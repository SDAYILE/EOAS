sap.ui.define([
	"./BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/Device',
	'sap/ui/model/Sorter',
	'sap/ui/core/Fragment',
	"sap/m/MessageBox",
	'sap/m/MessageToast',
	"sap/ui/core/routing/History"
], function(BaseController, JSONModel, Filter, FilterOperator, Device, Sorter, Fragment, MessageBox, MessageToast, History) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.SSEGApplication", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaSSEG.view.SSEGApplication
		 */
		onInit: function() {
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_EOAS_SSEG");
			this.oRouteHandler = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouteHandler.getRoute("SSEGApplication").attachPatternMatched(this.onPatternMatched, this);

			this._viewModel = new JSONModel({
				fileSize: 5,
				enableSubmit: false,
				isEditable: true,
				isPV: false,
				isECSA: false,
				isExporting: false,
				isBatteryReq: false,
				isInstalled: false,
				isNotInstalled: false,
				isSubmitted: false,
				visibleExport: false,
				isNotExport: false,
				onShowFields: false
			});
			this.getView().setModel(this._viewModel, "ViewModel");
			this._mViewSettingsDialogs = {};

			var oPropertyModel = new JSONModel({
				HTML: "<p>Properties that are linked to your e-Services profile (as property owner, nominated official or administrator) are presented below. Select a property to grant proxy authorisation for another e-services users to apply for energy services on your behalf.</p>" +
					"<p><strong>Don’t see your property listed here?</strong></p>" +
					"<p>Only properties that fall within one of the City's electricity supply areas will be listed. <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Maps%20and%20statistics/Electricity%20Distribution%20Licence%20and%20Area%20Boundaries.pdf\"  font-weight:600;\">View the City's electricity supply areas</a>   </p>" +

					"<p>For any support-related queries on Energy Services Applications, email Electricityapplication.queries@capetown.gov.za or call one of the electricity area offices:  North: 021 444 1394/6; East: 021 444 8511/2; South 021 400 4750/1/2/3.</p>"
			});

			this.getView().setModel(oPropertyModel, "PropertyModel");
		},

		onPatternMatched: function(oEvent) {
			this.Notifi_num = oEvent.getParameter("arguments").AppID;
			this.BP = oEvent.getParameter("arguments").BP;
			var sRole = oEvent.getParameter("arguments").Role;
			this.sStatus = oEvent.getParameter("arguments").Status;
			var sExistingPlot =
				"{\"geometry\":{\"spatialReference\":{\"latestWkid\":3857,\"wkid\":102100},\"x\":2057249.11502885,\"y\":-3971386.832107401,\"type\":\"point\"},\"attributes\":null}";
			var isisKey = 1000;
			this.Documents = [];
			this.onResetWizard();
			//	this.onResetFields();
			this.onMapReset();

			this.onInitialiseModels();
			this.onInitialiseValues();
			this._loadManufacturers();
			this.onEventListener("");
			this.byId("schematicImg").setVisible(false);
			this.getView().addStyleClass('sapUiSizeCompact');

			var oStepToDeclaration = this.byId("DeclarationStep");

			if (this.Notifi_num === "NEW") {
				sap.ui.core.BusyIndicator.show();
				this._loadProperties();

				this.getView().getModel("ViewModel").setProperty("/isEditable", true);
				this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
				this.getView().getModel("ViewModel").setProperty("/isSubmitted", false);
				this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
				this.byId("InvertersStep").setOptional(false);
				this.byId("btnSubmit").setVisible(true);
				oStepToDeclaration.setTitle("Declaration");
				this.byId("DisplaySet").setVisible(false);
				this.byId("txtDeclaration").setVisible(true);
				this.byId("chkConfirm").setVisible(true);
				this.byId("chkConfirm").setSelected(false);

			}

			this.CalculateTotBat();
			this.CalculateTotPV();
			this.calculateTotInverters();

		},

		onResetWizard: function() {
			var oWizard = this.byId("SSEGWizard");
			var oFirstStep = oWizard.getSteps()[0];
			oWizard.discardProgress(oFirstStep);
			oWizard.goToStep(oFirstStep);
		},

		onValidateWizardSteps: function() {
			var oWizard = this.byId("SSEGWizard");
			oWizard.validateStep(this.byId("PropertyStep"));
			oWizard.validateStep(this.byId("ContactDetailStep"));
			oWizard.validateStep(this.byId("SupplyStep"));
			oWizard.validateStep(this.byId("SystemStep"));
			oWizard.validateStep(this.byId("InvertersStep"));
			oWizard.validateStep(this.byId("SchematicStep"));
			oWizard.validateStep(this.byId("DocumentStep"));
		},

		onAddQNumZeros: function(num, size) {
			num = num.toString();
			while (num.length < size) num = "0" + num;
			return num;
		},

		onEventListener: function(ParcelNum) {
			var $mapFrame = $("#mapFrame");

			if ($mapFrame[0] !== undefined) {

				$mapFrame[0].contentWindow.postMessage({
					type: "message",
					command: "ZoomToIsisKey",
					isiskey: ParcelNum
				}, "*");
				// Receive data from Child
				window.addEventListener("message", function(event) {

					//set validation to validate the property step in the wizard

					this.PropertyValid = true;
					this.onEnableSubmit();

					var fields = event.data.installationLocation;
					$("#txtLandParcelKey").val(fields.SL_LAND_PRCL_KEY);
					$("#txtErf").val(fields.PRTY_NMBR);
					$("#txtAddressNo").val(fields.ADR_NO);
					$("#txtStreet").val(fields.STR_NAME);
					$("#txtSuburb").val(fields.OFC_SBRB_NAME);
					$("#txtAllotment").val(fields.ALT_NAME);
					$("#txtWard").val(fields.WARD_NAME);
					$("#txtSubcouncil").val(fields.SUB_CNCL_NMBR);
					this.xcoordinate = fields.COORDINATE_X;
					this.ycoordinate = fields.COORDINATE_Y;
					this.Longitude = fields.COORDINATE_LON;
					this.Latitude = fields.COORDINATE_LAT;
				}.bind(this));
			}
		},

		onMapReset: function() {
			window.addEventListener("reset", function(event) {
				var step1 = this.getView().byId('PropertyStep');
				step1.setValidated(false);
			}.bind(this));
		},

		onInitialiseModels: function(oEvent) {
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oHeaderModel, "Header");

			var oInverterModel = new sap.ui.model.json.JSONModel();
			oInverterModel.setData({
				data: []
			});
			this.getView().setModel(oInverterModel, "InverterModel");

			var oProperties = new sap.ui.model.json.JSONModel();
			oProperties.setData({
				data: []
			});
			this.getView().setModel(oProperties, "Properties");

			var oPayersModel = new sap.ui.model.json.JSONModel();
			oPayersModel.setData({
				data: []
			});
			this.getView().setModel(oPayersModel, "PayersModel");

			var oPostalModel = new sap.ui.model.json.JSONModel();
			oPostalModel.setData({
				data: []
			});
			this.getView().setModel(oPostalModel, "PostalModel");

			var oOwnerModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oOwnerModel, "OwnerModel");

			var oPartnerModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oPartnerModel, "PartnerModel");

			var oInstallerModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oInstallerModel, "InstallerModel");

			var oElectricalModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oElectricalModel, "ElectricalModel");

			var oECSAModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oECSAModel, "ECSAModel");

			var oMeters = new sap.ui.model.json.JSONModel();
			oMeters.setData({
				data: []
			});
			this.getView().setModel(oMeters, "Meters");

			var oBatteryModel = new sap.ui.model.json.JSONModel();
			oBatteryModel.setData({
				data: []
			});
			this.getView().setModel(oBatteryModel, "BatteryModel");

			var oPVModel = new sap.ui.model.json.JSONModel();
			oPVModel.setData({
				data: []
			});
			this.getView().setModel(oPVModel, "PVModel");

			var oManufacturers = new sap.ui.model.json.JSONModel();
			oManufacturers.setData({
				data: []
			});
			this.getView().setModel(oManufacturers, "Manufacturers");

			var oModels = new sap.ui.model.json.JSONModel();
			oModels.setData({
				data: []
			});
			this.getView().setModel(oModels, "Models");

			var oDocuments = new sap.ui.model.json.JSONModel();
			oDocuments.setData({
				data: []
			});
			this.getView().setModel(oDocuments, "Documents");

			var oEnergyTypes = sap.ui.getCore().getModel("EnergyTypes");
			this.getView().setModel(oEnergyTypes, "EnergyTypes");
			var oSystemTypes = sap.ui.getCore().getModel("SystemTypes");
			this.getView().setModel(oSystemTypes, "SystemTypes");
			var oAppTypes = sap.ui.getCore().getModel("AppTypes");
			this.getView().setModel(oAppTypes, "AppTypes");
			var oDeviceTypes = sap.ui.getCore().getModel("DeviceTypes");
			this.getView().setModel(oDeviceTypes, "DeviceTypes");
			var oSupplySize = sap.ui.getCore().getModel("SupplySize");
			this.getView().setModel(oSupplySize, "SupplySize");
			var oPhaseTypes = sap.ui.getCore().getModel("PhaseTypes");
			this.getView().setModel(oPhaseTypes, "PhaseTypes");
			var oTitles = sap.ui.getCore().getModel("Titles");
			this.getView().setModel(oTitles, "Titles");
		},

		onInitialiseValues: function() {

			var oSystemTable = this.byId("tblSystem");
			var oItems = oSystemTable.getItems();
			for (var i = 0; i < oItems.length; i++) {
				//oSystemTable.setSelectedItem(oItems[i]);
				oItems[i].setHighlight("None");
			}
			oSystemTable.removeSelections();
			this.byId("idxAppType").setSelectedIndex(-1);
			this.byId("idxReverse").setSelectedIndex(-1);
			this.byId("idxExport").setSelectedIndex(-1);
			//this.byId("idxBatStorage").setSelectedIndex(-1);
			this.byId("idxInstalled").setSelectedIndex(-1);
			this.byId("fileUploader").setValue(null);
			this.byId("cmbAppType").setSelectedKey("");
			this.byId("Vat").setValue(null);
			this.byId("FileUpload").setValue(null);
			this.getView().getModel("ViewModel").setProperty("/DeviceCategoryText", "");
			this.getView().getModel("ViewModel").setProperty("/Phase", "");
			this.getView().getModel("ViewModel").setProperty("/ExistSuppCategory", "");
			this.getView().getModel("ViewModel").setProperty("/isExporting", false);
			this.getView().getModel("ViewModel").setProperty("/visibleExport", false);
			this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
			this.getView().getModel("ViewModel").setProperty("/isPV", false);
			this.getView().getModel("ViewModel").setProperty("/isECSA", false);
			this.getView().getModel("ViewModel").setProperty("/isNotInstalled", false);
			this.getView().getModel("ViewModel").setProperty("/isInstalled", false);
		},

		_loadApplicationData: function(AppID) {
			var oHeader = this.getView().getModel("Header");
			var sPath = "/SSEG_App_HeadersSet('" + AppID + "')";
			sap.ui.core.BusyIndicator.show();
			this._oODataModel.read(sPath, {
				urlParameters: {
					"$expand": "NP_ON_APPID,NP_ON_APPID_1,NP_ON_APPID_2,NP_ON_APPID_3,NP_ON_APPID_4"
				},
				success: function(oData) {
					//Set Header properties
					oHeader.setData(oData);

					if (oData.EnergSourcType === "PV") {
						this.getView().getModel("ViewModel").setProperty("/isPV", true);
					} else {
						this.getView().getModel("ViewModel").setProperty("/isPV", false);
					}
					//Set App Type Radio Button
					if (oData.AppType === "NEW") {
						this.byId("idxAppType").setSelectedIndex(0);
					} else {
						this.byId("idxAppType").setSelectedIndex(1);
					}

					//Set System Type 
					if (oData.SystemType !== "") {
						var sSystemType = "00" + oData.SystemType;
						this.getView().getModel("Header").setProperty("/SystemType", sSystemType);
						this._setSystemTypes(sSystemType);
					}

					//Set Export Radio Button
					if (oData.Export === "X") {
						this.byId("idxExport").setSelectedIndex(0);
					} else {
						this.byId("idxExport").setSelectedIndex(1);
					}
					//Set Reverse Radio Button
					if (oData.Reverse) {
						this.byId("idxReverse").setSelectedIndex(0);
					} else {
						this.byId("idxReverse").setSelectedIndex(1);
					}
					//Set Installed Radio Button
					if (oData.Instd) {
						this.byId("idxInstalled").setSelectedIndex(0);
					} else {
						this.byId("idxInstalled").setSelectedIndex(1);
					}
					this.MeterNumber = oData.MeterNo;

					//Set Application Properties
					this._setProperties(oData.NP_ON_APPID_1);
					this._setPartners(oData.NP_ON_APPID_2);
					this._setContact(oData.Role);
					this._setDevices(oData.NP_ON_APPID_3);
					this._setDocuments(oData.NP_ON_APPID_4);
					// var sMeterNum = this.onAddQNumZeros(oData.MeterNo, 18);

					oHeader.refresh();
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_setProperties: function(aProperties) {
			var oProperties = this.getView().getModel("Properties").getData().data;
			var objJSON = {};

			for (var i = 0; i < aProperties.results.length; i++) {
				// if (oData.NP_ON_APPID.results[i].AppReqid === AppID) {
				oProperties.push(aProperties.results[i]);
				//}
			}
			objJSON.geometry = {
				spatialReference: {
					latestWkid: 3857,
					wkid: 102100
				}
			};

			objJSON.geometry.x = oProperties[0].Xcoordinate;
			objJSON.geometry.y = oProperties[0].Ycoordinate;
			objJSON.geometry.type = "point";
			objJSON.attributes = null;

			var existingPlotJson = JSON.stringify(objJSON);
			this.onPlotExisitingPoint(existingPlotJson, oProperties[0].Plno);

			this._setMeterDetails(oProperties[0].Partner, oProperties[0].Plno);

			this.getView().getModel("Properties").refresh();
			this.onPlotExisitingPoint(existingPlotJson, oProperties[0].Plno);
		},

		_setPartners: function(aPartners) {

			for (var j = 0; j < aPartners.results.length; j++) {
				if (aPartners.results[j].isConct) {
					this.byId("cmbAppType").setSelectedKey(aPartners.results[j].Role);
					if (aPartners.results[j].Role === "OWNER") {
						this.getView().getModel("ViewModel").setProperty("/onShowFields", false);
					} else {
						this.getView().getModel("ViewModel").setProperty("/onShowFields", true);
					}
				}
				switch (aPartners.results[j].Role) {
					case "OWNER":
						// code block
						this.getView().getModel("OwnerModel").setData(aPartners.results[j]);
						break;
					case "APPLC":
						// code block
						this.getView().getModel("PartnerModel").setData(aPartners.results[j]);
						break;
					case "ECSAP":
						// code block
						this.getView().getModel("ECSAModel").setData(aPartners.results[j]);
						break;
					case "INSTA":
						// code block
						this.getView().getModel("InstallerModel").setData(aPartners.results[j]);
						break;
					case "ELECT":
						// code block
						this.getView().getModel("ElectricalModel").setData(aPartners.results[j]);
						break;
					case "ContactPerson":
						// code block
						this.getView().getModel("PartnerModel").setData(aPartners.results[j]);
						break;
					default:
						// code block
						this.getView().getModel("PartnerModel").setData(aPartners.results[j]);
				}

			}
		},

		_setContact: function(sRole) {
			if (sRole === "OWNER") {
				this.getView().getModel("ViewModel").setProperty("/onShowFields", false);
			} else {
				this.getView().getModel("ViewModel").setProperty("/onShowFields", true);
			}

		},

		_setDevices: function(aDevices) {
			var oBatteryModel = this.getView().getModel("BatteryModel").getData().data;
			var oPVModel = this.getView().getModel("PVModel").getData().data;
			var oInverterModel = this.getView().getModel("InverterModel").getData().data;

			for (var i = 0; i < aDevices.results.length; i++) {

				switch (aDevices.results[i].DevicTyp) {
					case "BATRY":
						// code block
						oBatteryModel.push(aDevices.results[i]);
						break;
					case "INVET":
						// code block
						oInverterModel.push(aDevices.results[i]);

						break;
					case "PVNEL":
						// code block
						oPVModel.push(aDevices.results[i]);
						break;
					default:
						// code block
				}

			}
			this.getView().getModel("BatteryModel").refresh();
			this.CalculateTotBat();
			this.getView().getModel("PVModel").refresh();
			this.CalculateTotPV();
			this.getView().getModel("InverterModel").refresh();
			this.calculateTotInverters();
		},

		_setDocuments: function(aDocuments) {
			var oDocuments = this.getView().getModel("Documents").getData().data;
			for (var i = 0; i < aDocuments.results.length; i++) {
				oDocuments.push(aDocuments.results[i]);
			}
			this.getView().getModel("Documents").refresh();
		},

		_setMeterDetails: function(BP, sPLNO) {
			var sMeterNum = this.getView().getModel("Header").getProperty("/MeterNo");
			var values = {

				PARTNER: BP,
				PLNO: sPLNO

			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_METER_NUMBERS", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					sap.ui.core.BusyIndicator.hide();
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].MeterNo === sMeterNum) {
							this.getView().getModel("Header").setProperty("/MeterNo", oData.results[i].MeterNo);
							this.getView().getModel("Header").setProperty("/Equipment", oData.results[i].Equipment);
							this.getView().getModel("Header").setProperty("/Material", oData.results[i].Material);
							this.getView().getModel("Header").setProperty("/functionLoctn", oData.results[i].Tplnr);
							this.getView().getModel("ViewModel").setProperty("/ExistSuppCategory", oData.results[i].ExistSuppCategory);
							this.getView().getModel("ViewModel").setProperty("/DeviceCategoryText", oData.results[i].DeviceCategoryText);
							this.getView().getModel("ViewModel").setProperty("/Amperage", oData.results[i].Vertrag);
							this.getView().getModel("ViewModel").setProperty("/PropType", oData.results[i].ExistSuppCategory);

						}
					}
				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		_setSystemTypes: function(sSystemType) {
			//var oBattery = this.byId("idxBatStorage");
			var oSystemTable = this.byId("tblSystem");
			var oItems = oSystemTable.getItems();
			oSystemTable.removeSelections();
			for (var i = 0; i < oItems.length; i++) {
				var fieldID = oItems[i].getProperty("fieldGroupIds")[0];
				if (sSystemType === fieldID) {
					//oSystemTable.setSelectedItem(oItems[i]);
					oItems[i].setHighlight("Success");

				}
			}
			switch (sSystemType) {
				case "001":
					// code block
					// 	When System Type = 1 or 4, display PDF page 
					this.byId("_SchematicForm").setVisible(false);
					// this.byId("_SchematicConsent").setVisible(true);
					this.byId("schematicImg").setVisible(true);

					this.byId("schematicImg").setSrc("./SchematicImages/Page2.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", true);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);

					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "002":
					// code block
					//	When System Type = 2 display PDF page 3
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);
					this.byId("schematicImg").setSrc("./SchematicImages/Page3.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", true);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "003":
					// code block
					// 	When System Type = 3,  display PDF page 5 (note: this diagram will be updated)
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);
					this.byId("schematicImg").setSrc("./SchematicImages/Page5.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "004":
					// code block
					// 	When System Type = 1 or 4, display PDF page 2
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);
					this.byId("schematicImg").setSrc("./SchematicImages/Page2.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", false);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
					this.getView().getModel("ViewModel").setProperty("/isPV", true);
					break;
				case "005":
					this.byId("_SchematicForm").setVisible(true);
					this.byId("schematicImg").setVisible(false);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					this.getView().getModel("ViewModel").setProperty("/isECSA", false);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
					break;
				default:
					// code block
			}
		},

		onPlotExisitingPoint: function(sExistingPlot, isisKey) {
			var $mapFrame = $("#mapFrame");
			if ($mapFrame[0] !== undefined) {
				$mapFrame[0].contentWindow.postMessage({
					type: "message",
					command: "ZoomToIsisKey",
					isiskey: isisKey,
					existingPlotJson: sExistingPlot
				}, "*");
			}
		},

		_loadProperties: function() {
			var oProperties = this.getView().getModel("Properties").getData().data;
			var filter = new sap.ui.model.Filter("Partner", sap.ui.model.FilterOperator.EQ, this.BP);

			this._oODataModel.read("/SSEG_Own_Prox_PropertiesSet", {
				filters: [filter],
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						parseInt(oData.results[i].Erfno);
						oProperties.push(oData.results[i]);
					}
					this.getView().getModel("Properties").refresh();
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_loadOwnerDetails: function(BP) {
			var oOwnerModel = this.getView().getModel("OwnerModel");
			var filter = new sap.ui.model.Filter("Partner", sap.ui.model.FilterOperator.EQ, BP);
			this._oODataModel.read("/SSEG_Roles_PartnerSet", {
				filters: [filter],
				success: function(oData) {
					oOwnerModel.setData(oData.results[0]);
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_loadPayer: function(sParcel) {
			var oPayersModel = this.getView().getModel("PayersModel").getData().data;
			var oPostalModel = this.getView().getModel("PostalModel").getData().data;
			var filter = new sap.ui.model.Filter("Parcel", sap.ui.model.FilterOperator.EQ, "'" + sParcel + "'");
			this._oODataModel.read("/SSEG_Roles_PartnerSet ", {
				filters: [filter],
				success: function(oData) {

					var newArray = this.removeDuplicates(oData.results);
					var newPost = this.removeDuplicatePost(oData.results);
					for (var i = 0; i < newPost.length; i++) {
						oPostalModel.push(newPost[i]);
					}

					for (var j = 0; j < newArray.length; j++) {
						oPayersModel.push(newArray[j]);
					}
					// .push(newArray);
					this.getView().getModel("PayersModel").refresh();
					this.getView().getModel("PostalModel").refresh();

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		removeDuplicates: function(arr) {
			var result = arr.filter(
				(person, index) => index === arr.findIndex(
					other => person.Partner === other.Partner
				));
			return result;
		},

		removeDuplicatePost: function(arr) {
			var result = arr.filter(
				(person, index) => index === arr.findIndex(
					other => person.StreetNo + person.StreetAdr + person.City + person.PoCode === other.StreetNo + other.StreetAdr + other.City +
					other.PoCode
				));
			return result;
		},

		_loadMeters: function() {

			var values = {
				PARTNER: this.SelectedProperty.Partner,
				PLNO: this.SelectedProperty.Plno
			};

			this.getView().getModel("Meters").setData({
				data: []
			});

			var oMeters = this.getView().getModel("Meters").getData().data;
			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_METER_NUMBERS", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					sap.ui.core.BusyIndicator.hide();
					if (oData.results.length === 0) {
						MessageBox.error(
							"There is no meter for the selected property please contact our Customer Services at the respective area email on the property selection screen"
						);
					}
					for (var i = 0; i < oData.results.length; i++) {
						parseInt(oData.results[i].MeterNo);
						oMeters.push(oData.results[i]);
					}
					this.getView().getModel("Meters").refresh();
				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		_loadManufacturers: function() {
			this.getView().getModel("Manufacturers").setData({
				data: []
			});
			var oManufacturers = this.getView().getModel("Manufacturers").getData().data;
			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_INSTLL_MANUF", {
				method: "GET",
				success: function(oData, response) {
					sap.ui.core.BusyIndicator.hide();
					for (var i = 0; i < oData.results.length; i++) {
						oManufacturers.push(oData.results[i]);
					}
					this.getView().getModel("Manufacturers").refresh();
				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		_loadModels: function(Manufacturer) {
			this.getView().getModel("Models").setData({
				data: []
			});
			var oModels = this.getView().getModel("Models").getData().data;

			var filter = new sap.ui.model.Filter("Manu", sap.ui.model.FilterOperator.EQ, Manufacturer);
			this._oODataModel.read("/SSEG_Inventer_ModelSet", {
				filters: [filter],
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();
					for (var i = 0; i < oData.results.length; i++) {
						oModels.push(oData.results[i]);
					}
					this.getView().getModel("Models").refresh();

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		onPartySelect: function(oEvent) {
			var oSource = oEvent.getSource(),
				sSelectedKey = oSource.getSelectedKey();

			switch (sSelectedKey) {
				case "OWNER":
					// code block

					this.getView().getModel("ViewModel").setProperty("/isPartyReq", false);
					this.getView().getModel("ViewModel").setProperty("/onShowFields", false);
					break;
				case "APPLC":
					// code block
					sap.ui.core.BusyIndicator.show();
					this.getView().getModel("ViewModel").setProperty("/isPartyReq", false);
					this.getView().getModel("ViewModel").setProperty("/onShowFields", true);

					var filter = new sap.ui.model.Filter("Notifi_num", sap.ui.model.FilterOperator.EQ, this.SelectedProperty.AppReqid);
					var filterb = new sap.ui.model.Filter("Role", sap.ui.model.FilterOperator.EQ, "APPLC");
					this._oODataModel.read("/SSEG_Roles_PartnerSet", {
						filters: [filter, filterb],
						success: function(oData) {
							this.getView().getModel("PartnerModel").setProperty("/Title", oData.results[0].Title);
							this.getView().getModel("PartnerModel").setProperty("/Surname", oData.results[0].Surname);
							this.getView().getModel("PartnerModel").setProperty("/Name", oData.results[0].Name);
							this.getView().getModel("PartnerModel").setProperty("/CellNo", oData.results[0].CellNo);
							this.getView().getModel("PartnerModel").setProperty("/Email", oData.results[0].Email);
							this.getView().getModel("PartnerModel").setProperty("/Role", "APPLC");
							sap.ui.core.BusyIndicator.hide();
						}.bind(this),
						error: function(oError) {
							sap.ui.core.BusyIndicator.hide();
							this.showErrorMessage(oError);
						}.bind(this)
					});
					break;
				case "CONTA":
					// code block
					this.getView().getModel("ViewModel").setProperty("/onShowFields", true);
					this.getView().getModel("ViewModel").setProperty("/isPartyReq", true);
					this.getView().getModel("PartnerModel").setProperty("/Title", "");
					this.getView().getModel("PartnerModel").setProperty("/Surname", "");
					this.getView().getModel("PartnerModel").setProperty("/Name", "");
					this.getView().getModel("PartnerModel").setProperty("/CellNo", "");
					this.getView().getModel("PartnerModel").setProperty("/Email", "");
					this.getView().getModel("PartnerModel").setProperty("/Role", "CONTA");
					break;
				default:
					// code block
			}
			//this._validateContactDetails();
		},

		onAmpSelect: function(oEvent) {
			var oSource = oEvent.getSource(),
				sSelectedKey = oSource.getSelectedKey();
			this.getView().getModel("Header").setProperty("/AMPERE_R", sSelectedKey);
			if (sSelectedKey <= "006") {
				//Set Status to PTI
				this.getView().getModel("Header").setProperty("/Status", "E0002");
			}
			this.getMaxInstallLimits();
		},

		onSystemTypeSelect: function(oEvent) {
			var oSource = oEvent.getSource();
			var sSelectedKey = oSource.getSelectedItem().getProperty("fieldGroupIds")[0];
			var oEnergySource = this.byId("cmbEnergy");
			//var oBattery = this.byId("idxBatStorage");

			switch (sSelectedKey) {
				case "001":
					// code block
					// 	When System Type = 1 or 4, display PDF page 
					this.getView().getModel("Header").setProperty("/SystemType", parseInt(sSelectedKey));
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					this.byId("schematicImg").setSrc("./SchematicImages/Page2.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", true);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
					oEnergySource.setSelectedKey("");
					this.byId("InvertersStep").setOptional(false);
					this.getView().getModel("Header").setProperty("/EnergSourcType", "");
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "002":
					// code block
					//	When System Type = 2 display PDF page 3
					this.getView().getModel("Header").setProperty("/SystemType", parseInt(sSelectedKey));
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					this.byId("schematicImg").setSrc("./SchematicImages/Page3.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", true);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", true);
					oEnergySource.setSelectedKey("");
					this.byId("InvertersStep").setOptional(false);
					this.getView().getModel("Header").setProperty("/EnergSourcType", "");
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "003":
					// code block
					// 	When System Type = 3,  display PDF page 5 (note: this diagram will be updated)
					this.getView().getModel("Header").setProperty("/SystemType", parseInt(sSelectedKey));
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);

					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);;
					this.byId("schematicImg").setSrc("./SchematicImages/Page5.jpg");
					this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
					if (this.PropertyType === "COM") {
						this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
						this.getView().getModel("Header").setProperty("/Qmcod", "0800");
					} else {
						this.getView().getModel("Header").setProperty("/Qmcod", "0400");
					}
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", true);
					oEnergySource.setSelectedKey("");
					this.byId("InvertersStep").setOptional(false);
					this.getView().getModel("Header").setProperty("/EnergSourcType", "");
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "004":
					// code block
					// 	When System Type = 1 or 4, display PDF page 2
					this.getView().getModel("Header").setProperty("/SystemType", parseInt(sSelectedKey));
					this.byId("_SchematicForm").setVisible(false);
					this.byId("schematicImg").setVisible(true);
					this.byId("schematicImg").setSrc("./SchematicImages/Page2.jpg");
					this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
					oEnergySource.setSelectedKey("PV");
					this.byId("InvertersStep").setOptional(true);
					this.getView().getModel("Header").setProperty("/EnergSourcType", "PV");
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", false);
					this.getView().getModel("ViewModel").setProperty("/isPV", true);

					if (this.PropertyType === "COM") {
						this.getView().getModel("Header").setProperty("/Qmcod", "0700");
					} else {
						this.getView().getModel("Header").setProperty("/Qmcod", "0300");
					}
					this.getView().getModel("ViewModel").setProperty("/isECSA", false);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
					break;
				case "005":
					this.getView().getModel("Header").setProperty("/SystemType", parseInt(sSelectedKey));
					this.byId("_SchematicForm").setVisible(true);
					this.byId("schematicImg").setVisible(false);
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					oEnergySource.setSelectedKey("");
					this.byId("InvertersStep").setOptional(true);
					this.getView().getModel("Header").setProperty("/EnergSourcType", "");
					this.getView().getModel("ViewModel").setProperty("/enableEnergy", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					if (this.PropertyType === "COM") {
						this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
						this.getView().getModel("Header").setProperty("/Qmcod", "0900");
					}
					this.getView().getModel("ViewModel").setProperty("/isECSA", false);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
					// code block
					// System Type = 5, do not display schematic drawings, instead, a drawing must be attached (mandatory)
					break;
				default:
					// code block
			}

		},

		onSelectEnergyType: function(oEvent) {
			var oSource = oEvent.getSource(),
				sSelectedKey = oSource.getSelectedKey();
			this.getView().getModel("Header").setProperty("/EnergSourcType", sSelectedKey);

			if (sSelectedKey === "PV") {
				this.getView().getModel("ViewModel").setProperty("/isPV", true);
			} else {
				this.getView().getModel("ViewModel").setProperty("/isPV", false);
			}

		},

		onInverterDialogOpen: function(oEvent) {
			if (!this._InverterDialog) {
				this._InverterDialog = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.SSEG.AddInverter", this);
			}
			// toggle compact style
			this._InverterDialog.addStyleClass('sapUiSizeCompact');
			this.getView().addDependent(this._InverterDialog);
			sap.ui.getCore().byId("invModel").setEnabled(false);
			this._InverterDialog.open();
		},

		onInverterDialogClose: function(oEvent) {
			this._InverterDialog.close();
		},

		onSaveInverter: function(oEvent) {
			var aInverters = this.getView().getModel("InverterModel").getProperty("/data");
			var oInverter = {};
			oInverter.DevicCod = "001";
			oInverter.DevicTyp = "INVET";
			oInverter.Manu = sap.ui.getCore().byId("invMake").getSelectedKey();
			oInverter.SizeD = sap.ui.getCore().byId("invSize").getValue();
			oInverter.Model = sap.ui.getCore().byId("invModel").getSelectedKey();
			oInverter.Phase = sap.ui.getCore().byId("invPhase").getValue();
			oInverter.Quant = sap.ui.getCore().byId("invQuant").getValue();
			var tot = parseFloat(oInverter.SizeD) * parseInt(oInverter.Quant);
			oInverter.TsizeD = tot.toString();

			var PhaseCustomer = this.getView().getModel("ViewModel").getProperty("/Phase");
			switch (PhaseCustomer) {
				case "SINGLE-PHA":
					// code block
					if (oInverter.Phase === "THREE-PHAS") {
						MessageBox.error("Please note that you cannot add a three phase inverter to a Single phase meter");
						return;
					}
					break;
				case "THREE-PHAS":

					break;
				default:
					// code block
			}

			aInverters.push(oInverter);
			this.getView().getModel("InverterModel").refresh();

			sap.ui.getCore().byId("invMake").setSelectedKey(null);
			sap.ui.getCore().byId("invModel").setSelectedKey(null);
			sap.ui.getCore().byId("invSize").setValue(null);
			sap.ui.getCore().byId("invPhase").setValue(null);
			sap.ui.getCore().byId("invQuant").setValue(null);

			this.calculateTotInverters();
			this.onInverterDialogClose();

		},

		onBatteryDialogOpen: function(oEvent) {
			if (!this._BatteryDialog) {
				this._BatteryDialog = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.SSEG.AddBatteryStorage", this);
			}
			// toggle compact style
			this._BatteryDialog.addStyleClass('sapUiSizeCompact');
			this.getView().addDependent(this._BatteryDialog);
			sap.ui.getCore().byId("btnBatterySave").setEnabled(false);
			this._BatteryDialog.open();
		},

		onBatteryDialogClose: function(oEvent) {
			this._BatteryDialog.close();
		},

		onSaveBattery: function(oEvent) {
			var oBattery = {};
			oBattery.DevicCod = "001";
			oBattery.DevicTyp = "BATRY";
			oBattery.Manu = sap.ui.getCore().byId("bMake").getValue();
			oBattery.Model = sap.ui.getCore().byId("bModel").getValue();
			oBattery.Voltage = sap.ui.getCore().byId("bVoltage").getValue();
			oBattery.SizeD = sap.ui.getCore().byId("bSize").getValue();
			oBattery.Quant = sap.ui.getCore().byId("bQuantity").getValue();

			this.getView().getModel("BatteryModel").getProperty("/data").push(oBattery);
			this.getView().getModel("BatteryModel").refresh();

			sap.ui.getCore().byId("bMake").setValue(null);
			sap.ui.getCore().byId("bModel").setValue(null);
			sap.ui.getCore().byId("bVoltage").setValue(null);
			sap.ui.getCore().byId("bSize").setValue(null);
			sap.ui.getCore().byId("bQuantity").setValue(null);
			this.CalculateTotBat();
			this.onBatteryDialogClose();
			this.CalculateTotMCC();
		},

		CalculateTotBat: function() {
			var aBatteries = this.getView().getModel("BatteryModel").getProperty("/data");
			var sum = 0;
			for (var i = 0; i < aBatteries.length; i++) {
				sum += parseInt(aBatteries[i].Quant);
			}

			this.byId("inpTotBat").setValue(sum);
		},

		onPVDialogOpen: function(oEvent) {
			if (!this._PVDialog) {
				this._PVDialog = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.SSEG.AddPVPanel", this);
			}
			// toggle compact style
			this._PVDialog.addStyleClass('sapUiSizeCompact');
			this.getView().addDependent(this._PVDialog);
			this._PVDialog.open();
		},

		onPVDialogClose: function(oEvent) {
			this._PVDialog.close();
		},

		onSavePV: function(oEvent) {
			var oPV = {};
			oPV.DevicCod = "001";
			oPV.DevicTyp = "PVNEL";
			oPV.Manu = sap.ui.getCore().byId("pvManu").getValue();
			oPV.Model = sap.ui.getCore().byId("pvModel").getValue();
			oPV.Voltage = sap.ui.getCore().byId("pvWatts").getValue();
			oPV.Quant = sap.ui.getCore().byId("pvQuant").getValue();

			this.getView().getModel("PVModel").getProperty("/data").push(oPV);
			this.getView().getModel("PVModel").refresh();

			sap.ui.getCore().byId("pvManu").setValue(null);
			sap.ui.getCore().byId("pvModel").setValue(null);
			sap.ui.getCore().byId("pvWatts").setValue(null);
			sap.ui.getCore().byId("pvQuant").setValue(null);
			this.CalculateTotPV();
			this.onPVDialogClose();
		},

		CalculateTotPV: function() {
			var aPanels = this.getView().getModel("PVModel").getProperty("/data");
			var quaTot = 0;
			var wattsTot = 0.00;
			var lineTot = 0.00;
			for (var i = 0; i < aPanels.length; i++) {
				lineTot = parseFloat(aPanels[i].Voltage) * parseInt(aPanels[i].Quant);
				quaTot += parseInt(aPanels[i].Quant);
				wattsTot += lineTot;
			}
			this.byId("inpTotPV").setValue(quaTot);
			this.byId("inpPVWatts").setValue(wattsTot.toFixed(2));
		},

		calculateTotInverters: function() {
			var aInv = this.getView().getModel("InverterModel").getProperty("/data");
			var total = 0;
			var totalCap = 0.00;
			var lineTot = 0.00;
			var oWizard = this.byId("SSEGWizard");
			var totNPR = parseFloat(this.byId("inpNPR").getValue());
			this.suffNPR = true;

			for (var i = 0; i < aInv.length; i++) {
				lineTot = parseFloat(aInv[i].SizeD) * parseInt(aInv[i].Quant);
				total += parseInt(aInv[i].Quant);
				totalCap += lineTot;
			}

			this.byId("inpTotInv").setValue(total);
			this.byId("inpCapInv").setValue(totalCap.toFixed(2));
			if (this.Notifi_num === "NEW") {
				if (totNPR < totalCap) {
					this.suffNPR = false;
					MessageBox.error("The total sum of inverters cannot exceed the allocation of the property name plate rating of  " + totNPR +
						" please reduce the number of inverters");
					return;
				}
			}
		},

		CalculateTotMCC: function(oEvent) {
			var aBatteries = this.getView().getModel("BatteryModel").getProperty("/data");
			var iRate = 0.3;
			var totVoltage = 0;
			var totMCC = 0;

			for (var i = 0; i < aBatteries.length; i++) {
				totVoltage = parseFloat(aBatteries[i].Voltage) * parseInt(aBatteries[i].Quant);
				totMCC += totVoltage * iRate;
			}
		},

		_validateInverterSaveEnablement: function(oEvent) {
			var aInputControls = this._getFormFields(sap.ui.getCore().byId("_InverterForm"));
			var oControl;
			var sState;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						sap.ui.getCore().byId("btnInvSave").setEnabled(false);
						return;
					} else {
						sState = oControl.getValueState();
						if (sState === "Error") {
							sap.ui.getCore().byId("btnInvSave").setEnabled(false);
							return;
						} else {
							sap.ui.getCore().byId("btnInvSave").setEnabled(true);
						}
					}
				} else {
					sState = oControl.getValueState();
					if (sState === "Error") {
						sap.ui.getCore().byId("btnInvSave").setEnabled(false);
						return;
					} else {
						sap.ui.getCore().byId("btnInvSave").setEnabled(true);
					}
				}
			}
		},

		_validatePVSaveEnablement: function(oEvent) {
			var aInputControls = this._getFormFields(sap.ui.getCore().byId("_PVPanelForm"));
			var oControl;
			var sState;
			var oBtnPVSave = sap.ui.getCore().byId("btnPVSave");
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						oBtnPVSave.setEnabled(false);
						return;
					} else {
						sState = oControl.getValueState();
						if (sState === "Error") {
							oBtnPVSave.setEnabled(false);
							return;
						} else {
							oBtnPVSave.setEnabled(true);
						}
					}
				} else {
					sState = oControl.getValueState();
					if (sState === "Error") {
						oBtnPVSave.setEnabled(false);
						return;
					} else {
						oBtnPVSave.setEnabled(true);
					}
				}
			}
		},

		onSelectProperty: function(oEvent) {
			var oSource = oEvent.getSource();
			var oItem = oSource.getSelectedItem();
			var oObject = oItem.getBindingContext("Properties").getObject();
			this.PropertySelected = true;
			this.SelectedProperty = oObject;
			this.SelectedProperty.Egiskey = this.SelectedProperty.Plno;
			this._loadMeters();

			if (oObject.Check) {
				this.PropertySelected = false;
				MessageBox.error("Another application for SSEG for this property is already in progress");
				return;
			}

			if (oObject.AppReqid === "") {
				this.getView().getModel("Header").setProperty("/Role", "OWNER");
				this.getView().getModel("Header").setProperty("/Partner", "");
				this.getView().byId("cmbAppType").getItems()[1].setEnabled(false);
				this.getView().byId("cmbAppType").getItems()[2].setEnabled(true);
				this._loadOwnerDetails(this.BP);

			} else {
				this.getView().getModel("Header").setProperty("/Role", "APPLC");
				this.getView().getModel("Header").setProperty("/Partner", this.BP);
				this.getView().byId("cmbAppType").getItems()[1].setEnabled(true);
				this.getView().byId("cmbAppType").getItems()[2].setEnabled(false);
				this._loadOwnerDetails(this.SelectedProperty.Partner);
			}
			this._loadPayer(this.SelectedProperty.Plno);
			this.onEventListener(oObject.Plno);

		},

		onSelectManufacturer: function(oEvent) {
			var oSource = oEvent.getSource();
			var oItem = oSource.getSelectedItem();
			var oObject = oItem.getBindingContext("Manufacturers").getObject();
			if (oSource.getSelectedKey() !== "") {
				sap.ui.getCore().byId("invModel").setEnabled(true);
				this._loadModels(oObject.MCode);
			} else {
				sap.ui.getCore().byId("invModel").setEnabled(false);
			}

		},

		onSelectModel: function(oEvent) {
			var oSource = oEvent.getSource();
			var oItem = oSource.getSelectedItem();
			var oObject = oItem.getBindingContext("Models").getObject();
			this.PropertyType = oObject.ExistSuppCategoryCode;
			sap.ui.getCore().byId("invSize").setValue(oObject.SizeD);
			sap.ui.getCore().byId("invPhase").setValue(oObject.Phase);
		},

		onSelectAppType: function(oEvent) {
			var iSelectedIndex = parseInt(oEvent.getParameter('selectedIndex'));
			if (iSelectedIndex === 1) {
				//Radio Button No 
				this.getView().getModel("Header").setProperty("/AppType", "UPDAT");
			} else {
				//Radio Button Yes 
				this.getView().getModel("Header").setProperty("/AppType", "NEW");
			}

		},

		onSelectExport: function(oEvent) {
			var iSelectedIndex = parseInt(oEvent.getParameter('selectedIndex'));
			if (iSelectedIndex === 1) {
				//Radio Button No 

				this.getView().getModel("ViewModel").setProperty("/isNotExport", true);
				this.getView().getModel("Header").setProperty("/Export", "");
				this.getView().getModel("ViewModel").setProperty("/visibleExport", false);

			} else {
				//Radio Button Yes 
				this.getView().getModel("ViewModel").setProperty("/isNotExport", false);
				this.getView().getModel("Header").setProperty("/Export", "X");
				this.getView().getModel("ViewModel").setProperty("/visibleExport", true);
			}
			this._validateMeterChange();

		},

		onSelectReverse: function(oEvent) {
			var iSelectedIndex = parseInt(oEvent.getParameter('selectedIndex'));
			if (iSelectedIndex === 1) {
				//Radio Button No 
				this.getView().getModel("Header").setProperty("/Reverse", false);

			} else {
				//Radio Button Yes 
				this.getView().getModel("Header").setProperty("/Reverse", true);

			}

		},

		onSelectInstalled: function(oEvent) {
			var iSelectedIndex = parseInt(oEvent.getParameter('selectedIndex'));
			if (iSelectedIndex === 1) {
				//Radio Button No 
				this.getView().getModel("ViewModel").setProperty("/isInstalled", false);
				this.getView().getModel("ViewModel").setProperty("/isNotInstalled", true);
				this.getView().getModel("Header").setProperty("/Instd", "");
			} else {
				//Radio Button Yes 
				this.getView().getModel("ViewModel").setProperty("/isInstalled", true);
				this.getView().getModel("ViewModel").setProperty("/isNotInstalled", false);
				this.getView().getModel("Header").setProperty("/Instd", "X");
			}

		},

		getPartners: function() {
			var sSelectedKey = this.byId("cmbAppType").getSelectedKey();
			var oOwnerData = this.getView().getModel("OwnerModel").getData();
			var PartnerData = this.getView().getModel("PartnerModel").getData();
			var InstallerData = this.getView().getModel("InstallerModel").getData();
			var ElectricalData = this.getView().getModel("ElectricalModel").getData();
			var ECSAData = this.getView().getModel("ECSAModel").getData();
			var sNotificationType = this.getView().getModel("Header").getProperty("/Qmart");
			var oPayer = {};

			if (this.SelectedProperty.AppReqid === "") {

				oOwnerData.Partner = this.BP;
			} else {
				oOwnerData.Partner = this.SelectedProperty.Partner;

			}

			var aPartners = [];
			if (sSelectedKey === "OWNER") {

				oOwnerData.Role = sSelectedKey;
				oOwnerData.isConct = true;

				aPartners.push(oOwnerData);
			} else {
				// Owner details always has to be populated
				oOwnerData.Role = "OWNER";

				aPartners.push(oOwnerData);

				//The Applicant
				PartnerData.Partner = this.BP;
				PartnerData.isConct = true;
				aPartners.push(PartnerData);
				//Add other details 
			}

			if (InstallerData.InstaReg !== "") {
				InstallerData.Role = "INSTA";
				aPartners.push(InstallerData);
			}

			ElectricalData.Role = "ELECT";
			aPartners.push(ElectricalData);

			if (ECSAData.EscaReg !== "") {
				ECSAData.Role = "ECSAP";
				aPartners.push(ECSAData);

			}

			//Add payers information

			if (sNotificationType === "Z9") {
				oPayer.Role = "PAYER";
				var fullname = this.Payer.Name + this.Payer.Surname;
				var aSplitName = fullname.split(" ");
				oPayer.Name = aSplitName[1];
				oPayer.Surname = aSplitName[2];
				oPayer.Partner = this.Payer.Partner;
				oPayer.StreetNo = this.Postal.StreetNo;
				oPayer.StreetAdr = this.Postal.StreetAdr;
				oPayer.City = this.Postal.City;
				oPayer.PVat_No = this.byId("Vat").getValue();
				aPartners.push(oPayer);
			}

			return aPartners;
		},

		getDevices: function() {
			var Devices = [];
			var oBatteryModel = this.getView().getModel("BatteryModel").getData().data;
			var oPVModel = this.getView().getModel("PVModel").getData().data;
			var oInverterModel = this.getView().getModel("InverterModel").getData().data;

			for (var i = 0; i < oBatteryModel.length; i++) {
				Devices.push(oBatteryModel[i]);
			}

			for (var j = 0; j < oPVModel.length; j++) {
				Devices.push(oPVModel[j]);
			}

			for (var k = 0; k < oInverterModel.length; k++) {
				Devices.push(oInverterModel[k]);
			}
			return Devices;
		},

		_setCoding: function(oEvent) {
			var AppCat = this.MeterProperties.ExistSuppCategoryCode;
			var bExport = this.byId("idxExport").getSelectedIndex() === 0 ? true : false;
			var sSystemType = this.getView().getModel("Header").getProperty("/SystemType");
			if (bExport && AppCat === "DOM") {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0100");
			}

			if (!bExport && AppCat === "DOM") {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0200");
			}

			if (AppCat === "DOM" && sSystemType === 3) {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0300");
			}

			if (AppCat === "DOM" && sSystemType === 4) {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0400");
			}

			if (bExport && AppCat === "COM") {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0500");
			}

			if (!bExport && AppCat === "COM") {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0600");
			}

			if (AppCat === "COM" && sSystemType === 3) {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0700");
			}

			if (AppCat === "COM" && sSystemType === 4) {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0800");
			}

			if (AppCat === "COM" && sSystemType === 5) {
				this.getView().getModel("Header").setProperty("/Qmgrp", "SSEG");
				this.getView().getModel("Header").setProperty("/Qmcod", "0800");
			}
		},

		_onSubmitApp: function() {
			var oHeaderModel = this.getView().getModel("Header");
			var oProperties = oHeaderModel.getData();
			sap.ui.core.BusyIndicator.show();
			this._setCoding();
			this.SelectedProperty.Xcoordinate = this.xcoordinate.toString();
			this.SelectedProperty.Ycoordinate = this.ycoordinate.toString();
			this.SelectedProperty.Longitude = this.Longitude.toString();
			this.SelectedProperty.Latitude = this.Latitude.toString();
			var iErfNo = parseInt(this.SelectedProperty.Erfno);
			var AddrString = "SSEG:" + iErfNo + " - " + this.SelectedProperty.Address;
			oProperties.Qmtxt = AddrString.slice(0, 40);
			oProperties.StartDate = this.byId("startDate").getDateValue();
			oProperties.EndDate = this.byId("endDate").getDateValue();

			oProperties.MCC = this.byId("inpMCC").getValue();
			oProperties.MEC = this.byId("inpMEC").getValue();
			oProperties.NPR = this.byId("inpNPR").getValue();

			oProperties.NP_ON_APPID_1 = [this.SelectedProperty];
			oProperties.NP_ON_APPID_2 = this.getPartners();
			oProperties.NP_ON_APPID_3 = this.getDevices();
			if (this.Documents.length > 0) {
				oProperties.NP_ON_APPID_4 = this.Documents;
			}

			this._oODataModel.create("/SSEG_App_HeadersSet", oProperties, {
				success: function(oData, oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this._oODataModel.resetChanges();
					this.onInitialiseModels();
					if (this.serverResponseHasError(oResponse)) {
						//message handling: render error message
						this.showErrorMessage(this.serverResponseHasError(oResponse));
						return;
					}
					this._successSSEGMessageBox(oData.Qmnum);
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					//this._oODataModel.resetChanges();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_successSSEGMessageBox: function(AppID) {
			var vText = "Small-Scale Embedded Generation Application No: " + AppID + " Successfully Created";
			MessageBox.success(vText, {
				icon: sap.m.MessageBox.Icon.SUCCESS,
				title: "Success",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: function(oAction) {
					if (oAction === "OK") {
						this.getRouter().navTo("ApplicationHistory");
					}
				}.bind(this)
			});
		},

		_onSubmitComReport: function(oEvent) {
			var oProp = {};
			oProp.Qmnum = this.Qmnum;
			oProp.Cp1Answer = this.byId("Cp1").getSelectedIndex() === 0 ? true : false;
			oProp.Cp2Answer = this.byId("Cp2").getSelectedIndex() === 0 ? true : false;
			oProp.Cp3Answer = this.byId("Cp3").getSelectedIndex() === 0 ? true : false;
			oProp.Cp4Answer = this.byId("Cp4").getSelectedIndex() === 0 ? true : false;
			oProp.Cp5Answer = this.byId("Cp5").getSelectedIndex() === 0 ? true : false;
			oProp.Cp6Answer = this.byId("Cp6").getSelectedIndex() === 0 ? true : false;
			oProp.Cp7Answer = this.byId("Cp7").getSelectedIndex() === 0 ? true : false;
			oProp.Comments = this.byId("Com").getValue();
			this._oODataModel.createEntry("/SSEG_App_Comm_RptSet", {
				properties: oProp
			});

			this._oODataModel.submitChanges({
				//on succesful case update response from backend
				success: function(oData, oResponse) {
					this._oODataModel.resetChanges();
					this.onReportSuccessMessage(this.Qmnum);
					return;
				}.bind(this),
				//on error response from backend
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this._oODataModel.resetChanges();
					this.showErrorMessage(oError);
				}.bind(this)
			});

		},

		onSearch: function(oEvent) {
			// add filter for search
			var query = oEvent.getSource().getValue();
			var oTable = this.byId("tblProperties");

			var filters = [];
			if (query && query.length > 0) {
				var oFilter1 = [new sap.ui.model.Filter("Street", sap.ui.model.FilterOperator.Contains, query), new sap.ui.model.Filter("HouseNo",
					sap.ui.model.FilterOperator.Contains, query), new sap.ui.model.Filter("AllotmentName",
					sap.ui.model.FilterOperator.Contains, query)];
				var allFilters = new sap.ui.model.Filter(oFilter1, false);
				filters.push(allFilters);
			}
			oTable.getBinding("items").filter(filters, "Application");
		},

		getViewSettingsDialog: function(sDialogFragmentName) {
			var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!pDialog) {
				pDialog = Fragment.load({
					id: this.getView().getId(),
					name: sDialogFragmentName,
					controller: this
				}).then(function(oDialog) {
					if (Device.system.desktop) {
						oDialog.addStyleClass("sapUiSizeCompact");
					}
					return oDialog;
				});
				this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
			}
			return pDialog;
		},
		handleSortButtonPressed: function() {
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.SSEG.PropSortDialog")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},

		handleSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("tblProperties"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		onDownloadSelectedDoc: function() {
			var oUploadSet = this.byId("DisplaySet");
			oUploadSet.getItems().forEach(function(oItem) {

				var oObject = oItem.getBindingContext("Documents").getObject();
				var decodedPdfContent = window.atob(oObject.Content); //"data:application/pdf;base64,"+base64EncodedPDF; //btoa(base64EncodedPDF);
				var byteArray = new Uint8Array(decodedPdfContent.length);
				for (var i = 0; i < decodedPdfContent.length; i++) {
					byteArray[i] = decodedPdfContent.charCodeAt(i);
				}
				var blob = new Blob([byteArray.buffer], {
					type: oObject.Mimetype //"application/pdf"
				});

				var _pdfurl = URL.createObjectURL(blob);
				if (window.navigator.msSaveOrOpenBlob) {
					window.navigator.msSaveBlob(_pdfurl, oObject.Filename);
				} else {
					var elem = window.document.createElement('a');
					elem.href = _pdfurl;
					elem.download = oObject.Filename;
					document.body.appendChild(elem);
					elem.click();
					document.body.removeChild(elem);
				}

			});

		},

		onUploadSchemaDoc: function(oEvent) {
			var oProp = {};
			var sDocType = oEvent.getSource().getFieldGroupIds()[0];
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = function() {
				var base64String = oFileReader.result;
				oProp.Content = base64String.split(',')[1];
				that.Documents.push(oProp);
			};
			oProp.Filename = oParameters.files[0].name;
			oProp.Mimetype = oParameters.files[0].type;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				oProp.Filetype = "docx";
				oProp.Doctype = "docx";
			} else {
				oProp.Filetype = sfileType.substring(sfileType.indexOf('/') + 1);
				oProp.Doctype = sfileType.substring(sfileType.indexOf('/') + 1);
			}

			oProp.Docdisc = sDocType;
			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		onUploadDocuments: function(oEvent) {
			var oProp = {};
			var sDocType = oEvent.getSource().getFieldGroupIds()[0];
			var that = this;
			var oFileObject = oEvent.getParameter("item").getFileObject();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = function() {
				var base64String = oFileReader.result;
				oProp.Content = base64String.split(',')[1];
				that.Documents.push(oProp);
			};
			oProp.Filename = oFileObject.name;
			oProp.Mimetype = oFileObject.type;
			var sfileType = oFileObject.type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				oProp.Filetype = "docx";
				oProp.Doctype = "docx";
			} else {
				oProp.Filetype = sfileType.substring(sfileType.indexOf('/') + 1);
				oProp.Doctype = sfileType.substring(sfileType.indexOf('/') + 1);
			}

			oProp.Docdisc = sDocType;
			oFileReader.readAsDataURL(oFileObject);
		},

		onUploadDelete: function(oEvent) {
			var sFieldID = oEvent.getSource().getFieldGroupIds()[0];
		},

		onNavBack: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("ApplicationHistory", {}, true);
			}
		},

		isValidPhoneNumber: function(sPhoneNumber) {
			//check for valid SA telephone number (mobile or landline)
			if (!/^((?:\+27|27)|0)(\d{2})-?(\d{3})-?(\d{4})$/.test(sPhoneNumber.replace(/[-()_+|:.\/]/g, ""))) {
				return false;
			} else {
				return true;
			}
		},

		onValidateStartDate: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getDateValue();
			var oCurrentDay = new Date();
			if (sValue < oCurrentDay) {
				if (sValue.setHours(0, 0, 0, 0) === oCurrentDay.setHours(0, 0, 0, 0)) {
					// Date equals today's date
					oSource.setValueState("None");
					oSource.setValueStateText("");
				} else {
					//check if user has captured event date that is in the past
					oSource.setValueState("Error");
					oSource.setValueStateText("Please enter a period from date that is not in the past");
					return;
				}
			}

			oSource.setValueState("None");
			oSource.setValueStateText("");

		},

		onValidateEndDate: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getDateValue();
			var startDate = this.byId("startDate").getDateValue();
			var oCurrentDay = new Date();
			if (sValue < oCurrentDay) {
				//check if user has captured event date that is in the past
				if (sValue.setHours(0, 0, 0, 0) === oCurrentDay.setHours(0, 0, 0, 0)) {
					// Date equals today's date
					oSource.setValueState("None");
					oSource.setValueStateText("");
				} else {
					//check if user has captured event date that is in the past
					oSource.setValueState("Error");
					oSource.setValueStateText("Please enter a period from date that is not in the past");
					return;
				}
			}

			if (sValue < startDate) {
				//check if user has captured event date that is in the past
				oSource.setValueState("Error");
				oSource.setValueStateText("The period to date should be greater then the period from date");
				return;
			}

			//Check if the date is within a year 
			var oDateVal = this.byId("startDate").getValue();
			var dateParts = oDateVal.split(".");

			// month is 0-based, that's why we need dataParts[1] - 1
			var dateObject = new Date(+dateParts[2] + 1, dateParts[1] - 1, +dateParts[0]);

			if (sValue > dateObject) {
				oSource.setValueState("Error");
				oSource.setValueStateText("Please enter a period from the date that is not greater than a year");
				return;
			}

			oSource.setValueState("None");
			oSource.setValueStateText("");
		},

		_validateCommisionersReport: function(oEvent) {
			var aInputControls = this._getFormFields(this.byId("cocForm"));
			var oControl;
			var sType;
			var oButton = this.byId("btnSubmitRep");

			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					sType = oControl.getMetadata().getName();

					if (sType === "sap.m.RadioButtonGroup") {
						var idx = oControl.getSelectedIndex();
						if (idx === -1) {
							oButton.setEnabled(false);
							return;
						} else {
							oButton.setEnabled(true);
						}
					}
				}
			}

			this.onEnableSubmit();
		},

		onValidateNumberField: function(oEvent) {
			var oSource = oEvent.getSource();

			var val = oSource.getValue();
			val = val.replace(/[^0-9.]/g, '');
			oSource.setValue(val);

			if (isNaN(val)) {
				oSource.setValueState("Error");
				oSource.setValueStateText("Invalid number entered");
			} else {
				oSource.setValueState("None");
				oSource.setValueStateText("");
			}
			this._validateBatterySave();
		},

		_validateBatterySave: function() {
			var aInputControls = this._getFormFields(sap.ui.getCore().byId("_FormAddBattery"));
			var oControl;
			var sState;

			var oButton = sap.ui.getCore().byId("btnBatterySave");

			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sType = oControl.getMetadata().getName();

					if (sType === "sap.m.Input") {
						var sValue = oControl.getValue();
						if (!sValue) {
							oButton.setEnabled(false);
							return;
						} else {
							oButton.setEnabled(true);
						}

						sState = oControl.getValueState();
						if (sState === "Error") {
							oButton.setEnabled(false);
							return;
						} else {
							oButton.setEnabled(true);
						}
					}

				} else {
					sState = oControl.getValueState();
					if (sState === "Error") {
						oButton.setEnabled(false);
						return;
					} else {
						oButton.setEnabled(true);
					}
				}
			}
		},

		_validateMeterChange: function() {
			sap.ui.core.BusyIndicator.show();
			var sSerialNr = "";

			if (this.MeterProperties.ExistDeviceCategory === "1004" && this.MeterProperties.ExistSuppCategoryCode === "COM" && this.byId(
					"idxExport").getSelectedIndex() === 0 ? true : false) {
				sSerialNr = this.MeterProperties.MeterNo.slice(9);
				sSerialNr = sSerialNr.substring(0, 4);
			}

			var values = {
				BillingClass: this.MeterProperties.ExistSuppCategoryCode,
				Export: this.byId("idxExport").getSelectedIndex() === 0 ? true : false,
				FunctionClass: this.MeterProperties.ExistDeviceCategory,
				SNRange: sSerialNr

			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_Meter_Changes", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					this.getView().getModel("Header").setProperty("/Qmart", oData.Qmart);
					this.getView().getModel("Header").setProperty("/ActRequir", oData.ZssegMeterChng);

					// 
					if (oData.Qmart === "Z9") {
						this.byId("SCResponsibleToPay").setVisible(true);
					} else {
						this.byId("SCResponsibleToPay").setVisible(false);
					}

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		onEnableSubmit: function(oEvent) {
			var bDeclaration = this.byId("chkConfirm").getSelected();
			this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
			if (bDeclaration) {
				this.getView().getModel("ViewModel").setProperty("/enableSubmit", true);
			} else {
				this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
			}
		},

		onValueHelpRequest: function(oEvent) {
			var oView = this.getView();
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "capetown.gov.zaEnergyApplication.view.fragment.SSEG.MeterDialog",
					controller: this
				}).then(function(oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}
			this._pValueHelpDialog.then(function(oValueHelpDialog) {
				oValueHelpDialog.open();
			}.bind(this));
		},

		handleClose: function(oEvent) {
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);
			var path = oEvent.getParameter("selectedContexts")[0].getPath();
			var oPhaseSizeCMB = this.byId("cmbSupplySize");
			var comFil;
			this.MeterProperties = this.getView().getModel("Meters").getProperty(path);
			this.getView().getModel("Header").setProperty("/MeterNo", this.MeterProperties.MeterNo);
			this.getView().getModel("Header").setProperty("/Equipment", this.MeterProperties.Equipment);
			this.getView().getModel("Header").setProperty("/Material", this.MeterProperties.Material);
			this.getView().getModel("Header").setProperty("/functionLoctn", this.MeterProperties.Tplnr);
			this.getView().getModel("ViewModel").setProperty("/ExistSuppCategory", this.MeterProperties.ExistSuppCategory);
			this.getView().getModel("ViewModel").setProperty("/DeviceCategoryText", this.MeterProperties.DeviceCategoryText);
			this.getView().getModel("ViewModel").setProperty("/Amperage", this.MeterProperties.Vertrag);
			this.getView().getModel("ViewModel").setProperty("/PropType", this.MeterProperties.ExistSuppCategory);
			var phase = this.MeterProperties.ExistSuppPhase.substring(0, 2);
			switch (phase) {
				case "3P":
					// code block
					this.getView().getModel("ViewModel").setProperty("/Phase", "THREE-PHAS");
					this.byId("phaseCMB").setEnabled(false);

					if (this.MeterProperties.ExistSuppCategoryCode === "DOM") {
						var oFilterRES = new sap.ui.model.Filter({
							path: "Value",
							operator: FilterOperator.BT,
							value1: "001",
							value2: "006"
						});
						comFil = new sap.ui.model.Filter([oFilterRES]);
						oPhaseSizeCMB.getBinding("items").filter(comFil, sap.ui.model.FilterType.Application);
					}

					break;
				case "SP":
					// code block
					this.getView().getModel("ViewModel").setProperty("/Phase", "SINGLE-PHA");
					this.byId("phaseCMB").setEnabled(false);
					comFil = new sap.ui.model.Filter({
						path: "Value",
						operator: FilterOperator.BT,
						value1: "003",
						value2: "005"
					});

					oPhaseSizeCMB.getBinding("items").filter(comFil, sap.ui.model.FilterType.Application);

					break;
				default:
					this.getView().getModel("ViewModel").setProperty("/Phase", "");
					this.byId("phaseCMB").setEnabled(true);
					// code block
			}

		},

		onSelectSupplyPhase: function(oEvent) {
			var oSource = oEvent.getSource();
			var sSelectedKey = oSource.getSelectedKey();
			var comFil;
			var oPhaseSizeCMB = this.byId("cmbSupplySize");
			switch (sSelectedKey) {
				case "THREE-PHAS":
					// code block
					this.getView().getModel("ViewModel").setProperty("/Phase", "THREE-PHAS");
					this.byId("phaseCMB").setEnabled(false);

					if (this.MeterProperties.ExistSuppCategoryCode === "DOM") {
						var oFilterRES = new sap.ui.model.Filter({
							path: "Value",
							operator: FilterOperator.BT,
							value1: "001",
							value2: "010"
						});
						comFil = new sap.ui.model.Filter([oFilterRES]);
						oPhaseSizeCMB.getBinding("items").filter(comFil, sap.ui.model.FilterType.Application);
					} else {
						oPhaseSizeCMB.getBinding("items").filter("");
					}

					break;
				case "SINGLE-PHA":
					// code block
					this.getView().getModel("ViewModel").setProperty("/Phase", "SINGLE-PHA");
					this.byId("phaseCMB").setEnabled(false);
					comFil = new sap.ui.model.Filter({
						path: "Value",
						operator: FilterOperator.BT,
						value1: "003",
						value2: "005"
					});
					oPhaseSizeCMB.getBinding("items").filter(comFil, sap.ui.model.FilterType.Application);

					break;
				default:
					this.getView().getModel("ViewModel").setProperty("/Phase", "");
					this.byId("phaseCMB").setEnabled(true);
					// code block
			}
		},

		getInstallerSearch: function(oEvent) {
			sap.ui.core.BusyIndicator.show();
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue();
			this.InstallerVerified = false;
			var InstallerModel = this.getView().getModel("InstallerModel");
			var values = {
				IM_REGNO: sValue,
				IM_ROLE: 'INSTA'
			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_Valid_regista", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					if (oData.RegNo === "") {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error(
							"There is no e-Services User Profile registered as an Installer provided. Please ensure that you have the correct details");
						return;
					}

					this.InstallerVerified = true;
					InstallerModel.setProperty("/InstaReg", oData.RegNo);
					InstallerModel.setProperty("/InstaCompn", oData.Name);
					InstallerModel.setProperty("/Title", oData.Title);
					InstallerModel.setProperty("/Email", oData.Email);
					InstallerModel.setProperty("/Wtelep", oData.CellNo);
					InstallerModel.setProperty("/Partner", oData.Partner);

					sap.ui.core.BusyIndicator.hide();

				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});

		},

		getElectricalSearch: function(oEvent) {
			sap.ui.core.BusyIndicator.show();
			var oSource = oEvent.getSource();
			this.ElectricalVerified = false;
			var sValue = oSource.getValue();
			var ElectricalModel = this.getView().getModel("ElectricalModel");
			var values = {
				IM_REGNO: sValue,
				IM_ROLE: 'ELECT'

			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_Valid_regista", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					if (oData.Name === "") {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error(
							"There is no e-Services User Profile registered as an Electrical Contractor provided. Please ensure that you have the correct details"
						);
						return;

					}

					this.ElectricalVerified = true;
					ElectricalModel.setProperty("/ElecReg", sValue);
					ElectricalModel.setProperty("/ElecCompn", oData.Name);
					ElectricalModel.setProperty("/Title", oData.Title);
					ElectricalModel.setProperty("/Email", oData.Email);
					ElectricalModel.setProperty("/Wtelep", oData.CellNo);
					ElectricalModel.setProperty("/Partner", oData.Partner);
					ElectricalModel.setProperty("/Name", oData.ProfName);
					sap.ui.core.BusyIndicator.hide();

				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		getECSAPSearch: function(oEvent) {
			sap.ui.core.BusyIndicator.show();
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue();
			var ECSAModel = this.getView().getModel("ECSAModel");
			var values = {
				IM_REGNO: sValue,
				IM_ROLE: 'ECSAP'
			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_Valid_regista", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {

					if (oData.RegNo === "") {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error(
							"There is no e-Services User Profile registered as an ECSA provided. Please ensure that you have the correct details");
						return;
					}
					ECSAModel.setProperty("/EscaReg", oData.RegNo);
					ECSAModel.setProperty("/Name", oData.Discipline);
					ECSAModel.setProperty("/Title", oData.Title);
					ECSAModel.setProperty("/Email", oData.Email);
					ECSAModel.setProperty("/Wtelep", oData.CellNo);
					ECSAModel.setProperty("/Partner", oData.Partner);
					ECSAModel.setProperty("/EscaCat", oData.Category);
					ECSAModel.setProperty("/Surname", oData.ProfName);
					sap.ui.core.BusyIndicator.hide();

				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});

		},

		getMaxInstallLimits: function() {
			var sAmpereSize = this.getView().getModel("Header").getProperty("/AMPERE_R");
			var sPhase = this.byId("phaseCMB").getSelectedKey();
			var BillingClass = this.MeterProperties.ExistSuppCategoryCode;

			var values = {
				AmpereSize: sAmpereSize,
				Phase: sPhase,
				BillingClass: BillingClass
			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_Valid_Volt_Lmt", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					//this._loadData();
					this.getView().getModel("ViewModel").setProperty("/NPR", oData.NprValue);
					this.getView().getModel("ViewModel").setProperty("/MEC", oData.MecValue);
					this.getView().getModel("ViewModel").setProperty("/MCC", oData.MccValue);
					sap.ui.core.BusyIndicator.hide();

				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		handleBatteryDelete: function(oEvent) {
			var m = oEvent.getSource().getParent();
			var idx = m.getBindingContextPath();
			var property = this.getView().getModel("BatteryModel").getData().data;
			var data = [];
			idx = idx.charAt(idx.lastIndexOf('/') + 1);

			if (idx !== -1) {
				//Delete row 
				data.push(this.getView().getModel("BatteryModel").getProperty("/data"));
				this.getView().getModel("BatteryModel").setProperty("/data", data[0]);
				property.splice(idx, 1);
				this.getView().getModel("BatteryModel").refresh();

			}
			this.CalculateTotBat();
		},

		handlePVDelete: function(oEvent) {
			var m = oEvent.getSource().getParent();
			var idx = m.getBindingContextPath();
			var property = this.getView().getModel("PVModel").getData().data;
			var data = [];
			idx = idx.charAt(idx.lastIndexOf('/') + 1);

			if (idx !== -1) {
				//Delete row 
				data.push(this.getView().getModel("PVModel").getProperty("/data"));
				this.getView().getModel("PVModel").setProperty("/data", data[0]);
				property.splice(idx, 1);
				this.getView().getModel("PVModel").refresh();
			}
			this.CalculateTotPV();
		},

		handleInverterDelete: function(oEvent) {
			var m = oEvent.getSource().getParent();
			var idx = m.getBindingContextPath();
			var property = this.getView().getModel("InverterModel").getData().data;
			var data = [];
			idx = idx.charAt(idx.lastIndexOf('/') + 1);

			if (idx !== -1) {
				//Delete row 
				data.push(this.getView().getModel("InverterModel").getProperty("/data"));
				this.getView().getModel("InverterModel").setProperty("/data", data[0]);
				property.splice(idx, 1);
				this.getView().getModel("InverterModel").refresh();
			}
			this.calculateTotInverters();
		},

		goToDeclarationStep: function(oEvent) {
			this.byId("SchematicStep").setNextStep(this.getView().byId("DeclarationStep"));
		},

		//How to Logic
		onHowto: function() {

			var howModel = new sap.ui.model.json.JSONModel();
			howModel.setData([{
				"Step": "Step 1 - Select a Property on the list of addresses provided."
			}, {
				"Step": "Step 2 - Select 'Draw a point' button."
			}, {
				"Step": "Step 3 - Plot a point on the selected property indicated with red borders."
			}, {
				"Step": "Step 4 - Review address details below map."
			}, {
				"Step": "Step 5 - Select 'Confirm' button."
			}, {
				"Step": "Step 6 - Select Step 2 to proceed to the next step"
			}]);

			this.getView().setModel(howModel, "alhowModel");

			if (!this.oDefaultDialog) {
				this.oDefaultDialog = new sap.m.Dialog({
					title: "Step by step guide",
					content: [new sap.m.List({
							items: {
								path: "alhowModel>/",
								template: new sap.m.StandardListItem({
									title: "{alhowModel>Step}"
								}).addStyleClass("howto")
							}

						}), new sap.m.FormattedText({
							htmlText: "<ul><li>To zoom: please double click the map or use the zoom (+/-) buttons.</li><li>To change address: select a different address provided on the list of properties.</li></ul>"

						}).addStyleClass("sapMFTex")

					],
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "Close",
						press: function() {
							this.oDefaultDialog.close();
						}.bind(this)
					})
				});
				this.oDefaultDialog.addStyleClass('sapUiSizeCompact');

				// to get access to the controller's model
				this.getView().addDependent(this.oDefaultDialog);

			}

			this.oDefaultDialog.open();
		},

		PropertyValidations: function() {
			var oPropertyTable = this.byId("tblProperties");
			var oItem = oPropertyTable.getSelectedItem();
			var oWizard = this.byId("SSEGWizard");

			if (!this.PropertySelected) {
				MessageBox.error("Another application for SSEG for this property is already in progress");
				oWizard.previousStep();
				return false;
			}

			if (oItem === null) {
				MessageBox.error(
					"Please choose one of the properties on the table that is associated with your e-Service account as a property owner or verified proxy."
				);
				oWizard.previousStep();
				return false;
			}

			if (this.xcoordinate === undefined) {
				MessageBox.error(
					"Please plot a point on the map, To guide you in plotting a point on the map for the selected property, kindly utilize the 'How to Plot' button located in the top right corner of the map."
				);
				oWizard.previousStep();
				return false;
			}
		},

		validateContactPersonFields: function() {
			var oWizard = this.byId("SSEGWizard");
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
			var ownerEmail = this.byId("ownerEmail");
			var ownerCell = this.byId("ownerCell");
			var cell = this.byId("cell");
			var email = this.byId("email");
			var oContact = this.byId("cmbAppType").getSelectedKey();

			ownerEmail.setValueState("None");
			ownerCell.setValueState("None");
			cell.setValueState("None");
			email.setValueState("None");

			if (this.byId("cmbAppType").getValue().trim() === "") {
				this.byId("cmbAppType").setValueState("Error");
				this.byId("cmbAppType").setValueStateText("Select Party");
				this.byId("cmbAppType").focus();
				MessageBox.error("Please select a party from the drop down values");
				oWizard.previousStep();
				return false;
			}

			if (this.byId("ownerEmail").getValue().trim() !== "") {
				if (!ownerEmail.getValue().match(rexMail)) {
					ownerEmail.setValueState("Error");
					ownerEmail.setValueStateText("Invalid email address");
					ownerEmail.focus();
					MessageBox.error("Invalid email address");
					oWizard.previousStep();
					return false;
				}
			} else {
				ownerEmail.setValueState("Error");
				ownerEmail.setValueStateText("Invalid email address");
				ownerEmail.focus();
				MessageBox.error("Invalid email address");
				oWizard.previousStep();
				return false;
			}

			if (ownerCell.getValue().trim() === "") {
				ownerCell.setValueState("Error");
				ownerCell.setValueStateText("Enter Cell Number");
				ownerCell.focus();
				MessageBox.error("Invalid phone number");
				oWizard.previousStep();
				return false;
			} else {
				if (!this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					ownerCell.setValueState("Error");
					ownerCell.setValueStateText("Invalid Cell Number");
					ownerCell.focus();
					MessageBox.error("Invalid phone number");
					oWizard.previousStep();
					return false;
				}
			}

			//}

			if (oContact === "CONTA") {
				if (this.byId("AppTitle").getValue().trim() === "") {
					this.byId("AppTitle").setValueState("Error");
					this.byId("AppTitle").setValueStateText("Select Title");
					this.byId("AppTitle").focus();
					MessageBox.error("Please select title from the drop down values");
					oWizard.previousStep();
					return false;
				}
				if (this.byId("AppSurname").getValue().trim() === "") {
					this.byId("AppSurname").setValueState("Error");
					this.byId("AppSurname").setValueStateText("Enter Surname");
					this.byId("AppSurname").focus();
					MessageBox.error("Enter surname");
					oWizard.previousStep();
					return false;
				}
				if (this.byId("AppName").getValue().trim() === "") {
					this.byId("AppName").setValueState("Error");
					this.byId("AppName").setValueStateText("Enter Name");
					this.byId("AppName").focus();
					MessageBox.error("Enter name");
					oWizard.previousStep();
					return false;
				}
				if (this.byId("cell").getValue().trim() === "") {
					this.byId("cell").setValueState("Error");
					this.byId("cell").setValueStateText("Enter Cell");
					this.byId("cell").focus();
					MessageBox.error("Invalid phone number");
					oWizard.previousStep();
					return false;
				} else {
					if (this.byId("cell").getValue().length < 10 && this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
						this.byId("cell").setValueState("Error");
						this.byId("cell").setValueStateText("Invalid Work Number");
						this.byId("cell").focus();
						MessageBox.error("Invalid phone number");
						oWizard.previousStep();
						return false;
					}
				}

				if (this.byId("email").getValue().trim() !== "") {
					if (!this.byId("email").getValue().match(rexMail)) {
						this.byId("email").setValueState("Error");
						this.byId("email").setValueStateText("Invalid email address");
						this.byId("email").focus();
						MessageBox.error("Invalid email address");
						oWizard.previousStep();
						return false;
					}
				} else {
					this.byId("email").setValueState("Error");
					this.byId("email").setValueStateText("Invalid email address");
					this.byId("email").focus();
					MessageBox.error("Invalid email address");
					oWizard.previousStep();
					return false;
				}
			}

			if (!this.ElectricalVerified) {
				this.byId("ElectricalReg").focus();
				MessageBox.error(
					"Please search for the electrical contractor details by entering the electrical contractor registration number and clicking on the search icon"
				);
				oWizard.previousStep();
				return false;
			}

			this.byId("AppTitle").setValueState("None");
			this.byId("AppSurname").setValueState("None");
			this.byId("AppName").setValueState("None");
			this.byId("cell").setValueState("None");
			this.byId("ownerEmail").setValueState("None");
			this.byId("ownerCell").setValueState("None");
			this.byId("email").setValueState("None");

		},

		_validateExistingSupply: function() {
			var aInputControls = this._getFormFields(this.byId("_SupplyForm"));
			var oControl;
			// var sState;

			this.ExistingSupplyValid = false;
			var oWizard = this.byId("SSEGWizard");

			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sType = oControl.getMetadata().getName();
					if (sType === "sap.m.ComboBox") {
						var oKey = oControl.getSelectedKey();
						if (oKey === "") {
							oControl.setValueState("Error");
							oControl.focus();
							oWizard.previousStep();
							return false;

						} else {
							oControl.setValueState("None");
							oControl.setValueStateText("");
						}
					}

					if (sType === "sap.m.Input") {
						var sValue = oControl.getValue();
						if (!sValue) {
							oControl.setValueState("Error");
							oControl.setValueStateText("Please select a meter number");
							oControl.focus();
							oWizard.previousStep();
							return false;
						} else {
							oControl.setValueState("None");
							oControl.setValueStateText("");
						}
					}
				}
			}

		},

		_validateSystemDetails: function() {
			var aInputControls = this._getFormFields(this.byId("_SystemForm"));
			var oControl;
			var sType;
			var selectedType = this.byId("tblSystem").getSelectedItem();
			var sECSA = this.byId("ECSAReg").getValue();
			var idxInstalled = this.byId("idxInstalled").getSelectedIndex();
			var idxExport = this.byId("idxExport").getSelectedIndex();
			var sSelectedEnergy = this.byId("cmbEnergy").getSelectedKey();

			this.isSystemValid = false;
			var oWizard = this.byId("SSEGWizard");

			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					sType = oControl.getMetadata().getName();

					if (sType === "sap.m.RadioButtonGroup") {
						var idx = oControl.getSelectedIndex();
						if (idx === -1) {
							oControl.setValueState("Error");
							MessageBox.error("Please select one of the options on the radio button");
							oControl.focus();
							oWizard.previousStep();
							return false;
						} else {
							oControl.setValueState("None");

						}
					}

					//System Type Selected?
					if (selectedType === null) {
						MessageBox.error("Please select the type of system from the options provided listed on the table ");
						this.byId("tblSystem").focus();
						oWizard.previousStep();
						return false;
					}

					//Energy Source Validation
					if (sSelectedEnergy === "") {
						this.byId("cmbEnergy").setValueState("Error");
						this.byId("cmbEnergy").setValueStateText("Please select the energy source");
						this.byId("cmbEnergy").focus();
						oWizard.previousStep();
						return false;
					} else {
						this.byId("cmbEnergy").setValueState("None");
						this.byId("cmbEnergy").setValueStateText("");
					}

					//Export Validation 
					var bisExporting = this.getView().getModel("ViewModel").getProperty("/isExporting");
					if (bisExporting) {
						if (idxExport === -1) {
							this.byId("idxExport").setValueState("Error");

							MessageBox.error("Please select one of the options on the radio button");
							oWizard.previousStep();
							this.byId("idxExport").focus();
							return false;
						} else {
							this.byId("idxExport").setValueState("None");

						}
					}

					var sNotificationType = this.getView().getModel("Header").getProperty("/Qmart");

					if (sNotificationType === "Z9") {
						if (this.byId("party").getSelectedItem() === null) {
							this.byId("party").setValueState("Error");
							this.byId("party").setValueStateText("Select Party");
							MessageBox.error("Please select payer from the drop down");
							oWizard.previousStep();
							return false;
						}

						if (this.byId("IstaxRequired").getSelectedIndex() === -1) {
							MessageBox.error("Please indicate if tax invoice is required");
							this.byId("IstaxRequired").setValueState("Error");
							oWizard.previousStep();
							return false;
						}

						if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("Vat").getValue() === "") {
							this.byId("Vat").setValueState("Error");
							this.byId("Vat").setValueStateText("Enter VAT");
							MessageBox.error("Please capture the required field");
							oWizard.previousStep();
							return false;
						}

						if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("FileUpload").getValue() === "") {
							this.byId("FileUpload").setValueState("Error");
							this.byId("FileUpload").setValueStateText("Upload Certificate");
							MessageBox.error("Please capture the required field");
							oWizard.previousStep();
							return false;
						}

						if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("postalAddress").getValue() === "") {
							this.byId("postalAddress").setValueState("Error");
							this.byId("postalAddress").setValueStateText("Select address");
							MessageBox.error("Please capture the required field");
							oWizard.previousStep();
							return false;
						}
					}

					//Check if Batteries is required

					var bBattery = this.getView().getModel("ViewModel").getProperty("/isBatteryReq");
					var oBatTable = this.byId("tblBateries");
					var oBatItems = oBatTable.getItems();
					if (bBattery) {
						if (oBatItems.length === 0) {
							MessageBox.error("Please add a battery by selecting the 'ADD A BATTERY' button ");
							oBatTable.focus();
							oWizard.previousStep();
							return false;
						}
					}

					//Check if PV is  required
					var bPV = this.getView().getModel("ViewModel").getProperty("/isPV");
					var oPVTable = this.byId("tblPV");
					var oPVItems = oPVTable.getItems();

					if (bPV) {
						if (oPVItems.length === 0) {
							MessageBox.error("Please add a PV Panel by selecting the 'ADD A PV PANEL' button ");
							this.byId("btnAddBat").focus();
							oWizard.previousStep();
							return false;
						}
					}
					var bECSAP = this.getView().getModel("ViewModel").getProperty("/isECSA");
					//ECSA Validated/Verified?
					if (bECSAP) {
						if (sECSA === "") {
							MessageBox.error(
								"Please search for the ECSA professional details by entering the  registration number and clicking on the search icon");
							//this.byId("ECSAReg").focus();
							oWizard.previousStep();
							return false;
						}
					}

					//Construction validation 
					if (idxInstalled === -1) {
						this.byId("idxInstalled").setValueState("Error");
						MessageBox.error("Please select one of the options on the radio button");
						//this.byId("idxInstalled").focus();
						oWizard.previousStep();
						return false;
					} else {
						this.byId("idxInstalled").setValueState("None");
						if (idxInstalled === 1) {
							if (this.byId("startDate").getValue() === "") {
								this.byId("startDate").setValueState("Error");
								this.byId("startDate").setValueStateText("Please select the energy source");
								this.byId("startDate").focus();
								oWizard.previousStep();
								return false;
							} else {
								this.byId("startDate").setValueState("None");
								this.byId("startDate").setValueStateText("");
							}

							if (this.byId("endDate").getValue() === "") {
								this.byId("endDate").setValueState("Error");
								this.byId("endDate").setValueStateText("Please select the energy source");
								this.byId("endDate").focus();
								oWizard.previousStep();
								return false;
							} else {
								this.byId("endDate").setValueState("None");
								this.byId("endDate").setValueStateText("");
							}

						}

					}

				}
			}

			//this.onEnableSubmit();
		},

		_validateInverter: function(oEvent) {
			//Check if Batteries is required
			var aInverters = this.getView().getModel("InverterModel").getProperty("/data");
			var oWizard = this.byId("SSEGWizard");
			var sSystem = this.getView().getModel("Header").getProperty("/SystemType");

			if (!this.suffNPR) {
				MessageBox.error(
					"The total sum of inverters cannot exceed the allocation of the property name plate rating of please reduce the number of inverters"
				);
				oWizard.previousStep();
				return false;
			}

			if (sSystem === 1 || sSystem === 2 || sSystem === 3) {

				this.isInverterValid = false;
				if (aInverters.length === 0) {
					MessageBox.error("Please add an inverter by selecting the 'ADD INVERTER' button ");
					oWizard.previousStep();
					this.byId("btnAddInv").focus();
					return false;

				}
			}

		},

		_validateSchema: function() {
			var bSelected = this.byId("_SchematicConsent").getSelected();
			var oWizard = this.byId("SSEGWizard");
			var sSystem = this.getView().getModel("Header").getProperty("/SystemType");
			if (bSelected) {
				if (sSystem === 5) {
					if (this.Documents.length === 0) {
						this.byId("fileUploader").setValueState("Error");
						this.byId("fileUploader").setValueStateText("Please upload a schema diagram to proceed");
						oWizard.previousStep();
						this.byId("fileUploader").focus();
						return false;
					}
				}

			} else {
				this.byId("_SchematicConsent").setValueState("Error");
				MessageBox.error("Please confirm the schema diagram by selecting the checkbox ");
				oWizard.previousStep();
				this.byId("_SchematicConsent").focus();
				return false;
			}

		},

		onSelectTaxRequired: function(oEvent) {
			if (oEvent.getSource().getSelectedIndex() === 0) {
				this.byId("Vat").setVisible(true);
				this.byId("FileUpload").setVisible(true);
			} else {

				this.byId("Vat").setVisible(false);
				this.byId("FileUpload").setVisible(false);

			}
		},

		onSelectPayer: function(oEvent) {
			var oPostCmb = this.byId("postalAddress");
			var oSource = oEvent.getSource();
			var oItem = oSource.getSelectedItem();
			this.Payer = oItem.getBindingContext("PayersModel").getObject();

			var oFilterRES = new sap.ui.model.Filter({
				path: "Partner",
				operator: FilterOperator.EQ,
				value1: this.Payer.Partner
			});
			var comFil = new sap.ui.model.Filter([oFilterRES]);
			oPostCmb.getBinding("items").filter(comFil, sap.ui.model.FilterType.Application);
		},

		onSelectPostalAddress: function(oEvent) {
			var oSource = oEvent.getSource();
			var oItem = oSource.getSelectedItem();
			this.Postal = oItem.getBindingContext("PostalModel").getObject();

		},

		onValidateVAT: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue();
			sap.ui.core.BusyIndicator.show();

			var values = {
				IM_REGNO: sValue,
				IM_ROLE: 'IM_VAT'
			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_Valid_regista", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
				}.bind(this)
			});
		}

	});

});