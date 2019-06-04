require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate"
],

  function (
    Map, MapView,
    FeatureLayer,
    Home, Locate) {

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

    // Add ui buttons to the top left corner of the view
    view.ui.add(homeBtn, "top-left");
    view.ui.add(locateBtn, "top-left");

    // Request URL
    var baseUrl = "https://www.grab.com/sg/wp-json/places/v1/grabpaymex/?region=SG"
    var allowOrigin = "https://api.allorigins.win/raw?url="
    var requestUrl = allowOrigin + baseUrl

    fetch(requestUrl)
      .then(response => response.json())
      .then(jsonResponse => createFeatures(jsonResponse[1]))
      .then(features => createFeatureLayer(features))
      .then(featureLayer => map.add(featureLayer))
      .catch(error => console.error('Error:', error));

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

        features.push(feature);
      }

      return features

    };

    // Create feature layer from features array
    createFeatureLayer = function (features) {

      var renderer = {
        type: "simple",  // autocasts as new SimpleRenderer()
        symbol: {
          type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
          size: 6,
          color: [0, 157, 59, 0.8],
          outline: {  // autocasts as new SimpleLineSymbol()
            width: 0.5,
            color: "white"
          }
        }
      };

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
      ];

      var featureLayer = new FeatureLayer({

        // create an instance of esri/layers/support/Field for each field object
        fields: fields,
        objectIdField: "id",
        geometryType: "point",
        spatialReference: { wkid: 4326 },
        source: features,
        popupTemplate: popupTemplate,
        renderer: renderer,
      });

      return featureLayer

    };

  });