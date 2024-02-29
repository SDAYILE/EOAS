sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	'sap/ui/core/Fragment',
	"sap/ui/model/Sorter",
	"sap/ui/Device"
], function(BaseController, JSONModel, MessageBox, Fragment, Sorter, Device) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.CredentialsDashboard", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.CredentialsDashboard
		 */
		onInit: function() {
			//Models
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_CREDENTIALS_VERIFICATION");

			var oCredentialModel = new JSONModel({
				HTML: "<p>All private service providers offering energy-related services supporting residential or commercial SSEG installations or new/modified electricity supply must register and submit relevant documents for verification so they can be listed on e-Services. </p>" +
					"<p>Only once the submitted documents have been <strong>successfully verified</strong> by City officials will SSEG applicants and New/Modified Service Connection applicants be able to add the service providers to applications submitted via e-services. </p>" +
					"<p>For registration-related documents that have a validity period, the registration will be revoked from the system on expiry and a new “Energy Service Providers Registration” request must be submitted with new validity dates.</p>" +
					"<p><strong>Registration for SSEG installers and Electrical Contractors can be done by a third party but for ECSA registered persons, registration must be done by the party themselves.</strong></p>" +
					"<p><strong>How to apply</strong></p>" +
					
					"<p><strong>SSEG installers:</strong> SSEG Installers that offer SSEG installation services to the public must register prior to being listed on SSEG or new/modified supply applications. This registration can be done by the SSEG installer or a third party. </p>" +
					"<p><strong>Electrical Contractors:</strong> that issue a Certificates of Compliance on any electrical work they have done on a premise must register and submit a valid Department of Employment and Labour Registration document for verification.  This service provider registration can be done by the electrical contractor or a third party.</p>" +
					
					"<p>You will need the <strong>following documents</strong> to register:</p>" +
					
					"<ol>" +
					"<li> A copy of the electrical contractor’s identity document (ID) </li>" +
					"<li> A copy of Employment and Labour Registration Document</li>" +
                    "</ol>" +
                    
                    "<p><strong>ECSA registered person </strong> is registered with the Engineering Council of South Africa (ECSA) in the professional category and conducts commissioning and issues sign-offs on embedded generation installations on residential or commercial premises before installations can be authorised by the City. These persons must register and submit their ECSA registration number for verification. This service provider registration can only be done by the ECSA registered person themselves.</p>" +
                    
                    "<p>The professional category includes:</p>" +
					
					"<ol>" +
					"<li> Professional Engineer (Pr. Eng.) </li>" +
					"<li> Professional Engineering Technologist (Pr. Tech. Eng.) </li>" +
					"<li> Professional Certificated Engineer (Pr. Cert. Eng.)  </li>" +
					"<li> Professional Engineering Technician (Pr. Techni. Eng). </li>" +
                    "</ol>" 
			});

			this.getView().setModel(oCredentialModel, "CredentialModel");

			this.viewModel = new JSONModel({
				installerVisible: false,
				electricalVisible: false,
				ecsaVisible: false,
				MessageTitle: "",
				Message: ""
			});

			this.getView().setModel(this.viewModel, "ViewModel");

			//this.getApplicantsData();

			//Navigation
			this.getRouter().getRoute("CredentialsDashboard").attachPatternMatched(this._onObjectMatched, this);

			this._mViewSettingsDialogs = {};

		},

		_onObjectMatched: function(oEvent) {

			this.ServiceType = oEvent.getParameter("arguments").ServiceType;
			this.BP = oEvent.getParameter("arguments").Bp;

			switch (this.ServiceType) {
				case "INSTALLER":
					this.getView().getModel("ViewModel").setProperty("/installerVisible", true);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", false);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", false);
					this.getDashboard("I");
					break;
				case "ELECTRICAL":
					this.getView().getModel("ViewModel").setProperty("/installerVisible", false);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", true);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", false);
					this.getDashboard("EC");
					break;
				case "ECSA":
					this.getView().getModel("ViewModel").setProperty("/installerVisible", false);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", false);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", true);
					this.getDashboard("ER");
					break;
			}
		},

		onNewAppPress: function() {
			switch (this.ServiceType) {
				case "INSTALLER":
					this.getRouter().navTo("CredentialVerificationPage2", {
						ServiceType: "INSTALLER"
					});
					break;
				case "ELECTRICAL":
					this.getRouter().navTo("CredentialVerificationPage2", {
						ServiceType: "ELECTRICAL"
					});
					break;
				case "ECSA":
					this.getRouter().navTo("CredentialVerificationPage2", {
						ServiceType: "ECSA"
					});
					break;
			}
		},

		onDisplayApplication: function(oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("DashboardModel").getPath();
			var oApplication = this.getView().getModel("DashboardModel").getProperty(sPath);

			this.getRouter().navTo("DisplayCredential", {
				AppReqId: oApplication.AppReqid,
				ServiceType: this.ServiceType
			});
		},

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.AdditionalInfo",
					this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		getDashboard: function(vType) {
			var FilterBp = new sap.ui.model.Filter("Partner", "EQ", this.BP),
				FilterType = new sap.ui.model.Filter("Type", "EQ", vType);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/CredentialsDashboardSet", {
				filters: [FilterBp, FilterType],
				success: function(oData) {
					var oInstallerModel = new JSONModel({
						results: oData.results
					});

					oInstallerModel.refresh();

					this.getView().setModel(oInstallerModel, "DashboardModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving dashboard details");
				}.bind(this)
			});
		},

		getElectricalDashboard: function() {
			var FilterBp = new sap.ui.model.Filter("Bp", "EQ", this.BP);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ElectricalDashboardSet", {
				filters: [FilterBp],
				success: function(oData) {
					var oElectricalModel = new JSONModel({
						results: oData.results
					});

					oElectricalModel.refresh();

					this.getView().setModel(oElectricalModel, "ElectricalModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving electrical details");
				}.bind(this)
			});
		},

		getECSADashboard: function() {
			var FilterBp = new sap.ui.model.Filter("Bp", "EQ", this.BP);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ECSADashboardSet", {
				filters: [FilterBp],
				success: function(oData) {
					var oECSAModel = new JSONModel({
						results: oData.results
					});

					oECSAModel.refresh();

					this.getView().setModel(oECSAModel, "ECSAModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving electrical details");
				}.bind(this)
			});
		},

		getApplicantsData: function() {
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ApplicantDetailsSet", {
				success: function(oData) {
					var oApplicantModel = new JSONModel({
						results: oData.results[0]
					});

					this.BP = oData.results[0].Partner;

					oApplicantModel.refresh();

					this.getView().setModel(oApplicantModel, "ApplicantDetailsModel");

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving applicant details. Please make sure the user is assigned the correct BP");
				}.bind(this)
			});
		},

		handlePopoverPress: function(oEvent) {

			var oButton = oEvent.getSource(),
				oView = this.getView(),
				oObject = oButton.getBindingContext("DashboardModel").getObject();
			//var sStatusType = oEvent.getSource().getFieldGroupIds()[0];
			switch (oObject.Status) {
				case "I":
					this.getView().getModel("ViewModel").setProperty("/MessageTitle", "Request in Progress:");
					this.getView().getModel("ViewModel").setProperty("/Message",
						"Your request is currently being processed. You will be notified of the outcome via email.");
					break;
				case "A":
					this.getView().getModel("ViewModel").setProperty("/MessageTitle", "Request Approved:");
					this.getView().getModel("ViewModel").setProperty("/Message", "Your request has been reviewed and approved.");
					break;
				case "R":
					this.getView().getModel("ViewModel").setProperty("/MessageTitle", "Request Rejected:");
					this.getView().getModel("ViewModel").setProperty("/Message", oObject.RejectReason);
					break;
				default:
			}
			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.StatusDescription",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					//oPopover.bindElement("/ProductCollection/0");
					return oPopover;
				});
			}
			this._pPopover.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
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

		handleInstallerSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("InstallerCompanyTable"),
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

		handleElectricalSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("ElectrContrTable"),
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

		handleECSASortDialogConfirm: function(oEvent) {
			var oTable = this.byId("ECSATable"),
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

		handleInstallerSortButtonPressed: function() {
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.SortInstaller")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});

		},

		handleElectricalSortButtonPressed: function() {
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.SortElectrical")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});

		},

		handleECSASortButtonPressed: function() {
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.SortInstaller")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});

		}

	});

});