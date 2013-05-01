    /**
     * DOC_TBA
     *
     * @alias BoxTessellator
     * @exports BoxTessellator
     *
     * @see CubeMapEllipsoidTessellator
     * @see PlaneTessellator
     */
    var BoxTessellator = {
        /**
         * DOC_TBA
         *
         * @exception {DeveloperError} All dimensions' components must be greater than or equal to zero.
         */
        compute : function(template) {
            template = template || {};
            var minimumCorner;
            var maximumCorner;

            if (template.minimumCorner && template.maximumCorner) {
                minimumCorner = template.minimumCorner;
                maximumCorner = template.maximumCorner;
            } else {
                var dimensions = template.dimensions || new Cartesian3(1.0, 1.0, 1.0);

                if (dimensions.x < 0 || dimensions.y < 0 || dimensions.z < 0) {
                    throw new DeveloperError('All dimensions components must be greater than or equal to zero.');
                }

                var corner = dimensions.multiplyByScalar(0.5);
                minimumCorner = corner.negate();
                maximumCorner = corner;
            }

            var mesh = {};
            mesh.attributes = {};
            mesh.indexLists = [];

            var c = new Cesium.Cartographic();

            c.longitude = minimumCorner.longitude;
            c.latitude  = minimumCorner.latitude;
            c.height    = minimumCorner.height;
            var v0 = ellipsoid.cartographicToCartesian(c);

            c.longitude = maximumCorner.longitude;
            c.latitude  = minimumCorner.latitude;
            c.height    = minimumCorner.height;
            var v1 = ellipsoid.cartographicToCartesian(c);

            c.longitude = maximumCorner.longitude;
            c.latitude  = maximumCorner.latitude;
            c.height    = minimumCorner.height;
            var v2 = ellipsoid.cartographicToCartesian(c);

            c.longitude = minimumCorner.longitude;
            c.latitude  = maximumCorner.latitude;
            c.height    = minimumCorner.height;
            var v3 = ellipsoid.cartographicToCartesian(c);

            c.longitude = minimumCorner.longitude;
            c.latitude  = minimumCorner.latitude;
            c.height    = maximumCorner.height;
            var v4 = ellipsoid.cartographicToCartesian(c);

            c.longitude = maximumCorner.longitude;
            c.latitude  = minimumCorner.latitude;
            c.height    = maximumCorner.height;
            var v5 = ellipsoid.cartographicToCartesian(c);

            c.longitude = maximumCorner.longitude;
            c.latitude  = maximumCorner.latitude;
            c.height    = maximumCorner.height;
            var v6 = ellipsoid.cartographicToCartesian(c);

            c.longitude = minimumCorner.longitude;
            c.latitude  = maximumCorner.latitude;
            c.height    = maximumCorner.height;
            var v7 = ellipsoid.cartographicToCartesian(c);


            // 8 corner points.
            mesh.attributes.position = {
                componentDatatype : Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : [
                          v0.x, v0.y, v0.z,
                          v1.x, v1.y, v1.z,
                          v2.x, v2.y, v2.z,
                          v3.x, v3.y, v3.z,
                          v4.x, v4.y, v4.z,
                          v5.x, v5.y, v5.z,
                          v6.x, v6.y, v6.z,
                          v7.x, v7.y, v7.z
                      ]
            };

            // 12 triangles:  6 faces, 2 triangles each.
            mesh.indexLists.push({
                primitiveType : Cesium.PrimitiveType.TRIANGLES,
                values : [
                          4, 5, 6, // Top: plane z = corner.Z
                          4, 6, 7,
                          1, 0, 3, // Bottom: plane z = -corner.Z
                          1, 3, 2,
                          1, 6, 5, // Side: plane x = corner.X
                          1, 2, 6,
                          2, 3, 7, // Side: plane y = corner.Y
                          2, 7, 6,
                          3, 0, 4, // Side: plane x = -corner.X
                          3, 4, 7,
                          0, 1, 5, // Side: plane y = -corner.Y
                          0, 5, 4
                      ]
            });

            return mesh;
        }
    };

