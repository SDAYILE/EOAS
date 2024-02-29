sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"capetown/gov/zaEnergyApplication/model/models",
	"sap/ui/model/json/JSONModel"
], function(UIComponent, Device, models, JSONModel) {
	"use strict";

	return UIComponent.extend("capetown.gov.zaEnergyApplication.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			// create the views based on the url/hash
			this.getRouter().initialize();
			
			this.NotificationModel = new JSONModel({
				results: []
			});
			
			this.PropertyOwnerModel = new JSONModel({
				results: []
			});
			
			this.ResponsiblePayerModel = new JSONModel({
				results: []
			});
			
			this.SelectedProperyModel = new JSONModel({
				results: []
			});
			
			this.AttachmentsModel = new JSONModel({
				results: []
			});
			
			this.NotificationModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.PropertyOwnerModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.ResponsiblePayerModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.SelectedProperyModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.AttachmentsModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.setModel(this.NotificationModel, "Notification");
			this.setModel(this.PropertyOwnerModel, "PropertyOwner");
			this.setModel(this.ResponsiblePayerModel, "ResponsiblePayer");
			this.setModel(this.SelectedProperyModel, "SelectedProperty");
			this.setModel(this.AttachmentsModel, "Attachments");
			
		}
	});
});