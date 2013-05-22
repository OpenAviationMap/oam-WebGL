define(['Cesium/Cesium',
        './Airspace'],
function(Cesium, Airspace) {
    "use strict";

    /**
     * Create an Open Aviation Map Viewer.
     *
     * @param {string} divName the name of the div to put the OAM viewer into.
     * @param {array of string} [aixmUrls] a list of URLs pointing to AIXM files to display.
     */
    var OamViewer = function(options) {

        // create the cesium vidget & set it up
        var widget = new Cesium.CesiumWidget(options.divName);

        var terrainProvider = new Cesium.CesiumTerrainProvider({ url : 'http://cesium.agi.com/smallterrain' });
        widget.centralBody.terrainProvider = terrainProvider;
        widget.centralBody.depthTestAgainstTerrain = true;

        var primitives = widget.scene.getPrimitives();
        var airspaces = [];

        /**
         * The underlying Cesium widget object.
         */
        this.cesiumWidget = widget;

        /**
         * The airspaces displayed in the viewer.
         */
        this.airspaces = airspaces;

        if (typeof options.aixmUrls !== 'undefined') {
            this.loadAirspaces(options.aixmUrls);
        }
    };

    /**
     * Load airspaces into the Open Aviation Map viewer.
     *
     * @param {array of string} aixmUrls an array of URLs pointint at AIXM files.
     */
    OamViewer.prototype.loadAirspaces = function(aixmUrls) {
        var primitives = this.cesiumWidget.scene.getPrimitives();

        Airspace.fromAixmUrls(aixmUrls, function(airspaces) {
            for (var i = 0; i < airspaces.length; ++i) {
                primitives.add(airspaces[i].primitive);
            }
        });
    }

    return OamViewer;
});

