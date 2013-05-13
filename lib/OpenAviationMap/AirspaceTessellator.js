define(['Cesium/Cesium'],
function(Cesium) {
    "use strict";

    /**
     * DOC_TBA
     *
     * @alias AirspaceTessellator
     * @exports AirspaceTessellator
     *
     * @see CubeMapEllipsoidTessellator
     * @see PlaneTessellator
     */
    var AirspaceTessellator = {
        /**
         * DOC_TBA
         *
         * @exception {DeveloperError} All dimensions' components must be greater than or equal to zero.
         */
        compute : function(airspace) {
            var mesh = {};
            mesh.attributes = {};
            mesh.indexLists = [];

            var upperPoints = [];
            var lowerPoints = [];
            var c = new Cesium.Cartographic();
            var ellipsoid = Cesium.Ellipsoid.WGS84;

            // omit the first point, as it is the same as the last one
            for (var i = 2; i < airspace.poslist.length; i += 2) {
                c.latitude  = Cesium.Math.toRadians(airspace.poslist[i]);
                c.longitude = Cesium.Math.toRadians(airspace.poslist[i+1]);
                c.height    = airspace.upper;

                var v = ellipsoid.cartographicToCartesian(c);
                upperPoints.push(v);

                c.height    = airspace.lower;
                v = ellipsoid.cartographicToCartesian(c);
                lowerPoints.push(v);
            }

            mesh.attributes.position = {
                componentDatatype : Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : []
            };

            mesh.indexLists.push({
                primitiveType : Cesium.PrimitiveType.TRIANGLES,
                values : []
            });


            // todo: remove duplicate points
            //       enter each point only once and the
            //       add indices appropriately


            var index = 0;

            // prepare the side walls, two triangles for each wall
            //
            //    A        B       E
            //    +--------+-------+
            //    |      / |      /|    triangles:  A C B
            //    |     /  |     /                  B C D
            //    |    /   |    /  |
            //    |   /    |   /   |
            //    |  /     |  /    |
            //    | /      | /     |
            //    +--------+-------+
            //    C        D       F
            //    

            for (var i = 0; i < upperPoints.length; ++i) {

                // first do A C B

                // this is A above
                var v = upperPoints[i];

                mesh.attributes.position.values.push(v.x);
                mesh.attributes.position.values.push(v.y);
                mesh.attributes.position.values.push(v.z);

                mesh.indexLists[0].values.push(index++);

                // this is C above
                v = lowerPoints[i];

                mesh.attributes.position.values.push(v.x);
                mesh.attributes.position.values.push(v.y);
                mesh.attributes.position.values.push(v.z);

                mesh.indexLists[0].values.push(index++);

                // this is B above
                v = upperPoints[(i + 1) % upperPoints.length];

                mesh.attributes.position.values.push(v.x);
                mesh.attributes.position.values.push(v.y);
                mesh.attributes.position.values.push(v.z);

                mesh.indexLists[0].values.push(index++);


                // now do B C D

                // this is B above
                v = upperPoints[(i + 1) % upperPoints.length];

                mesh.attributes.position.values.push(v.x);
                mesh.attributes.position.values.push(v.y);
                mesh.attributes.position.values.push(v.z);

                mesh.indexLists[0].values.push(index++);

                // this is C above
                v = lowerPoints[i];

                mesh.attributes.position.values.push(v.x);
                mesh.attributes.position.values.push(v.y);
                mesh.attributes.position.values.push(v.z);

                mesh.indexLists[0].values.push(index++);

                // this is D above
                v = lowerPoints[(i + 1) % upperPoints.length];

                mesh.attributes.position.values.push(v.x);
                mesh.attributes.position.values.push(v.y);
                mesh.attributes.position.values.push(v.z);

                mesh.indexLists[0].values.push(index++);
            }

            return mesh;
        }
    };

    return AirspaceTessellator;
});

