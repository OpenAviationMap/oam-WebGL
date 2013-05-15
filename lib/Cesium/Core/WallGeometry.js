/*global define*/
define([
        './DeveloperError',
        './Cartesian3',
        './Cartographic',
        './Ellipsoid',
        './Math',
        './Matrix4',
        './ComponentDatatype',
        './PrimitiveType',
        './defaultValue',
        './BoundingSphere',
        './GeometryAttribute',
        './GeometryIndices'
    ], function(
        DeveloperError,
        Cartesian3,
        Cartographic,
        Ellipsoid,
        Math,
        Matrix4,
        ComponentDatatype,
        PrimitiveType,
        defaultValue,
        BoundingSphere,
        GeometryAttribute,
        GeometryIndices) {
    "use strict";

    /**
     * Creates a wall, which is similar to a line string
     *
     * @alias EllipsoidGeometry
     * @constructor
     *
     * @exception {DeveloperError} All dimensions components must be greater than or equal to zero.
     */
    var WallGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var coordinates;

        if (typeof options.coordinates !== 'undefined') {
            coordinates = options.coordinates;
        } else {
            throw new DeveloperError('Coordinates must be supplied.');
        }

        var attributes = {};
        var indexLists = [];

        var c = new Cartographic();
        var ellipsoid = Ellipsoid.WGS84;

        attributes.position = new GeometryAttribute({
            componentDatatype : ComponentDatatype.FLOAT,
            componentsPerAttribute : 3,
            values : []
        });

        // add lower and upper points one after the other, lower
        // points being even and upper points being odd
        for (var i = 0; i < options.coordinates.length; i += 3) {
            c.latitude  = Math.toRadians(options.coordinates[i+1]);
            c.longitude = Math.toRadians(options.coordinates[i]);
            c.height    = 0;
            var v = ellipsoid.cartographicToCartesian(c);

            // insert the lower point
            attributes.position.values.push(v.x);
            attributes.position.values.push(v.y);
            attributes.position.values.push(v.z);

            c.height    = parseFloat(options.coordinates[i+2]);
            v = ellipsoid.cartographicToCartesian(c);

            // insert the upper point
            attributes.position.values.push(v.x);
            attributes.position.values.push(v.y);
            attributes.position.values.push(v.z);
        }

        indexLists.push(
            new GeometryIndices({
                primitiveType : PrimitiveType.TRIANGLES,
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

        var noPoints1 = (options.coordinates.length / 3) - 1;
        var indexes = indexLists[0].values;
        for (var i = 0; i < noPoints1; ++i) {

            // first do A C B
            indexes.push(i + 1);
            indexes.push(i);
            indexes.push(i + 3);

            // now do B C D
            indexes.push(i + 3);
            indexes.push(i);
            indexes.push(i + 2);
        }

        /**
         * DOC_TBA
         */
        this.attributes = attributes;

        /**
         * DOC_TBA
         */
        this.indexLists = indexLists;

        /**
         * DOC_TBA
         */
        this.boundingSphere = new BoundingSphere.fromVertices(attributes.position.values);

        /**
         * DOC_TBA
         */
        this.modelMatrix = defaultValue(options.modelMatrix, Matrix4.IDENTITY.clone());

        /**
         * DOC_TBA
         */
        this.pickData = options.pickData;
    };

    // default KML namespace resolver, see
    // https://developer.mozilla.org/en-US/docs/Introduction_to_using_XPath_in_JavaScript#Implementing_a_User_Defined_Namespace_Resolver
    function kmlNsResolver(prefix) {
        return 'http://www.opengis.net/kml/2.2';
    }

    /**
     *  Create a Wall from a KML file that includes a LineString.
     *
     *  @param lineString the KML LineString DOM node to build this Wall from.
     *  @return a WallGeometry that reflects the KML LineString
     * @exception {DeveloperError} All dimensions components must be greater than or equal to zero.
     */
    WallGeometry.fromKML = function(lineString) {
        var tessellate;
        var altitudeMode;
        var extrude;
        var coordinates = [];

        var doc = lineString.ownerDocument;

        // get the coordinates
        var xpResult = doc.evaluate('kml:coordinates/text()', lineString, kmlNsResolver,
                                     XPathResult.STRING_TYPE, null);
        var coordString = xpResult.stringValue;
        var coordSplitWs = coordString.split(/[\s]/);
        for (var i = 0; i < coordSplitWs.length; ++i) {
            var coordLine = coordSplitWs[i];

            if (!coordLine.trim()) {
                continue;
            }
            var coordSplit = coordLine.split(',');

            coordinates.push(coordSplit[0]);
            coordinates.push(coordSplit[1]);
            coordinates.push(coordSplit.length < 3 ? 0 : coordSplit[2]);
        }

        // get the extrude flag
        var xpResult = doc.evaluate('kml:extrude/text()', lineString, kmlNsResolver,
                                     XPathResult.STRING_TYPE, null);
        extrude = xpResult.stringValue == '1';

        // get the tessellate flag
        var xpResult = doc.evaluate('kml:tessellate/text()', lineString, kmlNsResolver,
                                     XPathResult.STRING_TYPE, null);
        tessellate = xpResult.stringValue == '1';

        // get the altitudeMode flag
        var xpResult = doc.evaluate('kml:altitudeMode/text()', lineString, kmlNsResolver,
                                     XPathResult.STRING_TYPE, null);
        altitudeMode = xpResult.stringValue;

        return new WallGeometry({
            extrude      : extrude,
            tessellate   : tessellate,
            altitudeMode : altitudeMode,
            coordinates  : coordinates
        });
    };

    return WallGeometry;
});

