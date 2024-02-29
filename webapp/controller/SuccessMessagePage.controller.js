sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.SuccessMessagePage", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.SuccessMessagePage
		 */
		onInit: function() {
			// apply compact density if touch is not supported, the standard cozy design otherwise
			//this.getView().addStyleClass(sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact");

			this.getRouter().getRoute("SuccessMessagePage").attachPatternMatched(this._onObjectMatched, this);
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf capetown.gov.zaEnergyApplication.view.SuccessMessagePage
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf capetown.gov.zaEnergyApplication.view.SuccessMessagePage
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf capetown.gov.zaEnergyApplication.view.SuccessMessagePage
		 */
		//	onExit: function() {
		//
		//	}

	});

});