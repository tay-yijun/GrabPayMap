require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/Home",
  "esri/widgets/Locate"
],

  function (
    Map, MapView,
    GraphicsLayer, Graphic,
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
      .then(jsonResponse => createGraphicsLayer(jsonResponse[1]))
      .catch(error => console.error('Error:', error));

    // Iterate through array to generate point graphics layer
    createGraphicsLayer = function (input) {

      var layer = new GraphicsLayer;

      // Iterate through array to generate points
      for (i = 0; i < input.length; i++) {

        // Create point geometry
        var point = {
          type: "point",
          longitude: input[i].lng,
          latitude: input[i].lat
        };

        // Create a symbol for drawing the point
        var markerSymbol = {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          color: [0, 157, 59],
        };

        var popupTemplate = {
          title: "{mex_trading_name}",
          content:
            "<p><b>Address:</b> <br>{address}</p>" +
            "<p><a href='{facebook}' target='_blank'>Facebook</a>" +
            "<br><a href='{instagram}' target='_blank'>Instagram</a>" +
            "<br><a href='{website}' target='_blank'>Website</a></p>"
        }

        // Create a graphic and add the geometry and symbol to it
        var pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          attributes: input[i],
          popupTemplate: popupTemplate
        });

        // Add graphic to layer
        layer.graphics.add(pointGraphic);

      }

      // Add layer to map
      map.add(layer);

    };

  });