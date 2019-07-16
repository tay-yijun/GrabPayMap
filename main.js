require([
  "esri/Map",
  "esri/Viewpoint",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate",
  "esri/widgets/Legend"
],

  function (
    Map, Viewpoint, MapView,
    FeatureLayer,
    Home, Locate, Legend) {

    // ==================================
    // Create map and UI components
    // ==================================

    var map = new Map({
      basemap: "gray-vector"
    });

    var view = new MapView({
      container: "viewDiv",
      padding: {
        top: 50
      },
      map: map,
      zoom: 11,
      center: [103.9218778181134, 1.325482651727095]
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

    // ==================================
    // Get data and create layer
    // ==================================

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

    // ==================================
    // Listen for events
    // ==================================

    // Listen for change, change renderer by scale value
    view.watch("scale", function (scale) {
      featureLayer.renderer =
        scale <= 30000 ? uniqueValueRenderer : heatmapRenderer
    });

    // When layer is loaded
    view.when(function (view) {
      view.whenLayerView(featureLayer).then(function (layerView) {
        layerView.watch("updating", function (value) {
          if (!value) {
            layerView.queryFeatures({
              geometry: view.extent
            })
              .then(function (results) {
                console.log(results);

                // Return and display feature count
                count = results.features.length; 
                document.getElementById("contentField").innerHTML = `<font color='#009D3B'>${count}</font> <hr>`;

                // Create a div DOM for each feature
                for (i = 0; i < count; i++) {
                  
                  merchant = results.features[i].attributes.mex_trading_name
                  address = results.features[i].attributes.address
                  divContent = `<b>${merchant}</b> <br> ${address} <hr>`;

                  div = document.createElement("div");
                  div.innerHTML = divContent;                  

                  document.getElementById("contentField").appendChild(div);

                }

              })
          }
        })
      })
    })

    // ==================================
    // Mobile UI
    // ==================================

    updateView(view.width < 750);

    view.watch("widthBreakpoint", function (breakpoint) {
      switch (breakpoint) {
        case "xsmall":
        case "small":
          updateView(true);
          break;
        case "medium":
        case "large":
        case "xlarge":
          updateView(false);
          break;
        default:
      }
    });

    function updateView(isMobileView) {
      if (isMobileView) {
        document.getElementById("viewDiv").style.height = "50%";
        document.getElementById("contentDiv").style.width = "100%";
        document.getElementById("contentDiv").style.height = "50%";
        document.getElementById("contentDiv").style.position = "relative";
        // document.getElementById("contentDiv").style.paddingTop = "15px";
        view.ui.remove(legend);
      }
      else {
        document.getElementById("viewDiv").style.height = "100%";
        document.getElementById("contentDiv").style.width = "30%";
        document.getElementById("contentDiv").style.height = "95%";
        document.getElementById("contentDiv").style.top = "5%";
        document.getElementById("contentDiv").style.position = "absolute";
        view.ui.add(legend, "bottom-left");
      }
    }

  });