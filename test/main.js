require([

  // ArcGIS
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer", 

  // Widgets
  "esri/widgets/Home",
  "esri/widgets/Zoom",
  "esri/widgets/Compass",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/widgets/Legend",
  "esri/widgets/BasemapToggle",
  "esri/widgets/ScaleBar",
  "esri/widgets/Attribution",

  // Bootstrap
  "bootstrap/Collapse",
  "bootstrap/Dropdown",

  // Calcite Maps
  "calcite-maps/calcitemaps-v0.10",

  // Calcite Maps ArcGIS Support
  "calcite-maps/calcitemaps-arcgis-support-v0.10",

  "dojo/domReady!"
],

  function (
    Map, MapView, FeatureLayer, 
    Home, Zoom, Compass, Locate, Search,
    Legend, BasemapToggle, ScaleBar, Attribution,
    Collapse, Dropdown,
    CalciteMaps,
    CalciteMapArcGISSupport) {

    /******************************************************************
     *
     * Create the map, view and widgets
     * 
     ******************************************************************/

    // Map
    var map = new Map({
      basemap: "topo"
    });

    // View
    var mapView = new MapView({
      container: "mapViewDiv",
      map: map,
      padding: {
        top: 50,
        bottom: 0
      },
      zoom: 12,
      center: [103.8198, 1.3521],
      ui: { components: [] }
    });

    // Popup and panel sync
    mapView.when(function () {
      CalciteMapArcGISSupport.setPopupPanelSync(mapView);
    });

    // Search - add to navbar
    var searchWidget = new Search({
      container: "searchWidgetDiv",
      view: mapView
    });
    CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

    // Map widgets
    var home = new Home({
      view: mapView
    });
    mapView.ui.add(home, "top-left");

    var zoom = new Zoom({
      view: mapView
    });
    mapView.ui.add(zoom, "top-left");

    var locateBtn = new Locate({
      view: mapView
    });
    mapView.ui.add(locateBtn, "top-left");

    var compass = new Compass({
      view: mapView
    });
    mapView.ui.add(compass, "top-left");

    var basemapToggle = new BasemapToggle({
      view: mapView,
      secondBasemap: "satellite"
    });
    mapView.ui.add(basemapToggle, "bottom-right");

    var scaleBar = new ScaleBar({
      view: mapView
    });
    mapView.ui.add(scaleBar, "bottom-left");

    var attribution = new Attribution({
      view: mapView
    });
    mapView.ui.add(attribution, "manual");

    // Panel widgets - add legend
    var legendWidget = new Legend({
      container: "legendDiv",
      view: mapView
    });

    /******************************************************************
     *
     * Create the feature layer
     * 
     ******************************************************************/

    var featureLayer;

    // Request URL
    var baseUrl = "https://www.grab.com/sg/wp-json/places/v1/grabpaymex/?region=SG"
    var allowOrigin = "https://api.allorigins.win/raw?url="
    var requestUrl = allowOrigin + baseUrl
    // var requestUrl = "./data/data.json"

    fetch(requestUrl)
      .then(response => response.json())
      .then(jsonResponse => createFeatures(jsonResponse[1]))
      .then(features => createFeatureLayer(features))
      .then(featureLayer => map.add(featureLayer))
      .then(response => console.log(response))
      .catch(error => console.error('Error:', error));

    var uniqueValueRenderer = {
      type: "unique-value",
      field: "service", 
      legendOptions: {
        title: "Service Type"
      },
      uniqueValueInfos: [
        {
          value: "fnb", 
          label: "F&B", 
          symbol: {
            type: "picture-marker", 
            url: "./img/icon-fnb.jpg", 
            width: "32px", 
            height: "32px"
          }
        }, 
        {
          value: "retail", 
          label: "Retail", 
          symbol: {
            type: "picture-marker", 
            url: "./img/icon-retail.jpg", 
            width: "32px", 
            height: "32px"
          }
        }, 
        {
          value: "service", 
          label: "Services", 
          symbol: {
            type: "picture-marker", 
            url: "./img/icon-service.jpg", 
            width: "32px", 
            height: "32px"
          }
        }, 
        {
          value: "others", 
          label: "Others",
          symbol: {
            type: "picture-marker", 
            url: "./img/icon-others.jpg", 
            width: "32px", 
            height: "32px"
          }
        },
      ]
    };

    var heatmapRenderer = {
      type: "heatmap",
      colorStops: [
        { ratio: 0, color: "rgba(191, 230, 206, 0)" },
        { ratio: 0.2, color: "rgba(191, 230, 206, 0.2)" },
        { ratio: 0.3, color: "rgba(127, 206, 157, 0.4)" },
        { ratio: 0.4, color: "rgba(63, 181, 108, 0.6)" },
        { ratio: 1, color: "rgba(0, 157, 59, 0.8)" }
      ],
      maxPixelIntensity: 100,
      minPixelIntensity: 0
    };

    // Iterate through JSON response to create array of features
    createFeatures = function (input) {

      var features = [];

      for (i = 0; i < input.length; i++) {
        // for (i = 0; i < 5; i++) {

        var feature = {};

        // Create feature geomtry
        feature.geometry = {
          type: "point",
          longitude: input[i].lng,
          latitude: input[i].lat
        };

        // Create feature attributes
        feature.attributes = input[i];

        // Conditional value from JSON
        // To-do: write this in a more efficient way
        if (feature.attributes.type_fnb == "1") {
          feature.attributes.service = "fnb"
        }
        else if (feature.attributes.type_retail == "1") {
          feature.attributes.service = "retail"
        }
        else if (feature.attributes.type_service == "1") {
          feature.attributes.service = "service"
        }
        else {
          feature.attributes.service = "others"
        }

        // Adding a count field for heatmap renderer to work
        feature.attributes.count = 1;

        features.push(feature);
      }

      return features
    };

    // Create feature layer from features array
    createFeatureLayer = function (features) {

      var popupTemplate = {
        title: "{mex_trading_name}",
        content:
          "<p><b>Address:</b> <br>{address}</p>" +
          "<p><a href='{facebook}' target='_blank'>Facebook</a>" +
          "<br><a href='{instagram}' target='_blank'>Instagram</a>" +
          "<br><a href='{website}' target='_blank'>Website</a></p>"
      };

      var fields = [
        {
          name: "id",
          alias: "id",
          type: "oid"
        },
        {
          name: "mex_trading_name",
          alias: "mex_trading_name",
          type: "string"
        },
        {
          name: "address",
          alias: "address",
          type: "string"
        },
        {
          name: "service",
          alias: "service",
          type: "string"
        },
        {
          name: "facebook",
          alias: "facebook",
          type: "string"
        },
        {
          name: "instagram",
          alias: "instagram",
          type: "string"
        },
        {
          name: "website",
          alias: "website",
          type: "string"
        },
        {
          name: "count",
          alias: "count",
          type: "integer"
        }
      ];

      featureLayer = new FeatureLayer({

        title: "GrabPay Merchants",
        fields: fields,
        objectIdField: "id",
        geometryType: "point",
        spatialReference: { wkid: 4326 },
        source: features,
        popupTemplate: popupTemplate,
        renderer: heatmapRenderer,
      });

      return featureLayer
    };

    // // Listen for change, change renderer by scale value
    // mapView.watch("scale", function (scale) {
    //   featureLayer.renderer =
    //     scale <= 30000 ? uniqueValueRenderer : heatmapRenderer
    // });

  });