require([    
    'Cesium/Cesium',
    'Widgets/Dojo/CesiumViewerWidget',
    'dojo/io-query',
    'OpenAviationMap',
], function(Cesium,
            CesiumViewerWidget,
            ioQuery,
            OpenAviationMap) {

    // set up an OAM viewer and load a few AIXM files
    var aixmUrls = [ 'var/hungary-5.1.aixm51',
                     'var/hungary-5.2.aixm51',
                     'var/hungary-5.5.aixm51',
                     'var/hungary-5.6.aixm51' ];

    var widget = new OpenAviationMap.OamViewer({ divName : 'cesiumContainer', aixmUrls : aixmUrls });

    // look at Hungary
    var cc = widget.cesiumWidget.scene.getCamera().controller;
    var extent = new Cesium.Extent(Cesium.Math.toRadians(18.5),
                                   Cesium.Math.toRadians(49),
                                   Cesium.Math.toRadians(20),
                                   Cesium.Math.toRadians(45.5));
    cc.viewExtent(extent, Cesium.Ellipsoid.WGS84);

});

