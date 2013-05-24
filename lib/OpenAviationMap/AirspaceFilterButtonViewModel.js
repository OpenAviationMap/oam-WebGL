/*global define*/
define(['Widgets/createCommand',
        'Core/defaultValue',
        'Core/Cartesian3',
        'Core/DeveloperError',
        'Core/Ellipsoid',
        'Core/Extent',
        'Core/Math',
        'Core/Matrix4',
        'Scene/Camera',
        'Scene/CameraColumbusViewMode',
        'Scene/PerspectiveFrustum',
        'Scene/SceneMode',
        'ThirdParty/knockout'
        ], function(
            createCommand,
            defaultValue,
            Cartesian3,
            DeveloperError,
            Ellipsoid,
            Extent,
            CesiumMath,
            Matrix4,
            Camera,
            CameraColumbusViewMode,
            PerspectiveFrustum,
            SceneMode,
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
        this.command = createCommand(function() {
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
