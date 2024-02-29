sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/Fragment',
	'sap/ui/Device',
	'sap/ui/model/Sorter'
], function(BaseController, JSONModel, Fragment, Device, Sorter) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.Authorizations", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.Authorizations
		 */
		onInit: function() {
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_PROXY_AUTH_LCL");
			this.oRouteHandler = sap.ui.core.UIComponent.getRouterFor(this);

			var oProxyModel = new JSONModel({
				HTML: "<p>This service is used to grant someone else, such as an electrical contractor, SSEG installer or any other relevant party, authorisation to apply for energy-related services on your behalf, using e-services. If you are submitting an energy services application for your own residential property (or a commercial property for which you are the nominated official or administrator) proxy authorisation is not required.</p>" +
					"<p><strong>How to apply</strong></p>" +
					"<p>Complete the <strong>'Grant proxy authorisation'</strong> and upload the accompanying required documents. A proxy authorisation will be generated to give your specified proxy authority to apply for energy services on your behalf for a specified period. </p>" +
                    
                    "<p>You will need the <strong>following documents</strong> to complete the application:</p>" +
					"<ol>" +
					"<li> A copy of your identity document (ID)  </li>" +
					"<li> A copy of the ID of the person you are assigning proxy authorisation to</li>" +
					"<li> A signed proxy authorisation letter </li>" +
                    "</ol>"+
                    
                    "<p><strong>Please take note of the following:</strong></p>" +
					"<ol>" +
					"<li> Proxy authorisation can only be given to <strong>natural persons,</strong> not to companies. Therefore, if you have contracted a company to do work for you, you must first request <strong>the ID number</strong> of the person who will be handling your applications.</li>" +
					"<li> Proxy authorisation can only be given <strong>to e-Services users with valid accounts.</strong> Before granting proxy permission, check that the person to whom you would like to give permission is a registered e-Services user.</li>" +
					"<li> Proxy authorisation will be given to a person for a specified period of time of no more than 12 months. Once this time has elapsed, you must reapply to 'Grant proxy authorisation' with a new time period. </li>" +
					"<li> You can revoke proxy authorisation after you have submitted a request. To revoke proxy authorisation, click on the 'Revoke' button. Once revoked, you must apply for a new 'Grant proxy authorisation' for a new period, if required. </li>" +
                    "</ol>"
			});

			this.getView().setModel(oProxyModel, "ProxyModel");
			this.oRouteHandler.getRoute("Authorizations").attachPatternMatched(this.onPatternMatched, this);
			this._viewModel = new JSONModel({
				fileSize: 5,
				enableSubmit: false
			});

			this.getView().setModel(this._viewModel, "ViewModel");
			this._mViewSettingsDialogs = {};
		},

		onPatternMatched: function() {
			this._loadData();
			this.getView().addStyleClass('sapUiSizeCompact');
		},

		onNavBack: function() {
			this.getRouter().navTo("LandingPage");
		},

		_loadData: function() {
			sap.ui.core.BusyIndicator.show();
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			//var data = [];
			this._oODataModel.read("/ProxAppHeaderSet", {
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].AppReqid === "0000000000") {
							this.BP = oData.results[i].Partner;
							oData.results.pop(oData.results[i]);
						} else {
							this.BP = oData.results[i].Partner;
						}
					}
					sap.ui.core.BusyIndicator.hide();
					oHeaderModel.setData(oData.results);
					this.getView().setModel(oHeaderModel, "HeaderModel");
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		onNewAppPress: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("NewProxyApplication", {
				AppID: "NEW",
				BP: this.BP
			});
		},

		onDisplayApplication: function(oEvent) {
			var oRouter = this.getOwnerComponent().getRouter();
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("HeaderModel").getPath();
			var oApplication = this.getView().getModel("HeaderModel").getProperty(sPath);
			oRouter.navTo("NewProxyApplication", {
				AppID: oApplication.AppReqid,
				BP: this.BP
			});
		},
		
		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.Proxy.AdditionalInfo", this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},


		handlePopoverPress: function(oEvent) {
			var oButton = oEvent.getSource(),
				oView = this.getView(),
				oObject = oButton.getBindingContext("HeaderModel").getObject();
			var sStatusType = oEvent.getSource().getFieldGroupIds()[0];
			switch (sStatusType) {
				case "I":
					// code block
					this.getView().getModel("ViewModel").setProperty("/MessageTitle", "Application in Progress:");
					this.getView().getModel("ViewModel").setProperty("/Message",
						"Your application is currently being processed. You will be notified of the outcome via email.");
					break;
				case "A":
					// code block
					this.getView().getModel("ViewModel").setProperty("/MessageTitle", "Application Approved:");
					this.getView().getModel("ViewModel").setProperty("/Message", "Your application has been reviewed and approved.");

					break;
				case "R":
					// code block
					this.getView().getModel("ViewModel").setProperty("/MessageTitle", "Application Rejected:");
					this.getView().getModel("ViewModel").setProperty("/Message", oObject.RejReason);
					//MessageBox.information("Your booking will be reserved for 24 hours.");
					break;
				default:
					// code block
			}
			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "capetown.gov.zaEnergyApplication.view.fragment.Proxy.Popover",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
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

		handleSortButtonPressed: function() {
			this.getViewSettingsDialog("capetown.gov.zaEnergyApplication.view.fragment.Proxy.SortDialog")
				.then(function(oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},

		handleSortDialogConfirm: function(oEvent) {
			var oTable = this.byId("tblHistory"),
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
		}

	});

});