define(['Cesium/Cesium'],
function(Cesium) {
    "use strict";

    var Airspace = function(airspace) {
        this.airspace = airspace;

        var options = {
            extrude      : true,
            tessellate   : true,
            //altitudeMode : airspace.upperRef === 'SFC' ? 'relativeToGround' : 'absolute',
            altitudeMode : 'absolute',
            coordinates  : airspace.poslist,
            top          : airspace.upper,
            bottom       : airspace.lower
        };

        var wall = new Cesium.WallGeometry(options);

        wall.pickData = airspace.designator;

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

        this.geometries = [ wall ];

        this.primitive = new Cesium.Primitive({
            geometries : this.geometries,
            appearance : this.appearance
        });
    };

    return Airspace;
});
