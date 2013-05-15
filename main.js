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
], function(Cesium, AirspaceGeometry) {

    var widget = new Cesium.CesiumWidget('cesiumContainer');
    var scene = widget.scene;

    var addAirspace = function(airspace, primitives) {
        var ag = new AirspaceGeometry(airspace);

        var material = Cesium.Material.fromType(undefined, Cesium.Material.ColorType);
        material.uniforms.color = airspace.color;
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

        var primitive = new Cesium.Primitive([ag], appearance);
        primitives.add(primitive);

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


        var mesh3 = new Cesium.BoxGeometry({
            vertexFormat : Cesium.VertexFormat.POSITION_ONLY,
            dimensions : new Cesium.Cartesian3(1000000.0, 1000000.0, 2000000.0),
            modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Cartographic.fromDegrees(-75.59777, 40.03883))), new Cesium.Cartesian3(0.0, 0.0, 3000000.0)),
            pickData : 'mesh3'
        });

        var primitive = new Cesium.Primitive([mesh3], Cesium.Appearance.CLOSED_TRANSLUCENT);
        primitives.add(primitive);



    var west = 18.93888888888889;
    var east = 18.965555555555554;
    var north = 47.531666666666666;
    var south = 47.5225;

    var upper = 1066;

    // look at our polygon
    var extent = new Cesium.Extent(Cesium.Math.toRadians(west),
                                   Cesium.Math.toRadians(south),
                                   Cesium.Math.toRadians(east),
                                   Cesium.Math.toRadians(north));
    var cc = scene.getCamera().controller;
    cc.viewExtent(extent, ellipsoid);
    cc.moveBackward(1000);
    cc.moveDown(4000);
    cc.lookUp(Math.PI / 2.5);


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

    function reqListener () {
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

            var posListSplit = posListString.split(" ");
            var posList = [];
            for (var i = 0; i < posListSplit.length; ++i) {
                posList[i] = parseFloat(posListSplit[i]);
            }

            var airspace = {
                designator: designator,
                color: color,
                lower: lowerInM,
                upper: upperInM,
                poslist: posList
            };

            addAirspace(airspace, primitives);
        }
    };

    var aixmFiles = [ "var/hungary-5.1.aixm51",
                      "var/hungary-5.2.aixm51",
                      "var/hungary-5.5.aixm51",
                      "var/hungary-5.6.aixm51" ];

    for (var i = 0; i < aixmFiles.length; ++i) {
        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.open("get", aixmFiles[i], true);
        oReq.send();
    }
});
