define(['Cesium/Cesium',
        'Widgets/Dojo/CesiumViewerWidget',
        './Airspace',
        './AirspaceFilterButton'],
function(Cesium,
         CesiumViewerWidget,
         Airspace,
         AirspaceFilterButton) {
    "use strict";

    /**
     * Create an Open Aviation Map Viewer.
     *
     * @param {string} container the name of the div to put the OAM viewer into.
     * @param {array of string} [aixmUrls] a list of URLs pointing to AIXM files to display.
     */
    var OamViewer = function(options) {
        if (typeof options.container === 'undefined') {
            throw new Cesium.DeveloperError('container is required.');
        }

        var container = options.container;

        if (typeof container === 'string') {
            var tmp = document.getElementById(container);
            if (tmp === null) {
                throw new Cesium.DeveloperError('Element with id "' + container + '" does not exist in the document.');
            }
            container = tmp;
        }

        // create the cesium vidget & set it up
        var widget = new CesiumViewerWidget({});

        // place & start
        widget.placeAt(container);
        widget.startup();

        // override the base layer imagery providers
        widget.baseLayerPicker.destroy();
        // workaround to remove all elements in the container
        // see https://github.com/AnalyticalGraphicsInc/cesium/issues/788
        while (widget.baseLayerPickerContainer.firstChild) {
            widget.baseLayerPickerContainer.removeChild(widget.baseLayerPickerContainer.firstChild);
        }

        var imageryLayers = widget.centralBody.getImageryLayers();
        var providerViewModels = createImageryProviders(widget.dayImageUrl);
        widget.baseLayerPicker = new Cesium.BaseLayerPicker(widget.baseLayerPickerContainer,
                                                            imageryLayers,
                                                            providerViewModels);
        widget.baseLayerPicker.viewModel.selectedItem(providerViewModels[0]);

        // remove the scene mode picker as we're only doing 3D
        widget.sceneModePicker.destroy();
        widget.sceneModePicker = undefined;

        // remove the home button
        widget.homeButton.destroy();
        widget.homeButton = undefined;

        // remove the clock & timeline for now
        widget.timeline.destroy();
        widget.timeline = undefined;
        widget.animation.destroy();
        widget.animation = undefined;

        // add a button
        var filters = document.createElement('div');
        filters.className = 'OpenAviationMap-AirspaceFilters';
        container.appendChild(filters);

        for (var type in Airspace.typeToColor) {
            console.log(type);
            var filterButton = new AirspaceFilterButton(filters, this, type, Airspace.typeToColor[type]);
        }

        // add a terrain provider so that we have 3D terrain
        var terrainProvider = new Cesium.CesiumTerrainProvider({ url : 'http://cesium.agi.com/smallterrain' });
        widget.centralBody.terrainProvider = terrainProvider;
        widget.centralBody.depthTestAgainstTerrain = true;

        var primitives = widget.scene.getPrimitives();
        var airspaces = [];

        /**
         * The underlying Cesium widget object.
         */
        this.cesiumWidget = widget;

        /**
         * The airspaces displayed in the viewer.
         */
        this.airspaces = airspaces;

        if (typeof options.aixmUrls !== 'undefined') {
            this.loadAirspaces(options.aixmUrls);
        }

        widget.onObjectSelected = function(selectedObject) {
            console.log(selectedObject);
        };
    };

    /**
     * Load airspaces into the Open Aviation Map viewer.
     *
     * @param {array of string} aixmUrls an array of URLs pointint at AIXM files.
     */
    OamViewer.prototype.loadAirspaces = function(aixmUrls) {
        var primitives = this.cesiumWidget.scene.getPrimitives();
        var that = this;

        Airspace.fromAixmUrls(aixmUrls, function(airspaces) {
            for (var i = 0; i < airspaces.length; ++i) {
                that.airspaces.push(airspaces[i]);
                primitives.add(airspaces[i].primitive);
            }
        });
    }

    /**
     * Toggle the display of a particular type of airspace.
     *
     * @param {String} airspaceType the type of airspace to show / not to show
     *        like 'TRA' or 'D'
     */
    OamViewer.prototype.toggleAirspaceType = function(airspaceType) {
        for (var i = 0; i < this.airspaces.length; ++i) {
            var ap = this.airspaces[i];

            if (ap.type === airspaceType) {
                ap.primitive.show = !ap.primitive.show;
            }
        }
    }

    /**
     * Create a list of imagery providers to be used by the base layer picker.
     */
    function createImageryProviders(dayImageUrl) {
        var proxy = new Cesium.DefaultProxy('/proxy/');
        //While some sites have CORS on, not all browsers implement it properly, so a proxy is needed anyway;
        var proxyIfNeeded = Cesium.FeatureDetection.supportsCrossOriginImagery() ? undefined : proxy;

        var providerViewModels = [];
        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'Bing Maps Aerial',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/bingAerial.png'),
            tooltip : 'Bing Maps aerial imagery \nhttp://www.bing.com/maps',
            creationFunction : function() {
                return new Cesium.BingMapsImageryProvider({
                    url : 'http://dev.virtualearth.net',
                    mapStyle : Cesium.BingMapsStyle.AERIAL,
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'Bing Maps Aerial with Labels',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/bingAerialLabels.png'),
            tooltip : 'Bing Maps aerial imagery with label overlays \nhttp://www.bing.com/maps',
            creationFunction : function() {
                return new Cesium.BingMapsImageryProvider({
                    url : 'http://dev.virtualearth.net',
                    mapStyle : Cesium.BingMapsStyle.AERIAL_WITH_LABELS,
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'Bing Maps Roads',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/bingRoads.png'),
            tooltip : 'Bing Maps standard road maps\nhttp://www.bing.com/maps',
            creationFunction : function() {
                return new Cesium.BingMapsImageryProvider({
                    url : 'http://dev.virtualearth.net',
                    mapStyle : Cesium.BingMapsStyle.ROAD,
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'Open\u00adStreet\u00adMap',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/openStreetMap.png'),
            tooltip : 'OpenStreetMap (OSM) is a collaborative project to create a free editable map \
of the world.\nhttp://www.openstreetmap.org',
            creationFunction : function() {
                return new Cesium.OpenStreetMapImageryProvider({
                    url : 'http://tile.openstreetmap.org/',
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'MapQuest Open\u00adStreet\u00adMap',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/mapQuestOpenStreetMap.png'),
            tooltip : 'OpenStreetMap (OSM) is a collaborative project to create a free editable \
map of the world.\nhttp://www.openstreetmap.org',
            creationFunction : function() {
                return new Cesium.OpenStreetMapImageryProvider({
                    url : 'http://otile1.mqcdn.com/tiles/1.0.0/osm/',
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'The Black Marble',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/blackMarble.png'),
            tooltip : 'The lights of cities and villages trace the outlines of civilization in this global view of the \
Earth at night as seen by NASA/NOAA\'s Suomi NPP satellite.',
            creationFunction : function() {
                return new Cesium.TileMapServiceImageryProvider({
                    url : 'http://cesium.agi.com/blackmarble',
                    maximumLevel : 8,
                    credit : 'Black Marble imagery courtesy NASA Earth Observatory',
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'Disable Streaming Imagery',
            iconUrl : require.toUrl('lib/Cesium/Widgets/Images/ImageryProviders/singleTile.png'),
            tooltip : 'Uses a single image for the entire world.',
            creationFunction : function() {
                return new Cesium.SingleTileImageryProvider({
                    url : dayImageUrl,
                    proxy : proxyIfNeeded
                });
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'Open Aviation Map with airspaces',
            iconUrl : require.toUrl('var/icon.png'),
            tooltip : 'Open Aviation Map.',
            creationFunction : function() {
                var bg = new Cesium.SingleTileImageryProvider({
                    url: 'var/white.png'
                });
                var osmProvider = new Cesium.OpenStreetMapImageryProvider({
                    url: 'http://openaviationmap.tyrell.hu/static/osm',
                    maximumLevel: 15,
                    credit: 'Open Aviation Map'
                });
                var oamProvider = new Cesium.OpenStreetMapImageryProvider({
                    url: 'http://openaviationmap.tyrell.hu/static/oam',
                    maximumLevel: 15,
                    credit: 'Open Aviation Map'
                });

                return [ bg, osmProvider, oamProvider ];
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'ICAO ground chart by Open Aviation Map',
            iconUrl : require.toUrl('var/icon.png'),
            tooltip : 'ICAO ground chart.',
            creationFunction : function() {
                var bg = new Cesium.SingleTileImageryProvider({
                    url: 'var/white.png'
                });
                var osmProvider = new Cesium.OpenStreetMapImageryProvider({
                    url: 'http://openaviationmap.tyrell.hu/static/osm',
                    maximumLevel: 15,
                    credit: 'Open Aviation Map'
                });

                return [ bg, osmProvider ];
            }
        }));

        providerViewModels.push(Cesium.ImageryProviderViewModel.fromConstants({
            name : 'No ground layer',
            iconUrl : require.toUrl('var/white.png'),
            tooltip : 'No ground layer.',
            creationFunction : function() {
                var bg = new Cesium.SingleTileImageryProvider({
                    url: 'var/white.png'
                });

                return bg;
            }
        }));


        return providerViewModels;
    }

    return OamViewer;
});

