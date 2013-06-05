define(['Cesium/Cesium'],
function(Cesium) {
    "use strict";

    /**
     * Create an airspace. The returned object contains a property called 'primitive'
     * that can be given to Cesium to render the airspace.
     *
     * @constructor
     * @alias Airspace
     *
     * @param {array of Cartographic} positions the positions of the airspace boundary
     * @param {number} upper the upper boundary of the airspace, in meters
     * @param {number} lower the lower boundary of the airspace, in meters
     * @param {string} designator the airspace designator
     * @param {Color} color the color of the airspace
     * @param {CompoudPrimitive} primitives the created airspaces will be added to
     *                           this compound primitive
     * @param {TerrainProvider} terrainProvider a terrain provider so that height
     *                          references relative to ground level can be calculated
     */
    var Airspace = function(options) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;

        var positions = ellipsoid.cartographicArrayToCartesianArray(options.positions);


        // create a material and combine into a primitive
        var material = Cesium.Material.fromType(undefined, Cesium.Material.ColorType);
        material.uniforms.color = options.color;
        this.appearance = new Cesium.Appearance({
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

        /**
         * The airspace designator.
         */
        this.designator = options.designator;

        /**
         * The airspace type.
         */
        this.type = options.type;

        // if the altitude references are relative to ground, look up the terrain and
        // adjust accordingly

        if (options.upperRef === 'SFC' && typeof options.terrainProvider !== 'undefined') {
            // the top reference os relative to the ground, so query the terrain database
            createPrimitivesTerrain(this, options, positions);

        } else {
            // all elevations are absolute, add the primitives right away
            createPrimitives(this, options, positions);
        }

    };

    function createPrimitives(airspace, options, positions) {
        // create a vertical wall around the airspace
        var wall = new Cesium.WallGeometry({
            positions    : positions,
            top          : options.upper,
            bottom       : options.lower
        });

        // create the upper and lower horizontal boundary

        var upperPoly = new Cesium.PolygonGeometry({
            positions : positions,
            height    : options.upper
        });

        var lowerPoly = new Cesium.PolygonGeometry({
            positions : positions,
            height    : options.lower
        });

        var geometryInstances = [
            new Cesium.GeometryInstance({ geometry: wall,      pickData: options.designator }),
            new Cesium.GeometryInstance({ geometry: upperPoly, pickData: options.designator }),
            new Cesium.GeometryInstance({ geometry: lowerPoly, pickData: options.designator })
        ];

        /**
        * The primitive of the airspace, that can be given to Cesium to render.
        */
        airspace.primitive = new Cesium.Primitive({
            geometryInstances : geometryInstances,
            appearance        : airspace.appearance
        });

        options.primitives.add(airspace.primitive);
    }

    function createPrimitivesTerrain(airspace, options, positions) {
        var coords = [];

        for (var i = 0; i < options.positions.length; ++i) {
            coords.push(options.positions[i]);
        }

        // request the elevation ground data
        Cesium.when(Cesium.sampleTerrain(options.terrainProvider, 11, coords), function(terrain) {
            // as a wokraround for the polygons
            var avgH = 0;
            for (var i = 0; i < options.positions.length; ++i) {
                avgH = terrain[i].height;
            }
            avgH /= options.positions.length;

            var wall = new Cesium.WallGeometry({
                positions : positions,
                top       : options.upper,
                terrain   : terrain
            });

            var upperPoly = new Cesium.PolygonGeometry({
                positions : positions,
                height    : options.upper + avgH
            });

            var lowerPoly = new Cesium.PolygonGeometry({
                positions : positions,
                height    : options.lower
            });

            var geometryInstances = [
                new Cesium.GeometryInstance({ geometry: wall,      pickData: options.designator }),
                new Cesium.GeometryInstance({ geometry: upperPoly, pickData: options.designator }),
                new Cesium.GeometryInstance({ geometry: lowerPoly, pickData: options.designator })
            ];

            airspace.primitive = new Cesium.Primitive({
                geometryInstances : geometryInstances,
                appearance        : airspace.appearance
            });

            options.primitives.add(airspace.primitive);
        });
    }
    

    /**
     * A map of airspace types to color codes.
     */
    Airspace.typeToColor = {
        'P'    : new Cesium.Color(1, 0, 0, 0.3),
        'R'    : new Cesium.Color(1, 0, 0, 0.3),
        'D'    : new Cesium.Color(1, 0, 0, 0.3),
        'TRA'  : new Cesium.Color(0.5, 0, 1, 0.3),
        'SA'   : new Cesium.Color(0, 0, 1, 0.3),
        'SG'   : new Cesium.Color(0, 0, 1, 0.3),
        'B'    : new Cesium.Color(0, 1, 0, 0.3),
        'TIZ'  : new Cesium.Color(0, 0, 1, 0.3),
        'TMA'  : new Cesium.Color(0, 0, 1, 0.3),
        'MTMA' : new Cesium.Color(0, 0, 1, 0.3),
        'CTA'  : new Cesium.Color(1, 0.68, 0.5, 0.3),
        'CTR'  : new Cesium.Color(1, 0.68, 0.5, 0.3),
        'MCTR' : new Cesium.Color(1, 0.68, 0.5, 0.3),
        'FIR'  : new Cesium.Color(0, 0, 1, 0.3)
    };

    /**
     * XML namespace resolver for AIXM documents.
     */
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

    /**
     * Create airspaces from an AIXM document.
     *
     * @param {DOM node} aixmDocument the document node of the AIXM document to process
     * @param {CompoudPrimitive} primitives the created airspaces will be added to
     *                           this compound primitive
     * @param {TerrainProvider} terrainProvider a terrain provider so that height
     *                          references relative to ground level can be calculated
     * @return an array of airspaces extracted from the AIXM document
     */
    Airspace.fromAixm = function(aixmDocument, primitives, terrainProvider) {
        var airspaces = [];

        var doc = aixmDocument;
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
            var color = Airspace.typeToColor[type];

            var posListSplit = posListString.split(' ');
            var posList = [];
            for (var i = 0; i < posListSplit.length; i += 2) {
                var c = new Cesium.Cartographic(
                                Cesium.Math.toRadians(parseFloat(posListSplit[i + 1])),
                                Cesium.Math.toRadians(parseFloat(posListSplit[i])),
                                0);   // dummy height value
                posList.push(c);
            }

            var airspace = new Airspace({
                designator      : designator,
                type            : type,
                color           : color,
                lower           : lowerInM,
                lowerRef        : lowerLimitRef,
                upper           : upperInM,
                upperRef        : upperLimitRef,
                positions       : posList,
                primitives      : primitives,
                terrainProvider : terrainProvider
            });

            airspaces.push(airspace);
        }

        return airspaces;
    };

    /**
     * Create airspaces from a series of AIXM urls.
     *
     * @param {array of string} aixmUrls an array of URLs pointing to AIXM files
     * @param {CompoudPrimitive} primitives the created airspaces will be added to
     *                           this compound primitive
     * @param {TerrainProvider} terrainProvider a terrain provider so that height
     *                          references relative to ground level can be calculated
     * @param {function} callback a function that will receive the array of airspaces
     *                   extracted from the AIXM files. this may be called multiple
     *                   times as airspaces become available
     */
    Airspace.fromAixmUrls = function(aixmUrls, primitives, terrainProvider, callback) {

        for (var i = 0; i < aixmUrls.length; ++i) {
            var oReq = new XMLHttpRequest();
            oReq.open("get", aixmUrls[i], true);
            oReq.onload = function() {
                var airspaces = Airspace.fromAixm(this.responseXML, primitives, terrainProvider);

                callback(airspaces);
            };

            oReq.send();
        }

    }

    return Airspace;
});

