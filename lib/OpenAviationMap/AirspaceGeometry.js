define(['Cesium/Cesium'],
function(Cesium) {
    "use strict";

    var AirspaceGeometry = function(airspace) {
        this._airspace = airspace;

        var mesh = compute(this._airspace);

        this.attributes = mesh.attributes;
        this.indexLists = mesh.indexLists;

        this.boundingSphere = new Cesium.BoundingSphere.fromVertices(
                                                            mesh.attributes.position.values);

        this.modelMatrix = Cesium.Matrix4.IDENTITY.clone();

        this.pickData = airspace.designator;
    };


    /**
     * Compute the sides of the airspace
     *
     * @param airspace the airspace to compute the sides for
     * @return a mesh which represents the sides of the airspace
     * @exception {DeveloperError} All dimensions' components must be greater than or equal to zero.
     */
    var compute = function(airspace) {
        var mesh = {};
        mesh.attributes = {};
        mesh.indexLists = [];

        var c = new Cesium.Cartographic();
        var ellipsoid = Cesium.Ellipsoid.WGS84;

        mesh.attributes.position = new Cesium.GeometryAttribute({
            componentDatatype : Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute : 3,
            values : []
        });

        // omit the first point, as it is the same as the last one
        // add lower and upper points one after the other, lower
        // points being even and upper points being odd
        for (var i = 2; i < airspace.poslist.length; i += 2) {
            c.latitude  = Cesium.Math.toRadians(airspace.poslist[i]);
            c.longitude = Cesium.Math.toRadians(airspace.poslist[i+1]);
            c.height    = airspace.lower;
            var v = ellipsoid.cartographicToCartesian(c);

            // insert the lower point
            mesh.attributes.position.values.push(v.x);
            mesh.attributes.position.values.push(v.y);
            mesh.attributes.position.values.push(v.z);

            c.height    = airspace.upper;
            v = ellipsoid.cartographicToCartesian(c);

            // insert the upper point
            mesh.attributes.position.values.push(v.x);
            mesh.attributes.position.values.push(v.y);
            mesh.attributes.position.values.push(v.z);
        }

        mesh.indexLists.push(
            new Cesium.GeometryIndices({
                primitiveType : Cesium.PrimitiveType.TRIANGLES,
                values : []
        }));


        // prepare the side walls, two triangles for each wall
        //
        //    A (i+1)  B (i+3) E
        //    +--------+-------+
        //    |      / |      /|    triangles:  A C B
        //    |     /  |     / |                B C D
        //    |    /   |    /  |
        //    |   /    |   /   |
        //    |  /     |  /    |
        //    | /      | /     |
        //    +--------+-------+
        //    C (i)    D (i+2) F
        //    

        var noPoints1 = airspace.poslist.length - 4; 
        var indexes = mesh.indexLists[0].values;
        for (var i = 0; i < noPoints1; i += 2) {

            // first do A C B
            indexes.push(i + 1);
            indexes.push(i);
            indexes.push(i + 3);

            // now do B C D
            indexes.push(i + 3);
            indexes.push(i);
            indexes.push(i + 2);
        }

        // now tie together the last and the first
        // first do A C B
        indexes.push(1);
        indexes.push(0);
        indexes.push(noPoints1 + 1);

        // now do B C D
        indexes.push(noPoints1 + 1);
        indexes.push(0);
        indexes.push(noPoints1);


        return mesh;
    }

    return AirspaceGeometry;
});
