define(['Cesium/Cesium',
        'dojox/xml/parser'],
function(Cesium,
         xmlParser) {
    "use strict";

    /**
     * Read a KML file and display it in a Cesium Viewer
     * @constructor
     *
     * @param {String} kml the KML document to process
     * @param {Viewer} viewer the Cesium Viewer to display the KML in
     * @param {Boolean} [showKML=false} if true, the viewer will move its camera to show the new KML
     *        file area
     * @param {TerrainProvider} [terrainProvider] a terrain provider to calculate ground-realative elevation
     * @param {Boolean} [aboveGround=true] if true and a terrain provider is supplied, the points
     *        found in the KML are raised to at least ground level as returned by the terrain provider.
     *        this makes sure that no points are 'below ground', maybe because of measurment inaccuracies
     * @param {Float} [aboveGroundOffset=0.5] offset in meters if aboveGround=true, this is how many
     *        meters points will be forced above ground.
     */
    var KML = function(options) {
        if (typeof options.kml === 'undefined') {
            throw new Cesium.DeveloperError('kml is required.');
        }
        if (typeof options.viewer === 'undefined') {
            throw new Cesium.DeveloperError('viewer is required.');
        }

        this.viewer            = options.viewer;
        this.showKML           = Cesium.defaultValue(options.showKML, false);
        this.terrainProvider   = Cesium.defaultValue(options.terrainProvider, undefined);
        this.aboveGround       = Cesium.defaultValue(options.aboveGround, true);
        this.aboveGroundOffset = Cesium.defaultValue(options.aboveGroundOffset, 0.5);

        this.wallMaterial = Cesium.Material.fromType(this.viewer.scene.getContext(), 'Color');
        this.wallMaterial.uniforms.color = new Cesium.Color(1, 1, 0, 0.4);
        this.wallAppearance = new Cesium.MaterialAppearance({
            renderState : {
                cull : {
                    enabled : false
                },
                depthTest : {
                    enabled : true
                },
                depthMask : true,
                blending : Cesium.BlendingState.ALPHA_BLEND
            },
            flat        : true,
            faceForward : true,
            translucent : true,
            material    : this.wallMaterial
        });

        this.lineMaterial = Cesium.Material.fromType(this.viewer.scene.getContext(), 'Color');
        this.lineMaterial.uniforms.color = new Cesium.Color(0, 1, 0, 0.5);

        var kmlDoc = xmlParser.parse(options.kml);


        var that = this;
        this.fromKmlNode(kmlDoc, function(primitivesToAdd) {
            var primitives = that.viewer.scene.getPrimitives();

            for (var i = 0; i < primitivesToAdd.length; ++i) {
                primitives.add(primitivesToAdd[i]);
            }

            if (that.showKML) {
                // NOTE: this assumes a PolylineCollection at primitivesToAdd[1]
                //       and also assumes that the 1st polyline contains everything
                //       that needs to be shown
                //
                //       I wish there was an easier way to create an extent
                var extent = Cesium.Extent.fromCartographicArray(
                                    Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(
                                        primitivesToAdd[1].get(0).getPositions()));


                var scene = that.viewer.scene;
                disableInput(scene);
                var flight = Cesium.CameraFlightPath.createAnimationExtent(scene.getFrameState(), {
                                    destination: extent,
                                    onComplete: function() {
                                        enableInput(scene);
                                    }
                });
                scene.getAnimations().add(flight);
            }
        });
    };

    function disableInput(scene) {
        var controller = scene.getScreenSpaceCameraController();
        controller.enableTranslate = false;
        controller.enableZoom = false;
        controller.enableRotate = false;
        controller.enableTilt = false;
        controller.enableLook = false;
    }

    function enableInput(scene) {
        var controller = scene.getScreenSpaceCameraController();
        controller.enableTranslate = true;
        controller.enableZoom = true;
        controller.enableRotate = true;
        controller.enableTilt = true;
        controller.enableLook = true;
    }


    // default KML namespace resolver, see
    // https://developer.mozilla.org/en-US/docs/Introduction_to_using_XPath_in_JavaScript#Implementing_a_User_Defined_Namespace_Resolver
    function kmlNsResolver(prefix) {
        switch (prefix) {
            case 'gx':
                return 'http://www.google.com/kml/ext/2.2';
            default:
                return 'http://www.opengis.net/kml/2.2';
        }
    }

    /**
     * Create a set of Walls from a KML document that includes LineString elements.
     *
     * @param {DOM node} kmlNode the KML documents document node
     * @param {function(wall)} callback a function that will receive each WallGeometry created, one at a time.
     */
    KML.prototype.fromKmlNode = function(kmlNode, callback) {

        // look at all the Document nodes
        var documentNodes = kmlNode.evaluate('//kml:Document', kmlNode, kmlNsResolver,
                                             XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        for (var docNode = documentNodes.iterateNext(); docNode; docNode = documentNodes.iterateNext()) {
            var name = kmlNode.evaluate('//kml:name', docNode, kmlNsResolver,
                                        XPathResult.STRING_TYPE, null);

            var styles = getStyleMap(kmlNode, docNode);

            var placemarkNodes = kmlNode.evaluate('//kml:Placemark', docNode, kmlNsResolver,
                                                  XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

            for (var placemarkNode = placemarkNodes.iterateNext();
                 placemarkNode;
                 placemarkNode = placemarkNodes.iterateNext()) {

                var style;
                var xpResult = kmlNode.evaluate('.//kml:styleUrl', placemarkNode, kmlNsResolver,
                                                XPathResult.STRING_TYPE, null);
                if (xpResult.stringValue) {
                    var ref = xpResult.stringValue;
                    if (ref.substring(0, 1) === '#' && typeof styles[ref.substring(1)] !== 'undefined') {
                        style = styles[ref.substring(1)];
                    }
                }

                var it = kmlNode.evaluate('//kml:LineString', placemarkNode, kmlNsResolver,
                                        XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

                var addNameToWall = function(primitives) {
                    // TODO: migrate to new pick / ID API in Cesium
                    //wall.pickData = name;
                    callback(primitives);
                };

                for (var node = it.iterateNext(); node; node = it.iterateNext()) {
                    this.fromKMLLineString(node, style, addNameToWall);
                }
             }
        }
    };

    /**
     * Extract KML style definitions from a KML Document node, and return them in a map.
     *
     * @param {Node} kmlNode the KML DOM documents root node (document element)
     * @param {Node} docNode the KML Document node in which Style elements are explored
     * @return a map of styles, where the key of each style is the style's id
     */
    function getStyleMap(kmlNode, docNode) {
        var it = kmlNode.evaluate('//kml:Style', docNode, kmlNsResolver,
                                  XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        var styles = [];

        for (var node = it.iterateNext(); node; node = it.iterateNext()) {
            var id = node.getAttribute('id');
            var style = [];

            var xpResult = kmlNode.evaluate('.//kml:LineStyle', node, kmlNsResolver,
                                            XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (xpResult.singleNodeValue) {
                var lineStyleNode = xpResult.singleNodeValue;
                var lineStyle = [];

                xpResult = kmlNode.evaluate('.//kml:color', lineStyleNode, kmlNsResolver,
                                            XPathResult.STRING_TYPE, null);
                var colorStr = xpResult.stringValue;
                
                xpResult = kmlNode.evaluate('.//kml:width', lineStyleNode, kmlNsResolver,
                                            XPathResult.STRING_TYPE, null);
                var width = xpResult.stringValue;
                
                lineStyle['color'] = colorStr;
                lineStyle['width'] = parseFloat(width);
                style['line'] = lineStyle;
            }

            var xpResult = kmlNode.evaluate('.//kml:PolyStyle', node, kmlNsResolver,
                                            XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (xpResult.singleNodeValue) {
                var polyStyleNode = xpResult.singleNodeValue;
                var polyStyle = [];

                xpResult = kmlNode.evaluate('.//kml:color', polyStyleNode, kmlNsResolver,
                                            XPathResult.STRING_TYPE, null);
                var colorStr = xpResult.stringValue;
                
                polyStyle['color'] = colorStr;
                style['poly'] = polyStyle;
            }

            styles[id] = style;
        }

        return styles;
    }

    /**
     *  Create a Wall from a KML LineString DOM element.
     *
     *  @param {DOM node} lineString the KML LineString DOM node to build this Wall from.
     *  @param {Array} style a KML style, if one was specified in the KML file
     *  @param {function(wall)} callback the callback that will be called with the created WallGeometry
     */
    KML.prototype.fromKMLLineString = function(lineString, style, callback) {
        var altitudeMode;
        var coordinates = [];

        var doc = lineString.ownerDocument;

        // get the coordinates
        var xpResult = doc.evaluate('kml:coordinates/text()', lineString, kmlNsResolver,
                                     XPathResult.STRING_TYPE, null);
        var coordString = xpResult.stringValue;
        var coordSplitWs = coordString.split(/[\s]/);
        var lastLat = 0;
        var lastLon = 0;
        for (var i = 0; i < coordSplitWs.length; ++i) {
            var coordLine = coordSplitWs[i];

            if (!coordLine.trim()) {
                continue;
            }
            var coordSplit = coordLine.split(',');

            var lon = parseFloat(coordSplit[0]);
            var lat = parseFloat(coordSplit[1]);
            var height = coordSplit.length < 3 ? 0 : parseFloat(coordSplit[2]);

            if (lastLat === lat && lastLon === lon) {
                continue;
            }

            var c = Cesium.Cartographic.fromDegrees(lon, lat, height);
            coordinates.push(c);

            lastLat = lat;
            lastLon = lon;
        }

        // get the altitudeMode flag
        xpResult = doc.evaluate('kml:altitudeMode/text()', lineString, kmlNsResolver,
                                XPathResult.STRING_TYPE, null);
        altitudeMode = xpResult.stringValue;

        if (typeof this.terrainProvider !== 'undefined'
           && (altitudeMode === 'relativeToGround' || this.aboveGround)) {
            // request the terrain data for each point of the line string
            var coords = [];

            for (i = 0; i < coordinates.length; ++i) {
                coords.push(coordinates[i].clone());
            }

            var relativeToGround = altitudeMode === 'relativeToGround';
            var that = this;

            // request the elevation ground data
            Cesium.when(Cesium.sampleTerrain(this.terrainProvider, 11, coords), function(uc) {
                for (i = 0; i < coordinates.length; ++i) {
                    if (relativeToGround) {
                        coordinates[i].height += uc[i].height;
                    }
                    if (that.aboveGround && coordinates[i].height < uc[i].height) {
                        coordinates[i].height = uc[i].height + that.aboveGroundOffset;
                    }
                }

                var positions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(coordinates);
                that.createFromPositions(positions, style, callback);
            });
        } else {
            var positions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(coordinates);
            this.createFromPositions(positions, style, callback);
        }
    };

    /**
     * Create all the primitives based on the positions parsed & calculated,
     * then call the provided callback with these primitives.
     *
     * @param {Cartesian} positions an array of Cartesian positions
     * @param {Array} style a KML style, if one was specified in the KML file
     * @param {function(Primitive)} callback the callback to receive the primitive
     */
    KML.prototype.createFromPositions = function(positions, style, callback) {
        // create the wall that leads down to the ground
        var wall = new Cesium.WallGeometry({ positions: positions });
        var gi = new Cesium.GeometryInstance({ geometry : wall });

        var wallAppearance = this.wallAppearance;
        var lineMaterial   = this.lineMaterial;
        var lineWidth      = 1;

        if (typeof style !== 'undefined') {
            var material = Cesium.Material.fromType(this.viewer.scene.getContext(), 'Color');
            material.uniforms.color = Cesium.Color.fromRgba(parseInt(style['poly']['color'], 16));
            wallAppearance = new Cesium.MaterialAppearance({
                renderState : {
                    cull : {
                        enabled : false
                    },
                    depthTest : {
                        enabled : true
                    },
                    depthMask : true,
                    blending : Cesium.BlendingState.ALPHA_BLEND
                },
                flat        : true,
                faceForward : true,
                translucent : true,
                material    : material
            });

            lineMaterial = Cesium.Material.fromType(this.viewer.scene.getContext(), 'Color');
            lineMaterial.uniforms.color = Cesium.Color.fromRgba(parseInt(style['line']['color'], 16));
            lineWidth = style['line']['width'];
        }

        var wallPrimitive = new Cesium.Primitive({
            geometryInstances : [ gi ],
            appearance        : wallAppearance
        });

        // create the line that highlights the edge of the wall
        var lines = new Cesium.PolylineCollection();
        var line = lines.add();
        line.setPositions(positions);
        line.setMaterial(lineMaterial);
        line.setWidth(lineWidth);

        callback([wallPrimitive, lines]);
    }

    /**
     * Load KML files and add them to a viewer.
     *
     * @param {Array of String} urls an array of URLs pointing to KML files
     * @param {Viewer} viewer the Cesium Viewer to display the KML files in
     * @param {Struct} [options] additional options to be passed to each created KML
     */
    KML.fromUrls = function(urls, viewer, options) {

        var o = Cesium.defaultValue(options, {});

        for (var i = 0; i < urls.length; ++i) {
            var oReq = new XMLHttpRequest();
            oReq.open("get", urls[i], true);
            oReq.onload = function() {
                o.kml             = this.responseText;
                o.viewer          = viewer;
                o.terrainProivder = viewer.centralBody.terrainProvider;

                var kml = new KML(o);
            };

            oReq.send();
        }

    }

    return KML;
});

