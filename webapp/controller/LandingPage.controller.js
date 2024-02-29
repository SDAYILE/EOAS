sap.ui.define([
	//	"sap/ui/core/mvc/Controller"
	"capetown/gov/zaEnergyApplication/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.LandingPage", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.LandingPage
		 */
		onInit: function() {
			// apply compact density if touch is not supported, the standard cozy design otherwise
			this.getView().addStyleClass(sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact");

			this.getRouter().getRoute("LandingPage").attachPatternMatched(this._onObjectMatched, this);
		},

		onServiceConnection: function() {
			this.getRouter().navTo("ListOfApplications");
		},

		onCredentialVerification: function() {
			this.getRouter().navTo("CredentialVerificationPage1");
		},

		onAboutUs: function() {
			this.getRouter().navTo("AboutUs");
		},

		onProxy: function() {
			this.getRouter().navTo("Authorizations");
		},

		onSSEG: function() {
			this.getRouter().navTo("ApplicationHistory");
		}

	});

});