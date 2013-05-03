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

            var contour = [];
            var upperPoints = [];
            var lowerPoints = [];
            var c = new Cesium.Cartographic();

            // omit the first point, as it is the same as the last one
            for (var i = 2; i < airspace.poslist.length; i += 2) {
                contour.push(new poly2tri.Point(airspace.poslist[i], airspace.poslist[i+1]));

                c.latitude  = Cesium.Math.toRadians(airspace.poslist[i]);
                c.longitude = Cesium.Math.toRadians(airspace.poslist[i+1]);
                c.height    = airspace.upper;

                var v = ellipsoid.cartographicToCartesian(c);
                upperPoints.push(v);

                c.height    = airspace.lower;
                v = ellipsoid.cartographicToCartesian(c);
                lowerPoints.push(v);
            }

            var swctx = new poly2tri.SweepContext(contour);
            swctx.triangulate();
            var triangles = swctx.getTriangles();

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

            // insert the upper boundary triangles
            for (var i = 0; i < triangles.length; ++i) {
                var t = triangles[i];

                for (var j = 0; j < 3; ++j) {
                    var p = t.getPoint(j);

                    c.latitude  = Cesium.Math.toRadians(p.x);
                    c.longitude = Cesium.Math.toRadians(p.y);
                    c.height    = airspace.upper;

                    var v = ellipsoid.cartographicToCartesian(c);

                    mesh.attributes.position.values.push(v.x);
                    mesh.attributes.position.values.push(v.y);
                    mesh.attributes.position.values.push(v.z);

                    mesh.indexLists[0].values.push(index++);
                }
            }

            // insert the lower boundary triangles
            for (var i = 0; i < triangles.length; ++i) {
                var t = triangles[i];

                for (var j = 0; j < 3; ++j) {
                    var p = t.getPoint(j);

                    c.latitude  = Cesium.Math.toRadians(p.x);
                    c.longitude = Cesium.Math.toRadians(p.y);
                    c.height    = airspace.lower;

                    var v = ellipsoid.cartographicToCartesian(c);

                    mesh.attributes.position.values.push(v.x);
                    mesh.attributes.position.values.push(v.y);
                    mesh.attributes.position.values.push(v.z);

                    mesh.indexLists[0].values.push(index++);
                }
            }


            // now add indexes for the side walls, two triangles for each wall
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

