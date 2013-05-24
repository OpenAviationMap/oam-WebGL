var dojoConfig = {
    baseUrl : 'lib',

    // debug config for always refresh
    urlArgs: "v=" +  (new Date()).getTime(),

    waitSeconds : 0,

    packages : [{
        name : 'dojo',
        location : 'ThirdParty/dojo-release-1.8.3-src/dojo'
    }, {
        name : 'dojox',
        location : 'ThirdParty/dojo-release-1.8.3-src/dojox'
    }, {
        name : 'dijit',
        location : 'ThirdParty/dojo-release-1.8.3-src/dijit'
    }, {
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
        name : 'Dojo',
        location : 'Cesium/Widgets/Dojo'
    }, {
        name : 'Workers',
        location : 'Cesium/Workers'
    }, {
        name : 'Cesium',
        location : 'Cesium'

    }, {
        name : 'OpenAviationMap',
        location : 'OpenAviationMap'
    }] 
};

