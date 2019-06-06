require([

  // ArcGIS
  "esri/WebMap",
  "esri/views/MapView",

  // Widgets
  "esri/widgets/Home",
  "esri/widgets/Zoom",
  "esri/widgets/Compass",
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
], function (
  WebMap, MapView,
  Home, Zoom, Compass, Search, Legend, BasemapToggle, ScaleBar, Attribution,
  Collapse, Dropdown,
  CalciteMaps,
  CalciteMapArcGISSupport) {

    /******************************************************************
     *
     * Create the map, view and widgets
     * 
     ******************************************************************/
    
     // Map
    var map = new WebMap({
      portalItem: {
        id: "9f91f911f58540ceaac0300c55e18fbb"
      }
    });

    // View
    var mapView = new MapView({
      container: "mapViewDiv",
      map: map,
      padding: {
        top: 50,
        bottom: 0
      },
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
  });