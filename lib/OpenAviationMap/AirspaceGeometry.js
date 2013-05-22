define(['Cesium/Cesium'],
function(Cesium) {
    "use strict";

    /**
     * Create an airspace primitive.
     *
     * @param {array of Cartographic} positions the positions of the airspace boundary
     * @param {number} upper the upper boundary of the airspace, in meters
     * @param {number} lower the lower boundary of the airspace, in meters
     * @param {string} designator the airspace designator
     * @param {Color} color the color of the airspace
     */
    var AirspaceGeometry = function(options) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;

        var positions = ellipsoid.cartographicArrayToCartesianArray(options.positions);

        // create a vertical wall around the airspace
        var opts = {
            //altitudeMode : airspace.upperRef === 'SFC' ? 'relativeToGround' : 'absolute',
            altitudeMode : 'absolute',
            positions    : positions,
            top          : options.upper,
            bottom       : options.lower,
            pickData     : options.designator
        };

        var wall = new Cesium.WallGeometry(opts);

        // create the upper and lower horizontal boundary

        opts = {
            positions : positions,
            height    : options.upper,
            pickData  : options.designator
        };

        var upperPoly = new Cesium.PolygonGeometry(opts);

        opts.height = options.lower;

        var lowerPoly = new Cesium.PolygonGeometry(opts);


        // create a material and combine into a primitive
        var material = Cesium.Material.fromType(undefined, Cesium.Material.ColorType);
        material.uniforms.color = options.color;
        this.appearance = new Cesium.Appearance({
            renderState : {
                cull : {
                    enabled : false
                },
                depthTest : {
                    enabled : true
                },
                depthMask : false,
                blending : Cesium.BlendingState.ALPHA_BLEND
            },
            material : material
        });

        this.geometries = [ wall, upperPoly, lowerPoly ];

        this.primitive = new Cesium.Primitive({
            geometries : this.geometries,
            appearance : this.appearance
        });
    };

    return AirspaceGeometry;
});

