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
        name : 'OamViewer',
        location : 'OpenAviationMap/OamViewer'
    }] 
}, [    
    'Cesium/Cesium',
    'OpenAviationMap/OamViewer'
], function(Cesium, OamViewer) {

    // set up an OAM viewer and load a few AIXM files
    var aixmUrls = [ 'var/hungary-5.1.aixm51',
                     'var/hungary-5.2.aixm51',
                     'var/hungary-5.5.aixm51',
                     'var/hungary-5.6.aixm51' ];

    var widget = new OamViewer({ divName : 'cesiumContainer', aixmUrls : aixmUrls });

    // look at Hungary
    var cc = widget.cesiumWidget.scene.getCamera().controller;
    var extent = new Cesium.Extent(Cesium.Math.toRadians(18.5),
                                   Cesium.Math.toRadians(49),
                                   Cesium.Math.toRadians(20),
                                   Cesium.Math.toRadians(45.5));
    cc.viewExtent(extent, Cesium.Ellipsoid.WGS84);

});

