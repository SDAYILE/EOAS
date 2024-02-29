sap.ui.define([
	"./BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/ui/core/routing/History",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, History, MessageBox) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.ViewApplication", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaSSEG.view.ViewApplication
		 */
		onInit: function() {
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_EOAS_SSEG");
			this.oRouteHandler = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouteHandler.getRoute("ViewApplication").attachPatternMatched(this.onPatternMatched, this);
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

		},

		onPatternMatched: function(oEvent) {
			this.Notifi_num = oEvent.getParameter("arguments").AppID;
			this.BP = oEvent.getParameter("arguments").BP;
			this.sRole = oEvent.getParameter("arguments").Role;
			this.sStatus = oEvent.getParameter("arguments").Status;
			this.onInitialiseModels();
			this.onInitialiseValues();
			this.Documents = [];
			var oSystemTable = this.byId("tblSystem");
			var oItems = oSystemTable.getItems();
			for (var i = 0; i < oItems.length; i++) {
				//oSystemTable.setSelectedItem(oItems[i]);
				oItems[i].setHighlight("None");
			}

			this.Qmnum = this.onAddQNumZeros(this.Notifi_num, 12);
			sap.ui.core.BusyIndicator.show();
			this._loadApplicationData(this.Qmnum);

			this.getView().getModel("ViewModel").setProperty("/enableEnergy", false);
			this.getView().getModel("ViewModel").setProperty("/isSubmitted", true);

			this.byId("UploadSetCOC").setVisible(false);
			this.byId("UploadSetContract").setVisible(false);
			this.byId("ComReportForm").setVisible(false);
			this.byId("btnSubmitRep").setVisible(false);
			this.byId("btnSubmitDoc").setVisible(false);

			//TODO later!!!!!

			if (this.sStatus === "E0014" && this.sRole === "ECSAP") {
				this.byId("ComReportForm").setVisible(true);
				this.byId("btnSubmitRep").setVisible(true);
			}
			if (this.sStatus === "E0014" && this.sRole === "OWNER" || this.sStatus === "E0014" && this.sRole === "APPLC") {
				this.byId("UploadSetCOC").setVisible(true);
				this.byId("UploadSetContract").setVisible(true);
				this.byId("btnSubmitDoc").setVisible(true);

			}
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

			// var oApplicantModel = new sap.ui.model.json.JSONModel();
			// this.getView().setModel(oApplicantModel, "ApplicantModel");

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

		onInitialiseValues: function(oEvent) {
			this.byId("UploadSetCOC").removeAllItems();
			this.byId("UploadSetContract").removeAllItems();
			this.byId("Cp1").setSelected(false);
			this.byId("Cp2").setSelected(false);
			this.byId("Cp3").setSelected(false);
			this.byId("Cp4").setSelected(false);
			this.byId("Cp5").setSelected(false);
			this.byId("Cp6").setSelected(false);
			this.byId("Cp7").setSelected(false);
			this.byId("Com").setValue(null);

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
					this.ProxyBP = oData.Partner;
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
					//this._setContact(oData.Role);
					this._setDevices(oData.NP_ON_APPID_3);
					this._setDocuments(oData.NP_ON_APPID_4);
					// var sMeterNum = this.onAddQNumZeros(oData.MeterNo, 18);
					if (oData.EnergSourcType === "PV") {
						this.getView().getModel("ViewModel").setProperty("/isPV", true);
					} else {
						this.getView().getModel("ViewModel").setProperty("/isPV", false);
					}
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
			if (this.sRole === "OWNER") {
				this._setMeterDetails(this.BP, oProperties[0].Plno);
			} else {
				this._setMeterDetails(this.ProxyBP, oProperties[0].Plno);
			}

			// var objJSON = JSON.parse(existingPlotJsonExample);

			this.getView().getModel("Properties").refresh();
			// this.onPlotExisitingPoint(existingPlotJson, oProperties[0].Plno);
		},

		_setPartners: function(aPartners) {
			//Set Application Partners by Roles
			for (var j = 0; j < aPartners.results.length; j++) {

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

				if (aPartners.results[j].isConct) {
					this.byId("cmbAppType").setSelectedKey(aPartners.results[j].Role);
					if (aPartners.results[j].Role === "OWNER") {
						this.getView().getModel("ViewModel").setProperty("/onShowFields", false);
					} else {
						this.getView().getModel("ViewModel").setProperty("/onShowFields", true);
					}
				}

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

				//oProperties.push(aProperties.results[i]);

			}
			this.getView().getModel("BatteryModel").refresh();
			// this.CalculateTotBat();
			this.getView().getModel("PVModel").refresh();
			// this.CalculateTotPV();
			this.getView().getModel("InverterModel").refresh();
			// this.calculateTotInverters();
		},

		_setDocuments: function(aDocuments) {
			if (aDocuments.results.length > 0) {
				this.byId("docForm").setVisible(true);
			} else {
				this.byId("docForm").setVisible(false);
			}
			var oDocuments = this.getView().getModel("Documents").getData().data;
			for (var i = 0; i < aDocuments.results.length; i++) {
				oDocuments.push(aDocuments.results[i]);
			}
			this.getView().getModel("Documents").refresh();
		},

		_setMeterDetails: function(BP, sPLNO) {
			var sMeterNum = this.getView().getModel("Header").getProperty("/MeterNo");
			var values = {
				// PARTNER: this.BP,
				PARTNER: BP,
				PLNO: sPLNO
					//PLNO: this.SelectedProperty.Plno
			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_METER_NUMBERS", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					sap.ui.core.BusyIndicator.hide();
					for (var i = 0; i < oData.results.length; i++) {
						var MeterNo = this.onAddQNumZeros(oData.results[i].MeterNo, 18);
						if (MeterNo === sMeterNum) {
							this.getView().getModel("Header").setProperty("/MeterNo", oData.results[i].MeterNo);
							this.getView().getModel("Header").setProperty("/Equipment", oData.results[i].Equipment);
							this.getView().getModel("Header").setProperty("/Material", oData.results[i].Material);
							this.getView().getModel("Header").setProperty("/functionLoctn", oData.results[i].Tplnr);
							this.getView().getModel("ViewModel").setProperty("/ExistSuppCategory", oData.results[i].ExistSuppCategory);
							this.getView().getModel("ViewModel").setProperty("/DeviceCategoryText", oData.results[i].DeviceCategoryText);
							this.getView().getModel("ViewModel").setProperty("/Amperage", oData.results[i].Vertrag);
							this.getView().getModel("ViewModel").setProperty("/PropType", oData.results[i].ExistSuppCategory);
							var phase = oData.results[i].ExistSuppPhase.substring(0, 2);
							switch (phase) {
								case "3P":
									// code block
									this.getView().getModel("ViewModel").setProperty("/Phase", "THREE-PHAS");
									break;
								case "SP":
									// code block
									this.getView().getModel("ViewModel").setProperty("/Phase", "SINGLE-PHA");
									break;
								default:
									this.getView().getModel("ViewModel").setProperty("/Phase", "");
									// code block
							}

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
					// this.byId("_SchematicForm").setVisible(false);
					// // this.byId("_SchematicConsent").setVisible(true);
					// this.byId("schematicImg").setVisible(true);
					// //oBattery.setSelectedIndex(1);
					// this.byId("schematicImg").setSrc("./SchematicImages/Page2.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", true);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);

					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "002":
					// code block
					//	When System Type = 2 display PDF page 3
					// this.byId("_SchematicForm").setVisible(false);
					// this.byId("schematicImg").setVisible(true);
					// this.byId("schematicImg").setSrc("./SchematicImages/Page3.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", true);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "003":
					// code block
					// 	When System Type = 3,  display PDF page 5 (note: this diagram will be updated)
					// this.byId("_SchematicForm").setVisible(false);
					// this.byId("schematicImg").setVisible(true);
					// this.byId("schematicImg").setSrc("./SchematicImages/Page5.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", true);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", true);
					this.getView().getModel("ViewModel").setProperty("/isPV", false);
					break;
				case "004":
					// code block
					// 	When System Type = 1 or 4, display PDF page 2
					// this.byId("_SchematicForm").setVisible(false);
					// this.byId("schematicImg").setVisible(true);
					// this.byId("schematicImg").setSrc("./SchematicImages/Page2.jpg");
					this.getView().getModel("ViewModel").setProperty("/isECSA", false);
					this.getView().getModel("ViewModel").setProperty("/isExporting", false);
					this.getView().getModel("ViewModel").setProperty("/isBatteryReq", false);
					this.getView().getModel("ViewModel").setProperty("/isPV", true);
					break;
				case "005":
					// this.byId("_SchematicForm").setVisible(true);
					// this.byId("schematicImg").setVisible(false);
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

		onAddQNumZeros: function(num, size) {
			num = num.toString();
			while (num.length < size) num = "0" + num;
			return num;
		},

		onDownloadSelectedDoc: function() {
			var oUploadSet = this.byId("DisplaySet");
			oUploadSet.getItems().forEach(function(oItem) {
				if (oItem.getSelected()) {
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
				}
			});

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

		_onSubmitComReport: function(oEvent) {

			//if(cocDoc.get)

			var oProp = {};
			oProp.Qmnum = this.Qmnum;

			if (!this.byId("Cp1").getSelected()) {
				this.byId("Cp1").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}

			if (!this.byId("Cp2").getSelected()) {
				this.byId("Cp2").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}

			if (!this.byId("Cp3").getSelected()) {
				this.byId("Cp3").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}

			if (!this.byId("Cp4").getSelected()) {
				this.byId("Cp4").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}

			if (!this.byId("Cp5").getSelected()) {
				this.byId("Cp5").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}

			if (!this.byId("Cp6").getSelected()) {
				this.byId("Cp6").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}

			if (!this.byId("Cp7").getSelected()) {
				this.byId("Cp7").setValueState("Error");
				MessageBox.error("Kindly ensure all checkboxes are selected before submitting");
				return;
			}
			oProp.Cp1Answer = true;
			oProp.Cp2Answer = true;
			oProp.Cp3Answer = true;
			oProp.Cp4Answer = true;
			oProp.Cp5Answer = true;
			oProp.Cp6Answer = true;
			oProp.Cp7Answer = true;
			oProp.Comments = this.byId("Com").getValue();
			this._oODataModel.createEntry("/SSEG_App_Comm_RptSet", {
				properties: oProp
			});
			sap.ui.core.BusyIndicator.show();
			this._oODataModel.setUseBatch(true);
			this._oODataModel.submitChanges({
				//on succesful case update response from backend
				success: function(oData, oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this._oODataModel.resetChanges();
					this._oODataModel.setUseBatch(false);
					MessageBox.success("Your application with reference number: " + this.Notifi_num + " has been assigned for further processing", {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						title: "Success",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (oAction === "OK") {
								this.getRouter().navTo("ApplicationHistory");
							}
						}.bind(this)
					});
					// this._onSubmitDocuments();
					//this.onReportSuccessMessage(this.Qmnum);
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

		_onSubmitDocuments: function(oEvent) {
			var cocDoc = this.byId("UploadSetCOC");
			var contractDoc = this.byId("UploadSetContract");

			if (cocDoc.getIncompleteItems().length === 0) {
				MessageBox.error("Please upload the Certificate of Commission by clicking the upload button or dragging and dropping the document");
				return;
			}

			if (contractDoc.getIncompleteItems().length === 0) {
				MessageBox.error(
					"Please upload the Supplementary Contract by downloading the template provided and clicking the upload button or dragging and dropping the document"
				);
				return;
			}

			var oProperties = {};
			oProperties.Qmnum = this.Qmnum;
			//	oProperties.Status = "E0005";
			if (this.Documents.length > 0) {
				oProperties.NP_ON_APPID_4 = this.Documents;
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

						MessageBox.success("Your application with reference number: " + this.Notifi_num + " has been assigned for further processing", {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Success",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function(oAction) {
								if (oAction === "OK") {
									this.getRouter().navTo("ApplicationHistory");
								}
							}.bind(this)
						});
					}.bind(this),
					error: function(oError) {
						sap.ui.core.BusyIndicator.hide();
						//this._oODataModel.resetChanges();
						this.showErrorMessage(oError);
					}.bind(this)
				});
			} else {
				MessageBox.error("No documents have been uploaded.");
			}
		},

		onDownloadTemplate: function() {
				var url = "model/SupplementalContract.docx";
				window.open(url, '_blank');
			}
			/**
			 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			 * (NOT before the first rendering! onInit() is used for that one!).
			 * @memberOf capetown.gov.zaSSEG.view.ViewApplication
			 */
			//	onBeforeRendering: function() {
			//
			//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf capetown.gov.zaSSEG.view.ViewApplication
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf capetown.gov.zaSSEG.view.ViewApplication
		 */
		//	onExit: function() {
		//
		//	}

	});

});