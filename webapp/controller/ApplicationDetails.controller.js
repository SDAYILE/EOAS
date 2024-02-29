sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function(BaseController, MessageBox, JSONModel) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.ApplicationDetails", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.ApplicationDetails
		 */
		onInit: function() {

			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_EOAS");
			this.getRouter().getRoute("ApplicationDetails").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function(oEvent) {
			var NotifNo = String(oEvent.getParameter("arguments").Notification);

			this.getApplicationDetails(NotifNo);

			this.byId("PrevSupplyUnit").setVisible(false);
			this.byId("PrevPrepaymentMeter").setVisible(false);
			this.byId("PrevUpgradeSupply").setVisible(false);
			this.byId("PrevBuildingPlan").setVisible(false);
			this.byId("PrevVoltage").setVisible(false);
			this.byId("PrevSupplyPhase").setVisible(false);
			this.byId("PrevSupplyPhaseSize").setVisible(false);
			this.byId("PrevCable").setVisible(false);
			this.byId("PrevLVSupplySize").setVisible(false);
			this.byId("PrevLVSupplySizeA").setVisible(false);
			this.byId("PrevLVSupplySizeKVA").setVisible(false);
			this.byId("PrevLVSupplySizeMVA").setVisible(false);
			this.byId("PrevRelocation1").setVisible(false);
			this.byId("PrevRelocation2").setVisible(false);
			this.byId("PrevRelocation3").setVisible(false);
			this.byId("PrevRelocation4").setVisible(false);
			this.byId("PrevRelocation5").setVisible(false);
			this.byId("PrevRelocation6").setVisible(false);
			this.byId("PrevTariff").setVisible(false);
			this.byId("PrevMeterType").setVisible(false);
			this.byId("PrevCategory").setVisible(true);
		},

		getApplicationDetails: function(vNotifNo) {
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/NotificationDetailsSet(Qmnum='" + vNotifNo + "')", {
				success: function(oData) {

					if (oData.Category === "Residential Customer") {
						this.formatResidentialServiceUI(oData.ServiceType);
					} else {
						this.formatCommercialServiceUI(oData.ServiceType);
					}

					var oNotificationDetailsModel = new JSONModel({
						results: oData
					});

					oNotificationDetailsModel.refresh();

					this.byId("PrevPropertyForm").setModel(oNotificationDetailsModel);
					this.byId("PrevPropertyForm").bindElement({
						path: "/results"
					});

					this.byId("PrevPropertyOwnerForm").setModel(oNotificationDetailsModel);
					this.byId("PrevPropertyOwnerForm").bindElement({
						path: "/results"
					});

					this.byId("PrevContactPersonForm").setModel(oNotificationDetailsModel);
					this.byId("PrevContactPersonForm").bindElement({
						path: "/results"
					});

					this.byId("PrevPersonPaymentForm").setModel(oNotificationDetailsModel);
					this.byId("PrevPersonPaymentForm").bindElement({
						path: "/results"
					});

					this.byId("PrevServiceSelectiontForm").setModel(oNotificationDetailsModel);
					this.byId("PrevServiceSelectiontForm").bindElement({
						path: "/results"
					});

					this.byId("PrevExistingSupplyForm").setModel(oNotificationDetailsModel);
					this.byId("PrevExistingSupplyForm").bindElement({
						path: "/results"
					});

					this.byId("PrevServiceRequiredForm").setModel(oNotificationDetailsModel);
					this.byId("PrevServiceRequiredForm").bindElement({
						path: "/results"
					});

					switch (oData.ServiceType) {
						//New Supply/Temporary Supply
						case "01":
							oData.ServiceType = "New Supply";
							break;
						case "07":
							oData.ServiceType = "Temporary Supply";
							break;
							//Upgrade & Conversion
						case "02":
							oData.ServiceType = "Upgrade/Downgrade Existing Supply";

							break;
						case "03":
							oData.ServiceType = "Conversion from Credit to Prepayment";
							break;

							//Overhead
						case "04":
							oData.ServiceType = "Overhead to Underground Conversion";
							break;
							//Addition
						case "06":
							oData.ServiceType = "Additional Meter";
							break;
							//Relocation
						case "05":
							oData.ServiceType = "Relocation of Services";
							break;
					}

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving notification details. Please try again later");
				}.bind(this)
			});
		},

		formatResidentialServiceUI: function(vServiceType) {
			switch (vServiceType) {
				//New Supply/Temporary Supply
				case "01":
					this.byId("PrevService").setText("New Supply");
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevCable").setVisible(true);
					break;
				case "07":
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevCable").setVisible(true);
					this.byId("PrevService").setText("Temporary Supply");
					break;

					//Upgrade & Conversion
				case "02":
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevService").setText("Upgrade/Downgrade Existing Supply");
					break;
				case "03":
					this.byId("PrevService").setText("Conversion from Credit to Prepayment");
					break;

					//Overhead
				case "04":
					this.byId("PrevService").setText("Overhead to Underground Conversion");
					break;

					//Addition
				case "06":
					this.byId("PrevBuildingPlan").setVisible(true);
					this.byId("PrevPrepaymentMeter").setVisible(true);
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevUpgradeSupply").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevService").setText("Additional Meter");

					break;

					//Relocation
				case "05":
					this.byId("PrevRelocation1").setVisible(false);
					this.byId("PrevRelocation2").setVisible(false);
					this.byId("PrevRelocation3").setVisible(false);
					this.byId("PrevRelocation4").setVisible(false);
					this.byId("PrevRelocation5").setVisible(false);
					this.byId("PrevRelocation6").setVisible(false);
					this.byId("PrevCategory").setVisible(false);
					this.byId("PrevService").setText("Relocation of Services");

					break;
			}
		},

		formatCommercialServiceUI: function(vServiceType) {
			switch (vServiceType) {
				//New Supply/Temporary Supply
				case "01":
					this.byId("PrevService").setText("New Supply");
					this.byId("PrevVoltage").setVisible(true);
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevMeterType").setVisible(true);
					this.byId("PrevTariff").setVisible(true);
					break;
				case "07":
					this.byId("PrevVoltage").setVisible(true);
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevMeterType").setVisible(true);
					this.byId("PrevTariff").setVisible(true);
					this.byId("PrevService").setText("Temporary Supply");
					break;

					//Upgrade & Conversion
				case "02":
					this.byId("PrevVoltage").setVisible(true);
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevMeterType").setVisible(true);
					this.byId("PrevTariff").setVisible(true);
					this.byId("PrevService").setText("Upgrade/Downgrade Existing Supply");
					break;
				case "03":
					this.byId("PrevService").setText("Conversion from Credit to Prepayment");
					break;

					//Overhead
				case "04":
					this.byId("PrevService").setText("Overhead to Underground Conversion");
					break;

					//Addition
				case "06":
					this.byId("PrevBuildingPlan").setVisible(true);
					this.byId("PrevPrepaymentMeter").setVisible(true);
					this.byId("PrevSupplyPhase").setVisible(true);
					this.byId("PrevUpgradeSupply").setVisible(true);
					this.byId("PrevSupplyPhaseSize").setVisible(true);
					this.byId("PrevService").setText("Additional Meter");

					break;

					//Relocation
				case "05":
					this.byId("PrevRelocation1").setVisible(false);
					this.byId("PrevRelocation2").setVisible(false);
					this.byId("PrevRelocation3").setVisible(false);
					this.byId("PrevRelocation4").setVisible(false);
					this.byId("PrevRelocation5").setVisible(false);
					this.byId("PrevRelocation6").setVisible(false);
					this.byId("PrevCategory").setVisible(false);
					this.byId("PrevService").setText("Relocation of Services");
					break;
			}
		}

	});

});