// var portalUrl = "https://citymaps.capetown.gov.za/agsport";
// var webmapID = "74f5e1129b0c48dca92d30c1046431bb";

var propertyLayerUrl = "https://citymaps.capetown.gov.za/agsext/rest/services/Search_Layers/SL_RGDB_PRTY/MapServer";
var geometryServiceUrl = "https://citymaps.capetown.gov.za/agsext/rest/services/Utilities/Geometry/GeometryServer"
var streetsLayerUrl = "https://citymaps.capetown.gov.za/agsext/rest/services/Search_Layers/SL_WGDB_STR_NAME/MapServer"
var suburbLayerUrl = "https://citymaps.capetown.gov.za/agsext/rest/services/Search_Layers/SL_WGDB_OFC_SBRB/MapServer";
var wardLayerUrl = "https://citymaps.capetown.gov.za/agsext/rest/services/Search_Layers/SL_RGDB_WARD/MapServer";
var subcouncilLayerUrl = "https://citymaps.capetown.gov.za/agsext/rest/services/Search_Layers/SL_CGIS_SUB_CNCL/MapServer";
var electricityRegionURL = "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Basic_Services_Infrastructure/MapServer";

var solrAddressUrl = "https://mapsearch.capetown.gov.za/solr/coct/select";

var activeTool = null;
var mapPoint = null;
var propertyGraphicsLayer = null;
var installationPointGraphicsLayer = null;
var markerSymbol = null;
var markerSymbolUrl = "img/pin.png"
var view = null;
var webmap = null;
var $panelDiv = null;
var $viewDiv = null;
var initialLocationQueue = [];
var aerialImageryLayer = null;
var electricityRegion = null;
var selectedProperty = null;
var selectedIsiskey = null;
var existingPlot = "";
var sketchWidget = null;
var isHostedInParent = false;

// Receive data from Parent
window.addEventListener("message", function(message) {
	var messageData = message.data;
	console.log("Map: message received: ", {
		messageData
	})

	// Resctrict messages from Parent e.g.: https://eservices1.capetown.gov.za
	//if ((message.origin != window.location.origin) && (message.origin !=  "http://127.0.0.1:5500")) {
	//    app.notifyUser.show("error", "I'm only allowed to receive messages from http://127.0.0.1:5500")
	//    return;
	//} 
	app.notifyUser.hide();

	if (messageData == "ClientReady") {
		isHostedInParent = true;
		app.hideSearchTools();
	}

	if (!messageData.command)
		return;

	if (messageData.command == "ZoomToIsisKey") {
		if (messageData.isiskey) {
			selectedIsiskey = messageData.isiskey
			app.zoomToIsisKey(selectedIsiskey)
		}

		if (messageData.existingPlotJson) {
			existingPlot = messageData.existingPlotJson
			app.handleAddExistingPlot(existingPlot)
		}
	}
})

$(function() {
	console.log("Map: DOM loaded")
	app.loadMap();

	$btnConfirmAddressLocation = $("#btnConfirmAddressLocation");
	$btnClearMap = $("#btnClearMap");
	$btnAerialPhoto = $("#btnAerialPhoto");
	$selectAddress = $("#selectAddress");

	$iconAerialImagery = $("#iconAerialImagery")
	$noticeMessageDiv = $("#noticeMessageDiv");
	$propertyResultsDiv = $("#propertyResultsDiv");
	$drawingToolsDiv = $("#drawingToolsDiv")
	$sketchWidgetDiv = $("#sketchWidgetDiv")
	$lblPropertyResultsCount = $("#lblPropertyResultsCount");
	$noticeDiv = $("#noticeDiv");
	$loaderDiv = $("#loaderDiv");
	$tabs = $("#tabs")
	$panelDiv = $("#panelDiv");
	$viewDiv = $("#viewDiv");

	$selectAddress.on("calciteSelectChange", function(evt) {
		app.handleAddressSelect(evt)
	})

	$btnAerialPhoto.click(function() {
		app.toggleAerialImagery();
	})

	$btnConfirmAddressLocation.click(function() {
		sketchWidget.cancel();
		app.notifyUser.show("success", "Installation Location confirmed!")

		// INTEGRATION SECTION OUTPUT  START
		// UNPACK installationLocation details
		console.table(installationLocation)
			// INTEGRATION SECTION OUTPUT  END

		var message = {
			installationLocation: installationLocation
		}
		app.messageParent(message)
	})

	$btnClearMap.click(function() {
		app.resetMessage();

		if (!isHostedInParent) {
			app.loadMap();
			return;
		}

		app.zoomToIsisKey(selectedIsiskey)
		app.handleAddExistingPlot(existingPlot)
	});
})

var app = {
	hideSearchTools: function(params) {},
	handleAddExistingPlot: function(existingPlotJson) {
		var features = [JSON.parse(existingPlotJson)]
		app.displayExistingFeatures(features)
	},
	zoomToIsisKey: function(isisKey) {

		app.getPropertyByIsisKey(isisKey, app.handleGetProperty)
	},
	loadMap: function(params) {
		console.time("Map: LoadWebmap")
		require(["esri/config",
				"esri/WebMap",
				"esri/views/MapView"
			],
			function(esriConfig,
				WebMap,
				MapView) {

				var portalUrl = "https://citymaps.capetown.gov.za/agsport";
				var webmapID = "74f5e1129b0c48dca92d30c1046431bb";

				// esriConfig.request.trustedServers.push(portalUrl);
				esriConfig.portalUrl = portalUrl

				webmap = new WebMap({
					portalItem: {
						id: webmapID
					}
				});

				view = new MapView({
					map: webmap,
					container: "viewDiv",
					navigation: {
						mouseWheelZoomEnabled: false,
						browserTouchPanEnabled: false
					},
					constraints: {
						rotationEnabled: false
					}
				});

				view.when(app.handleViewLoaded);
				view.watch("widthBreakpoint", app.handleWidthBreakpointWatch);
				view.on("click", app.handleViewClick)
				view.on("mouse-wheel", app.handleMouseWheel);
				view.on("pointer-down", app.handlePointerDown);
			})
	},
	messageParent: function(message) {
		// Send data to the Parent
		// Restrict messages to Parent e.g.: https://eservices1.capetown.gov.za
		window.parent.postMessage(message, "*");
		console.log("Map: Message posted", {
			message
		})
	},
	getPropertyByIsisKey: function(isisKey, callback) {
		require(["esri/rest/support/Query",
				"esri/rest/query",
				"esri/geometry/SpatialReference"
			],
			function(Query,
				query,
				SpatialReference) {

				var q = new Query();
				q.where = `SL_LAND_PRCL_KEY = ${isisKey}`;
				q.outSpatialReference = new SpatialReference({
					wkid: 3857
				})
				q.outFields = ["*"];
				q.returnGeometry = true;

				app.loader.show("Querying property details...")
				var queryProperty = query.executeQueryJSON(propertyLayerUrl + "/0", q);
				queryProperty.then(function(featureSet) {
					app.loader.hide();
					callback(featureSet.features);
				}, function(error) {
					app.loader.hide();
					console.error(error);
					app.notifyUser.show("error", "We are unable to query your property details at this time.")
					callback([])
				})
			})
	},
	displayExistingFeatures: function(features) {

		require(["esri/Graphic"],
			function(Graphic) {

				installationPointGraphicsLayer.removeAll();
				features.forEach(function(feature) {

					var pointGraphic = new Graphic({
						symbol: markerSymbol,
						geometry: feature.geometry
					})

					installationPointGraphicsLayer.add(pointGraphic)
				})
			})
	},
	handleGetElectricityRegion: function(features) {
		if (features.length == 0) {
			app.notifyUser.show("warning", `Intersecting Electricity Region not found`)
			return;
		}

		installationLocation.ELECTRICITY_REGION = features[0].attributes["RGN"]
	},
	getElectricityRegion: function(mapPoint, callback) {
		require(["esri/rest/support/Query",
				"esri/rest/query"
			],
			function(Query,
				query) {

				var q = new Query();
				q.geometry = mapPoint;
				q.outFields = ["*"];
				q.returnGeometry = false;

				app.loader.show("Querying electricity region...")
				var queryElecRegion = query.executeQueryJSON(electricityRegionURL + "/1", q);

				queryElecRegion.then(function(featureSet) {
					app.loader.hide()
					callback(featureSet.features);
				}, function(error) {
					app.loader.hide()
					console.error(error);
					app.notifyUser.show("error", "We are unable to locate your Electricity Region at this time.")
				})
			})
	},
	toggleAerialImagery: function(forceValue) {

		aerialImageryLayer.visible = !aerialImageryLayer.visible;

		if (forceValue) {
			aerialImageryLayer.visible = forceValue
		}

		var iconName = aerialImageryLayer.visible ? "view-visible" : "view-hide";
		$iconAerialImagery.prop("icon", iconName)
	},
	setLayout: function(device) {
		if (device == "mobile") {
			$panelDiv.removeClass("panel-float");
			$panelDiv.addClass("panel-dock");
			$panelDiv.css("max-width", "");

			//view.padding.right = 0
			//view.padding.bottom = $panelDiv.height()

		} else { // Desktop
			$panelDiv.removeClass("panel-dock");
			$panelDiv.addClass("panel-float");
			$panelDiv.css("max-width", "300px")

			//view.padding.right = 300
			//view.padding.bottom = 0;
		}
	},
	handleWidthBreakpointWatch: function(breakpoint) {
		switch (breakpoint) {
			case "xsmall":
				app.setLayout("mobile")
				break;
			case "small":
			case "medium":
			case "large":
			case "xlarge":
				app.setLayout("desktop")
				break;
		}
	},
	geocodeAddress: function(address, callback) {
		require(["esri/request"],
			function(esriRequest) {
				esriRequest(solrAddressUrl, {
					query: {
						q: address,
						fq: "facet:StreetAddress",
						df: "fulltext",
						wt: 'json'
					},
					responseType: "json"
				}).then(function(results) {
					callback(results.data.response.docs)
				}, function(error) {
					console.error(error);
					app.notifyUser.show("error", "We are unable to provide search suggestions at this time.")
					callback([])
				})
			})
	},
	handleAddressGeocode: function(solrResults) {

		if (solrResults.length == 0) {
			app.notifyUser.show("info", "Initial property could not be geocoded, use the map and navigate to the relevant property")
			return;
		}

		hasInitialAddress = true;
		var geocodeResult = {
			suggestResult: {
				feature: solrResults[0]
			}
		}

		app.handleSolrSelectResult(geocodeResult, app.goToInitialAddress)
	},
	goToInitialAddress: function(location) {
		app.addSolrResultToMap(location)
	},
	handleGraphicsLayersAdded: function(view) {

		app.loadWidgetsSketch(view);
		var message = "MapReady"
			//app.messageParent(message)

		// INTEGRATION SECTION INPUT 

		// SET selectedIsiskey to the BP's property isiskey/landparcelkey/egiskey.
		// CALL zoomToIsisKey         
		// GET EXISTING PLOT(s) from SAP system
		// PARSE JSON to features
		// CALL displayExistingFeatures

		// selectedIsiskey = 1000
		// app.zoomToIsisKey(selectedIsiskey)

		existingPlotJsonExample =
			"{\"geometry\":{\"spatialReference\":{\"latestWkid\":3857,\"wkid\":102100},\"x\":2057249.11502885,\"y\":-3971386.832107401,\"type\":\"point\"},\"attributes\":null}"
		var features = [JSON.parse(existingPlotJsonExample)]

		//app.displayExistingFeatures(features)
		// INTEGRATION SECTION INPUT END
	},
	handlePointerDown: function(event) {
		if (event.pointerType === "touch") {
			app.notifyUser.show("info", "To zoom in please use the zoom (+/-) buttons or use two fingers.");
		}
	},
	handleMouseWheel: function(params) {
		app.notifyUser.show("info", "To zoom in please double click the map or use the zoom (+/-) buttons.");
	},
	handleViewLoaded: function(view) {
		console.timeEnd("Map: LoadWebmap")
		$panelDiv.slideDown();

		view.goTo({
			scale: 512000
		})

		app.initializeGlobals()
		app.loadWidgetsDefault(view)

		app.setAerialLayer(view);
		app.handleWidthBreakpointWatch(view.widthBreakpoint);
		app.addGraphicsLayers(webmap, app.handleGraphicsLayersAdded);
	},
	initializeGlobals: function() {
		require(["esri/symbols/PictureMarkerSymbol"],
			function(PictureMarkerSymbol) {
				markerSymbol = new PictureMarkerSymbol({
					url: markerSymbolUrl,
					width: 20,
					height: 28,
					yoffset: 15
				});
			})
	},
	setAerialLayer: function(view) {
		view.map.layers.items.forEach(function(item) {
			if (item.title) {
				if (item.title.toLowerCase().indexOf("aerial imagery") >= 0) {
					aerialImageryLayer = item;
				}
			}
		})
	},
	addGraphicsLayers: function(webmap, callback) {
		require(["esri/layers/GraphicsLayer"],
			function(GraphicsLayer) {

				propertyGraphicsLayer = new GraphicsLayer({
					listMode: "hide"
				});
				webmap.add(propertyGraphicsLayer)

				installationPointGraphicsLayer = new GraphicsLayer({
					listMode: "hide"
				})
				webmap.add(installationPointGraphicsLayer);

				callback(view)
			})
	},
	handleViewClick: function(event) {

		mapPoint = event.mapPoint;

		if (activeTool == "PropertySelect") {
			app.getPropertyByMapPoint(mapPoint, app.handleGetProperty)
		}
	},
	plotInstallation: function(mapPoint) {
		require(["esri/geometry/geometryEngine"],
			function(geometryEngine) {

				var isWithin = geometryEngine.within(mapPoint, selectedProperty.geometry)

				if (!isWithin) {
					$btnConfirmAddressLocation.prop("disabled", true)
					app.notifyUser.show("error", "The installation location does not fall within the boundaries of the selected property")
					return;
				}

			})
	},
	handleGetProperty: function(features) {

		$lblPropertyResultsCount.text(features.length)

		if (features.length == 0) {
			app.notifyUser.show("warning", "We were unable to locate your property at this time.")
			selectedIsiskey = 1000
			app.zoomToIsisKey(selectedIsiskey)
			existingPlotJsonExample =
				"{\"geometry\":{\"spatialReference\":{\"latestWkid\":3857,\"wkid\":102100},\"x\":2057249.11502885,\"y\":-3971386.832107401,\"type\":\"point\"},\"attributes\":null}"
			var features = [JSON.parse(existingPlotJsonExample)]

			//app.displayExistingFeatures(features)
			return;
		} else if (features.length == 1) {
			selectedProperty = features[0];

			app.addPropertyToMap(selectedProperty)
			app.setSelectedProperty(selectedProperty);
			app.getElectricityRegion(selectedProperty.geometry.centroid, app.handleGetElectricityRegion)

			app.listFeatures([selectedProperty]);
		} else {
			app.notifyUser.show("info", "Multiple properties found, select a property below.")

			app.listFeatures(features);
		}
	},
	getPropertyByMapPoint: function(mapPoint, callback) {
		require(["esri/rest/support/Query",
				"esri/rest/query",
				"esri/geometry/SpatialReference"
			],
			function(Query,
				query,
				SpatialReference) {

				var q = new Query();
				q.geometry = mapPoint;
				q.outSpatialReference = new SpatialReference({
					wkid: 3857
				})
				q.outFields = ["*"];
				q.returnGeometry = true;

				app.loader.show("Querying property details...")
				var queryProperty = query.executeQueryJSON(propertyLayerUrl + "/0", q);
				queryProperty.then(function(featureSet) {
					app.loader.hide();
					callback(featureSet.features);
				}, function(error) {
					app.loader.hide();
					console.error(error);
					app.notifyUser.show("error", "We are unable to query your property details at this time.")
					callback([])
				})
			})
	},
	listFeatures: function(features) {

		propertyFeatures = features
		$propertyResultsDiv.slideDown();

		$selectAddress.empty()

		if (features.length > 1) {
			$("<calcite-option>", {
				value: null,
				text: "Select Property..."
			}).appendTo($selectAddress)
		}

		features.forEach(feature => {
			var attr = feature.attributes;

			var fullAddrNo = app.getFullAddressNo(feature)

			var label = app.titleCase(
				`${fullAddrNo || ""} ${attr["STR_NAME"] || ""} ${attr["LU_STR_NAME_TYPE"] || ""} ${attr["OFC_SBRB_NAME"] || ""}`)
			var value = attr["OBJECTID"]

			$("<calcite-option>", {
				value: value,
				text: label
			}).appendTo($selectAddress)
		});
	},
	handleAddressSelect: function(evt) {
		app.clearInstallationDetails();

		var objectid = evt.target.value;
		if (objectid) {
			var features = propertyFeatures.filter(function(feature) {
				return feature.attributes["OBJECTID"] == objectid;
			});

			selectedProperty = features[0]

			app.addPropertyToMap(selectedProperty);
			app.setSelectedProperty(selectedProperty);
			app.getElectricityRegion(selectedProperty.geometry.centroid, app.handleGetElectricityRegion)
			app.notifyUser.show("info", "Property Selected, use the drawing tool below to plot the exact location of your installation.")
		}
	},
	addPropertyToMap: function(feature) {
		require(["esri/Graphic",
				"esri/symbols/SimpleLineSymbol"
			],
			function(Graphic,
				SimpleLineSymbol) {

				var gra = new Graphic({
					geometry: feature.geometry,
					attributes: feature.attributes,
					symbol: new SimpleLineSymbol({
						color: "red",
						width: 3
					})
				})

				propertyGraphicsLayer.removeAll()
				propertyGraphicsLayer.add(gra)

				view.goTo({
					extent: feature.geometry.extent.expand(1.5)
				})

				app.toggleAerialImagery(true);
			})
	},
	setSelectedProperty: function(feature) {

		$drawingToolsDiv.slideDown()

		var attr = feature.attributes;

		installationLocation.SL_LAND_PRCL_KEY = attr["SL_LAND_PRCL_KEY"];
		installationLocation.PRTY_NMBR = attr["PRTY_NMBR"];
		installationLocation.ADR_NO = app.getFullAddressNo(feature);
		installationLocation.STR_NAME = app.getStreetName(attr["STR_NAME"], attr["LU_STR_NAME_TYPE"]);
		installationLocation.OFC_SBRB_NAME = attr["OFC_SBRB_NAME"];
		installationLocation.ALT_NAME = attr["ALT_NAME"];
		installationLocation.WARD_NAME = attr["WARD_NAME"];
		installationLocation.SUB_CNCL_NMBR = attr["SUB_CNCL_NMBR"]
	},
	getFullAddressNo: function(feature) {
		var fullAddrNo = feature.attributes["ADR_NO"];

		if (feature.attributes["ADR_NO_SFX"] && feature.attributes["ADR_NO_SFX"].trim().length > 0) {
			fullAddrNo += feature.attributes["ADR_NO_SFX"]
		}

		if (!fullAddrNo) {
			fullAddrNo = null
		} else {
			fullAddrNo = fullAddrNo.toString().toUpperCase();
		}

		return fullAddrNo
	},
	getStreetName: function(street, type) {

		if (!street && !type) {
			return null
		}

		if (type == "Null" || !type) {
			type = ""
		}

		var streetName = `${street} ${type}`

		if (!streetName) {
			streetName = ""
		} else {
			streetName = streetName.toString().toUpperCase()
		}

		return streetName
	},
	loadWidgetsDefault: function(params) {
		require(["esri/widgets/Home",
				"esri/widgets/Track"
			],
			function(Home,
				Track) {
				$btnAerialPhoto.css("display", "flex");
				view.ui.add($btnAerialPhoto[0], {
					position: "top-left"
				});

				var homeBtn = new Home({
					view: view
				});

				view.ui.add(homeBtn, {
					position: "top-left"
				});

				var track = new Track({
					view: view,
					goToLocationEnabled: true,
					scale: 750
				});

				track.on("track", function(tracking) {
					view.goTo({
						center: [tracking.position.longitude, tracking.position.latitude],
						scale: 750
					})
				})

				view.ui.add(track, {
					position: "top-left"
				});
			})
	},
	loadWidgetsSketch: function(params) {
		require(["esri/widgets/Sketch",
				"esri/widgets/Sketch/SketchViewModel"
			],
			function(Sketch,
				SketchViewModel) {

				var sketchVM = new SketchViewModel({
					pointSymbol: markerSymbol
				})

				$sketchWidgetDiv.empty();
				sketchWidget = new Sketch({
					layer: installationPointGraphicsLayer,
					view: view,
					creationMode: "single",
					viewModel: sketchVM,
					container: $sketchWidgetDiv[0],
					availableCreateTools: ["point"],
					visibleElements: {
						settingsMenu: false,
						duplicateButton: false
					}
				});

				sketchWidget.on("create", app.handleSketchCreate)
				sketchWidget.on("update", app.handleSketchUpdate)
				sketchWidget.on("delete", app.handleSketchDelete)
			})
	},
	handleSketchDelete: function(deleted) {
		if (installationPointGraphicsLayer.graphics.items.length == 0) {

			installationLocation.COORDINATE_X = null;
			installationLocation.COORDINATE_Y = null;
			installationLocation.COORDINATE_LON = null;
			installationLocation.COORDINATE_LAT = null;
			installationLocation.GEOMETRY_JSON = null;

			app.resetToolButtons()
		}
	},
	handleSketchUpdate: function(updated) {
		activeTool = "PlotInstallation"
		var installationGraphics = updated.graphics;

		app.validateInstallation(installationGraphics, selectedProperty.geometry, app.handleInstallationValidation)
	},
	validateInstallation: function(installationGraphics, propertyGeometry, callback) {
		require(["esri/geometry/geometryEngine"],
			function(geometryEngine) {

				var isWithin = true;
				installationGraphics.forEach(function(installationGraphic) {
					if (!geometryEngine.within(installationGraphic.geometry, propertyGeometry)) {
						isWithin = false;
					}
				})

				callback(isWithin, installationGraphics)
			})
	},
	handleInstallationValidation: function(isWithin, installationGraphics) {
		if (!isWithin) {
			$btnConfirmAddressLocation.prop("disabled", true)
			app.notifyUser.show("error", "The installation location does not fall within the boundaries of the selected property")
			return;
		}

		$btnConfirmAddressLocation.prop("disabled", false)

		installationGraphics.forEach(function(installationGraphic) {
			var mapPoint = installationGraphic.geometry;
			app.notifyUser.show("success", `Installation at: ${mapPoint.latitude}, ${mapPoint.longitude}`)

			installationLocation.COORDINATE_X = mapPoint.x;
			installationLocation.COORDINATE_Y = mapPoint.y;

			installationLocation.COORDINATE_LON = mapPoint.longitude
			installationLocation.COORDINATE_LAT = mapPoint.latitude;

			var plotGeometry = {
				spatialReference: mapPoint.spatialReference,
				x: mapPoint.x,
				y: mapPoint.y,
				type: "point"
			}
			installationLocation.GEOMETRY_JSON = JSON.stringify({
				geometry: plotGeometry,
				attributes: null
			});
		})

	},
	handleSketchCreate: function(created) {
		activeTool = "PlotInstallation"

		if (created.state == "start") {
			installationPointGraphicsLayer.removeAll();
		}

		if (created.state == "complete") {
			var installationGraphic = created.graphic
			app.validateInstallation([installationGraphic], selectedProperty.geometry, app.handleInstallationValidation)
		}
	},
	handleSolrSelectResult: function(solrSelectResult, callback) {
		require(["esri/geometry/Point",
				"esri/geometry/SpatialReference"
			],
			function(Point,
				SpatialReference) {

				var mapPoint = new Point({
					longitude: solrSelectResult.suggestResult.feature.Lon[0],
					latitude: solrSelectResult.suggestResult.feature.Lat[0]
				})

				var spatialReference = new SpatialReference({
					wkid: 3857
				});

				app.convertGeometryProjection(mapPoint, spatialReference, function(geometries) {
					if (geometries.length == 0) {
						app.notifyUser.show("info", "Map Point Projection could not converted.")
						return;
					}

					mapPoint.x = geometries[0].x;
					mapPoint.y = geometries[0].y;
					mapPoint.spatialReference = spatialReference

					callback(mapPoint)
				})
			})
		return 1;
	},
	convertGeometryProjection: function(geometry, spatialReference, callback) {
		require(["esri/rest/support/ProjectParameters",
				"esri/rest/geometryService"
			],
			function(ProjectParameters,
				geometryService) {

				var params = new ProjectParameters({
					geometries: [geometry],
					outSpatialReference: spatialReference
				})

				var geomProject = geometryService.project(geometryServiceUrl, params)
				geomProject.then(function(geometries) {
					callback(geometries);
				}, function(error) {
					console.error(error)
					app.notifyUser.show("error", "We are unable to convert XY projection at this time.");
					callback([])
				});
			})
	},
	addSolrResultToMap: function(mapPoint) {

		app.resetToolButtons();

		activeTool = "PropertySelect";
		app.getPropertyByMapPoint(mapPoint, app.handleGetProperty)
	},
	titleCase: function(s) {
		return s.toLowerCase().split(/\s+/).map(function(word) {
			if (word[0])
				return word.replace(word[0], word[0].toUpperCase())
		}).join(' ')
	},
	resetToolButtons: function() {

		$btnConfirmAddressLocation.prop("disabled", true);
		app.notifyUser.hide()
	},
	clearInstallationDetails: function() {
		console.log("clearInstallationDetails")

		$btnConfirmAddressLocation.prop("disabled", true)
		installationPointGraphicsLayer.removeAll();
	},
	resetMessage: function() {

		installationLocation.SL_LAND_PRCL_KEY = null;
		installationLocation.PRTY_NMBR = null;
		installationLocation.ADR_NO = null;
		installationLocation.STR_NAME = null;
		installationLocation.OFC_SBRB_NAME = null;
		installationLocation.ALT_NAME = null;
		installationLocation.ELECTRICITY_REGION = null;
		installationLocation.WARD_NAME = null;
		installationLocation.SUB_CNCL_NMBR = null;

		installationLocation.COORDINATE_X = null;
		installationLocation.COORDINATE_Y = null;
		installationLocation.COORDINATE_LON = null;
		installationLocation.COORDINATE_LAT = null;
		installationLocation.GEOMETRY_JSON = null;

		mapPoint = null;
		propertyFeatures = [];
		selectedProperty = null;
		activeTool = null;
		app.resetToolButtons();

		app.notifyUser.hide();
		$propertyResultsDiv.slideUp()

	},
	clearMapGraphics: function(params) {
		console.log("clearMapGraphics")
		propertyGraphicsLayer.removeAll();
		installationPointGraphicsLayer.removeAll();
	},
	loader: {
		show: function(message) {
			$loaderDiv.prop("text", message);
			$loaderDiv.prop("label", message);
			$loaderDiv.prop("scale", "m");
			$loaderDiv.show();
		},
		hide: function() {
			$loaderDiv.hide();
		}
	},
	notifyUser: {
		show: function(type, message) {
			switch (type) {
				case "error":
					$noticeDiv.attr("kind", "danger")
					break;
				case "warning":
					$noticeDiv.attr("kind", "warning")
					break;
				case "info":
					$noticeDiv.attr("kind", "info")
					break;
				case "success":
					$noticeDiv.attr("kind", "success")
					break;
			}

			$noticeDiv
				.prop("open", true)
				.prop("closable", true)
				.prop("width", "full")

			$noticeMessageDiv.text(message);
		},
		hide: function() {
			$noticeDiv.removeAttr("open")
		}
	}
}