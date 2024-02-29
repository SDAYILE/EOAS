sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/library",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, library, MessageBox) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.DisplayCredential", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.DisplayCredential
		 */
		onInit: function() {

			//Models
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_CREDENTIALS_VERIFICATION");

			//Navigation
			this.getRouter().getRoute("DisplayCredential").attachPatternMatched(this._onObjectMatched, this);

			//Page properties
			this._wizard = this.byId("DisplayCVWizard");
			this._oNavContainer = this.byId("DisplayCVNavContainer");
			this._oWizardContentPage = this.byId("pgDisplayCV");

			this.viewModel = new JSONModel({
				fileSize: 5,
				installerVisible: false,
				electricalVisible: false,
				ecsaVisible: false
			});

			this.getView().setModel(this.viewModel, "ViewModel");
			
		},

		_onObjectMatched: function(oEvent) {

			this.AppReqId = oEvent.getParameter("arguments").AppReqId;
			this.ServiceType = oEvent.getParameter("arguments").ServiceType;

			this.handleNavigationToStep(0);
			this._wizard.discardProgress(this._wizard.getSteps()[0]);

			switch (this.ServiceType) {
				case "INSTALLER":
					this.byId("DisplayCVInstaller").setVisible(true);
					this.byId("DisplayCVElectricContractor").setVisible(false);
					this.byId("DisplayCVECSA").setVisible(false);
					this.byId("pgDisplayCV").setTitle("SSEG Installer");
					this.getView().getModel("ViewModel").setProperty("/installerVisible", true);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", false);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", false);
					this.getInstallerData();
					break;
				case "ELECTRICAL":
					this.byId("DisplayCVInstaller").setVisible(false);
					this.byId("DisplayCVElectricContractor").setVisible(true);
					this.byId("DisplayCVECSA").setVisible(false);
					this.byId("pgDisplayCV").setTitle("Electrical Contractor");
					this.getView().getModel("ViewModel").setProperty("/installerVisible", false);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", true);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", false);
					this.getElectricalData();
					break;
				case "ECSA":
					this.byId("DisplayCVInstaller").setVisible(false);
					this.byId("DisplayCVElectricContractor").setVisible(false);
					this.byId("DisplayCVECSA").setVisible(true);
					this.byId("pgDisplayCV").setTitle("ECSA Registration");
					this.getView().getModel("ViewModel").setProperty("/installerVisible", false);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", false);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", true);
					this.getECSAData();
					break;
			}

		},

		handleNavigationToStep: function(iStepNumber) {
			var fnAfterNavigate = function() {
				this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
				this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

			this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},

		backToWizardContent: function() {
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
		},

		getInstallerData: function() {

			var FilterAppId = new sap.ui.model.Filter("AppReqID", "EQ", this.AppReqId);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/InstallerSet", {
				filters: [FilterAppId],
				success: function(oData) {
					var oApplicantModel = new JSONModel({
						results: oData.results[0]
					});

					oApplicantModel.refresh();

					this.byId("DisplayCVInstaller").setModel(oApplicantModel);
					this.byId("DisplayCVInstaller").bindElement({
						path: "/results"
					});

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving applicantion details. Please make sure the user is assigned the correct BP");
				}.bind(this)
			});
		},

		getElectricalData: function() {
			var FilterAppId = new sap.ui.model.Filter("AppReqID", "EQ", this.AppReqId);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ElectricalSet", {
				filters: [FilterAppId],
				success: function(oData) {
					var oApplicantModel = new JSONModel({
						results: oData.results[0]
					});

					oApplicantModel.refresh();

					this.byId("DisplayCVElectricContractor").setModel(oApplicantModel);
					this.byId("DisplayCVElectricContractor").bindElement({
						path: "/results"
					});

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving applicantion details. Please make sure the user is assigned the correct BP");
				}.bind(this)
			});
		},

		getECSAData: function() {
			var FilterAppId = new sap.ui.model.Filter("AppReqID", "EQ", this.AppReqId);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ECSASet", {
				filters: [FilterAppId],
				success: function(oData) {
					if (oData.results.length > 0) {
						var oApplicantModel = new JSONModel({
							results: oData.results[0]
						});

						oApplicantModel.refresh();

						this.byId("DisplayCVECSA").setModel(oApplicantModel);
						this.byId("DisplayCVECSA").bindElement({
							path: "/results"
						});
						
						if (oData.results[0].Notified === "X") {
						   this.byId("DisplayNotified").setSelectedIndex(0); 
						}else{
						  this.byId("DisplayNotified").setSelectedIndex(1);  
						}
					}

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving applicantion details. Please make sure the user is assigned the correct BP");
				}.bind(this)
			});
		}

	});

});