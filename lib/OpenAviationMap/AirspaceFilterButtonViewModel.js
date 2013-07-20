/*global define*/
define(['Cesium/Cesium',
        'ThirdParty/knockout'
        ], function(
            Cesium,
            knockout) {
    "use strict";

    /**
     * The ViewModel for {@link AirspaceFilterButton}.
     * @alias AirspaceFilterButtonViewModel
     * @constructor
     *
     * @param {OamViewer} viewer The Open Aviation Map Viewer to use
     * @param {String} type the airspace type to filter on
     *
     * @exception {DeveloperError} scene is required.
     */
    var AirspaceFilterButtonViewModel = function(viewer, type) {
        var that = this;

        if (typeof viewer === 'undefined') {
            throw new DeveloperError('viewer is required.');
        }
        if (typeof type === 'undefined') {
            throw new DeveloperError('type is required.');
        }

        /**
         * The Open Aviation Map Viewer.
         * @type OamViewer
         */
        this.viewer = viewer;

        /**
         * The command for filtering.
         * @type Command
         */
        this.command = Cesium.createCommand(function() {
            viewer.toggleAirspaceType(type);
        });

        /**
         * The current button tooltip.
         * @type Observable
         */
        this.tooltip = knockout.observable('Airspace Filter');
    };

    return AirspaceFilterButtonViewModel;
});
