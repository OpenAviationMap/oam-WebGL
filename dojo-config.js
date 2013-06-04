var dojoConfig = {
    baseUrl : 'lib',

    // debug config for always refresh
    urlArgs: "v=" +  (new Date()).getTime(),

    waitSeconds : 0,

    packages : [{
        name : 'dojo',
        location : 'Cesium/ThirdParty/dojo-release-1.8.3-src/dojo'
    }, {
        name : 'dojox',
        location : 'Cesium/ThirdParty/dojo-release-1.8.3-src/dojox'
    }, {
        name : 'dijit',
        location : 'Cesium/ThirdParty/dojo-release-1.8.3-src/dijit'
    }, {
        name : 'Assets',
        location : 'Cesium/Source/Assets'
    }, {
        name : 'Core',
        location : 'Cesium/Source/Core'
    }, {
        name : 'DynamicScene',
        location : 'Cesium/Source/DynamicScene'
    }, {
        name : 'Renderer',
        location : 'Cesium/Source/Renderer'
    }, {
        name : 'Scene',
        location : 'Cesium/Source/Scene'
    }, {
        name : 'Shaders',
        location : 'Cesium/Source/Shaders'
    }, {
        name : 'ThirdParty',
        location : 'Cesium/Source/ThirdParty'
    }, {
        name : 'Widgets',
        location : 'Cesium/Source/Widgets'
    }, {
        name : 'Dojo',
        location : 'Cesium/Source/Widgets/Dojo'
    }, {
        name : 'Workers',
        location : 'Cesium/Source/Workers'
    }, {
        name : 'Cesium',
        location : 'Cesium/Source'

    }, {
        name : 'OpenAviationMap',
        location : 'OpenAviationMap'
    }] 
};

