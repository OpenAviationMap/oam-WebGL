require([    
    'Cesium/Cesium',
    'dojo/io-query',
    'OpenAviationMap',
    'dojox/xml/parser',
    'OpenAviationMap/KML'
], function(Cesium,
            ioQuery,
            OpenAviationMap,
            xmlParser,
            KML) {

    // set up an OAM viewer and load a few AIXM files
    var aixmUrls = [ 'var/hungary-5.1.aixm51',
                     'var/hungary-5.2.aixm51',
                     'var/hungary-5.5.aixm51',
                     'var/hungary-5.6.aixm51' ];

    var widget = new OpenAviationMap.OamViewer({
                        container : 'cesiumContainer',
                        aixmUrls : aixmUrls
    });


    // look at Hungary
    var cc = widget.cesiumWidget.scene.getCamera().controller;
    var extent = new Cesium.Extent(Cesium.Math.toRadians(18.5),
                                   Cesium.Math.toRadians(49),
                                   Cesium.Math.toRadians(20),
                                   Cesium.Math.toRadians(45.5));
    cc.viewExtent(extent, Cesium.Ellipsoid.WGS84);

    var viewer = widget.cesiumWidget;

    KML.fromUrls(['var/akosmaroy-2013-03-05-LHTL-LHSK-3d.kml'], viewer);
});

