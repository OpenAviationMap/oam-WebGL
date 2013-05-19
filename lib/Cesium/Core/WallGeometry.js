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
        './GeometryIndices',
        '../Scene/sampleTerrain',
        '../ThirdParty/when'
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
        GeometryIndices,
        sampleTerrain,
        when) {
    "use strict";

    /**
     * Creates a wall, which is similar to a line string
     *
     * @alias WallGeometry
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

        if (options.altitudeMode === 'relativeToGround' && typeof options.terrain === 'undefined') {
            throw new DeveloperError('No terrain supplied when required.');
        }

        var c = new Cartographic();
        var ellipsoid = Ellipsoid.WGS84;

        attributes.position = new GeometryAttribute({
            componentDatatype : ComponentDatatype.FLOAT,
            componentsPerAttribute : 3,
            values : []
        });

        // add lower and upper points one after the other, lower
        // points being even and upper points being odd
        for (var i = 0, j = 0; i < options.coordinates.length; i += 3, ++j) {
            c.latitude  = Math.toRadians(options.coordinates[i+1]);
            c.longitude = Math.toRadians(options.coordinates[i]);
            c.height    = 0;
            var v = ellipsoid.cartographicToCartesian(c);

            // insert the lower point
            attributes.position.values.push(v.x);
            attributes.position.values.push(v.y);
            attributes.position.values.push(v.z);

            c.height    = parseFloat(options.coordinates[i+2]);
            if (options.terrain !== undefined) {
                c.height += options.terrain[j].height;
            }
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

        var noPoints1 = (options.coordinates.length / 3) * 2 - 3;
        var indexes = indexLists[0].values;
        for (i = 0; i < noPoints1; i += 2) {

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
        this.ellipsoid = ellipsoid;

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

    /**
     * Event handler for receiving terrain info when available.
     *
     * @memberof WallGeometry
     * @param positions the requested positions with the height info added to them
     */
    WallGeometry.prototype.gotTerrain = function(positions) {
        // offset position height values with what we got here
        // the values to be replaced are the elevation (z) coordinate
        // of each odd tripple attribute, that is indexes 3, 9, etc
        for (var i = 0, j = 3; i < positions.length - 1; ++i, j += 6) {
            var c = positions[i];
            c.height = 1000;
            var v = this.ellipsoid.cartographicToCartesian(c);

            this.attributes.position.values[j]     = v.x;
            this.attributes.position.values[j + 1] = v.y;
            this.attributes.position.values[j + 2] = v.z;
        }
    };

    // default KML namespace resolver, see
    // https://developer.mozilla.org/en-US/docs/Introduction_to_using_XPath_in_JavaScript#Implementing_a_User_Defined_Namespace_Resolver
    function kmlNsResolver(prefix) {
        return 'http://www.opengis.net/kml/2.2';
    }

    /**
     * Create a set of Walls from a KML document that includes LineString elements.
     *
     * @param kmlNode the KML documents document node
     * @param terrainProvider an optional terrain provider for LineStrings that need
     *        a ground reference.
     * @param callback a function that will receive each WallGeometry created.
     */
    WallGeometry.fromKML = function kmlReqListener(kmlNode, terrainProvider, callback) {
        var name = kmlNode.evaluate('//kml:name', kmlNode, kmlNsResolver,
                                    XPathResult.STRING_TYPE, null);

        var it = kmlNode.evaluate('//kml:LineString', kmlNode, kmlNsResolver,
                                  XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        for (var node = it.iterateNext(); node; node = it.iterateNext()) {
            WallGeometry.fromKMLLineString(node, terrainProvider, function(wall) {
                wall.pickData = name;
                callback(wall);
            });
        }
    };

    /**
     *  Create a Wall from a KML LineString DOM element.
     *
     *  @param lineString the KML LineString DOM node to build this Wall from.
     *  @param terrainProvider an optional terrain provider, used when relative-to-ground elevation
     *         data is needed to render the wall
     *  @param callback the callback that will be called with the created WallGeometry
     */
    WallGeometry.fromKMLLineString = function(lineString, terrainProvider, callback) {
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
        xpResult = doc.evaluate('kml:extrude/text()', lineString, kmlNsResolver,
                                XPathResult.STRING_TYPE, null);
        extrude = xpResult.stringValue === '1';

        // get the tessellate flag
        xpResult = doc.evaluate('kml:tessellate/text()', lineString, kmlNsResolver,
                                XPathResult.STRING_TYPE, null);
        tessellate = xpResult.stringValue === '1';

        // get the altitudeMode flag
        xpResult = doc.evaluate('kml:altitudeMode/text()', lineString, kmlNsResolver,
                                XPathResult.STRING_TYPE, null);
        altitudeMode = xpResult.stringValue;

        var options = {
            extrude         : extrude,
            tessellate      : tessellate,
            altitudeMode    : altitudeMode,
            coordinates     : coordinates
        };

        if (altitudeMode === 'relativeToGround') {
            // request the terrain data for each point of the line string
            var coords = [];
            var c = new Cartographic();

            for (i = 0; i < options.coordinates.length; i += 3) {
                c.latitude  = Math.toRadians(options.coordinates[i+1]);
                c.longitude = Math.toRadians(options.coordinates[i]);
                c.height    = parseFloat(options.coordinates[i+2]);

                coords.push(c);
            }

            // request the elevation ground data
            when(sampleTerrain(terrainProvider, 11, coords), function(positions) {
                options.terrain = positions;

                var wall = new WallGeometry(options);
                callback(wall);
            });
        } else {
            // just create a Wall and return it
            var wall = new WallGeometry(options);
            callback(wall);
        }
    };

    return WallGeometry;
});

