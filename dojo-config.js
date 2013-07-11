var dojoConfig = {
    baseUrl : 'lib',

    // debug config for always refresh
    urlArgs: "v=" +  (new Date()).getTime(),

    waitSeconds : 0,

    packages : [{
        name : 'dojo',
        location : 'dojo-release-1.9.1/dojo'
    }, {
        name : 'dojox',
        location : 'dojo-release-1.9.1/dojox'
    }, {
        name : 'dijit',
        location : 'dojo-release-1.9.1/dijit'
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

