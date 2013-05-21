require({
    baseUrl : 'lib',

    // debug config for always refresh
    urlArgs: "v=" +  (new Date()).getTime(),

    waitSeconds : 0,

    packages : [{
        name : 'Assets',
        location : 'Cesium/Assets'
    }, {
        name : 'Core',
        location : 'Cesium/Core'
    }, {
        name : 'DynamicScene',
        location : 'Cesium/DynamicScene'
    }, {
        name : 'Renderer',
        location : 'Cesium/Renderer'
    }, {
        name : 'Scene',
        location : 'Cesium/Scene'
    }, {
        name : 'Shaders',
        location : 'Cesium/Shaders'
    }, {
        name : 'ThirdParty',
        location : 'Cesium/ThirdParty'
    }, {
        name : 'Widgets',
        location : 'Cesium/Widgets'
    }, {
        name : 'Workers',
        location : 'Cesium/Workers'
    }, {
        name : 'Cesium',
        location : 'Cesium'

    }, {
        name : 'Box',
        location : 'OpenAviationMap/Box'
    }] 
}, [    
    'Cesium/Cesium',
    'OpenAviationMap/AirspaceGeometry'
], function(Cesium, Airspace) {

    var widget = new Cesium.CesiumWidget('cesiumContainer');
    var scene = widget.scene;


    var addAirspace = function(airspace, primitives) {
        var as = new Airspace(airspace);

        primitives.add(as.primitive);

        /*
        var c = new Cesium.Cartographic();

        var upperPoints = [];
        var lowerPoints = [];
        for (var i = 2; i < airspace.poslist.length; i += 2) {
            c.latitude  = Cesium.Math.toRadians(airspace.poslist[i]);
            c.longitude = Cesium.Math.toRadians(airspace.poslist[i+1]);
            c.height    = airspace.upper;

            var v = ellipsoid.cartographicToCartesian(c);
            upperPoints.push(v);

            c.height    = airspace.lower;
            v = ellipsoid.cartographicToCartesian(c);
            lowerPoints.push(v);
        }

        var upperPoly = new Cesium.Polygon();
        upperPoly.setPositions(upperPoints);
        upperPoly.height = airspace.upper;
        upperPoly.material.uniforms.color = airspace.color;

        // fix so that the polygon goes through a depth test
        upperPoly._rs = scene.getContext().createRenderState( {
            depthTest : {
                enabled : true,
                func : Cesium.DepthFunction.LESS
            },
            blending : Cesium.BlendingState.ALPHA_BLEND
        });
        primitives.add(upperPoly);

        var lowerPoly = new Cesium.Polygon();
        lowerPoly.setPositions(lowerPoints);
        lowerPoly.height = airspace.lower;
        lowerPoly.material.uniforms.color = airspace.color;

        // fix so that the polygon goes through a depth test
        lowerPoly._rs = scene.getContext().createRenderState( {
            depthTest : {
                enabled : true,
                func : Cesium.DepthFunction.LESS
            },
            depthMask : false,
            blending : Cesium.BlendingState.ALPHA_BLEND
        });
        primitives.add(lowerPoly);

        */
    };

    var bg = new Cesium.SingleTileImageryProvider({
        url: 'var/white.png'
    });
    var osmProvider = new Cesium.OpenStreetMapImageryProvider({
        url: 'http://openaviationmap.tyrell.hu/static/osm',
        maximumLevel: 15,
        credit: 'Open Aviation Map'
    });
    var oamProvider = new Cesium.OpenStreetMapImageryProvider({
        url: 'http://openaviationmap.tyrell.hu/static/oam',
        maximumLevel: 15,
        credit: 'Open Aviation Map'
    });

    var ellipsoid = widget.centralBody.getEllipsoid();
    var primitives = scene.getPrimitives();

    var layers = widget.centralBody.getImageryLayers();
    /*
    layers.removeAll();
    layers.addImageryProvider(bg);
    layers.addImageryProvider(osmProvider);
    layers.addImageryProvider(oamProvider);
    */

    widget.centralBody.depthTestAgainstTerrain = true;

    var terrainProvider = new Cesium.CesiumTerrainProvider({
       url : 'http://cesium.agi.com/smallterrain'
    });
    widget.centralBody.terrainProvider = terrainProvider;


    var cc = scene.getCamera().controller;
    var west = Cesium.Math.toRadians(17.5);
    var south = Cesium.Math.toRadians(46.5);
    var east = Cesium.Math.toRadians(18.9928799);
    var north = Cesium.Math.toRadians(47.3374825);
    var extent = new Cesium.Extent(west, south, east, north);
    cc.viewExtent(extent, Cesium.Ellipsoid.WGS84);


    function nsResolver(prefix) {
        var ns = {
            'message'   : 'http://www.aixm.aero/schema/5.1/message',
            'gmd'       : 'http://www.isotc211.org/2005/gmd',
            'gco'       : 'http://www.isotc211.org/2005/gco',
            'xlink'     : 'http://www.w3.org/1999/xlink',
            'gml'       : 'http://www.opengis.net/gml/3.2',
            'gts'       : 'http://www.isotc211.org/2005/gts',
            'xsi'       : 'http://www.w3.org/2001/XMLSchema-instance',
            'aixm'      : 'http://www.aixm.aero/schema/5.1'
        };

        return ns[prefix] || null;
    }

    function reqListener() {
        var doc = this.responseXML;
        var it = doc.evaluate('//aixm:AirspaceTimeSlice', doc, nsResolver,
                                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        var xpResult;
        for (var airspaceNode = it.iterateNext(); airspaceNode; airspaceNode = it.iterateNext()) {

            // get the type
            var xpResult = doc.evaluate('aixm:type', airspaceNode, nsResolver,
                                        XPathResult.STRING_TYPE, null);
            var type = xpResult.stringValue;

            // get the designator
            xpResult = doc.evaluate('aixm:designator', airspaceNode, nsResolver,
                                    XPathResult.STRING_TYPE, null);
            var designator = xpResult.stringValue;

            // get the upper bounds
            xpResult = doc.evaluate('.//aixm:upperLimit', airspaceNode, nsResolver,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var upperLimitNode = xpResult.singleNodeValue;
            var upperLimit = upperLimitNode.firstChild.nodeValue;
            var upperLimitUom = upperLimitNode.attributes['uom'].value;

            xpResult = doc.evaluate('.//aixm:upperLimitReference', airspaceNode, nsResolver,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var upperLimitRefNode = xpResult.singleNodeValue;
            var upperLimitRef = upperLimitRefNode.firstChild.nodeValue;

            // get the lower bounds
            xpResult = doc.evaluate('.//aixm:lowerLimit', airspaceNode, nsResolver,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var lowerLimitNode = xpResult.singleNodeValue;
            var lowerLimit = lowerLimitNode.firstChild.nodeValue;
            var lowerLimitUom = lowerLimitNode.attributes['uom'].value;

            xpResult = doc.evaluate('.//aixm:lowerLimitReference', airspaceNode, nsResolver,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var lowerLimitRefNode = xpResult.singleNodeValue;
            var lowerLimitRef = lowerLimitRefNode.firstChild.nodeValue;

            // extract the airspace horizontal shape
            xpResult = doc.evaluate('.//aixm:horizontalProjection', airspaceNode, nsResolver,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var horizProjNode = xpResult.singleNodeValue;

            // only deal with simple polygons for now
            var iit = doc.evaluate('.//gml:posList', horizProjNode, nsResolver,
                                    XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            var posListNode = iit.iterateNext();
            if (posListNode == null) {
                continue;
            } else if (iit.iterateNext() != null) {
                continue;
            } else {
                var posListString = posListNode.firstChild.nodeValue;
            }

            // TODO: extract this into an UOM class with conversions
            var lowerInM;
            switch (lowerLimitUom) {
                case 'FT': lowerInM = parseFloat(lowerLimit) * 0.3048; break;
                case 'FL': lowerInM = 100.0 * parseFloat(lowerLimit) * 0.3048; break;
                default: lowerInM = parseFloat(lowerLimit); break;
            }

            var upperInM;
            switch (upperLimitUom) {
                case 'FT': upperInM = parseFloat(upperLimit) * 0.3048; break;
                case 'FL': upperInM = 100.0 * parseFloat(upperLimit) * 0.3048; break;
                default: upperInM = parseFloat(upperLimit); break;
            }

            // TODO: put this logic inside the Airspace class
            var color;
            switch (type) {
                case 'P': color = new Cesium.Color(1, 0, 0, 0.4); break;
                case 'R': color = new Cesium.Color(1, 0, 0, 0.4); break;
                case 'D': color = new Cesium.Color(1, 0, 0, 0.4); break;
                case 'TRA': color = new Cesium.Color(0.5, 0, 1, 0.4); break;
                case 'SA': color = new Cesium.Color(0, 0, 1, 0.4); break;
                case 'SG': color = new Cesium.Color(0, 0, 1, 0.4); break;
                case 'B': color = new Cesium.Color(0, 1, 0, 0.4); break;
                default: color = new Cesium.Color(1, 1, 1, 0.4); break;
            }

            var posListSplit = posListString.split(' ');
            var posList = [];
            for (var i = 0; i < posListSplit.length; i += 2) {
                var c = new Cesium.Cartographic(
                                Cesium.Math.toRadians(parseFloat(posListSplit[i + 1])),
                                Cesium.Math.toRadians(parseFloat(posListSplit[i])),
                                0);   // dummy height value
                posList.push(c);
            }

            var airspace = {
                designator : designator,
                type       : type,
                color      : color,
                lower      : lowerInM,
                lowerRef   : lowerLimitRef,
                upper      : upperInM,
                upperRef   : upperLimitRef,
                poslist    : posList
            };

            addAirspace(airspace, primitives);
        }
    };

    var aixmFiles = [ 'var/hungary-5.1.aixm51',
                      'var/hungary-5.2.aixm51',
                      'var/hungary-5.5.aixm51',
                      'var/hungary-5.6.aixm51' ];

    for (var i = 0; i < aixmFiles.length; ++i) {
        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.open("get", aixmFiles[i], true);
        oReq.send();
    }

    function addWall(wall) {
        var material = Cesium.Material.fromType(undefined, Cesium.Material.ColorType);
        material.uniforms.color = new Cesium.Color(1.0, 1.0, 0, 0.3);
        var appearance = new Cesium.Appearance({
            renderState : {
                cull : {
                    enabled : false
                },
                depthTest : {
                    enabled : true
                },
                depthMask : false,
                blending : Cesium.BlendingState.ALPHA_BLEND
            },
            material : material
        });

        var primitive = new Cesium.Primitive({
            geometries: [wall],
            appearance: appearance
        });
        primitives.add(primitive);
    }

    function kmlReqListener() {
        Cesium.WallGeometry.fromKML(this.responseXML, terrainProvider, function(wall) {
            addWall(wall);
        });
    };

    var kmlFiles = [
        'var/akosmaroy-2013-03-05-LHTL-LHSK-3d.kml',
        'var/akosmaroy-2013-03-05-LHTL-LHSK-3d-relground.kml'
    ];

    for (var i = 0; i < kmlFiles.length; ++i) {
        var oReq = new XMLHttpRequest();
        oReq.onload = kmlReqListener;
        oReq.open("get", kmlFiles[i], true);
        oReq.send();
    }




    var material = Cesium.Material.fromType(undefined, Cesium.Material.ColorType);
    material.uniforms.color = new Cesium.Color(0.0, 1.0, 0, 0.3);
    var appearance = new Cesium.Appearance({
        renderState : {
            cull : {
                enabled : false
            },
            depthTest : {
                enabled : true
            },
            depthMask : false,
            blending : Cesium.BlendingState.ALPHA_BLEND
        },
        material : material
    });

    var positions = ellipsoid.cartographicArrayToCartesianArray([
        Cesium.Cartographic.fromDegrees(19, 47),
        Cesium.Cartographic.fromDegrees(19, 57),
        Cesium.Cartographic.fromDegrees(29, 57),
        Cesium.Cartographic.fromDegrees(29, 47)
    ]);

    var polygon = new Cesium.PolygonGeometry({
        positions : positions,
        height    : 10000,
        pickData  : 'foo'
    });

    var primitive = new Cesium.Primitive({
        geometries: [ polygon ],
        appearance: appearance
    });

    console.log(primitive);

    //primitives.add(primitive);

});

