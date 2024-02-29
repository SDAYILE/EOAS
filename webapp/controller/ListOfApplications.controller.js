sap.ui.define([
	//"sap/ui/core/mvc/Controller"
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	"sap/ui/Device"
], function(BaseController, MessageBox, JSONModel, Sorter, Fragment, Device) {
	"use strict";

	var sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.ListOfApplications", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.ListOfApplications
		 */
		onInit: function() {
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_EOAS");

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

			this.getRouter().getRoute("ListOfApplications").attachPatternMatched(this._onObjectMatched, this);

			this._mViewSettingsDialogs = {};

		},

		_onObjectMatched: function(oEvent) {
			//this.getApplicantsData();
			this.ApplicSubmitted = undefined;
			this.ApplicSubmitted = oEvent.getParameter("arguments").ApplicSubmitted;

			this.getView().addStyleClass('sapUiSizeCompact');

			this.getApplicantDetails();
			
		},

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.AdditionalInfo", this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		onNewApplication: function() {
		
			this.onDisplayTerms();
		},

		onWithdraApplication: function() {
			this.createEntryForWithdrawal();
			sap.ui.core.BusyIndicator.show(0);
			if (this._oODataModel.hasPendingChanges()) {
				this._oODataModel.submitChanges({
					success: function(oData) {
						this._oODataModel.resetChanges();
						this.byId("btnWithdraw").setVisible(false);
						this.byId("idApplications").removeSelections();
						this.getApplications();

						var StatusUpdate = oData.__batchResponses[0].__changeResponses[0].data.StatusUpdated;

						if (StatusUpdate === "X") {
							this.onShowFormattedText();
						} else {
							MessageBox.error("Notification could not be withdrawn. Please contact service desk");
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

		onSelectApplication: function() {
			var path = this.getView().byId("idApplications").getSelectedItem().getBindingContext("ApplicationsModel").getPath();

			var Properties = this.getView().getModel("ApplicationsModel").getProperty(path);

			this.Notification = String(Properties.Notification);

			if (Properties.Withdraw === "X") {
				this.byId("btnWithdraw").setVisible(true);
				this.byId("btnWithdraw").setEnabled(true);
			} else {
				this.byId("btnWithdraw").setVisible(true);
				this.byId("btnWithdraw").setEnabled(false);
			}
		},

		onDisplayTerms: function() {
			if (!this._oTermsDialog) {
				this._oTermsDialog = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.TermsNConditions", this);
				this.getView().addDependent(this._oTermsDialog);
			}
			this._oTermsDialog.open();
		},

		onAgreeTerms: function() {
			this._oTermsDialog.close();

			this.getRouter().navTo("ServiceConnection", {
				ApplicSubmitted: this.ApplicSubmitted
			});
		},

		onCancelTerms: function() {
			this._oTermsDialog.close();
		},

		getApplicantDetails: function() {
			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ApplicantDetailsSet", {
				success: function(oData) {
					var oApplicantModel = new JSONModel({
						results: oData.results[0]
					});

					this.BP = oData.results[0].Partner;

					oApplicantModel.refresh();

					this.getView().setModel(oApplicantModel, "ApplicantDetailsModel");
				
					this.getApplications();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving applicant details. Please try again later");
				}.bind(this)
			});
		},

		getApplications: function() {
		
			var FilterPartner = new sap.ui.model.Filter("Partner", "EQ", this.BP);

			sap.ui.core.BusyIndicator.show(0);
			this._oODataModel.read("/ApplicationsSet", {
				filters: [FilterPartner],
				success: function(oData) {

					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i].Notification = parseInt(oData.results[i].Notification);

						switch (oData.results[i].ServiceType) {
							//New Supply
							case "01":
								oData.results[i].ServiceType = "New Supply";
								break;
							case "07":
								oData.results[i].ServiceType = "Temporary Supply";
								break;
								//Upgrade & Conversion
							case "02":
								oData.results[i].ServiceType = "Upgrade/Downgrade Existing Supply";

								break;
							case "03":
								oData.results[i].ServiceType = "Conversion from Credit to Prepayment";
								break;
								//Overhead
							case "04":
								oData.results[i].ServiceType = "Overhead to Underground Conversion";
								break;
								//Addition
							case "06":
								oData.results[i].ServiceType = "Additional Meter";
								break;
								//Relocation
							case "05":
								oData.results[i].ServiceType = "Relocation of Services";
								break;
						}
					}

					var oApplicationsModel = new JSONModel({
						results: oData.results
					});

					oApplicationsModel.refresh();

					this.getView().setModel(oApplicationsModel, "ApplicationsModel");
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Error occured while retrieving property details. Please try again later");
				}.bind(this)
			});
		},

		createEntryForWithdrawal: function() {
			// create Withdrawal properties
			var oProperties = {
				Notification: this.Notification
			};

			this._oContextNotes = this._oODataModel.createEntry("/WithdrawApplicationSet", {
				properties: oProperties,
				success: function() {},
				error: function(oError) {
				
				}.bind(this)
			});
		},

		onShowFormattedText: function() {
			MessageBox.success("Notification " + this.Notification + " has been updated", {
				actions: [MessageBox.Action.CLOSE],
				title: "Notification Update",
				id: "messageBoxId",
				contentWidth: "100px",
				styleClass: sResponsivePaddingClasses,
				onClose: function(oAction) {}.bind(this)
			});
		},

		onDisplayApplication: function(oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("ApplicationsModel").getPath();
			var oNotification = this.getView().getModel("ApplicationsModel").getProperty(sPath);

			this.getRouter().navTo("ApplicationDetails", {
				Notification: oNotification.Notification
			});
		},

		onNavBack: function() {
			this.getRouter().navTo("LandingPage");
		},

		handleSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("idApplications"),
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
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.ServiceConnection.SortApplications")
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
		}

	});

});