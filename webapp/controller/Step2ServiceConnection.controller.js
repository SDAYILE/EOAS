sap.ui.define([
	//	"sap/ui/core/mvc/Controller"
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/Fragment'
], function(BaseController, MessageBox, JSONModel, Fragment) {
	"use strict";

	var sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.Step2ServiceConnection", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.Step2ServiceConnection
		 */
		onInit: function() {
			// apply compact density if touch is not supported, the standard cozy design otherwise

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

			this.getRouter().getRoute("Step2ServiceConnection").attachPatternMatched(this._onObjectMatched, this);

			this.byId("SCServiceRequiredForm").setModel(this.NotificationModel);
			this.byId("SCServiceRequiredForm").bindElement({
				path: "/results"
			});

			this.byId("RevPropertyForm").setModel(this.NotificationModel);
			this.byId("RevPropertyForm").bindElement({
				path: "/results"
			});

			this.byId("RevPropertyOwnerForm").setModel(this.PropertyOwnerModel);
			this.byId("RevPropertyOwnerForm").bindElement({
				path: "/results"
			});

			this.byId("RevContactPersonForm").setModel(this.NotificationModel);
			this.byId("RevContactPersonForm").bindElement({
				path: "/results"
			});

			this.byId("RevPersonPaymentForm").setModel(this.NotificationModel);
			this.byId("RevPersonPaymentForm").bindElement({
				path: "/results"
			});

			this.byId("RevServiceSelectiontForm").setModel(this.NotificationModel);
			this.byId("RevServiceSelectiontForm").bindElement({
				path: "/results"
			});

			this.byId("RevExistingSupplyForm").setModel(this.NotificationModel);
			this.byId("RevExistingSupplyForm").bindElement({
				path: "/results"
			});

			this.byId("RevServiceRequiredForm").setModel(this.NotificationModel);
			this.byId("RevServiceRequiredForm").bindElement({
				path: "/results"
			});

			this._wizard = this.byId("SCWizard");
			this._wizard = this.byId("SCWizard");
			this._oNavContainer = this.byId("SCWizardNavContainer");
			this._oWizardContentPage = this.byId("pgSC");

		},

		_onObjectMatched: function(oEvent) {

			this.ApplicSubmitted = undefined;
			this.ApplicSubmitted = oEvent.getParameter("arguments").ApplicSubmitted;
			this.Service = oEvent.getParameter("arguments").Service;
			//this.getView().addStyleClass('sapUiSizeCompact');  

			this.handleNavigationToStep(0);
			this._wizard.discardProgress(this._wizard.getSteps()[0]);
			this.byId("chkConfirm").setSelected(false);
			this.byId("btnSubmit").setEnabled(false);
			this.byId("categoryTemporary").setVisible(false);
			this.byId("categoryTemporary").setValue();

			if (this.ApplicSubmitted === "true") {
				this.handleNavigationToStep(0);
				this._wizard.discardProgress(this._wizard.getSteps()[0]);
				this.clearAllForms();
			}

			if (this.Service !== this.oldService) {

				this.byId("category").setValue();
				this.hideServiceSpecificFields();
				this.byId("supplyUnit").setEnabled(true);

				//Set header text
				switch (this.Service) {
					//New Supply
					case "01":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("newSupply"));
						this.byId("SCExistingSupplyForm").setVisible(false);
						this.byId("RevExistingSupplyForm").setVisible(false);
						this.byId("SCServiceRequiredForm").setVisible(true);
						this.byId("category").setVisible(true);
						break;
						//Upgrade
					case "02":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("upgrade"));
						this.byId("SCExistingSupplyForm").setVisible(true);
						this.byId("RevExistingSupplyForm").setVisible(true);
						this.byId("SCServiceRequiredForm").setVisible(true);
						this.byId("category").setVisible(true);
						break;
						//Conversion
					case "03":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("conversion"));
						this.byId("SCExistingSupplyForm").setVisible(true);
						this.byId("RevExistingSupplyForm").setVisible(true);
						this.byId("SCServiceRequiredForm").setVisible(false);
						this.byId("category").setVisible(false);
						break;
						//Overhead
					case "04":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("overhead"));
						this.byId("SCExistingSupplyForm").setVisible(true);
						this.byId("RevExistingSupplyForm").setVisible(true);
						this.byId("SCServiceRequiredForm").setVisible(false);
						this.byId("category").setVisible(false);
						break;
						//Relocation
					case "05":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("relocation"));
						this.byId("SCExistingSupplyForm").setVisible(true);
						this.byId("RevExistingSupplyForm").setVisible(true);
						this.byId("SCCompanyForm").setVisible(false);
						this.byId("SCContractorDetailsForm").setVisible(false);
						//this.byId("SCECSADetailsForm").setVisible(false);
						this.byId("category").setVisible(false);
						this.byId("SCServiceRequiredForm").setVisible(true);
						this.byId("serviceTypeInput1").setVisible(true);
						this.byId("serviceTypeInput2").setVisible(true);
						this.byId("serviceTypeInput3").setVisible(true);
						this.byId("serviceTypeInput4").setVisible(true);
						this.byId("serviceTypeInput5").setVisible(true);
						this.byId("serviceTypeInput6").setVisible(true);
						this.byId("relocationServiceText").setVisible(true);

						if (this.byId("serviceTypeInput1").getValue() === "") {
							MessageBox.information(
								"Please specify the relocation service needed and include any relevant documents, such as photographs of the site and items to be relocated"
							);
						}
						break;
						//Additional
					case "06":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("additional"));
						this.byId("SCExistingSupplyForm").setVisible(true);
						this.byId("RevExistingSupplyForm").setVisible(true);
						this.byId("SCServiceRequiredForm").setVisible(true);
						this.byId("category").setVisible(true);
						this.byId("supplyUnit").setSelectedItem().setSelectedKey("001");
						this.byId("supplyUnit").setEnabled(false);
						break;
						//Temporaty
					case "07":
						this.byId("ServiceStep").setTitle(this.getResourceBundle().getText("temporary"));
						this.byId("SCServiceRequiredForm").setVisible(true);
						this.byId("category").setVisible(false);
						this.byId("categoryTemporary").setVisible(true);
						break;
				}

				this.oldService = this.Service;

			}

			if (this.NotificationModel.getData().results.Subdivision === "X" && (this.Service === "01" || this.Service === "07")) {
				this.byId("SCCompanyForm").setVisible(false);
				this.byId("SCContractorDetailsForm").setVisible(false);
				this.byId("ElectricConStrip").setVisible(false);
				//this.byId("SCECSADetailsForm").setVisible(false);
			} else if (this.NotificationModel.getData().results.Subdivision === "" && (this.Service === "01" || this.Service === "07")) {
				this.byId("SCCompanyForm").setVisible(false);
				this.byId("SCContractorDetailsForm").setVisible(true);
				this.byId("ElectricConStrip").setVisible(true);
				//this.byId("SCECSADetailsForm").setVisible(true);
			}

			this.getVoltages();

		},

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.AdditionalInfo",
					this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		getVoltages: function() {
			var FilterKey = new sap.ui.model.Filter("Key", "EQ", this.Service);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/VoltageSet", {
				filters: [FilterKey],
				success: function(oData) {
					var oVoltageModel = new JSONModel({
						results: oData.results
					});

					oVoltageModel.refresh();

					this.getView().setModel(oVoltageModel, "VoltageModel");

					if (this.byId("SCExistingSupplyForm").getVisible() === true) {
						this.getMeterDetails();
					} else {
						sap.ui.core.BusyIndicator.hide();
					}

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving voltage details. Please try again later");
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
					MessageBox.error("Error occured while retrieving applicant details. Please try again later");
				}.bind(this)
			});
		},

		getMeterDetails: function() {
			var FilterBp = new sap.ui.model.Filter("Bp", "EQ", this.NotificationModel.getData().results.Partner);
			var FilterParcel = new sap.ui.model.Filter("Parcel", "EQ", this.NotificationModel.getData().results.Plno);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/MeterDetailsSet", {
				filters: [FilterBp, FilterParcel],
				success: function(oData) {
					var oMeterDetailsModel = new JSONModel({
						results: oData.results
					});

					if (oData.results.length >= 1) {
						this.byId("metNo").setValue(oData.results[0].MeterNo);
						this.byId("devCategory").setValue(oData.results[0].DeviceCategoryText);
						this.byId("metPhase").setValue(oData.results[0].ExistSuppPhaseText);
						//this.byId("metCategory").setValue(oData.results[0].ExistSuppCategory);

						this.ExistingCategory = oData.results[0].ExistSuppCategoryCode;
						this.ExistingPhase = oData.results[0].ExistSuppPhase;

						this.NotificationModel.getData().results.ExistDeviceCategory = oData.results[0].ExistDeviceCategory;
						this.NotificationModel.getData().results.ExistSuppCategory = this.ExistingCategory;
						this.NotificationModel.getData().results.ExistSuppPhase = this.ExistingPhase;

					}

					//If category = DOM OR servise is Additional meter , then Voltage must default to LV
					if (this.ExistingCategory === "DOM" || this.Service === "06") {
						this.byId("ExistingVoltage").setSelectedItem().setSelectedKey("001");
						this.byId("ExistingVoltage").setEnabled(false);
						this.byId("existSupplUnt").setSelectedItem().setSelectedKey("001");
						this.byId("ExistingLVPhaseSize").setVisible(true);
						this.byId("requiredExistingMV").setVisible(false);
						this.byId("requiredExistingHV").setVisible(false);
						this.getExistingLVSupplyPhaseSizes();
					} else {
						this.byId("ExistingVoltage").setEnabled(true);
					}

					oMeterDetailsModel.refresh();

					this.getView().setModel(oMeterDetailsModel, "MeterDetailsModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving existing meter details. Please try again later");
				}.bind(this)
			});
		},

		getMeterTypes: function(vSize) {
			var FilterSize = new sap.ui.model.Filter("Size", "EQ", vSize);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/MeterTypeSet", {
				filters: [FilterSize],
				success: function(oData) {
					var oMeterTypeModel = new JSONModel({
						results: oData.results
					});

					oMeterTypeModel.refresh();

					this.getView().setModel(oMeterTypeModel, "MeterTypeModel");
					this.byId("meterType").setVisible(true);
					this.byId("meterType").setValue();
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving meter types details. Please try again later");
				}.bind(this)
			});
		},

		getSupplyPhaseSize: function(vPhase) {

			var FilterPhase = new sap.ui.model.Filter("Phase", "EQ", vPhase);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/SupplySizeSet", {
				filters: [FilterPhase],
				success: function(oData) {
					var oSupplySizeModel = new JSONModel({
						results: oData.results
					});

					oSupplySizeModel.refresh();

					this.getView().setModel(oSupplySizeModel, "SupplySizeModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving supply size. Please try again later");
				}.bind(this)
			});
		},

		getCommercialSupplyPhaseSize: function(vPhase) {

			var FilterPhase = new sap.ui.model.Filter("Phase", "EQ", vPhase);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/SupplyPhaseCommercialSet", {
				filters: [FilterPhase],
				success: function(oData) {
					var oCommSupplySizeModel = new JSONModel({
						results: oData.results
					});

					oCommSupplySizeModel.refresh();

					this.getView().setModel(oCommSupplySizeModel, "CommSupplySizeModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving supply size. Please try again later");
				}.bind(this)
			});
		},

		getTariffChase: function() {

			var FilterPhase = new sap.ui.model.Filter("Phase", "EQ", this.byId("reqSupplyPhaseLV").getSelectedItem().getKey()),
				FilterSupply = new sap.ui.model.Filter("Supply", "EQ", this.byId("LVPhaseSize").getSelectedItem().getText()),
				FilterVoltage = new sap.ui.model.Filter("Voltage", "EQ", this.byId("voltage").getSelectedItem().getText());

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/TariffChoiceSet", {
				filters: [FilterPhase, FilterSupply, FilterVoltage],
				success: function(oData) {
					var oTariffChoiceModel = new JSONModel({
						results: oData.results
					});

					oTariffChoiceModel.refresh();

					this.getView().setModel(oTariffChoiceModel, "TariffChoiceModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving tariff. Please try again later");
				}.bind(this)
			});
		},

		getMVHVTariffChoice: function(vSupply) {

			var FilterSupply = new sap.ui.model.Filter("Supply", "EQ", vSupply),
				FilterVoltage = new sap.ui.model.Filter("Voltage", "EQ", this.byId("voltage").getSelectedItem().getText());

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/TariffChoiceSet", {
				filters: [FilterSupply, FilterVoltage],
				success: function(oData) {
					if (oData.results.length === 0) {
						sap.ui.core.BusyIndicator.hide();
						this.byId("tariffChoice").setVisible(false);
						MessageBox.error("No Tariff found for this supply size");
					} else {
						var oTariffChoiceModel = new JSONModel({
							results: oData.results
						});

						oTariffChoiceModel.refresh();
						this.byId("tariffChoice").setVisible(true);

						this.getView().setModel(oTariffChoiceModel, "TariffChoiceModel");
						sap.ui.core.BusyIndicator.hide();
					}
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving tariff. Please try again later");
				}.bind(this)
			});
		},

		getConversionTariffChoice: function() {
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/TariffChoiceSet", {
				success: function(oData) {
					var oTariffChoiceModel = new JSONModel({
						results: oData.results
					});

					oTariffChoiceModel.refresh();

					this.getView().setModel(oTariffChoiceModel, "TariffChoiceModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving tariff. Please try again later");
				}.bind(this)
			});
		},

		getExistingLVSupplyPhaseSizes: function() {

			var FilterPhase = new sap.ui.model.Filter("Phase", "EQ", this.byId("ExistingVoltage").getSelectedItem().getKey()),
				FilterCategory = new sap.ui.model.Filter("Category", "EQ", this.ExistingCategory);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ExistingLVSupplySizeSet", {
				filters: [FilterPhase, FilterCategory],
				success: function(oData) {
					var oLVSupplySizeModel = new JSONModel({
						results: oData.results
					});

					oLVSupplySizeModel.refresh();

					this.getView().setModel(oLVSupplySizeModel, "ExistingLvSupplySizeModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving supply size. Please try again later");
				}.bind(this)
			});

		},

		getInstallerDetails: function(vNumber) {

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/InstallerDetailsSet(RegNumber='" + vNumber + "')", {
				success: function(oData) {

					var oInstallerDetailsModel = new JSONModel({
						results: oData.results
					});

					oInstallerDetailsModel.refresh();

					this.byId("SCCompanyForm").setModel(oInstallerDetailsModel);
					this.byId("SCCompanyForm").bindElement({
						path: "/results"
					});

					if (oData.Name === "") {
						MessageBox.error("Invalid Company Registration Number");
						this.byId("companyName").setValue();
					} else {
						MessageBox.success("Company Registration Number successfully verified");
						this.byId("companyName").setValue(oData.Name);
						this.InstallerVerified = "X";
					}

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Company Registration number could not be verified. Please enter the correct registration number");
					this.byId("companyName").setValue();
				}.bind(this)
			});
		},

		getElectricalDetails: function(vNumber) {
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ElectricalDetailsSet(RegNumber='" + vNumber + "')", {
				success: function(oData) {

					var oInstallerDetailsModel = new JSONModel({
						results: oData
					});

					oInstallerDetailsModel.refresh();

					this.byId("SCContractorDetailsForm").setModel(oInstallerDetailsModel);
					this.byId("SCContractorDetailsForm").bindElement({
						path: "/results"
					});

					if (oData.Name === "") {
						MessageBox.error("Invalid Electrical Contractor Registration Number");
					} else {
						MessageBox.success("Electrical Contractor Registration Number successfully verified");
						this.ElectricalContractorValid = "X";
					}

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(
						"Electrical Contractor Registration number could not be verified. Please enter the correct registration number");
					this.byId("contrName").setValue();
					this.byId("contrCell").setValue();
					this.byId("contrEmail").setValue();
				}.bind(this)
			});
		},

		getECSADetails: function(vNumber) {
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ECSADetailsSet(RegNumber='" + vNumber + "')", {
				success: function(oData) {

					var oInstallerDetailsModel = new JSONModel({
						results: oData
					});

					oInstallerDetailsModel.refresh();

					if (oData.Name === "") {
						MessageBox.error("Invalid ECSA Contractor Registration Number");
					} else {
						MessageBox.success("ECSA Contractor Registration Number successfully verified");
					}

					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("ECSA Contractor Registration number could not be verified. Please enter the correct registration number");
					this.byId("ECSAcell").setValue();
					this.byId("ECSAemail").setValue();
					this.byId("ECSAdiscipline").setValue();
					this.byId("ECSAcategory").setValue();
				}.bind(this)
			});
		},

		onSelectCategory: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.hideServiceSpecificFields();

			if (oEvent.getSource().getSelectedItem().getKey() === "DOM") {
				this.formatResidentialServiceUI();
			} else {
				this.formatCommercialServiceUI();
			}

			this.NotificationModel.getData().results.CategoryText = oEvent.getSource().getValue();
		},

		onSelectRequiredSupply: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			if (oEvent.getSource().getSelectedItem().getKey() === "001") {
				this.byId("PhaseSize").setVisible(true);
				this.byId("PhaseSize").setValue();
				this.getSupplyPhaseSize(oEvent.getSource().getSelectedItem().getKey());
			} else {
				this.byId("PhaseSize").setVisible(true);
				this.byId("PhaseSize").setValue();
				this.getSupplyPhaseSize(oEvent.getSource().getSelectedItem().getKey());
			}
			this.NotificationModel.getData().results.PhaseText = oEvent.getSource().getValue();
		},

		onSelectRequiredSupplyLV: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			if (oEvent.getSource().getSelectedItem().getKey() === "001") {
				this.byId("LVPhaseSize").setVisible(true);
				this.byId("LVPhaseSize").setValue();
				this.getCommercialSupplyPhaseSize(oEvent.getSource().getSelectedItem().getKey());
			} else {
				this.byId("LVPhaseSize").setVisible(true);
				this.byId("LVPhaseSize").setValue();
				this.getCommercialSupplyPhaseSize(oEvent.getSource().getSelectedItem().getKey());
			}

			this.NotificationModel.getData().results.PhaseText = oEvent.getSource().getValue();
		},

		onSelectRequiredSupplySize: function(oEvent) {

			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			if (oEvent.getSource().getSelectedItem().getKey() === "001" &&
				this.byId("reqSupplyPhase").getSelectedItem().getKey() === "001" &&
				this.byId("category").getSelectedItem().getKey() === "DOM" &&
				(this.Service === "01" || this.Service === "07")) {
				this.byId("cable").setVisible(true);
			} else {
				this.byId("cable").setVisible(false);
			}

			this.NotificationModel.getData().results.SupplySizeText = oEvent.getSource().getValue();
			this.getMeterTypes("");
		},

		onSelectVoltage: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			if (oEvent.getSource().getSelectedItem().getKey() === "001") {
				this.byId("reqSupplyPhaseLV").setVisible(true);
				this.byId("reqSupplyPhaseLV").setValue();
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(false);
			} else if (oEvent.getSource().getSelectedItem().getKey() === "002") {
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(true);
				this.byId("requiredMV").setValue();
				this.byId("requiredHV").setVisible(false);
				this.byId("LVPhaseSize").setVisible(false);
				this.byId("tariffChoice").setVisible(false);
				this.byId("meterType").setVisible(false);
			} else if (oEvent.getSource().getSelectedItem().getKey() === "003") {
				this.byId("reqSupplyPhaseLV").setVisible(false);
				this.byId("requiredLV").setVisible(false);
				this.byId("requiredMV").setVisible(false);
				this.byId("requiredHV").setVisible(true);
				this.byId("requiredHV").setValue();
				this.byId("LVPhaseSize").setVisible(false);
				this.byId("tariffChoice").setVisible(false);
				this.byId("meterType").setVisible(false);
			}

			this.NotificationModel.getData().results.VoltageText = oEvent.getSource().getValue();

		},

		onSelectReqLVSupplySize: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			switch (oEvent.getSource().getSelectedItem().getKey()) {
				case "5":
				case "10":
				case "20":
				case "40":
				case "60":
				case "80":
				case "100":
					this.byId("meterType").setVisible(true);
					this.byId("meterType").setValue();
					this.getMeterTypes(oEvent.getSource().getSelectedItem().getText());
					break;
				default:
					this.byId("meterType").setVisible(true);
					this.byId("meterType").setValue();
					this.getMeterTypes(oEvent.getSource().getSelectedItem().getText());
					//this.byId("meterType").setSelectedItem().setSelectedKey("002");
					break;
			}

			this.byId("tariffChoice").setVisible(true);
			this.byId("tariffChoice").setValue();
			this.getTariffChase();

			this.NotificationModel.getData().results.SupplySizeText = oEvent.getSource().getValue();
		},

		onSelectUpgradeSupply: function(oEvent) {
			if (oEvent.getSource().getSelectedIndex() === 0) {
				this.NotificationModel.getData().results.Upgrade = "X";
				this.NotificationModel.getData().results.SelectUpgradeText = "Yes";
			} else {
				this.NotificationModel.getData().results.Upgrade = "";
				this.NotificationModel.getData().results.SelectUpgradeText = "No";
			}

			if (oEvent.getSource().getSelectedIndex() === 0 && this.byId("category").getSelectedItem().getKey() === "COM" &&
				this.Service === "04") {
				this.byId("voltage").setVisible(true);
				this.byId("voltage").setValue();
				this.byId("reqSupplyPhaseLV").setVisible(true);
				this.byId("reqSupplyPhaseLV").setValue();
			} else if (oEvent.getSource().getSelectedIndex() === 1 && this.byId("category").getSelectedItem().getKey() === "COM" &&
				this.Service === "04") {
				// hide Service Specific Fields
			}
			if (oEvent.getSource().getSelectedIndex() === 0 && this.byId("category").getSelectedItem().getKey() === "DOM" &&
				this.Service === "04") {
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("reqSupplyPhase").setValue();
			} else if (this.byId("category").getSelectedItem().getKey() === "DOM" && oEvent.getSource().getSelectedIndex() === "1" &&
				this.Service === "04") {
				// hide Service Specific Fields
			}

			if (oEvent.getSource().getSelectedIndex() === 0 &&
				this.Service === "06" && this.byId("category").getSelectedItem().getKey() === "DOM") {
				this.byId("prepaymentMeter").setVisible(true);
				this.byId("prepaymentMeter2").setVisible(false);
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("supplyUnit").setVisible(false);
				this.byId("buildingPlan").setVisible(true);
				this.byId("buildingPlanText").setVisible(true);
			} else if (oEvent.getSource().getSelectedIndex() === 1 &&
				this.Service === "06" && this.byId("category").getSelectedItem().getKey() === "DOM") {
				// hide Service Specific Fields
			}

			if (oEvent.getSource().getSelectedIndex() === 0 &&
				this.Service === "06" && this.byId("category").getSelectedItem().getKey() === "COM") {
				this.byId("prepaymentMeter").setVisible(false);
				this.byId("prepaymentMeter2").setVisible(true);
				this.byId("prepaymentMeter2").setValue();
				this.byId("reqSupplyPhase").setVisible(true);
				this.byId("supplyUnit").setVisible(true);
				this.byId("buildingPlan").setVisible(false);
				this.byId("buildingPlanText").setVisible(false);
			} else if (oEvent.getSource().getSelectedIndex() === 1 &&
				this.Service === "06" && this.byId("category").getSelectedItem().getKey() === "COM") {
					// hide Service Specific Fields
			}

		},

		onSelectSubdivision: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			if (oEvent.getSource().getSelectedItem().getKey() === "X") {
				this.byId("SCCompanyForm").setVisible(false);
				this.byId("SCContractorDetailsForm").setVisible(false);
				this.byId("ElectricConStrip").setVisible(false);
				
			} else {
				this.byId("SCCompanyForm").setVisible(false);
				this.byId("SCContractorDetailsForm").setVisible(true);
				this.byId("ElectricConStrip").setVisible(true);
			
			}
		},

		onSelectCableRequired: function(oEvent) {

			if (oEvent.getSource().getSelectedIndex() === 1) {
				MessageBox.warning(this.getResourceBundle().getText("cableRequiredWarning"));
				this.NotificationModel.getData().results.CableReqText = "No";
			} else {
				this.NotificationModel.getData().results.CableReq = "X";
				this.NotificationModel.getData().results.CableReqText = "Yes";
			}

			oEvent.getSource().setValueState("None");
		},

		onSelectTariff: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.NotificationModel.getData().results.TariffText = oEvent.getSource().getValue();
		},

		onSelectMeterType: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.NotificationModel.getData().results.MeterTypeText = oEvent.getSource().getValue();
		},

		onSelectSupplyUnit: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.NotificationModel.getData().results.SupplyUnitText = oEvent.getSource().getValue();
		},

		onSelectPrepayment: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}

			this.NotificationModel.getData().results.PrepaymentText = oEvent.getSource().getValue();
		},

		onSelectDropDown: function(oEvent) {
			if (this.validateComboBox(oEvent) === false) {
				return;
			}
		},

		onSelectExistingVoltage: function(oEvent) {

			if (oEvent.getSource().getSelectedItem().getKey() === "001") {
				this.byId("existSupplUnt").setSelectedItem().setSelectedKey("001");
				this.byId("ExistingLVPhaseSize").setVisible(true);
				this.byId("requiredExistingMV").setVisible(false);
				this.byId("requiredExistingHV").setVisible(false);
				this.getExistingLVSupplyPhaseSizes();
			} else if (oEvent.getSource().getSelectedItem().getKey() === "002") {
				this.byId("existSupplUnt").setSelectedItem().setSelectedKey("002");
				this.byId("ExistingLVPhaseSize").setVisible(false);
				this.byId("requiredExistingMV").setVisible(true);
				this.byId("requiredExistingHV").setVisible(false);
			} else if (oEvent.getSource().getSelectedItem().getKey() === "003") {
				this.byId("existSupplUnt").setSelectedItem().setSelectedKey("003");
				this.byId("ExistingLVPhaseSize").setVisible(false);
				this.byId("requiredExistingMV").setVisible(false);
				this.byId("requiredExistingHV").setVisible(true);
			}

		},

		onChangeMV: function(oEvent) {
			var mvValue = parseInt(oEvent.getSource().getValue());

			this.NotificationModel.getData().results.MeterType = "002";

			if (mvValue > 1000) {
				this.byId("SCCompanyForm").setVisible(false);
				this.byId("SCContractorDetailsForm").setVisible(false);
				this.byId("ElectricConStrip").setVisible(false);
			
			} else {
				this.byId("SCCompanyForm").setVisible(false);
				this.byId("SCContractorDetailsForm").setVisible(true);
				this.byId("ElectricConStrip").setVisible(true);
			
			}

			this.getMVHVTariffChoice(mvValue);
			this.NotificationModel.getData().results.SupplySizeText = oEvent.getSource().getValue();
		},

		onChangeHV: function(oEvent) {
			var hvValue = parseInt(oEvent.getSource().getValue());
			this.NotificationModel.getData().results.MeterType = "002";

			this.getMVHVTariffChoice(hvValue);
			this.NotificationModel.getData().results.SupplySizeText = oEvent.getSource().getValue();
		},

		formatResidentialServiceUI: function() {

			switch (this.Service) {
				//New Supply/Temporary Supply
				case "01":
				case "07":
					this.byId("SCExistingSupplyForm").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(true);
					this.byId("reqSupplyPhase").setValue();
					this.byId("reqSupplyPhase").focus();
					this.byId("supplyMeter").setVisible(false);
					this.byId("supplyUnit").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("voltage").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Upgrade & Conversion
				case "02":
				case "03":
					this.byId("SCExistingSupplyForm").setVisible(true);
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(true);
					this.byId("reqSupplyPhase").setValue();
					this.byId("voltage").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Overhead
				case "04":
					this.byId("SCExistingSupplyForm").setVisible(true);
					this.byId("reqSupplyPhase").setVisible(true);
					this.byId("reqSupplyPhase").setValue();
					this.byId("upgradeSupply").setVisible(true);
					this.byId("upgradeSupply").setSelectedIndex(-1);
					this.byId("voltage").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Addition
				case "06":
					this.byId("SCExistingSupplyForm").setVisible(true);
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("buildingPlan").setVisible(true);
					this.byId("buildingPlan").setValue();
					this.byId("buildingPlanText").setVisible(true);
					this.byId("prepaymentMeter").setVisible(true);
					this.byId("prepaymentMeter").setValue();
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("upgradeSupply").setVisible(true);
					this.byId("upgradeSupply").setSelectedIndex(-1);
					this.byId("voltage").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(true);
					this.byId("reqSupplyPhase").setValue();
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Relocation
				case "05":
					this.byId("SCExistingSupplyForm").setVisible(true);
					this.byId("serviceTypeInput1").setVisible(true);
					this.byId("serviceTypeInput2").setVisible(true);
					this.byId("serviceTypeInput3").setVisible(true);
					this.byId("serviceTypeInput4").setVisible(true);
					this.byId("serviceTypeInput5").setVisible(true);
					this.byId("serviceTypeInput6").setVisible(true);
					this.byId("relocationServiceText").setVisible(true);
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("voltage").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("SCCompanyForm").setVisible(false);
					this.byId("SCContractorDetailsForm").setVisible(false);

					if (this.byId("serviceTypeInput1").getValue() === "") {
						MessageBox.information(
							"Please specify the relocation service needed and include any relevant documents, such as photographs of the site and items to be relocated"
						);
					}

					break;
			}

		},

		formatCommercialServiceUI: function() {
			switch (this.Service) {
				//New Supply/Temporary Supply
				case "01":
				case "07":
					this.byId("voltage").setVisible(true);
					this.byId("voltage").setValue();
					this.byId("reqSupplyPhase").setVisible(false);
					this.byId("supplyMeter").setVisible(false);
					this.byId("supplyUnit").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Upgrade & Conversion
				case "02":
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(true);
					this.byId("reqSupplyPhaseLV").setValue();
					this.byId("voltage").setVisible(true);
					this.byId("voltage").setValue();
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;
				case "03":
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("voltage").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(true);
					this.byId("tariffChoice").setVisible(true);
					this.byId("relocationServiceText").setVisible(false);
					this.getConversionTariffChoice();
					break;

					//Overhead
				case "04":
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(true);
					this.byId("reqSupplyPhaseLV").setValue();
					this.byId("reqSupplyPhase").setVisible(false);
					this.byId("upgradeSupply").setVisible(true);
					this.byId("upgradeSupply").setSelectedIndex(-1);
					this.byId("voltage").setVisible(true);
					this.byId("voltage").setValue();
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Additional
				case "06":
					this.byId("supplyUnit").setVisible(true);
					this.byId("supplyUnit").setValue();
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(true);
					this.byId("prepaymentMeter2").setValue();
					this.byId("upgradeSupply").setVisible(true);
					this.byId("upgradeSupply").setSelectedIndex(-1);
					this.byId("voltage").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(true);
					this.byId("reqSupplyPhase").setValue();
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("tariffChoice").setVisible(false);
					this.byId("relocationServiceText").setVisible(false);
					break;

					//Relocation
				case "05":
					this.byId("supplyUnit").setVisible(false);
					this.byId("reqSupplyPhaseLV").setVisible(false);
					this.byId("buildingPlan").setVisible(false);
					this.byId("buildingPlanText").setVisible(false);
					this.byId("prepaymentMeter").setVisible(false);
					this.byId("prepaymentMeter2").setVisible(false);
					this.byId("reqSupplyPhase").setVisible(false);
					this.byId("upgradeSupply").setVisible(false);
					this.byId("voltage").setVisible(false);
					this.byId("PhaseSize").setVisible(false);
					this.byId("cable").setVisible(false);
					this.byId("LVPhaseSize").setVisible(false);
					this.byId("requiredLV").setVisible(false);
					this.byId("requiredMV").setVisible(false);
					this.byId("requiredHV").setVisible(false);
					this.byId("meterType").setVisible(false);
					this.byId("serviceTypeInput1").setVisible(true);
					this.byId("serviceTypeInput2").setVisible(true);
					this.byId("serviceTypeInput3").setVisible(true);
					this.byId("serviceTypeInput4").setVisible(true);
					this.byId("serviceTypeInput5").setVisible(true);
					this.byId("serviceTypeInput6").setVisible(true);
					this.byId("tariffChoice").setVisible(false);
					this.byId("SCCompanyForm").setVisible(false);
					this.byId("SCContractorDetailsForm").setVisible(false);
					this.byId("relocationServiceText").setVisible(true);

					if (this.byId("serviceTypeInput1").getValue() === "") {
						MessageBox.information(
							"Please specify the relocation service needed and include any relevant documents, such as photographs of the site and items to be relocated"
						);
					}
					break;
			}

		},

		handleMessageBoxOpen: function(sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.YES) {
						this.onSubmitApplication();
					}
				}.bind(this)
			});
		},

		handleWizardSubmit: function() {
			var results = this.validateAllSteps();

			if (results === true) {
				this.handleMessageBoxOpen("Are you sure you want to submit your application?", "confirm");
			}
		},

		onStep1CompleteActivate: function() {
			this.byId("btnContinue").setVisible(true);
		},

		onConfirm: function() {
			if (this.byId("chkConfirm").getSelected() === true) {
				this.byId("btnSubmit").setEnabled(true);
			} else {
				this.byId("btnSubmit").setEnabled(false);
			}
		},

		validateServiceSpecificFields: function() {
			//Validate existing supply form first if visible 
			if (this.byId("SCExistingSupplyForm").getVisible() === true) {

				if (this.byId("ExistingVoltage").getValue().trim() === "") {
					this.byId("ExistingVoltage").setValueState("Error");
					this.byId("ExistingVoltage").setValueStateText("Select Voltage");
					this.byId("ExistingVoltage").focus();
					MessageBox.error("Select Voltage");
					this._wizard.previousStep();
					return false;
				}

				if (this.byId("ExistingLVPhaseSize").getVisible() === true && this.byId("ExistingLVPhaseSize").getValue().trim() === "") {
					this.byId("ExistingLVPhaseSize").setValueState("Error");
					this.byId("ExistingLVPhaseSize").setValueStateText("Select Phase Size");
					this.byId("ExistingLVPhaseSize").focus();
					MessageBox.error("Select Phase Size");
					this._wizard.previousStep();
					return false;
				}

				if (this.byId("requiredExistingMV").getVisible() === true && this.byId("requiredExistingMV").getValue().trim() === "") {
					this.byId("requiredExistingMV").setValueState("Error");
					this.byId("requiredExistingMV").setValueStateText("Enter Supply Size");
					this.byId("requiredExistingMV").focus();
					MessageBox.error("Enter Supply Size");
					this._wizard.previousStep();
					return false;
				}

				if (this.byId("requiredExistingHV").getVisible() === true && this.byId("requiredExistingHV").getValue().trim() === "") {
					this.byId("requiredExistingHV").setValueState("Error");
					this.byId("requiredExistingHV").setValueStateText("Enter Supply Size");
					this.byId("requiredExistingHV").focus();
					MessageBox.error("Enter Supply Size");
					this._wizard.previousStep();
					return false;
				}

				this.byId("ExistingVoltage").setValueState("None");
				this.byId("ExistingVoltage").setValueStateText("");
				this.byId("ExistingLVPhaseSize").setValueState("None");
				this.byId("ExistingLVPhaseSize").setValueStateText("");
				this.byId("requiredExistingMV").setValueState("None");
				this.byId("requiredExistingMV").setValueStateText("");
				this.byId("requiredExistingHV").setValueState("None");
				this.byId("requiredExistingHV").setValueStateText("");
			}

			//Validate service required form
			var oForm = this.byId("SCServiceRequiredForm").getContent();

			try {
				oForm.forEach(function(Field) {
					if (typeof Field.getValue === "function") {
						if ((!Field.getValue() || Field.getValue().length < 1) && Field.getVisible() === true && Field.getId().indexOf(
								"serviceTypeInput") !== 39) {
							if (typeof Field.getItems === "function") {
								if (Field.getSelectedItem() === null) {
									Field.setValueState("Error");
									Field.setValueStateText("Select Value on the drop down");
									Field.focus();
								}
							} else {
								Field.setValueState("Error");
								Field.setValueStateText("Enter required value");
								Field.focus();
							}
							throw new Error("Break the loop.");
						} else {
							Field.setValueState("None");
						}
					} else if (typeof Field.getSelectedIndex === "function") {
						if (Field.getSelectedIndex() === -1 && Field.getVisible() === true) {
							Field.setValueState("Error");
							throw new Error("Break the loop.");
						} else {
							Field.setValueState("None");
						}
					}

				});
			} catch (error) {
				this._wizard.previousStep();
				return false;
			}

			this.validateContractorDetails();
		},

		validateContractorDetails: function() {

			if (this.byId("SCContractorDetailsForm").getVisible() === true) {
				if (this.ElectricalContractorValid !== "X") {
					MessageBox.error("Before proceeding, kindly click on the search button to verify the electrical contractor registration number");
					this._wizard.previousStep();
					return;
				}
			}
		},

		onSubmitApplication: function() {

			this.createEntryForNotification();
			this.createEntryForAttachment();
			sap.ui.core.BusyIndicator.show(0);
			if (this._oODataModel.hasPendingChanges()) {
				this._oODataModel.submitChanges({
					success: function(oData) {
						this._oODataModel.resetChanges();

						var Qnum = oData.__batchResponses[0].__changeResponses[0].data.Qmnum;
						var errorMessage = oData.__batchResponses[0].__changeResponses[0].data.ErrMessage;
						sap.ui.core.BusyIndicator.hide();

						if (Qnum !== "") {
							this.onShowFormattedTextInfo(Qnum);
						} else {
							this.onShowFormattedTextError(errorMessage);
						}

					}.bind(this),
					error: function(oError) {
						this._oODataModel.resetChanges();
						sap.ui.core.BusyIndicator.hide();
						var mErrorMessage;
						if (oError.statusCode === 500) {
							mErrorMessage = "An exception occured. Please contact service desk";
						} else {
							mErrorMessage = oError.message + " because of a " + oError.statusText;
						}
						MessageBox.error(mErrorMessage);
					}.bind(this)
				});
			}

		},

		onDisplayReviewPage: function() {
			this._oNavContainer.to(this.byId("ReviewPage"));
		},

		onNavBackReview: function() {
			this._oNavContainer.back();
		},

		createEntryForNotification: function() {
			// create notification properties
			var oProperties = {
				ErfNo: String(this.NotificationModel.getData().results.Erf),
				ContactTitle: this.NotificationModel.getData().results.ContactTitle,
				ContactName: this.NotificationModel.getData().results.ContactName,
				ContactSurname: this.NotificationModel.getData().results.ContactSurname,
				ContactCellNo: this.NotificationModel.getData().results.ContactCellNo,
				ContactEmail: this.NotificationModel.getData().results.ContactEmail,
				OwnerTitle: this.PropertyOwnerModel.getData().results.Title,
				OwnerName: this.PropertyOwnerModel.getData().results.FirstName,
				OwnerSurname: this.PropertyOwnerModel.getData().results.LastName,
				OwnerCellNo: this.PropertyOwnerModel.getData().results.CellNo,
				OwnerEmail: this.PropertyOwnerModel.getData().results.Email,
				OwnerPartner: this.NotificationModel.getData().results.Partner,
				PayerPartner: this.NotificationModel.getData().results.PayerPartner,
				PayerVatNo: this.ResponsiblePayerModel.getData().results.VatNo,
				PayerTaxInvCheck: this.NotificationModel.getData().results.PayerTaxInvCheck,
				ServiceType: this.NotificationModel.getData().results.ServiceType,
				Category: this.NotificationModel.getData().results.Category,
				Supply: this.NotificationModel.getData().results.Supply,
				Phase: this.NotificationModel.getData().results.Phase,
				CableReq: this.NotificationModel.getData().results.CableReq,
				Voltage: this.NotificationModel.getData().results.Voltage,
				MeterType: this.NotificationModel.getData().results.MeterType,
				TariffChoice: this.NotificationModel.getData().results.TariffChoice,
				Upgrade: this.NotificationModel.getData().results.Upgrade,
				Subdivision: this.NotificationModel.getData().results.Subdivision,
				City: this.SelectedProperyModel.getData().results.City,
				Suburb: this.SelectedProperyModel.getData().results.Suburb,
				StreetNo: String(this.SelectedProperyModel.getData().results.StreetNo),
				StreetAdr: String(this.SelectedProperyModel.getData().results.StreetAdr),
				PostalCode: String(this.SelectedProperyModel.getData().results.PostalCode),
				PayerAddressString: this.NotificationModel.getData().results.PayerAddressString,
				MeterNo: this.byId("metNo").getValue(),
				ExistDeviceCategory: this.NotificationModel.getData().results.ExistDeviceCategory,
				ExistSuppCategory: this.NotificationModel.getData().results.ExistSuppCategory,
				ExistSuppPhase: this.NotificationModel.getData().results.ExistSuppPhase,
				ExistSuppVoltage: this.NotificationModel.getData().results.ExistSuppVoltage,
				ExistSuppUnit: this.NotificationModel.getData().results.ExistSuppUnit,
				Plno: this.NotificationModel.getData().results.Plno,
				RelocationDetail: this.NotificationModel.getData().results.RelocationDetail,
				NoOfMeters: this.NotificationModel.getData().results.NoOfMeters,
				InstallerReg: this.byId("companyReg").getValue(),
				InstallerName: this.byId("companyReg").getValue()
			};

			this._oContextNotes = this._oODataModel.createEntry("/CreateNotificationSet", {
				properties: oProperties,
				success: function() {},
				error: function(oError) {
				
				}.bind(this)
			});

		},

		createEntryForAttachment: function() {
			// create notification properties

			var oProperties = {};
			var isAttachmentFound = false;

			if (this.AttachmentsModel.getData().results.length !== 0) {

				if (this.AttachmentsModel.getData().results.FileContent !== undefined) {
					oProperties.FileName = this.AttachmentsModel.getData().results.FileName;
					oProperties.FileType = this.AttachmentsModel.getData().results.FileType;
					oProperties.FileContent = this.AttachmentsModel.getData().results.FileContent;
					isAttachmentFound = true;
				}
			}

			if (this.Pic1Properties !== undefined) {
				oProperties.Pic1FileName = this.Pic1Properties.Pic1FileName;
				oProperties.Pic1FileType = this.Pic1Properties.Pic1FileType;
				oProperties.Pic1FileContent = this.Pic1Properties.Pic1FileContent;
				isAttachmentFound = true;
			}

			if (this.Pic2Properties !== undefined) {
				oProperties.Pic2FileName = this.Pic2Properties.Pic2FileName;
				oProperties.Pic2FileType = this.Pic2Properties.Pic2FileType;
				oProperties.Pic2FileContent = this.Pic2Properties.Pic2FileContent;
				isAttachmentFound = true;
			}

			if (this.Pic3Properties !== undefined) {
				oProperties.Pic3FileName = this.Pic3Properties.Pic3FileName;
				oProperties.Pic3FileType = this.Pic3Properties.Pic3FileType;
				oProperties.Pic3FileContent = this.Pic3Properties.Pic3FileContent;
				isAttachmentFound = true;
			}

			if (this.Pic4Properties !== undefined) {
				oProperties.Pic4FileName = this.Pic4Properties.Pic4FileName;
				oProperties.Pic4FileType = this.Pic4Properties.Pic4FileType;
				oProperties.Pic4FileContent = this.Pic4Properties.Pic4FileContent;
				isAttachmentFound = true;
			}

			if (this.Pic5Properties !== undefined) {
				oProperties.Pic5FileName = this.Pic5Properties.Pic5FileName;
				oProperties.Pic5FileType = this.Pic5Properties.Pic5FileType;
				oProperties.Pic5FileContent = this.Pic5Properties.Pic5FileContent;
				isAttachmentFound = true;
			}

			if (isAttachmentFound === true) {
				this._oContextAttachments = this._oODataModel.createEntry("/AttachmentsSet", {
					properties: oProperties,
					success: function() {},
					error: function(oError) {
						var mErrorMessage;
						if (oError.statusCode === 500) {
							mErrorMessage = "An exception occured. Please contact service desk";
						} else {
							mErrorMessage = oError.message + " because of a " + oError.statusText;
						}
						MessageBox.error(mErrorMessage);
					}.bind(this)
				});
			}
			//	}
		},

		convertToSAPDate: function(vDate) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddTKK:mm:ss"
			});
			return dateFormat.format(new Date(vDate));
		},

		onShowFormattedTextInfo: function(notification) {
			MessageBox.success("Notification No: " + notification + " Successfully Created", {
				actions: [MessageBox.Action.CLOSE],
				title: "Application Complete",
				id: "messageBoxId2",
				contentWidth: "100px",
				styleClass: sResponsivePaddingClasses,
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.CLOSE) {
						//this.getRouter().navTo("ListOfApplications");

						this.getRouter().navTo("ListOfApplications", {
							ApplicSubmitted: true
						});
					}
				}.bind(this)
			});
		},

		onNavBack: function() {
			this.getRouter().navTo("ServiceConnection", {
				ApplicSubmitted: false
			});
		},

		onShowFormattedTextError: function(message) {
			MessageBox.error(message, {
				actions: [MessageBox.Action.CLOSE],
				title: "Notification Error",
				id: "messageBoxId3",
				contentWidth: "100px",
				styleClass: sResponsivePaddingClasses,
				onClose: function(oAction) {}.bind(this)
			});
		},

		clearAllForms: function() {

			this.byId("chkConfirm").setSelected(false);
			this.byId("btnSubmit").setEnabled(false);

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

		onUploadBuildingPlan: function(oEvent) {

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
			this.AttachmentsModel.getData().results.BuildFileContent = this.Properties.FileContent;
			this.AttachmentsModel.getData().results.BuildFileName = this.Properties.FileName;
			this.AttachmentsModel.getData().results.BuildFileType = this.Properties.FileType;

		},

		onUploadRelocationDetails1: function(oEvent) {

			this.Pic1Properties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.Pic1Properties.Pic1FileContent = base64String.split(',')[1];
			});

			this.Pic1Properties.Pic1FileContent = that.FileContent;
			this.Pic1Properties.Pic1FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.Pic1Properties.Pic1FileType = "docx";
			} else {
				this.Pic1Properties.Pic1FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);

		},

		onUploadRelocationDetails2: function(oEvent) {
			this.Pic2Properties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.Pic2Properties.Pic2FileContent = base64String.split(',')[1];
			});

			this.Pic2Properties.Pic2FileContent = that.FileContent;
			this.Pic2Properties.Pic2FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.Pic2Properties.Pic2FileType = "docx";
			} else {
				this.Pic2Properties.Pic2FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);

		},

		onUploadRelocationDetails3: function(oEvent) {
			this.Pic3Properties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.Pic3Properties.Pic3FileContent = base64String.split(',')[1];
			});

			this.Pic3Properties.Pic3FileContent = that.FileContent;
			this.Pic3Properties.Pic3FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.Pic3Properties.Pic3FileType = "docx";
			} else {
				this.Pic3Properties.Pic3FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);

		},

		onUploadRelocationDetails4: function(oEvent) {
			this.Pic4Properties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.Pic4Properties.Pic4FileContent = base64String.split(',')[1];
			});

			this.Pic4Properties.Pic4FileContent = that.FileContent;
			this.Pic4Properties.Pic4FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.Pic4Properties.Pic4FileType = "docx";
			} else {
				this.Pic4Properties.Pic4FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);

		},

		onUploadRelocationDetails5: function(oEvent) {
			this.Pic5Properties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.Pic5Properties.Pic5FileContent = base64String.split(',')[1];
			});

			this.Pic5Properties.Pic5FileContent = that.FileContent;
			this.Pic5Properties.Pic5FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.Pic5Properties.Pic5FileType = "docx";
			} else {
				this.Pic5Properties.Pic5FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		handleMeterValueHelp: function() {
			var oView = this.getView();

			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.MeterDetails",
					controller: this
				}).then(function(oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}
			this._pValueHelpDialog.then(function(oValueHelpDialog) {
				this._configValueHelpDialog();
				oValueHelpDialog.open();
			}.bind(this));
		},

		_configValueHelpDialog: function() {
			
		},

		handleClose: function(oEvent) {
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			var path = oEvent.getParameter("selectedContexts")[0].getPath();

			var Properties = this.getView().getModel("MeterDetailsModel").getProperty(path);

			this.byId("metNo").setValue(Properties.MeterNo);
			this.byId("devCategory").setValue(Properties.DeviceCategoryText);
			this.byId("metPhase").setValue(Properties.ExistSuppPhaseText);

			this.ExistingCategory = Properties.ExistSuppCategoryCode;
			this.ExistingPhase = Properties.ExistSuppPhase;

			this.NotificationModel.getData().results.ExistDeviceCategory = Properties.ExistDeviceCategory;
			this.NotificationModel.getData().results.ExistSuppCategory = this.ExistingCategory;
			this.NotificationModel.getData().results.ExistSuppPhase = this.ExistingPhase;

			//if no existing phase, display drop
			if (this.ExistingPhase === "") {
				this.byId("metPhase").setVisible(false);
				this.byId("existPhase").setVisible(true);
			} else {
				this.byId("metPhase").setVisible(true);
				this.byId("existPhase").setVisible(false);
			}
			//If category = DOM , then Voltage must default to LV
			if (this.ExistingCategory === "DOM") {
				this.byId("ExistingVoltage").getSelectedItem().setKey("001");
				this.byId("ExistingVoltage").setEnabled(false);
				this.byId("existSupplUnt").setSelectedItem().setSelectedKey("001");
				this.byId("ExistingLVPhaseSize").setVisible(true);
				this.byId("requiredExistingMV").setVisible(false);
				this.byId("requiredExistingHV").setVisible(false);
				this.getExistingLVSupplyPhaseSizes();
			} else {
				this.byId("ExistingVoltage").setEnabled(true);
			}

			if (this.ExistingCategory === "DOM" && Properties.ExistDeviceCategory === "PP") {
				MessageBox.error("A Pre-payment meter already exist conversion not possible.");
				this._wizard.invalidateStep(this.byId("SCWizard"));
			} else {
				this._wizard.validateStep(this.byId("SCWizard"));
			}

		},

		hideServiceSpecificFields: function() {
			this.byId("supplyMeter").setVisible(false);
			this.byId("supplyMeter").setValue();
			this.byId("supplyUnit").setVisible(false);
			this.byId("supplyUnit").setValue();
			this.byId("prepaymentMeter").setVisible(false);
			this.byId("prepaymentMeter").setValue();
			this.byId("prepaymentMeter2").setVisible(false);
			this.byId("prepaymentMeter2").setValue();
			this.byId("upgradeSupply").setVisible(false);
			this.byId("upgradeSupply").setSelectedIndex(-1);
			this.byId("buildingPlan").setVisible(false);
			this.byId("buildingPlanText").setVisible(false);
			this.byId("voltage").setVisible(false);
			this.byId("voltage").setValue();
			this.byId("reqSupplyPhase").setVisible(false);
			this.byId("reqSupplyPhase").setValue();
			this.byId("reqSupplyPhaseLV").setVisible(false);
			this.byId("reqSupplyPhaseLV").setValue();
			this.byId("PhaseSize").setVisible(false);
			this.byId("PhaseSize").setValue();
			this.byId("cable").setVisible(false);
			this.byId("cable").setSelectedIndex(-1);
			this.byId("LVPhaseSize").setVisible(false);
			this.byId("LVPhaseSize").setValue();
			this.byId("requiredLV").setVisible(false);
			this.byId("requiredLV").setValue();
			this.byId("requiredMV").setVisible(false);
			this.byId("requiredMV").setValue();
			this.byId("requiredHV").setVisible(false);
			this.byId("requiredHV").setValue();
			this.byId("meterType").setVisible(false);
			this.byId("meterType").setValue();
			this.byId("tariffChoice").setVisible(false);
			this.byId("serviceTypeInput1").setVisible(false);
			this.byId("serviceTypeInput2").setVisible(false);
			this.byId("serviceTypeInput3").setVisible(false);
			this.byId("serviceTypeInput4").setVisible(false);
			this.byId("serviceTypeInput5").setVisible(false);
			this.byId("serviceTypeInput6").setVisible(false);
			this.byId("upgradeSupply").setVisible(false);
			this.byId("upgradeSupply").setSelectedIndex(-1);
			this.byId("tariffChoice").setVisible(false);
			this.byId("tariffChoice").setValue();
			this.byId("relocationServiceText").setVisible(false);

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

		onAllowNumbersOnly: function(oEvent) {
			var number = oEvent.getSource().getValue();

			if (number.length <= 3) {
				this.oldNumber = number;
			} else {
				oEvent.getSource().setValue(this.oldNumber);
			}
		},

		onVerifyInstaller: function(oEvent) {
			var number = oEvent.getSource().getValue();

			if (number.trim() !== "") {
				this.getInstallerDetails(number);
			}
		},

		onVerifyElectrical: function(oEvent) {
			var number = oEvent.getSource().getValue();

			if (number.trim() !== "") {
				this.getElectricalDetails(number);
			}
		},

		onVerifyECSA: function(oEvent) {
			var number = oEvent.getSource().getValue();

			if (number.trim() !== "") {
				this.getECSADetails(number);
			}
		},

		onFileSizeExceed: function(oEvent) {
			MessageBox.error("File size exceeded. You can only upload max size of 5MB");
		},

		clearHiddenFields: function() {
			var oForm = this.byId("SCServiceRequiredForm").getContent();

			oForm.forEach(function(Field) {
				if (typeof Field.getValue === "function") {
					if (Field.getVisible() === false) {
						Field.setValue("");
					}
				} else if (typeof Field.getSelectedIndex === "function") {
					if (Field.getVisible() === true) {
						Field.setSelectedIndex(-1);
					}
				}

			});
		},

		NavigateToStep1: function() {
			this.handleNavigationToStep(0);
		},

		handleCancelMessageBoxOpen: function(sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.YES) {
						this.handleNavigationToStep(0);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
						this.byId("chkConfirm").setSelected(false);
						this.byId("btnSubmit").setEnabled(false);
						this.getRouter().navTo("ListOfApplications", {
							ApplicSubmitted: true
						});
					}
				}.bind(this)
			});
		},

		handleWizardCancel: function() {
			this.handleCancelMessageBoxOpen("Are you sure you want to cancel this application?", "confirm");
		},

		validateAllSteps: function() {
			var oForm = this.byId("SCServiceRequiredForm").getContent();

			oForm.forEach(function(Field) {
				if (typeof Field.getValue === "function") {
					if ((!Field.getValue() || Field.getValue().length < 1) && Field.getVisible() === true && Field.getId().indexOf(
							"serviceTypeInput") !== 39) {
						if (typeof Field.getItems === "function") {
							if (Field.getSelectedItem() === null) {
								Field.setValueState("Error");
								Field.setValueStateText("Select Value on the drop down");
								Field.focus();
								this.handleNavigationToStep(0);
								return false;
							}
						} else {
							Field.setValueState("Error");
							Field.setValueStateText("Enter required value");
							Field.focus();
							this.handleNavigationToStep(0);
							return false;
						}
					} else {
						Field.setValueState("None");
					}
				} else if (typeof Field.getSelectedIndex === "function") {
					if (Field.getSelectedIndex() === -1 && Field.getVisible() === true) {
						Field.setValueState("Error");
						this.handleNavigationToStep(0);
						return false;
					} else {
						Field.setValueState("None");
					}
				}
			});

			return true;
		}

	});

});