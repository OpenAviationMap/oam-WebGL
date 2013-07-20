/*global define*/
define(['./AirspaceFilterButtonViewModel',
        'Cesium/Cesium',
        'ThirdParty/knockout'
        ], function(
         AirspaceFilterButtonViewModel,
         Cesium,
         knockout) {
    "use strict";

    /**
     * A single button widget for returning to the default camera view of the current scene.
     *
     * @alias AirspaceFilterButton
     * @constructor
     *
     * @param {Element|String} container The DOM element or ID that will contain the widget.
     * @param {OamViewer} viewer the Open Aviation Map viewer to use.
     * @param {String} type the airspace type to filter on
     * @param {String} color the color value of the button
     *
     * @exception {DeveloperError} container is required.
     * @exception {DeveloperError} viewer is required.
     */
    var AirspaceFilterButton = function(container, viewer, type, color) {
        if (typeof container === 'undefined') {
            throw new DeveloperError('container is required.');
        }
        if (typeof viewer === 'undefined') {
            throw new DeveloperError('viewer is required.');
        }
        if (typeof type === 'undefined') {
            throw new DeveloperError('type is required.');
        }
        if (typeof color === 'undefined') {
            throw new DeveloperError('color is required.');
        }

        if (typeof container === 'string') {
            var tmp = document.getElementById(container);
            if (tmp === null) {
                throw new DeveloperError('Element with id "' + container + '" does not exist in the document.');
            }
            container = tmp;
        }

        /**
         * Gets the parent container.
         * @memberof AirspaceFilterButton
         * @type {Element}
         */
        this.container = container;

        /**
         * Gets the viewModel being used by the widget.
         * @memberof AirspaceFilterButton
         * @type {AirspaceFilterButtonViewModel}
         */
        this.viewModel = new AirspaceFilterButtonViewModel(viewer, type);

        /**
         * Gets the container element for the widget.
         * @memberof AirspaceFilterButton
         * @type {Element}
         */
        this.container = container;

        this._element = document.createElement('span');
        this._element.className = 'OpenAviationMap-AirspaceFilterButton';
        this._element.setAttribute('data-bind', 'attr: { title: tooltip }, click: command');
        this._element.style.cssText += 'background-color: ' + color.toCssColorString() + ';';
        this._element.innerHTML = '<span style="text-align: center; vertical-align: middle">' + type + '</span>';

        container.appendChild(this._element);

        knockout.applyBindings(this.viewModel, this._element, type);
    };

    /**
     * Destroys the  widget.  Should be called if permanently
     * removing the widget from layout.
     * @memberof AirspaceFilterButton
     */
    AirspaceFilterButton.prototype.destroy = function() {
        var container = this.container;
        knockout.cleanNode(container);
        container.removeChild(this._element);
        return destroyObject(this);
    };

    return AirspaceFilterButton;
});
