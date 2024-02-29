sap.ui.define([
	"./BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/core/Fragment',
	'sap/ui/Device',
	'sap/ui/model/Sorter',
	"../model/formatter",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, Filter, FilterOperator, Fragment, Device, Sorter, formatter, MessageBox) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.ApplicationHistory", {
		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaProxy.view.App
		 */
		onInit: function() {
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_EOAS_SSEG");
			this.oRouteHandler = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouteHandler.getRoute("ApplicationHistory").attachPatternMatched(this.onPatternMatched, this);
			this._mViewSettingsDialogs = {};
			var oModel = new JSONModel({
				HTML: "<p>This application form is for connecting embedded generation (EG) and solar PV geysers to residential, commercial, or industrial electrical systems. Only City of Cape Town-approved grid-tied inverters are allowed for EG connections.</p>" +
					"<p>Please ensure your application adheres to the most recent 'Requirements for SSEG' document before submitting your application.</p>" +
					"<p>By making application and signing this form, the applicant gives consent to the processing of his/her/its personal information as reflected thereon, as understood in terms of the Protection of Personal Information Act, 2013, and to the further processing thereof internally within the City of Cape Town and to its contractors and service providers and its research partners, subject to the conditions of the said Act. </p>" +
					"<p>The requirement to submit a Commencement of Work form for installation work that would require a new or upgraded electricity supply was waived in the City of Cape Town in accordance with Regulation 8(1) of the Electrical Installation Regulations of the Occupational Health and Safety Act (Act 85 of 1993).</p>" +
					"<p>Only the property owner may apply or request a change to the existing connection to the property.</p>" +
					"<p>A separate 'Application for a new or modified electricity supply service' form must also be completed for applications equal to or greater than 350kVA where a network study is required.</p>" +
					"<p>ECSA professional sign-off is mandatory at the commissioning stage in accordance with grid-tied embedded generation installation commissioning report. All grid-tied embedded generation installations on the City's distribution network must be certified for compliance with the City's requirements as follows:</p>" +
					"<ul><li>An ECSA registered professional engineer (Pr. Eng.), professional engineering technologist (Pr. Tech. Eng.), or certificated engineer (Pr. Cert. Eng.) may certify Commercial, Industrial and Residential SSEG installations.</li><li>An ECSA registered professional technician (Pr. Techni. Eng.) may only certify Residential SSEG installations.</li></ul>" +
					"<ol><li>Energy Directorate will require prior written approval from the following departments, where applicable. Applications will not be considered until all relevant approvals have been obtained.<ul><li>Planning and Building Development Management (Area offices) - Zoning/subdivision/building structure plans</li><li>City Health Specialised Services (021) 4003781 - Noise impact assessment and ventilation</li><li>City Health Specialised Services (021) 5905200 - Air pollution and quality (only applicable to fuel-burning technologies) </li></ul></li><li>Photovoltaic (PV) SSEG applications will require approval from Planning and Building Development Management only if:<ul><li>Rooftop installations: PV panel(s) in its installed position projects more than 1.5m, measured perpendicularly, above the roof and/or projects more than 600mm above the highest point of the roof;</li><li>Installations on the ground: PV panel(s) in its installed position projects more than 2.1 meters above the natural/finished ground level.</li></ul></li><li>PV SSEG applications typically do not require approvals for noise impact assessment and ventilation nor air pollution and quality.</li><li><ul><li> Micro Wind Turbine - means 'wind turbine infrastructure' which has the following Restrictions:<ol type='i'><li> Maximum blade diameter of 700m</li><li> Maximum height of blades above ground level of 2.5m if freestanding</li><li> Maximum height of blades above the roof of 1.5m when attached to the building and a minimum distance from the boundary wall of 2.5m.</li></ol></li><li>Small-Scale Wind Turbine - means 'Wind Turbine Infrastructure' where the rotor axis is horizontal, and the overall rotor diameter does not exceed 3m; or where the rotor axis is vertical, and the power output does exceed 3 kW, but excludes a Micro Wind Turbine.</li><li>Wind Building Plans Requirements Please note that building plan applications will be required for Small-Scale Wind Turbines. Building plan applications will not be required for Micro Wind Turbines.</li><ul></li></ol>"
			});
			this.getView().setModel(oModel);

			var oSssegModel = new JSONModel({
				HTML: "<p>This application form is for connecting embedded generation (EG) and solar PV geysers to residential, commercial, or industrial electrical systems.</p>" +
					"<p>Requests for Stand-by Fossil Fuel (Petrol and Diesel) authorisation should also be submitted using this online application form.</p>" +
					"<p>Before submitting your application, please note the following: </p>" +

					"<ol>" +
					"<li>Only a property owner or proxy (who has been granted permission by the property owner) to apply can submit an application. Due to the technical nature of these requests, we recommended that a <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Procedures%2c%20guidelines%20and%20regulations/Guideline_for_Electrical_Contractors__1st_edition_June_2014_.pdf\"  font-weight:600;\">registered electrical contractor</a> , ECSA Registered Person or an SSEG Installer submit the application on behalf of property owners. To grant permission to an electrical contractor to apply on your behalf, issue proxy permission here.</li>" +
					"<li>The installer, Electrical Contractor and ECSA Registered Professional indicated on the application must be registered e-Services users. Please ensure that you have their correct profile information, as this will be verified before being able to submit.</li>" +
					"<li>Only City of Cape Town-approved grid-tied inverters are allowed for energy-generation connections. Visit the City's List of Approved Inverter,  <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Forms,%20notices,%20tariffs%20and%20lists/Approved%20Photovoltaic%20(PV)%20Inverter%20List.pdf\"  font-weight:600;\">available online</a></li>" +
					"<li>Applicants are required to read the latest, published Requirements for Small Scale Embedded Generation, where the application and approval process for small-scale embedded generation in the City of Cape Town is explained,   <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Procedures%2c%20guidelines%20and%20regulations/Requirements%20for%20Small-Scale%20Embedded%20Generation.pdf\"  font-weight:600;\">available online</a></li>" +
					"</ol>" +

					"<p><strong>As part of your application, you must have the following information / documentation at hand:</strong></p>" +

					"<ol>" +
					"<li>Installer information (with registration number as per e-services profile)</li>" +
					"<li>Electrical Contractor (with registration number as per e-services profile)</li>" +
					"<li>ECSA Registered Professional (with registration number as per e-services profile)</li>" +
					"<li>Information about the existing supply at the property</li>" +
					"<li>Commercial applicants must supply a Schematics Design Drawing document as part of their application</li>" +
					"<li>If a new meter installation is required, a new meter request will be kicked off by the application (please note: there is a cost associated to the installation of new meters)</li>" +
					"</ol>" +

					"<p><strong>ECSA registered professional</strong></p>" +
					"<p>Person registered with ECSA in the professional category. The professional category includes: </p>" +
					"<ol>" +
					"<li>Professional Engineer (Pr. Eng.) </li>" +
					"<li>Professional Engineering Technologist (Pr. Tech. Eng.) </li>" +
					"<li>Professional Certified Engineer (Pr. Cert. Eng.) </li>" +
					"<li>Professional Engineering Technician (Pr. Techni. Eng).</li>" +
					"</ol>"
			});

			this.getView().setModel(oSssegModel, "SsegModel");

		},

		onPatternMatched: function(oEvent) {
			sap.ui.core.BusyIndicator.show();
			this.onInitialiseModels();
			this._loadDropDownValues();
			this.getView().addStyleClass('sapUiSizeCompact');

		},

		onNavBack: function() {
			this.getRouter().navTo("LandingPage");
		},

		onInitialiseModels: function(oEvent) {
			var oEnergyTypes = new sap.ui.model.json.JSONModel();
			oEnergyTypes.setData({
				data: []
			});
			sap.ui.getCore().setModel(oEnergyTypes, "EnergyTypes");

			var oSystemTypes = new sap.ui.model.json.JSONModel();
			oSystemTypes.setData({
				data: []
			});
			sap.ui.getCore().setModel(oSystemTypes, "SystemTypes");

			var oAppTypes = new sap.ui.model.json.JSONModel();
			oAppTypes.setData({
				data: []
			});
			sap.ui.getCore().setModel(oAppTypes, "AppTypes");

			var oSupplySize = new sap.ui.model.json.JSONModel();
			oSupplySize.setData({
				data: []
			});
			sap.ui.getCore().setModel(oSupplySize, "SupplySize");

			var oDeviceTypes = new sap.ui.model.json.JSONModel();
			oDeviceTypes.setData({
				data: []
			});
			sap.ui.getCore().setModel(oDeviceTypes, "DeviceTypes");

			var oPhaseTypes = new sap.ui.model.json.JSONModel();
			oPhaseTypes.setData({
				data: []
			});
			sap.ui.getCore().setModel(oPhaseTypes, "PhaseTypes");

			var oTitles = new sap.ui.model.json.JSONModel();
			oTitles.setData({
				data: []
			});
			sap.ui.getCore().setModel(oTitles, "Titles");

		},

		_loadData: function(BP) {

			sap.ui.core.BusyIndicator.show();
			var filter = new sap.ui.model.Filter("Partner", sap.ui.model.FilterOperator.EQ, BP);
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			this._oODataModel.read("/SSEG_App_HeadersSet", {
				filters: [filter],
				success: function(oData) {
					oHeaderModel.setData(oData.results);
					this.getView().setModel(oHeaderModel, "HeaderModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_loadDropDownValues: function() {
			var oEnergyTypes = sap.ui.getCore().getModel("EnergyTypes").getData().data;
			var oSystemTypes = sap.ui.getCore().getModel("SystemTypes").getData().data;
			var oDeviceTypes = sap.ui.getCore().getModel("DeviceTypes").getData().data;
			var oAppTypes = sap.ui.getCore().getModel("AppTypes").getData().data;
			var oSupplySize = sap.ui.getCore().getModel("SupplySize").getData().data;
			var oPhaseTypes = sap.ui.getCore().getModel("PhaseTypes").getData().data;
			var oTitles = sap.ui.getCore().getModel("Titles").getData().data;
			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/GET_DEFAULT_OPTIONS", {
				method: "GET",
				success: function(oData, response) {
					for (var i = 0; i < oData.results.length; i++) {
						switch (oData.results[i].Domains) {
							case "ZSSEG_ENERG_SOURC_TYPE":
								// code block
								oEnergyTypes.push(oData.results[i]);
								break;
							case "ZSSEG_SYSTEM_TYPE":
								// code block
								oSystemTypes.push(oData.results[i]);
								break;
							case "ZSSEG_APP_TYPE":
								// code block
								oAppTypes.push(oData.results[i]);
								break;
							case "ZSSEG_DEVICE_TYPE":
								// code block
								oDeviceTypes.push(oData.results[i]);
								break;
							case "ZSSEG_BP_TYPE":
								// code block
								this.BP = oData.results[i].Value;
								break;
							case "ZSSEG_EXIST_SIZE_FULL":
								// code block
								oSupplySize.push(oData.results[i]);
								break;
							case "ZSSEG_ELECTR_PHASE_D":
								// code block
								oPhaseTypes.push(oData.results[i]);
								break;
							case "AD_TITLE":
								oTitles.push(oData.results[i]);
								break;

							default:
								// code block
						}
					}
					this._loadData(this.BP);
				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		onNewAppPress: function(oEvent) {
			// var oRouter = this.getOwnerComponent().getRouter();
			if (this.BP === "") {
				this.onCancelTerms();
				MessageBox.error("Invalid user, please register on the e-Services portal in order to create a new application");
			} else {
				this.oRouteHandler.navTo("SSEGApplication", {
					AppID: "NEW",
					// BP: "1000007875",
					BP: this.BP,
					Role: "NEW",
					Status: "NEW"
				});
			}

		},

		onExisitingAppPress: function(oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("HeaderModel").getPath();
			var oApplication = this.getView().getModel("HeaderModel").getProperty(sPath);
			if (oApplication.Role === "") {
				oApplication.Role = "OWNER";
			}
			this.oRouteHandler.navTo("ViewApplication", {
				AppID: oApplication.Qmnum,
				BP: this.BP,
				Role: oApplication.Role,
				Status: oApplication.Status
			});
		},

		onSearch: function(oEvent) {
			var query = oEvent.getSource().getValue();

			var oTable = this.byId("tblHistory");

			var filters = [];
			if (query && query.length > 0) {
				var oFilter1 = [new sap.ui.model.Filter("Qmtxt", sap.ui.model.FilterOperator.Contains, query), new sap.ui.model.Filter("NameFirst",
					sap.ui.model.FilterOperator.Contains, query), new sap.ui.model.Filter("NameLast",
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
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.SSEG.AppSortDialog")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},

		handleSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("tblHistory"),
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

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.SSEG.AdditionalInfo", this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		onOpenTerms: function(oEvent) {
			if (!this._TermsDialog) {
				this._TermsDialog = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.SSEG.TermsAndConditions", this);
			}
			// toggle compact style
			this._TermsDialog.addStyleClass('sapUiSizeCompact');
			this.getView().addDependent(this._TermsDialog);
			this._TermsDialog.open();
		},

		onCancelTerms: function(oEvent) {
			this._TermsDialog.close();
		},

		onWithdrawApplication: function(oEvent) {
				var oHistoryTable = this.byId("tblHistory");
				var sItem = oHistoryTable.getSelectedItem();
				if (sItem === null) {
					MessageBox.error("To withdraw an application, select it above and click the withdraw button");
				}
				var oObject = sItem.getBindingContext("HeaderModel").getObject();
				sap.ui.core.BusyIndicator.show();
				var values = {
					Notification: oObject.Qmnum,
					Status: 'E0007'
				};

				this._oODataModel.setUseBatch(false);
				this._oODataModel.callFunction("/Set_App_Status", {
					method: "POST",
					urlParameters: values,
					success: function(oData, response) {
						//this._loadData();
						sap.ui.core.BusyIndicator.hide();
						window.location.reload();

					}.bind(this),
					error: function(oResponse) {
						sap.ui.core.BusyIndicator.hide();
						this.showErrorMessage(oResponse);
					}.bind(this)
				});
			}
		
	});
});