require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate", 
  "esri/widgets/Legend"
],

  function (
    Map, MapView,
    FeatureLayer,
    Home, Locate, Legend) {

    var map = new Map({
      basemap: "topo"
    });

    var view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 12,
      center: [103.8198, 1.3521]
    });

    var homeBtn = new Home({
      view: view
    });

    var locateBtn = new Locate({
      view: view
    });

    var legend = new Legend({
      view: view
    }); 

    // Add ui buttons to the top left corner of the view
    view.ui.add(homeBtn, "top-left");
    view.ui.add(locateBtn, "top-left");
    view.ui.add(legend, "bottom-left");

    var featureLayer;

    // Request URL
    var baseUrl = "https://www.grab.com/sg/wp-json/places/v1/grabpaymex/?region=SG"
    var allowOrigin = "https://api.allorigins.win/raw?url="
    // var requestUrl = allowOrigin + baseUrl
    var requestUrl = "./data/data.json"

    fetch(requestUrl)
      .then(response => response.json())
      .then(jsonResponse => createFeatures(jsonResponse[1]))
      .then(features => createFeatureLayer(features))
      .then(featureLayer => map.add(featureLayer))
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

    // Listen for change, change renderer by scale value
    view.watch("scale", function (scale) {
      featureLayer.renderer =
        scale <= 30000 ? uniqueValueRenderer : heatmapRenderer
    });

  });