define(['Cesium/Cesium'],
function(Cesium) {
    "use strict";

    var Airspace = function(airspace) {
        this.airspace = airspace;

        // create a vertical wall around the airspace
        var options = {
            //altitudeMode : airspace.upperRef === 'SFC' ? 'relativeToGround' : 'absolute',
            altitudeMode : 'absolute',
            coordinates  : airspace.poslist,
            top          : airspace.upper,
            bottom       : airspace.lower,
            pickData     : airspace.designator
        };

        var wall = new Cesium.WallGeometry(options);

        // create the upper and lower horizontal boundary
        var ellipsoid = Cesium.Ellipsoid.WGS84;

        options = {
            positions : ellipsoid.cartographicArrayToCartesianArray(airspace.poslist),
            height    : airspace.upper,
            pickData  : airspace.designator
        };

        var upperPoly = new Cesium.PolygonGeometry(options);

        options.height = airspace.lower;

        var lowerPoly = new Cesium.PolygonGeometry(options);


        // create a material and combine into a primitive
        var material = Cesium.Material.fromType(undefined, Cesium.Material.ColorType);
        material.uniforms.color = airspace.color;
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

    return Airspace;
});
