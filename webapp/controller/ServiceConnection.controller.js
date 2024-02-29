sap.ui.define([
	//	"sap/ui/core/mvc/Controller"
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	"sap/ui/Device"
], function(BaseController, MessageBox, JSONModel, Sorter, Fragment, Device) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.ServiceConnection", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.ServiceConnection
		 */
		onInit: function() {

			//Models
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_EOAS");
			this.NotificationModel = this.getOwnerComponent().getModel("Notification");
			this.PropertyOwnerModel = this.getOwnerComponent().getModel("PropertyOwner");
			this.ResponsiblePayerModel = this.getOwnerComponent().getModel("ResponsiblePayer");
			this.SelectedProperyModel = this.getOwnerComponent().getModel("SelectedProperty");
			this.AttachmentsModel = this.getOwnerComponent().getModel("Attachments");

			var oServiceConnectionModel = new JSONModel({
				HTML: "<p>The New/Modified Electricity Supply Application will enable a property owner or proxy (who has been granted permission by the property owner) to apply for any of the following electricity services for City-supplied properties. Due to the technical nature of these requests, we recommended that a <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Procedures%2c%20guidelines%20and%20regulations/Guideline_for_Electrical_Contractors__1st_edition_June_2014_.pdf\"  font-weight:600;\">registered electrical contractor</a> submit the application on behalf of property owners To grant permission to an electrical contractor to apply on your behalf, issue proxy permission here.</p>" +
					"<p><em>Note: Residential connections are supplied at a maximum of 100A. For larger connections, select the Commercial Service Category</em></p>" +
					"<p><strong>Service request options available:</strong></p>" +
					"<p><strong>New supply</strong> To establish a new metered electricity connection to a new property or sub-division. Applications must include a Certificate of Compliance issued by a registered electrical contractor for any electrical work completed on the property.</p>" +
					"<p><strong>Upgrade or downgrade existing supply</strong> To increase or decrease electricity supply. Applications must include a Certificate of Compliance issued by a registered electrical contractor for any electrical work completed on the property.</p>" +
					"<p><strong>Conversion from credit to prepaid meter</strong> To replace a credit meter (billed retrospectively) with a split prepaid meter. <em>Note: Depending on the request, you may qualify for a free prepaid meter replacement.</em></p>" +
					"<p><strong>Overhead to underground conversion</strong> To convert an existing electrical connection, which currently receives power through an overhead line, to an underground electrical cable system. Applications must include a Certificate of Compliance issued by a registered electrical contractor for any electrical work completed on the property. </p>" +
					"<p><strong>Relocation of service</strong> To relocate any City-owned electrical infrastructure (such as public street lights, electrical kiosks, electrical cables, electrical overhead services and electrical substations, etc.) to a different physical location. <em>Note: Each request will be evaluated to determine viability, as it is not always possible to relocate services.</em>  </p>" +
					"<p><strong>Additional meter</strong> To install an additional electricity meter on a property. <em>Note: A maximum of three meters are allowed on a domestic (residential) property. The size of the main breaker to the property and the size of supply to each meter point after the main circuit breaker must be provided in the application.</em></p>" +
					"<p><strong>Temporary supply</strong> Temporary supply of electricity to premises for a period of less than 12 months. Applications must include a Certificate of Compliance issued by a registered electrical contractor for any electrical work completed on the property. <em>Note: Please be aware that you are not permitted to request a temporary power supply for a property that already has a metered electrical connection. Temporary supply may not exceed 12 months, and only a supply of up to 500kVA is allowed.</em> </p>"
			});

			this.getView().setModel(oServiceConnectionModel, "ServiceConnectionModel");

			//Navigation
			this.getRouter().getRoute("ServiceConnection").attachPatternMatched(this._onObjectMatched, this);

			//Page properties
			this._wizard = this.byId("SCWizard");
			this._oNavContainer = this.byId("SCWizardNavContainer");
			this._oWizardContentPage = this.byId("pgSC");

			//this.getView().setModel(this.NotificationModel, "NotificationModel");
			this.byId("SCContactPerson").setModel(this.NotificationModel);
			this.byId("SCContactPerson").bindElement({
				path: "/results"
			});

			this.byId("SCServiceSelectionForm").setModel(this.NotificationModel);
			this.byId("SCServiceSelectionForm").bindElement({
				path: "/results"
			});

			this.byId("SCSubdivisionForm").setModel(this.NotificationModel);
			this.byId("SCSubdivisionForm").bindElement({
				path: "/results"
			});

			this.getApplicantsData();

			this._mViewSettingsDialogs = {};
		},

		_onObjectMatched: function(oEvent) {

			this.ApplicSubmitted = undefined;
			this.ApplicSubmitted = oEvent.getParameter("arguments").ApplicSubmitted;

			if (this.ApplicSubmitted === "true") {
				this.handleNavigationToStep(0);
				this._wizard.discardProgress(this._wizard.getSteps()[0]);
				this.clearForms();
			}
		},

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.AdditionalInfo",
					this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
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
					this.getProperties();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving applicant details. Please try again later");
				}.bind(this)
			});
		},

		getProperties: function() {

			var FilterPartner = new sap.ui.model.Filter("Partner", "EQ", this.BP);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/PropertySet", {
				filters: [FilterPartner],
				success: function(oData) {

					for (var i = 0; i < oData.results.length; i++) {

						if (oData.results[i].StreetNo !== "") {
							oData.results[i].StreetNo = parseInt(oData.results[i].StreetNo);
						}
					}

					var oPropertyModel = new JSONModel({
						results: oData.results
					});

					oPropertyModel.refresh();

					this.getView().setModel(oPropertyModel, "PropertyModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving property details. Please try again later");
				}.bind(this)
			});
		},

		getMultiPropertyOwners: function() {
			var FilterParcel = new sap.ui.model.Filter("Plno", "EQ", this.NotificationModel.getData().results.Plno);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/OwnersSet", {
				filters: [FilterParcel],
				success: function(oData) {
					var MultiOwnersModel = new JSONModel({
						results: oData.results
					});

					MultiOwnersModel.refresh();

					this.getView().setModel(MultiOwnersModel, "MultiOwnersModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving payer address details. Please try again later");
				}.bind(this)
			});
		},

		getPayerAddresses: function() {
			var FilterPartner = new sap.ui.model.Filter("Partner", "EQ", this.BP);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/PayerAddressSet", {
				filters: [FilterPartner],
				success: function(oData) {
					var PayerAddressModel = new JSONModel({
						results: oData.results
					});

					PayerAddressModel.refresh();

					this.getView().setModel(PayerAddressModel, "PayerAddressModel");
				
					this.getMultiPropertyOwners();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving payer address details. Please try again later");
				}.bind(this)
			});
		},

		getPropertyOwnerDetails: function() {

			sap.ui.core.BusyIndicator.show(0);

			this._oODataModel.read("/PropertyOwnerDetailsSet(Partner='" + this.propertyBP + "')", {
				success: function(oData) {
					this.PropertyOwnerModel.getData().results = oData;

					this.byId("SCOwnerContacts").setModel(this.PropertyOwnerModel);
					this.byId("SCOwnerContacts").bindElement({
						path: "/results"
					});

					this.getResponsiblePayer();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving property owner details. Please try again later");
				}.bind(this)
			});
		},

		getResponsiblePayer: function() {

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ResponsiblePayerSet(Partner='" + this.BP + "')", {
				success: function(oData) {

					this.ResponsiblePayerModel.getData().results = oData;
					this.VatNo = oData.VatNo;

					this.byId("SCResponsibleToPay").setModel(this.ResponsiblePayerModel);
					this.byId("SCResponsibleToPay").bindElement({
						path: "/results"
					});

					this.getPayerAddresses();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving property owner details. Please try again later");
				}.bind(this)
			});
		},

		getServiceConnectionTypes: function() {

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ServiceConnectionTypeSet", {
				success: function(oData) {
					var oServiceConnectionsModel = new JSONModel({
						results: oData.results
					});

					oServiceConnectionsModel.refresh();

					this.getView().setModel(oServiceConnectionsModel, "ServiceConnectionsModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving service connection types. Please try again later");
				}.bind(this)
			});
		},

		getMeterDetails: function() {
			var FilterBp = new sap.ui.model.Filter("Bp", "EQ", this.propertyBP);
			var FilterParcel = new sap.ui.model.Filter("Parcel", "EQ", this.NotificationModel.getData().results.Plno);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/MeterDetailsSet", {
				filters: [FilterBp, FilterParcel],
				success: function(oData) {

					if (oData.results.length >= 1) {
						this.MeterType = oData.results[0].ExistDeviceCategory;
						this.CustomerType = oData.results[0].ExistSuppCategoryCode;
					}
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving existing meter details. Please try again later");
				}.bind(this)
			});
		},

		onSelectApplyAs: function(oEvent) {
			if (this.byId("applicationAs").getSelectedItem() !== null) {
				this.byId("applicationAs").setValueState("None");
			}
			this.ApplicantValidations();
		},

		onSelectResponsiblePerson: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "Another") {
				this.byId("respperson").setVisible(true);
			} else {
				this.byId("respperson").setVisible(false);
			}

			this.ApplicantValidations();
		},

		ApplicantValidations: function() {

		},

		PropertyValidations: function() {
			if (this.EskomPropertyFound === "X") {
				MessageBox.error(
					"The property you selected is under Eskom supply. Only properties under City of Cape Town you can make application for");
				this._wizard.previousStep();
				return false;
			}
		},

		ServiceSelectionValidations: function() {

		},

		onSelectProperty: function(oEvent) {
			this._wizard.validateStep(this.byId("PropertyStep"));

			var path = this.getView().byId("idProperties").getSelectedItem().getBindingContext("PropertyModel").getPath();

			var Properties = this.getView().getModel("PropertyModel").getProperty(path);

			this.propertyBP = Properties.Partner;

			this.SelectedProperyModel.getData().results = Properties;

			this.NotificationModel.getData().results.Plno = Properties.Parcel;

			this.byId("SelectedProp").setText(Properties.FullAdr);

			this.byId("ApplicantDet").setText(this.byId("ownerName").getValue() + " " + this.byId("OwnerSurname").getValue());

			this.byId("ErfProp").setText(Properties.Erf);

			this.NotificationModel.getData().results.Erf = Properties.Erf;
			this.NotificationModel.getData().results.PropertyAddress = Properties.StreetNo + " " + Properties.StreetAdr + " " + Properties.Suburb;
			this.NotificationModel.getData().results.City = Properties.City;
			this.NotificationModel.getData().results.PostalCode = Properties.PostalCode;

			this.validateEskomProperty();

		},

		onSelectContact: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.NotificationModel.getData().results.PayerPartner = oEvent.getSource().getSelectedItem().getKey();
			this.byId("ApplicantDet").setText(this.byId("ownerName").getValue() + " " + this.byId("OwnerSurname").getValue());

		},

		onSelectExistingSupply: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "Yes") {
				this.byId("meter").setEnabled(true);
			} else {
				this.byId("meter").setEnabled(false);
			}
		},

		onSelectServiceType: function(oEvent) {
			// Residential -- New Supply & Temporary hide or show controls
			if (this.byId("category").getSelectedItem().getKey() === "Residential" &&
				(oEvent.getSource().getSelectedItem().getKey() ===
					"NewSupply" || oEvent.getSource().getSelectedItem().getKey() === "Temporary")) {
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("reqSupplyPhase").setValue();

				if (this.byId("reqSupplyPhase").getSelectedItem() !== null) {
					this.byId("reqSupplyPhase").getSelectedItem().setKey();
				}

				this.byId("supplyMeter").setVisible(false);
				this.byId("existingSupply").setVisible(false);
				this.byId("supplyUnit").setVisible(false);
				this.byId("supplySize").setVisible(false);
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("upgradeSupply").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("voltage").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);

			} else if (this.byId("category").getSelectedItem().getKey() === "Commercial" &&
				(oEvent.getSource().getSelectedItem().getKey() === "NewSupply" ||
					oEvent.getSource().getSelectedItem().getKey() === "Temporary")) {
				this.byId("voltage").setVisible(true);
				this.byId("voltage").setValue();

				if (this.byId("voltage").getSelectedItem() !== null) {
					this.byId("voltage").getSelectedItem().setKey();
				}
				this.byId("reqSupplyPhase").setVisible(false);
				this.byId("supplyMeter").setVisible(false);
				this.byId("existingSupply").setVisible(false);
				this.byId("supplyUnit").setVisible(false);
				this.byId("supplySize").setVisible(false);
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("upgradeSupply").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);

			} else if (this.byId("category").getSelectedItem().getKey() === "Residential" &&
				(oEvent.getSource().getSelectedItem().getKey() === "Upgrade" ||
					oEvent.getSource().getSelectedItem().getKey() === "Conversion")) {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("reqSupplyPhase").setValue();

				if (this.byId("reqSupplyPhase").getSelectedItem() !== null) {
					this.byId("reqSupplyPhase").getSelectedItem().setKey();
				}
				this.byId("voltage").setVisible(false);
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("upgradeSupply").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);

			} else if (this.byId("category").getSelectedItem().getKey() === "Commercial" &&
				(oEvent.getSource().getSelectedItem().getKey() === "Upgrade" ||
					oEvent.getSource().getSelectedItem().getKey() === "Conversion")) {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhaseLV").setVisible(true);
				this.byId("reqSupplyPhaseLV").setValue();

				if (this.byId("reqSupplyPhaseLV").getSelectedItem() !== null) {
					this.byId("reqSupplyPhaseLV").getSelectedItem().setKey();
				}

				this.byId("voltage").setVisible(true);
				this.byId("voltage").setValue();

				if (this.byId("voltage").getSelectedItem() !== null) {
					this.byId("voltage").getSelectedItem().setKey();
				}
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("upgradeSupply").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);


			} else if (this.byId("category").getSelectedItem().getKey() === "Residential" &&
				oEvent.getSource().getSelectedItem().getKey() === "Overhead") {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("reqSupplyPhase").setValue();

				if (this.byId("reqSupplyPhase").getSelectedItem() !== null) {
					this.byId("reqSupplyPhase").getSelectedItem().setKey();
				}
				this.byId("upgradeSupply").setVisible(true);
				this.byId("voltage").setVisible(false);
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);

			} else if (this.byId("category").getSelectedItem().getKey() === "Commercial" &&
				oEvent.getSource().getSelectedItem().getKey() === "Overhead") {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhaseLV").setVisible(true);
				this.byId("reqSupplyPhaseLV").setValue();
				if (this.byId("reqSupplyPhaseLV").getSelectedItem() !== null) {
					this.byId("reqSupplyPhaseLV").getSelectedItem().setKey();
				}
				this.byId("reqSupplyPhase").setVisible(false);
				this.byId("upgradeSupply").setVisible(true);
				this.byId("voltage").setVisible(true);
				this.byId("voltage").setValue();
				if (this.byId("voltage").getSelectedItem() !== null) {
					this.byId("voltage").getSelectedItem().setKey();
				}
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("reqSupplyPhase").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);

			} else if (this.byId("category").getSelectedItem().getKey() === "Residential" &&
				oEvent.getSource().getSelectedItem().getKey() === "Additional") {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("buildingPlan").setVisible(true);
				this.byId("prepaymentMeter").setVisible(true);
				this.byId("upgradeSupply").setVisible(true);
				this.byId("voltage").setVisible(false);
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("reqSupplyPhase").setValue();

				if (this.byId("reqSupplyPhase").getSelectedItem() !== null) {
					this.byId("reqSupplyPhase").getSelectedItem().setKey();
				}
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);

			} else if (this.byId("category").getSelectedItem().getKey() === "Commercial" &&
				oEvent.getSource().getSelectedItem().getKey() === "Additional") {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(true);
				this.byId("upgradeSupply").setVisible(true);
				this.byId("voltage").setVisible(false);
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("reqSupplyPhase").setValue();

				if (this.byId("reqSupplyPhase").getSelectedItem() !== null) {
					this.byId("reqSupplyPhase").getSelectedItem().setKey();
				}
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("serviceTypeInput").setVisible(false);

			} else if (oEvent.getSource().getSelectedItem().getKey() === "Relocation") {
				this.byId("supplyMeter").setVisible(true);
				this.byId("existingSupply").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("supplySize").setVisible(true);
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("buildingPlan").setVisible(false);
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("reqSupplyPhase").setVisible(false);
				this.byId("upgradeSupply").setVisible(false);
				this.byId("voltage").setVisible(false);
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(false);
				this.byId("cable").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
				this.byId("meterType").setVisible(false);
				this.byId("serviceTypeInput").setVisible(true);
			}
		},

		onServiceTypeSelection: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.byId("SelectedServ").setText(this.byId("serviceSelectionType").getSelectedItem().getText());
			this.NotificationModel.getData().results.ServiceText = this.byId("serviceSelectionType").getSelectedItem().getText();

			if (oEvent.getSource().getSelectedItem().getKey() === "01" || oEvent.getSource().getSelectedItem().getKey() === "07") {
				this.byId("subdivision").setVisible(true);
			
			} else {
				this.byId("subdivision").setVisible(false);
			}

			if (oEvent.getSource().getSelectedItem().getKey() === "03" && this.MeterType === "PP" && this.CustomerType === "DOM") {
				MessageBox.error("A Pre-payment meter already exist conversion not possible.");
				this._wizard.invalidateStep(this.byId("SCServiceSelection"));
			} else {
				this._wizard.validateStep(this.byId("SCServiceSelection"));
				this.validateServiceSelected();
			}

		},

		onSelectRequiredSupply: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "Single-Phase") {
				this.byId("singlePhaseSize").setVisible(true);
				this.byId("singlePhaseSize").setValue();
				this.byId("threePhaseSize").setVisible(false);
			} else {
				this.byId("singlePhaseSize").setVisible(false);
				this.byId("threePhaseSize").setVisible(true);
				this.byId("threePhaseSize").setValue();
			}
		},

		onSelectRequiredSupplyLV: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "Single-Phase") {
				this.byId("singlePhaseLV").setVisible(true);
				this.byId("threePhaseLV").setVisible(false);
			} else {
				this.byId("singlePhaseLV").setVisible(false);
				this.byId("threePhaseLV").setVisible(true);
			}
		},

		onSelectRequiredSupplySize: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "60" &&
				this.byId("category").getSelectedItem().getKey() === "Residential" &&
				(this.byId("serviceType").getSelectedItem().getKey() === "NewSupply" ||
					this.byId("serviceType").getSelectedItem().getKey() === "Temporary")) {
				this.byId("cable").setVisible(true);
			} else {
				this.byId("cable").setVisible(false);
			}
		},

		onSelectVoltage: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "LV") {
				this.byId("reqSupplyPhaseLV").setVisible(true);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
			} else if (oEvent.getSource().getSelectedItem().getKey() === "MV") {
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(true);
				this.byId("requiredHV").setVisible(false);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
			} else if (oEvent.getSource().getSelectedItem().getKey() === "HV") {
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(true);
				this.byId("threePhaseLV").setVisible(false);
				this.byId("singlePhaseLV").setVisible(false);
			}
		},

		onSelectReqLVSupplySize: function(oEvent) {
			switch (oEvent.getSource().getSelectedItem().getKey()) {
				case "5":
				case "10":
				case "20":
				case "40":
				case "60":
				case "80":
				case "100":
					this.byId("meterType").setVisible(true);
					break;
				default:
					this.byId("meterType").setVisible(true);
					this.byId("meterType").setSelectedItem().setSelectedKey("AMI");
					break;
			}
		},

		onSelectUpgradeSupply: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "Yes" && this.byId("category").getSelectedItem().getKey() === "Commercial" &&
				oEvent.getSource().getSelectedItem().getKey() === "Overhead") {
				this.byId("requiredLV").setVisible(true);
			} else if (oEvent.getSource().getSelectedItem().getKey() === "Yes") {
				this.byId("requiredLV").setVisible(false);
				this.byId("reqSupplyPhase").setVisible(true);
			}
		},

		onSelectCategory: function(oEvent) {
		
		},

		onSelectDropDown: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}
		},

		onConfirm: function() {
			if (this.byId("chkConfirm").getSelected() === true) {
				this.byId("btnSubmit").setEnabled(true);
			} else {
				this.byId("btnSubmit").setEnabled(false);
			}
		},

		onContinueToStep2: function() {

			var results = this.validateAllSteps();

			if (results === true) {
				this.NotificationModel.getData().results.Partner = this.propertyBP;
				//this.NotificationModel.getData().results.PayerPartner = this.BP;
				if (this.byId("subdivision").getSelectedIndex() === 0) {
					this.NotificationModel.getData().results.Subdivision = "X";
				} else {
					this.NotificationModel.getData().results.Subdivision = "";
				}

				this.getRouter().navTo("Step2ServiceConnection", {
					Service: this.byId("serviceSelectionType").getSelectedItem().getKey(),
					ApplicSubmitted: this.ApplicSubmitted
				});
			}

		},

		handleMessageBoxOpen: function(sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.YES) {
						this.clearForms();
						this.handleNavigationToStep(0);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
						this.getRouter().navTo("ListOfApplications", {
							ApplicSubmitted: true
						});
					}
				}.bind(this)
			});
		},

		handleWizardCancel: function() {
			this.handleMessageBoxOpen("Are you sure you want to cancel this application?", "confirm");
		},

		onStep1CompleteActivate: function() {

			if (this.ServiceFound === "") {

				if (this.byId("subdivision").getVisible() === true && this.byId("subdivision").getSelectedIndex() === -1) {
					this.byId("subdivision").setValueState("Error");
					MessageBox.error("Please indicate if this is a subdivision");
					this._wizard.previousStep();
				} else {
					this.byId("subdivision").setValueState("None");
					this.byId("btnContinue").setVisible(true);

					if (this.byId("subdivision").getSelectedIndex() === 0) {
						this.NotificationModel.getData().results.Subdivision = "X";
					} else {
						this.NotificationModel.getData().results.Subdivision = "";
					}
				}

			} else {
				MessageBox.error("The application for the selected service already exist and is currently being processed");
				this._wizard.previousStep();
			}

		},

		onAddProperty: function() {
			if (!this._oAddPropertyDialog) {
				this._oAddPropertyDialog = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.AddProperty", this);
				this.getView().addDependent(this._oAddPropertyDialog);
			}
			this._oAddPropertyDialog.open();
		},

		onCancelProperty: function() {
			this._oAddPropertyDialog.close();
		},

		onSubmitProperty: function() {
			this._oAddPropertyDialog.close();
		},

		onSelectPerson: function(oEvent) {
			if (oEvent.getSource().getSelectedItem().getKey() === "Contact") {
				this.byId("SCContactPerson").setVisible(true);
			} else {
				this.byId("SCContactPerson").setVisible(false);
			}

		},

		onSelectTaxRequired: function(oEvent) {

			if (oEvent.getSource().getSelectedIndex() === 0) {
				this.NotificationModel.getData().results.PayerTaxInvCheck = "X";
				this.byId("Vat").setVisible(true);
				this.byId("FileUpload").setVisible(true);
				this.NotificationModel.getData().results.VatRequired = "Yes";
			} else {
				this.NotificationModel.getData().results.PayerTaxInvCheck = "";
				this.byId("Vat").setVisible(false);
				this.byId("FileUpload").setVisible(false);
				this.NotificationModel.getData().results.VatRequired = "No";
			}
		},

		onSelectPostalAddress: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}
			this.NotificationModel.getData().results.PayerAddressString = oEvent.getSource().getSelectedItem().getText();
		},

		onSelectSubdivision: function(oEvent) {
			this.byId("subdivision").setValueState("None");

		},

		onUploadDocuments: function(oEvent) {
			//var oProperties = {};

			this.Properties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.Properties.FileContent = base64String.split(',')[1];
			});

			this.Properties.FileContent = that.FileContent;
			this.Properties.FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.Properties.FileType = "docx";
			} else {
				
				this.Properties.FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
			this.AttachmentsModel.getData().results = this.Properties;

		},

		onCancelApplication: function() {

		},

		validationErrorMessage: function(vText) {
			MessageBox.error("Please  " + vText);
		},

		validateContactPersonFields: function() {
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;

			this.byId("title").setValueState("None");
			this.byId("surname").setValueState("None");
			this.byId("name").setValueState("None");
			this.byId("cell").setValueState("None");
			this.byId("ownerEmail").setValueState("None");
			this.byId("ownerCell").setValueState("None");
			this.byId("ownerWorkTel").setValueState("None");
			this.byId("email").setValueState("None");

			if (this.byId("ownerEmail").getValue().trim() !== "") {
				if (!this.byId("ownerEmail").getValue().match(rexMail)) {
					this.byId("ownerEmail").setValueState("Error");
					this.byId("ownerEmail").setValueStateText("Invalid email address");
					this.byId("ownerEmail").focus();
					MessageBox.error("Invalid email address");
					this._wizard.previousStep();
					return false;
				}
			} else {
				this.byId("ownerEmail").setValueState("Error");
				this.byId("ownerEmail").setValueStateText("Invalid email address");
				this.byId("ownerEmail").focus();
				MessageBox.error("Invalid email address");
				this._wizard.previousStep();
				return false;
			}

			if (this.byId("ownerCell").getValue().trim() === "") {
				this.byId("ownerCell").setValueState("Error");
				this.byId("ownerCell").setValueStateText("Enter Cell Number");
				this.byId("ownerCell").focus();
				MessageBox.error("Invalid phone number");
				this._wizard.previousStep();
				return false;
			} else {
				if (!this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					this.byId("ownerCell").setValueState("Error");
					this.byId("ownerCell").setValueStateText("Invalid Cell Number");
					this.byId("ownerCell").focus();
					MessageBox.error("Invalid phone number");
					this._wizard.previousStep();
					return false;
				}
			}

			if (!this.byId("ownerWorkTel").getValue().trim() === "") {
				this.byId("ownerWorkTel").setValueState("Error");
				this.byId("ownerWorkTel").setValueStateText("Enter Work Number");
				this.byId("ownerWorkTel").focus();
				MessageBox.error("Invalid phone number");
				this._wizard.previousStep();
				return false;
			} else {
				if (!this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					this.byId("ownerWorkTel").setValueState("Error");
					this.byId("ownerWorkTel").setValueStateText("Invalid Work Number");
					this.byId("ownerWorkTel").focus();
					MessageBox.error("Invalid phone number");
					this._wizard.previousStep();
					return false;
				}
			}
		

			if (this.byId("title").getValue().trim() === "") {
				this.byId("title").setValueState("Error");
				this.byId("title").setValueStateText("Select Title");
				this.byId("title").focus();
				MessageBox.error("Please select title from the drop down values");
				this._wizard.previousStep();
				return false;
			}
			if (this.byId("surname").getValue().trim() === "") {
				this.byId("surname").setValueState("Error");
				this.byId("surname").setValueStateText("Enter Surname");
				this.byId("surname").focus();
				MessageBox.error("Enter surname");
				this._wizard.previousStep();
				return false;
			}
			if (this.byId("name").getValue().trim() === "") {
				this.byId("name").setValueState("Error");
				this.byId("name").setValueStateText("Enter Name");
				this.byId("name").focus();
				MessageBox.error("Enter name");
				this._wizard.previousStep();
				return false;
			}
			if (this.byId("cell").getValue().trim() === "") {
				this.byId("cell").setValueState("Error");
				this.byId("cell").setValueStateText("Enter Cell");
				this.byId("cell").focus();
				MessageBox.error("Invalid phone number");
				this._wizard.previousStep();
				return false;
			} else {
				if (this.byId("cell").getValue().length < 10 && this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					this.byId("cell").setValueState("Error");
					this.byId("cell").setValueStateText("Invalid Work Number");
					this.byId("cell").focus();
					MessageBox.error("Invalid phone number");
					this._wizard.previousStep();
					return false;
				}
			}

			if (this.byId("email").getValue().trim() !== "") {
				if (!this.byId("email").getValue().match(rexMail)) {
					this.byId("email").setValueState("Error");
					this.byId("email").setValueStateText("Invalid email address");
					this.byId("email").focus();
					MessageBox.error("Invalid email address");
					this._wizard.previousStep();
					return false;
				}
			} else {
				this.byId("email").setValueState("Error");
				this.byId("email").setValueStateText("Invalid email address");
				this.byId("email").focus();
				MessageBox.error("Invalid email address");
				this._wizard.previousStep();
				return false;
			}

			this.byId("title").setValueState("None");
			this.byId("surname").setValueState("None");
			this.byId("name").setValueState("None");
			this.byId("cell").setValueState("None");
			this.byId("ownerEmail").setValueState("None");
			this.byId("ownerCell").setValueState("None");
			this.byId("ownerWorkTel").setValueState("None");
			this.byId("email").setValueState("None");
			this.NotificationModel.getData().results.ContactTitleText = this.byId("title").getValue();

			this.validatePersonResponsibleForPaymentFields();

		},

		validatePersonResponsibleForPaymentFields: function() {

			if (this.byId("party").getSelectedItem() === null) {
				this.byId("party").setValueState("Error");
				this.byId("party").setValueStateText("Select Party");
				MessageBox.error("Please select payer from the drop down");
				this._wizard.previousStep();
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === -1) {
				MessageBox.error("Please indicate if tax invoice is required");
				this.byId("IstaxRequired").setValueState("Error");
				this._wizard.previousStep();
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("Vat").getValue() === "") {
				this.byId("Vat").setValueState("Error");
				this.byId("Vat").setValueStateText("Enter VAT");
				MessageBox.error("Please capture the required field");
				this._wizard.previousStep();
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("FileUpload").getValue() === "") {
				this.byId("FileUpload").setValueState("Error");
				this.byId("FileUpload").setValueStateText("Upload Certificate");
				MessageBox.error("Please capture the required field");
				this._wizard.previousStep();
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("postalAddress").getValue() === "") {
				this.byId("postalAddress").setValueState("Error");
				this.byId("postalAddress").setValueStateText("Select address");
				MessageBox.error("Please capture the required field");
				this._wizard.previousStep();
				return false;
			}

			this.byId("party").setValueState("None");
			this.byId("IstaxRequired").setValueState("None");
			this.byId("FileUpload").setValueState("None");
			this.byId("postalAddress").setValueState("None");
			this.NotificationModel.getData().results.PartyText = this.byId("party").getValue();
			this.NotificationModel.getData().results.PayerVatNo = this.byId("Vat").getValue();

			this.getMeterDetails();
		},

		validateServiceSelected: function() {
			var Parcel = this.NotificationModel.getData().results.Plno;
			var Service = this.byId("serviceSelectionType").getSelectedItem().getKey();

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ServiceCheckSet(Partner='" + this.propertyBP + "',ParcelNumber='" + Parcel + "',ServiceType='" + Service +
				"')", {
					success: function(oData) {

						this.ServiceFound = oData.IsFound;
						sap.ui.core.BusyIndicator.hide();

					}.bind(this),
					error: function(oError) {
						sap.ui.core.BusyIndicator.hide();
	
						this.ServiceFound = "";
					}.bind(this)
				});
		},

		validateEskomProperty: function() {
			var Parcel = this.NotificationModel.getData().results.Plno;
			var Erf = this.NotificationModel.getData().results.Erf;

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/EskomCheckSet(Parcel='" + Parcel + "',Erf='" + Erf + "')", {
				success: function(oData) {
					this.EskomPropertyFound = oData.IsFound;

					this.getPropertyOwnerDetails();
				}.bind(this),
				error: function(oError) {

					this.EskomPropertyFound = "";
					this.getPropertyOwnerDetails();
				}.bind(this)
			});
		},

		clearAllForms: function() {

			this.byId("idProperties").removeSelections();
			this.byId("serviceSelectionType").setValue();
			this.byId("btnContinue").setVisible(false);

		},

		resetForm: function(Form) {
			Form.forEach(function(Field) {
				if (typeof Field.getValue === "function") {
					if ((!Field.getValue() || Field.getValue().length < 1) && Field.getVisible() === true) {
						if (typeof Field.getItems === "function") {
							Field.setValue();
						}
					}
				}

			});
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

		onValidateEmail: function(oEvent) {
			var emailValue = oEvent.getParameter("value");
			var item = oEvent.getSource();
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
			if (!emailValue.match(rexMail)) {
				item.setValueState("Error");
				item.setValueStateText("Invalid email address");
				MessageBox.error("Invalid email address");
				this.isError = true;
			} else {
				item.setValueState("None");
				item.setValueStateText();
				this.isError = false;
			}
		},

		onResetError: function(oEvent) {
			var item = oEvent.getSource();

			item.setValueState("None");
			item.setValueStateText();

		},

		removeNumbersAndResetError: function(oEvent) {
			var item = oEvent.getSource();
			var name = item.getValue();

			item.setValueState("None");
			item.setValueStateText();

			// replace each number in a string with a replacement string
			var replaced = name.replace(/[0-9]/g, '');
			item.setValue(replaced);

		},

		isValidPhoneNumber: function(sPhoneNumber) {
			
			if (!/^((?:\+27|27)|0)(\d{2})-?(\d{3})-?(\d{4})$/.test(sPhoneNumber.replace(/[-()_+|:.\/]/g, ""))) {
				return false;
			} else {
				return true;
			}

		},

		onValidatePhoneNumber: function(oEvent) {
			var telValue = oEvent.getParameter("value");
			var item = oEvent.getSource();

			//Validate local number
			if (oEvent.getParameters().value.length >= 10 && this.isValidPhoneNumber(telValue)) {
				item.setValueState("None");
				item.setValueStateText();
			} else {
				item.setValueState("Error");
				item.setValueStateText("Invalid phone number");
				MessageBox.error("Please enter valid phone number");
			}
		},

		onFileSizeExceed: function(oEvent) {
			MessageBox.error("File size exceeded. You can only upload max size of 5MB");
		},

		validateComboBox: function(oControl) {
			if (oControl.getSource().getSelectedItem() === null) {
				oControl.getSource().setValue();
				oControl.getSource().setValueState("Error");
				oControl.getSource().setValueStateText("Please select value from the drop down");
				return false;
			}
			oControl.getSource().setValueState("None");
			return true;
		},

		handleSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("idProperties"),
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

		handleSortButtonPressed: function() {
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.SortProperties")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
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

		onValidateVAT: function() {
			var Vat = this.byId("Vat").getValue().trim();
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ValidateVATSet(Vat='" + Vat + "')", {
				success: function(oData) {
					if (oData.IsValid === "") {
						MessageBox.error("VAT number enterd is invalid");
						this.byId("Vat").setValue(this.VatNo);
					}
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while validating VAT number. Please try again later");
				}.bind(this)
			});
		},

		clearForms: function() {
			var oFormContact = this.byId("SCContactPerson").getContent();
			var oFormResponsiblePayment = this.byId("SCResponsibleToPay").getContent();

			oFormContact.forEach(function(Field) {
				if (typeof Field.getValue === "function") {
					Field.setValueState("None");
					Field.setValueStateText("");
					Field.setValue();
				} else if (typeof Field.getSelectedIndex === "function") {
					Field.setSelectedIndex(-1);
					Field.setValueState("None");

				}
			});

			oFormResponsiblePayment.forEach(function(Field) {
				if (typeof Field.getValue === "function") {
					Field.setValueState("None");
					Field.setValueStateText("");
					Field.setValue();
				} else if (typeof Field.getSelectedIndex === "function") {
					Field.setSelectedIndex(-1);
					Field.setValueState("None");

				}
			});

			this.byId("idProperties").removeSelections();
			this.byId("serviceSelectionType").setValue();
			this.byId("subdivision").setSelectedIndex(-1);
			this.byId("subdivision").setVisible(false);
			this.byId("btnContinue").setVisible(false);
			this.byId("Vat").setVisible(true);
			this.byId("FileUpload").setVisible(true);
			this.byId("postalAddress").setVisible(true);

		},

		validateAllSteps: function() {
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;

			if (this.byId("ownerEmail").getValue().trim() !== "") {
				if (!this.byId("ownerEmail").getValue().match(rexMail)) {
					this.byId("ownerEmail").setValueState("Error");
					this.byId("ownerEmail").setValueStateText("Invalid email address");
					this.byId("ownerEmail").focus();
					MessageBox.error("Invalid email address");
					this.handleNavigationToStep(2);
					return false;
				}
			} else {
				this.byId("ownerEmail").setValueState("Error");
				this.byId("ownerEmail").setValueStateText("Invalid email address");
				this.byId("ownerEmail").focus();
				MessageBox.error("Invalid email address");
				this.handleNavigationToStep(2);
				return false;
			}

			if (this.byId("ownerCell").getValue().trim() === "") {
				this.byId("ownerCell").setValueState("Error");
				this.byId("ownerCell").setValueStateText("Enter Cell Number");
				this.byId("ownerCell").focus();
				MessageBox.error("Invalid phone number");
				this.handleNavigationToStep(2);
				return false;
			} else {
				if (!this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					this.byId("ownerCell").setValueState("Error");
					this.byId("ownerCell").setValueStateText("Invalid Cell Number");
					this.byId("ownerCell").focus();
					MessageBox.error("Invalid phone number");
					this.handleNavigationToStep(2);
					return false;
				}
			}

			if (!this.byId("ownerWorkTel").getValue().trim() === "") {
				this.byId("ownerWorkTel").setValueState("Error");
				this.byId("ownerWorkTel").setValueStateText("Enter Work Number");
				this.byId("ownerWorkTel").focus();
				MessageBox.error("Invalid phone number");
				this.handleNavigationToStep(2);
				return false;
			} else {
				if (!this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					this.byId("ownerWorkTel").setValueState("Error");
					this.byId("ownerWorkTel").setValueStateText("Invalid Work Number");
					this.byId("ownerWorkTel").focus();
					MessageBox.error("Invalid phone number");
					this.handleNavigationToStep(2);
					return false;
				}
			}
		

			if (this.byId("title").getValue().trim() === "") {
				this.byId("title").setValueState("Error");
				this.byId("title").setValueStateText("Select Title");
				this.byId("title").focus();
				MessageBox.error("Please select title from the drop down values");
				this.handleNavigationToStep(2);
				return false;
			}
			if (this.byId("surname").getValue().trim() === "") {
				this.byId("surname").setValueState("Error");
				this.byId("surname").setValueStateText("Enter Surname");
				this.byId("surname").focus();
				MessageBox.error("Enter surname");
				this.handleNavigationToStep(2);
				return false;
			}
			if (this.byId("name").getValue().trim() === "") {
				this.byId("name").setValueState("Error");
				this.byId("name").setValueStateText("Enter Name");
				this.byId("name").focus();
				MessageBox.error("Enter name");
				this.handleNavigationToStep(2);
				return false;
			}
			if (this.byId("cell").getValue().trim() === "") {
				this.byId("cell").setValueState("Error");
				this.byId("cell").setValueStateText("Enter Cell");
				this.byId("cell").focus();
				MessageBox.error("Invalid phone number");
				this.handleNavigationToStep(2);
				return false;
			} else {
				if (this.byId("cell").getValue().length < 10 && this.isValidPhoneNumber(this.byId("ownerCell").getValue())) {
					this.byId("cell").setValueState("Error");
					this.byId("cell").setValueStateText("Invalid Work Number");
					this.byId("cell").focus();
					MessageBox.error("Invalid phone number");
					this.handleNavigationToStep(2);
					return false;
				}
			}

			if (this.byId("email").getValue().trim() !== "") {
				if (!this.byId("email").getValue().match(rexMail)) {
					this.byId("email").setValueState("Error");
					this.byId("email").setValueStateText("Invalid email address");
					this.byId("email").focus();
					MessageBox.error("Invalid email address");
					this.handleNavigationToStep(2);
					return false;
				}
			} else {
				this.byId("email").setValueState("Error");
				this.byId("email").setValueStateText("Invalid email address");
				this.byId("email").focus();
				MessageBox.error("Invalid email address");
				this.handleNavigationToStep(2);
				return false;
			}

			this.byId("title").setValueState("None");
			this.byId("surname").setValueState("None");
			this.byId("name").setValueState("None");
			this.byId("cell").setValueState("None");
			this.byId("ownerEmail").setValueState("None");
			this.byId("ownerCell").setValueState("None");
			this.byId("ownerWorkTel").setValueState("None");
			this.byId("email").setValueState("None");

			if (this.byId("party").getSelectedItem() === null) {
				this.byId("party").setValueState("Error");
				this.byId("party").setValueStateText("Select Party");
				MessageBox.error("Please select payer from the drop down");
				this.handleNavigationToStep(2);
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === -1) {
				MessageBox.error("Please indicate if tax invoice is required");
				this.byId("IstaxRequired").setValueState("Error");
				this.handleNavigationToStep(2);
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("Vat").getValue() === "") {
				this.byId("Vat").setValueState("Error");
				this.byId("Vat").setValueStateText("Enter VAT");
				MessageBox.error("Please capture the required field");
				this.handleNavigationToStep(2);
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("FileUpload").getValue() === "") {
				this.byId("FileUpload").setValueState("Error");
				this.byId("FileUpload").setValueStateText("Upload Certificate");
				MessageBox.error("Please capture the required field");
				this.handleNavigationToStep(2);
				return false;
			}

			if (this.byId("IstaxRequired").getSelectedIndex() === 0 && this.byId("postalAddress").getValue() === "") {
				this.byId("postalAddress").setValueState("Error");
				this.byId("postalAddress").setValueStateText("Select address");
				MessageBox.error("Please capture the required field");
				this.handleNavigationToStep(2);
				return false;
			}

			this.byId("party").setValueState("None");
			this.byId("IstaxRequired").setValueState("None");
			this.byId("FileUpload").setValueState("None");
			this.byId("postalAddress").setValueState("None");

			if (this.byId("serviceSelectionType").getSelectedItem() === null) {
				this.byId("serviceSelectionType").setValueState("Error");
				this.byId("serviceSelectionType").setValueStateText("Select service");
				MessageBox.error("Please select service from the drop down");
				this.handleNavigationToStep(2);
				return false;
			}

			this.byId("serviceSelectionType").setValueState("None");

			return true;
		}

	});

});