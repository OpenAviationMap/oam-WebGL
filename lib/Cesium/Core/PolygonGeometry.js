/*global define*/
define([
        './DeveloperError',
        './Cartesian2',
        './Cartesian3',
        './Matrix3',
        './Cartographic',
        './Ellipsoid',
        './Math',
        './Matrix4',
        './ComponentDatatype',
        './PrimitiveType',
        './defaultValue',
        './BoundingSphere',
        './GeometryAttribute',
        './GeometryIndices',
        './PolygonPipeline',
        './EllipsoidTangentPlane',
        './WindingOrder',
        './BoundingRectangle',
        './Quaternion',
        './GeometryFilters',
        '../Scene/sampleTerrain',
        '../ThirdParty/when'
    ], function(
        DeveloperError,
        Cartesian2,
        Cartesian3,
        Matrix3,
        Cartographic,
        Ellipsoid,
        CesiumMath,
        Matrix4,
        ComponentDatatype,
        PrimitiveType,
        defaultValue,
        BoundingSphere,
        GeometryAttribute,
        GeometryIndices,
        PolygonPipeline,
        EllipsoidTangentPlane,
        WindingOrder,
        BoundingRectangle,
        Quaternion,
        GeometryFilters,
        sampleTerrain,
        when) {
    "use strict";

    /**
     * @alias PolygonGeometry
     * @constructor
     *
     * @exception {DeveloperError} All dimensions components must be greater than or equal to zero.
     */
    var PolygonGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var positions;

        if (typeof options.positions !== 'undefined') {
            this.positions = options.positions;
        } else {
            throw new DeveloperError('Coordinates must be supplied.');
        }

        var attributes = {};
        var indexLists = [];

        var ellipsoid = Ellipsoid.WGS84;

        var boundingVolume = BoundingSphere.fromPoints(this.positions);
        var mesh = this.createMeshFromPositions(this.positions, boundingVolume);

        mesh = PolygonPipeline.scaleToGeodeticHeight(mesh, options.height, ellipsoid);
        mesh = GeometryFilters.reorderForPostVertexCache(mesh);
        mesh = GeometryFilters.reorderForPreVertexCache(mesh);

        attributes.position = new GeometryAttribute({
            componentDatatype : ComponentDatatype.FLOAT,
            componentsPerAttribute : 3,
            values : mesh.attributes.position.values
        });

        indexLists.push(
            new GeometryIndices({
                primitiveType : PrimitiveType.TRIANGLES,
                values : mesh.indexLists[0].values
        }));


        /**
         * The attributes (vertices)
         */
        this.attributes = attributes;

        /**
         * The indexes used for GL rendering
         */
        this.indexLists = indexLists;

        /**
         * The bounding sphere for the whole geometry
         */
        this.boundingSphere = boundingVolume;

        /**
         * The model matrix, simply the identity
         */
        this.modelMatrix = defaultValue(options.modelMatrix, Matrix4.IDENTITY.clone());

        /**
         * Pick data used for selection
         */
        this.pickData = options.pickData;
    };

    PolygonGeometry.prototype.createMeshFromPositions = function(positions, boundingSphere, outerPositions) {
        var cleanedPositions = PolygonPipeline.cleanUp(positions);
        if (cleanedPositions.length < 3) {
            // Duplicate positions result in not enough positions to form a polygon.
            return undefined;
        }

        var tangentPlane = EllipsoidTangentPlane.fromPoints(cleanedPositions, this.ellipsoid);
        var positions2D = tangentPlane.projectPointsOntoPlane(cleanedPositions);

        var originalWindingOrder = PolygonPipeline.computeWindingOrder2D(positions2D);
        if (originalWindingOrder === WindingOrder.CLOCKWISE) {
            positions2D.reverse();
            cleanedPositions.reverse();
        }
        var indices = PolygonPipeline.earClip2D(positions2D);
        // Checking bounding sphere with plane for quick reject
        var minX = boundingSphere.center.x - boundingSphere.radius;
        if ((minX < 0) && (BoundingSphere.intersect(boundingSphere, Cartesian4.UNIT_Y) === Intersect.INTERSECTING)) {
            indices = PolygonPipeline.wrapLongitude(cleanedPositions, indices);
        }
        var mesh = PolygonPipeline.computeSubdivision(cleanedPositions, indices, this._granularity);

        return mesh;
    };

    return PolygonGeometry;
});

