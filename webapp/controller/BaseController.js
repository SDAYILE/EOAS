sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox"
], function(Controller, History, MessageBox) {
	"use strict";

	return Controller.extend("capetown.gov.za.DebtManagement.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Convenience method for getting the Form Fields.
		 * @private
		 * @returns Controls (sap.m.Input, sap.m.CheckBox, sap.m.Select, "sap.m.DatePicker)
		 */
		getFormFields: function(oForm) {
			var aControls = [];
			var aFormContainerElementFields = [];
			var aFormContainers = oForm.getFormContainers();
			var bool;

			for (var i = 0; i < aFormContainers.length; i++) {
				var aFormElements = aFormContainers[i].getFormElements();
				bool = aFormContainers[i].getVisible();
				if (bool) {
					for (var j = 0; j < aFormElements.length; j++) {
						var oFormElement = aFormElements[j];
						var aFormFields = oFormElement.getFields();
						var oFormLabel = oFormElement.getLabel();
						for (var n = 0; n < aFormFields.length; n++) {
							aFormContainerElementFields.push({
								control: aFormFields[n],
								label: oFormLabel
							});
						}
					}
				}

			}

			for (i = 0; i < aFormContainerElementFields.length; i++) {
				var sControlType = aFormContainerElementFields[i].control.getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.CheckBox" || sControlType === "sap.m.Select" || sControlType ===
					"sap.m.DatePicker" || sControlType === "sap.m.TextArea") {
					if (aFormContainerElementFields[i].label) {
						aControls.push({
							control: aFormContainerElementFields[i].control,
							required: aFormContainerElementFields[i].label.getRequired()
						});
					} else {
						aControls.push({
							control: aFormContainerElementFields[i].control,
							required: ""
						});
					}
				}

			}

			return aControls;

		},

		validateEmail: function(oMessageStrip, oEmail) {
			var re =
				/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if (!re.test(oEmail)) {
				oMessageStrip.setText("Please Enter all Required Fields Correctly");
				oMessageStrip.setVisible(true);
				return false;
			} else {
				oMessageStrip.setVisible(false);
				return true;
			}
		},
		onNavBack: function(sRoute, mData) {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				//The history contains a previous entry
				window.history.go(-1);
			} else {
				var bReplace = true; // otherwise we go backwards with a forward history
				this.getRouter().navTo(sRoute, mData, bReplace);
			}
		},

		/**
		 * Event handler  for getting all input fields of a form.
		 * Checks if the input field is associated with a required label control
		 * if the input field as above mentioned it is considered a mandatory field
		 * @public
		 */
		_getFormInputFields: function(oForm) {
			var aControls = [];
			var aFormContainerElementFields = [];
			var aFormContainers = oForm.getFormContainers();
			var bool;

			for (var i = 0; i < aFormContainers.length; i++) {
				var aFormElements = aFormContainers[i].getFormElements();
				bool = aFormContainers[i].getVisible();
				if (bool) {
					for (var j = 0; j < aFormElements.length; j++) {
						var oFormElement = aFormElements[j];
						var aFormFields = oFormElement.getFields();
						var oFormLabel = oFormElement.getLabel();
						for (var n = 0; n < aFormFields.length; n++) {
							aFormContainerElementFields.push({
								control: aFormFields[n],
								label: oFormLabel
							});
						}
					}
				}
			}

			for (i = 0; i < aFormContainerElementFields.length; i++) {
				var sControlType = aFormContainerElementFields[i].control.getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.ui.unified.FileUploader") {
					aControls.push({
						control: aFormContainerElementFields[i].control,
						required: aFormContainerElementFields[i].label.getRequired()
					});
				}
			}
			return aControls;
		},

		/**
		 * Gets the form fields
		 * @param {sap.ui.layout.form} oSimpleForm the form in the view.
		 * @private
		 */
		_getFormFields: function(oSimpleForm) {
			var aControls = [];
			var aFormContent = oSimpleForm.getContent();
			var sControlType;
			for (var i = 0; i < aFormContent.length; i++) {
				sControlType = aFormContent[i].getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.DatePicker" || sControlType === "sap.m.ComboBox" ||
					sControlType === "sap.ui.unified.FileUploader" || sControlType === "sap.m.TextArea" || sControlType === "sap.m.RadioButtonGroup" ||
					sControlType === "sap.m.Select" || sControlType === "sap.m.MaskInput" || sControlType ===
					"sap.m.MultiComboBox") {
					aControls.push({
						control: aFormContent[i],
						required: aFormContent[i - 1].getRequired && aFormContent[i - 1].getRequired()
					});
				}
			}
			return aControls;
		},

		/**
		 * Convenience method for getting the Form Fields .
		 * @private
		 * @returns Controls (sap.ui.unified.FileUploader)&nbsp;
		 */
		_getFormOther: function(oForm) {
			var aControls = [];
			var aFormContainerElementFields = [];
			var aFormContainers = oForm.getFormContainers();
			var bool;

			for (var i = 0; i < aFormContainers.length; i++) {
				bool = aFormContainers[i].getVisible();
				var aFormElements = aFormContainers[i].getFormElements();
				if (bool) {
					for (var j = 0; j < aFormElements.length; j++) {
						var oFormElement = aFormElements[j];
						var aFormFields = oFormElement.getFields();
						var oFormLabel = oFormElement.getLabel();
						for (var n = 0; n < aFormFields.length; n++) {
							aFormContainerElementFields.push({
								control: aFormFields[n],
								label: oFormLabel
							});
						}
					}
				}
			}

			for (i = 0; i < aFormContainerElementFields.length; i++) {
				var sControlType = aFormContainerElementFields[i].control.getMetadata().getName();
				if (sControlType === "sap.ui.unified.FileUploader") {
					aControls.push({
						control: aFormContainerElementFields[i].control,
						required: aFormContainerElementFields[i].label.getRequired()
					});
				}
			}

			return aControls;
		},

		/**
		 * Event handler  for getting all select controls of a form.
		 * Checks if the select control is associated with a required label control
		 * if the input field as above mentioned it is considered a mandatory field
		 * @public
		 */
		_getFormSelectFields: function(oForm) {
			var aControls = [];
			var aFormContainerElementFields = [];
			var aFormContainers = oForm.getFormContainers();
			var bool;

			for (var i = 0; i < aFormContainers.length; i++) {
				var aFormElements = aFormContainers[i].getFormElements();
				bool = aFormContainers[i].getVisible();
				if (bool) {
					for (var j = 0; j < aFormElements.length; j++) {
						var oFormElement = aFormElements[j];
						var aFormFields = oFormElement.getFields();
						var oFormLabel = oFormElement.getLabel();
						for (var n = 0; n < aFormFields.length; n++) {
							aFormContainerElementFields.push({
								control: aFormFields[n],
								label: oFormLabel
							});
						}
					}
				}
			}
			for (i = 0; i < aFormContainerElementFields.length; i++) {
				var sControlType = aFormContainerElementFields[i].control.getMetadata().getName();
				if (sControlType === "sap.m.Select") {
					aControls.push({
						control: aFormContainerElementFields[i].control,
						required: aFormContainerElementFields[i].label.getRequired()
					});
				}
			}
			return aControls;
		},

		_getFormMaskInputFields: function(oForm) {
			var aControls = [];
			var aFormContainerElementFields = [];
			var aFormContainers = oForm.getFormContainers();
			var bool;

			for (var i = 0; i < aFormContainers.length; i++) {
				var aFormElements = aFormContainers[i].getFormElements();
				bool = aFormContainers[i].getVisible();
				if (bool) {
					for (var j = 0; j < aFormElements.length; j++) {
						var oFormElement = aFormElements[j];
						var aFormFields = oFormElement.getFields();
						var oFormLabel = oFormElement.getLabel();
						for (var n = 0; n < aFormFields.length; n++) {
							aFormContainerElementFields.push({
								control: aFormFields[n],
								label: oFormLabel
							});
						}
					}
				}
			}
			for (i = 0; i < aFormContainerElementFields.length; i++) {
				var sControlType = aFormContainerElementFields[i].control.getMetadata().getName();
				if (sControlType === "sap.m.MaskInput") {
					aControls.push({
						control: aFormContainerElementFields[i].control,
						required: aFormContainerElementFields[i].label.getRequired()
					});
				}
			}
			return aControls;
		},

		//check response for errors
		serverResponseHasError: function(oResponse) {
			//exception handling
			try {
				//create error instance
				var oError = {
					message: JSON.parse(oResponse.data.__batchResponses[0].response.body).error.message.value
				};
				//feedback to caller
				return oError;
				//no error was returned in batch response
			} catch (oException) {
				//explicitly none
				return null;

			}
		},

		_successMessageBox: function(AppID) {
			var vText = "Proxy Application No: " + AppID + " Successfully Created";
			MessageBox.success(vText, {
				icon: sap.m.MessageBox.Icon.SUCCESS,
				title: "Success",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: function(oAction) {
					if (oAction === "OK") {
						this.getRouter().navTo("Authorizations");
					}
				}.bind(this)
			});

		},
		showErrorMessage: function(oError) {
			jQuery.sap.require("sap.m.MessageBox");
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			sap.m.MessageBox.show(oError.message, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: "Error",
				actions: [sap.m.MessageBox.Action.CLOSE],
				details: oError.responseText,
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				contentWidth: "100px"

			});

		}
	});

});