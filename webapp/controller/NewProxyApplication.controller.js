sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	'sap/m/MessageToast'
], function(BaseController, JSONModel, History, Fragment, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.NewProxyApplication", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.NewProxyApplication
		 */
		onInit: function() {
			// HTML string bound to the formatted text control
			var oProxyModel = new JSONModel({
				HTML: "<p>This service is used to grant someone else, such as an electrical contractor, SSEG installer or any other relevant party, authorisation to apply for energy-related services on your behalf, using e-services. If you are submitting an energy services application for your own residential property (or a commercial property for which you are the nominated official or administrator) proxy authorisation is not required.</p>" +
					"<p><strong>How to apply</strong></p>" +
					"<p>Complete the <strong>'Grant proxy authorisation'</strong> and upload the accompanying required documents. A proxy authorisation will be generated to give your specified proxy authority to apply for energy services on your behalf for a specified period. </p>" +

					"<p>You will need the <strong>following documents</strong> to complete the application:</p>" +
					"<ol>" +
					"<li> A copy of your identity document (ID)  </li>" +
					"<li> A copy of the ID of the person you are assigning proxy authorisation to</li>" +
					"<li> A signed proxy authorisation letter </li>" +

					"</ol>" +

					"<p><strong>Please take note of the following:</strong></p>" +
					"<ol>" +
					"<li> Proxy authorisation can only be given to <strong>natural persons,</strong> not to companies. Therefore, if you have contracted a company to do work for you, you must first request <strong>the ID number</strong> of the person who will be handling your applications.</li>" +
					"<li> Proxy authorisation can only be given <strong>to e-Services users with valid accounts.</strong> Before granting proxy permission, check that the person to whom you would like to give permission is a registered e-Services user.</li>" +
					"<li> Proxy authorisation will be given to a person for a specified period of time of no more than 12 months. Once this time has elapsed, you must reapply to 'Grant proxy authorisation' with a new time period. </li>" +
					"<li> You can revoke proxy authorisation after you have submitted a request. To revoke proxy authorisation, click on the 'Revoke' button. Once revoked, you must apply for a new 'Grant proxy authorisation' for a new period, if required. </li>" +
					"</ol>"
			});

			this.getView().setModel(oProxyModel, "ProxyModel");

			var oPropertyModel = new JSONModel({
				HTML: "<p>Properties that are linked to your e-Services profile (as property owner, nominated official or administrator) are presented below. Select a property to grant proxy authorisation for another e-services users to apply for energy services on your behalf.</p>" +
					"<p><strong>Don’t see your property listed here?</strong></p>" +
					"<p>Only properties that fall within one of the City's electricity supply areas will be listed. <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Maps%20and%20statistics/Electricity%20Distribution%20Licence%20and%20Area%20Boundaries.pdf\"  font-weight:600;\">View the City's electricity supply areas</a>   </p>" +

					"<p>For any support-related queries on Energy Services Applications, email Electricityapplication.queries@capetown.gov.za or call one of the electricity area offices:  North: 021 444 1394/6; East: 021 444 8511/2; South 021 400 4750/1/2/3.</p>"
			});

			this.getView().setModel(oPropertyModel, "PropertyModel");

			var oModel = new JSONModel({
				HTML: "<p><strong>Please Note:</strong></p>" +
					"<p>A signed PROXY LETTER OF AUTHORITY must be uploaded below.<br> Download a template of this document  <a href=\"model/ProxyFromLegal.doc\"  font-weight:600;\">HERE</a> - then upload a completed copy.</p>"
			});
			this.getView().setModel(oModel);
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_PROXY_AUTH_LCL");
			this.oRouteHandler = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouteHandler.getRoute("NewProxyApplication").attachPatternMatched(this.onPatternMatched, this);

			this._viewModel = new JSONModel({
				fileSize: 5,
				enableSubmit: false
			});
			this.getView().setModel(this._viewModel, "ViewModel");
		},

		onPatternMatched: function(oEvent) {
			this.AppID = oEvent.getParameter("arguments").AppID;
			this.BP = oEvent.getParameter("arguments").BP;
			this.onInitialiseModels();
			this.onResetWizard();
			var oUpload = this.byId("UploadSet");
			this.byId("rbgTerms").setSelectedIndex(-1);
			this.count = 1;
			this.getView().addStyleClass('sapUiSizeCompact');

			this.Documents = [];
			this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
			this.ProxyDocValid = false;
			this.ProxyPropertyValid = false;
			this.ProxyDetailsValid = false;

			this.onResetDocuments();

			if (this.AppID === "NEW") {
				this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
				this.getView().getModel("ViewModel").setProperty("/isEditable", true);
				this.getView().getModel("ViewModel").setProperty("/viewMode", false);
				oUpload.setNoDataDescription(null);
				oUpload.setNoDataText(null);
				this._loadProperties();

			} else {
				this.getView().getModel("ViewModel").setProperty("/isEditable", false);
				this.getView().getModel("ViewModel").setProperty("/viewMode", true);
				this.onValidateWizardSteps();
				sap.ui.core.BusyIndicator.show();
				oUpload.setNoDataDescription("");
				oUpload.setNoDataText("Owners ID Copies Uploaded");

				oUpload.setUploadEnabled(false);
		
				this._loadHeaderData(this.AppID);
			
			}

			this.byId("lblID").setText("Proxy ID Number");
		
		},

		onInitialiseModels: function() {
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oHeaderModel, "Header");

			var oProperties = new sap.ui.model.json.JSONModel();
			oProperties.setData({
				data: []
			});
			this.getView().setModel(oProperties, "Properties");

			//ResourceModel
			if (!this.oResourceBundle) {
				this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			}
		},

		onResetWizard: function() {
			var oWizard = this.byId("ProxyWizard");
			var oFirstStep = oWizard.getSteps()[0];
			oWizard.discardProgress(oFirstStep);
			oWizard.goToStep(oFirstStep);
			oWizard.invalidateStep(oFirstStep);

		},

		onResetDocuments: function() {
		
			this.byId("Registration").setValue("");
			this.byId("ProxyID").setValue("");
			
			var oUpload = this.byId("UploadSet");
			var oItems = oUpload._getAllItems();
			for (var i = 0; i < oItems.length; i++) {
				oUpload.removeItem(oItems[i]);
			}
		},

		onValidateWizardSteps: function() {
			var step1 = this.getView().byId('PropertyStep');
			step1.setValidated(true);
			var step2 = this.getView().byId('ProxyDetailStep');
			step2.setValidated(true);
		},

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.Proxy.AdditionalInfo", this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		_loadHeaderData: function(AppID) {
			var oHeader = this.getView().getModel("Header");
			var oProperties = this.getView().getModel("Properties").getData().data;
			var sPath = "/ProxAppHeaderSet('" + AppID + "')";
			this._oODataModel.read(sPath, {
				urlParameters: {
					"$expand": "NP_ON_APPID,NP_ON_APPID_2"
				},
				success: function(oData) {
					oHeader.setData(oData);
					for (var i = 0; i < oData.NP_ON_APPID.results.length; i++) {
						if (oData.NP_ON_APPID.results[i].AppReqid === AppID) {
							oProperties.push(oData.NP_ON_APPID.results[i]);
						}
					}
					oHeader.refresh();
					this.getView().getModel("Properties").refresh();
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_loadProperties: function() {
			var oProperties = this.getView().getModel("Properties").getData().data;
			sap.ui.core.BusyIndicator.show();
			this._oODataModel.read("/ProxAppLinePropSet", {
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						// this.aBoardMembers.push(oData.results[i]);
						if (oData.results[i].AppReqid === "") {
							if (oData.results[i].Plno !== "") {
								oProperties.push(oData.results[i]);
							}

						}
					}
					this.getView().getModel("Properties").refresh();
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_loadSelectedProperties: function(AppID) {
			var oProperties = this.getView().getModel("Properties").getData().data;
			var filter = new sap.ui.model.Filter("AppReqid", sap.ui.model.FilterOperator.EQ, AppID);
			this._oODataModel.read("/ProxAppLinePropSet", {
				filters: [filter],
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].AppReqid === AppID) {
							oProperties.push(oData.results[i]);
						}
					}
					this.getView().getModel("Properties").refresh();

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		/* =========================================================== */
		/* set methods                                                 */
		/* =========================================================== */

		_createHeader: function() {
			var oHeaderModel = this.getView().getModel("Header");
			var oProperties = oHeaderModel.getData();

			var idxType = parseInt(this.byId("rbgIDType").getSelectedIndex());
			var IDType = "";

			if (idxType === 1) {
				IDType = "000004";
			} else {
				IDType = "000001";
			}

			oProperties.AppReqid = "";
			oProperties.Partner = this.BP;
			oProperties.Xpartner = this.ProxyBP;
			oProperties.ReqStatus = "I";
			oProperties.Cdate = null;
			oProperties.ProxIdTyp = IDType;

			var aProperties = [];

			var oTable = this.byId("oPropertiesTable");
			var Items = oTable.getSelectedItems();

			for (var i = 0; i < Items.length; i++) {
				var item = Items[i];
				var context = item.getBindingContext("Properties");
				var obj = context.getProperty(null, context);
				obj.AppReqid = "";
				aProperties.push(obj);
				oProperties.Reqname = obj.Address.substring(0, 30);
			}

			oProperties.NP_ON_APPID = aProperties;

			oProperties.NP_ON_APPID_2 = this.Documents;

			this._oODataModel.create("/ProxAppHeaderSet", oProperties, {
				success: function(oData, oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this._oODataModel.resetChanges();
					this.onInitialiseModels();
					if (this.serverResponseHasError(oResponse)) {
						//message handling: render error message
						this.showErrorMessage(this.serverResponseHasError(oResponse));
						return;
					}
					this.count = 1;
		
					this._successMessageBox(oData.AppReqid);
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					this._oODataModel.resetChanges();
					this.showErrorMessage(oError);

				}.bind(this)
			});

		},

		onSubmitApp: function() {
			sap.ui.core.BusyIndicator.show();
			this.onGetUploadCollectionDocuments();

		},

		onUploadDocuments: function(oEvent) {
			var oProp = {};

			if (oEvent !== undefined) {
				var sDocType = oEvent.getSource().getFieldGroupIds()[0];
				var that = this;

				for (var i = 0; i < that.Documents.length; i++) {
					if (that.Documents[i].Docdisc === sDocType) {
						that.Documents.pop(that.Documents[i]);
					}
				}


				var oParameters = oEvent.getParameters();
				//create file reader and file reader event handler
				var oFileReader = new FileReader();
				oFileReader.onload = function() {
					var base64String = oFileReader.result;

					oProp.Content = base64String.split(',')[1];
					that.Documents.push(oProp);
					that.ValidateDocuments();
				};

				oProp.Filename = oParameters.files[0].name;
				var sfileType = oParameters.files[0].type;
				if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
					oProp.Filetype = "docx";
				} else {
					oProp.Filetype = sfileType.substring(sfileType.indexOf('/') + 1);
				}

				oProp.Docdisc = sDocType;

				oFileReader.readAsDataURL(oParameters.files[0]);

			}

		},

		onNavBack: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Authorizations", {}, true);
			}

		},

		ValidateProperties: function(oEvent) {
			var oSource = oEvent.getSource();
			var oItems = oSource.getSelectedItems();
			var step1 = this.getView().byId('PropertyStep');
			this.ProxyPropertyValid = false;
			if (oItems.length > 0) {
				step1.setValidated(true);
				this.ProxyPropertyValid = true;
			} else {
				step1.setValidated(false);
				this.ProxyPropertyValid = false;
			}
			this.onEnableSubmit(oEvent);
		},

		ValidateDocuments: function() {
			// var Doc1 = this.byId("OwnerID").getValue();
			var oUploadSet = this.byId("UploadSet");
			var oItems = oUploadSet._getAllItems();
			var Doc2 = this.byId("ProxyID").getValue();

			this.ProxyDocValid = false;

			if (oItems.length > 0 && Doc2 !== "") {
				this.ProxyDocValid = true;
			} else {
				this.ProxyDocValid = false;
			}
			this.onEnableSubmit();
		},

		_onValidateEmail: function(oEvent) {
			var emailValue = oEvent.getParameter("value");
			var item = oEvent.getSource();
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
			if (!emailValue.match(rexMail)) {
				item.setValueState("Error");
				item.setValueStateText("Invalid email address");
			} else {
				item.setValueState("None");
				item.setValueStateText(null);
			}
			this._validatePoxyDetails();
		},

		isValidPhoneNumber: function(sPhoneNumber) {

			if (!/^((?:\+27|27)|0)(\d{2})-?(\d{3})-?(\d{4})$/.test(sPhoneNumber.replace(/[-()_+|:.\/]/g, ""))) {
				return false;
			} else {
				return true;
			}
		},

		_onValidatePhoneNumber: function(oEvent) {
			var telValue = oEvent.getParameter("value");
			var item = oEvent.getSource();

			if (!this.isValidPhoneNumber(telValue)) {
				item.setValueState("Error");
				item.setValueStateText("Invalid phone number");
				item.focus();
	
			} else {
				item.setValueState("None");
				item.setValueStateText(null);
			}

			this._validatePoxyDetails();
		},

		onValidateStartDate: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getDateValue();
			var oCurrentDay = new Date();
			if (sValue < oCurrentDay) {
				if (sValue.setHours(0, 0, 0, 0) === oCurrentDay.setHours(0, 0, 0, 0)) {
					// Date equals today's date
					oSource.setValueState("None");
					oSource.setValueStateText("");
				} else {
					//check if user has captured event date that is in the past
					oSource.setValueState("Error");
					oSource.setValueStateText("Please enter a period from date that is not in the past");
					return;
				}
			}

			oSource.setValueState("None");
			oSource.setValueStateText("");

			this._validatePoxyDetails();
		},

		onValidateEndDate: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getDateValue();
			var startDate = this.byId("startDate").getDateValue();
			var oCurrentDay = new Date();
			if (sValue < oCurrentDay) {
				//check if user has captured event date that is in the past
				if (sValue.setHours(0, 0, 0, 0) === oCurrentDay.setHours(0, 0, 0, 0)) {
					// Date equals today's date
					oSource.setValueState("None");
					oSource.setValueStateText("");
				} else {
					//check if user has captured event date that is in the past
					oSource.setValueState("Error");
					oSource.setValueStateText("Please enter a period from date that is not in the past");
					return;
				}
			}

			if (sValue < startDate) {
				//check if user has captured event date that is in the past
				oSource.setValueState("Error");
				oSource.setValueStateText("The period to date should be greater then the period from date");
				return;
			}

			//Check if the date is within a year&nbsp;
			var oDateVal = this.byId("startDate").getValue();
			var dateParts = oDateVal.split(".");

			// month is 0-based, that's why we need dataParts[1] - 1
			var dateObject = new Date(+dateParts[2] + 1, dateParts[1] - 1, +dateParts[0]);
			// oDateVal.setYear(oDateVal.getFullYear() + 1);

			if (sValue > dateObject) {
				oSource.setValueState("Error");
				oSource.setValueStateText("Please enter a period from the date that is not greater than a year");
				return;
			}

			oSource.setValueState("None");
			oSource.setValueStateText("");
			this._validatePoxyDetails();
		},

		_validatePoxyDetails: function() {
			var aInputControls = this._getFormFields(this.byId("_ProxyDetailsForm"));
			var oControl;
			var sState;

			this.ProxyDetailsValid = false;
	
			var oWizard = this.byId("ProxyWizard");

			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sType = oControl.getMetadata().getName();

					if (sType === "sap.m.RadioButtonGroup") {
						var idx = oControl.getSelectedIndex();
						if (idx === -1) {
							oWizard.invalidateStep(this.byId("ProxyDetailStep"));
							this.ProxyDetailsValid = false;
							this.onEnableSubmit();
							return;
						} else {
							oWizard.validateStep(this.byId("ProxyDetailStep"));
							this.ProxyDetailsValid = true;
						}
					}

					if (sType === "sap.m.Input" || sType === "sap.m.DatePicker") {
						var sValue = oControl.getValue();
						if (!sValue) {
							oWizard.invalidateStep(this.byId("ProxyDetailStep"));
							this.ProxyDetailsValid = false;
							this.onEnableSubmit();
							return;
						} else {
							oWizard.validateStep(this.byId("ProxyDetailStep"));
							this.ProxyDetailsValid = true;
						}
					

						sState = oControl.getValueState();
						if (sState === "Error") {
							oWizard.invalidateStep(this.byId("ProxyDetailStep"));
							this.ProxyDetailsValid = false;
							this.onEnableSubmit();
							return;
						} else {
							oWizard.validateStep(this.byId("ProxyDetailStep"));
							this.ProxyDetailsValid = true;
						}
					}

				} else {
					sState = oControl.getValueState();
					if (sState === "Error") {
						oWizard.invalidateStep(this.byId("ProxyDetailStep"));
						this.ProxyDetailsValid = false;
						this.onEnableSubmit();
						return;

					} else {
						oWizard.validateStep(this.byId("ProxyDetailStep"));
						this.ProxyDetailsValid = true;
					}
				}
			}
			this.onEnableSubmit();
		},

		onEnableSubmit: function(oEvent) {
			var terms = this.byId("rbgTerms").getSelectedIndex();
			this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
			if (this.ProxyDocValid && this.ProxyPropertyValid && this.ProxyDetailsValid && terms === 0) {
				this.getView().getModel("ViewModel").setProperty("/enableSubmit", true);
			} else {
				this.getView().getModel("ViewModel").setProperty("/enableSubmit", false);
			}

		},

		Validate: function(oEvent) {
			var oSource = oEvent.getSource();
			var idNumber = oSource.getValue();
			var idxType = parseInt(this.byId("rbgIDType").getSelectedIndex());
			var IDType = "";
			// assume everything is correct and if it later turns out not to be, just set this to false
			var correct = true;

			// apply Luhn formula for check-digits
			var tempTotal = 0;
			var checkSum = 0;
			var multiplier = 1;

			for (var i = 0; i < 13; ++i) {
				tempTotal = parseInt(idNumber.charAt(i)) * multiplier;
				if (tempTotal > 9) {
					tempTotal = parseInt(tempTotal.toString().charAt(0)) + parseInt(tempTotal.toString().charAt(1));
				}
				checkSum = checkSum + tempTotal;
				multiplier = (multiplier % 2 === 0) ? 1 : 2;
			}

			if (idxType === 1) {
				IDType = "000004";
				if (idNumber < 5) {
					oSource.setValueStateText("Invalid passport number");
					oSource.setValueState("Error");
					correct = false;
				} else {
					correct = true;
				}
			} else {
				IDType = "000001";
				// SA ID Number have to be 13 digits, so check the length
				if (idNumber.length > 13 || !this.isNumber(idNumber)) {
					//error.append('<p>ID number does not appear to be authentic - input not a valid number</p>');
					correct = false;
				} else {
					if ((checkSum % 10) !== 0) {
						correct = false;
					} else {
						correct = true;
					}
				}
			}
			// if no error found, hide the error message
			if (correct) {
				oSource.setValueStateText("");
				oSource.setValueState("None");
				this.validateProxyID(idNumber, IDType);
			} else {
				oSource.setValueStateText("Invalid ID Number Provided");
				oSource.setValueState("Error");
				//this.ProxyDetailsValid = false;
			}

			this._validatePoxyDetails();
		},

		validateProxyID: function(IDNumber, IDType) {
			var oIdInput = this.byId("oIdInput");
			sap.ui.core.BusyIndicator.show();
	
			var values = {
				im_proxy_ID: IDNumber,
				im_proxy_IDTyp: IDType

			};

			this._oODataModel.setUseBatch(false);
			this._oODataModel.callFunction("/Proxy_ID_BP_Check", {
				method: "GET",
				urlParameters: values,
				success: function(oData, response) {
					sap.ui.core.BusyIndicator.hide();
					if (oData.results.length > 0) {
						this.ProxyBP = oData.results[0].Partner;
						oIdInput.setValueState("None");
						oIdInput.setValueStateText("");
					} else {
						oIdInput.setValueState("Error");
						MessageBox.error(
							"There is no valid Business Partner associated with the provided proxy ID/Passport number. The proxy should register on the City's e-services portal."
						);
						oIdInput.setValueStateText(
							"There is no valid Business Partner associated with the provided proxy ID/Passport number. The proxy should register on the City's e-services portal."
						);
					}

				}.bind(this),
				error: function(oResponse) {
					sap.ui.core.BusyIndicator.hide();
					this.showErrorMessage(oResponse);
				}.bind(this)
			});
		},

		onOpenDialog: function() {
			// load BusyDialog fragment asynchronously
			if (!this._pBusyDialog) {
				this._pBusyDialog = Fragment.load({
					name: "capetown.gov.zaEnergyApplication.view.fragment.Proxy.BusyIndicator",
					controller: this
				}).then(function(oBusyDialog) {
					this.getView().addDependent(oBusyDialog);
				
					return oBusyDialog;
				}.bind(this));
			}

			this._pBusyDialog.then(function(oBusyDialog) {
				oBusyDialog.open();
			}.bind(this));
		},

		onCloseBusyDialog: function() {
			this._pBusyDialog.then(function(oBusyDialog) {
				oBusyDialog.close();
			});
		},

		isNumber: function(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		},

		handleTypeMissmatch: function(oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			aFileTypes.map(function(sType) {
				return "*." + sType;
			});
			MessageToast.show("The file type *." + oEvent.getParameter("fileType") +
				" is not supported. Choose one of the following types: " +
				aFileTypes.join(", "));
		},

		onIDType: function(oEvent) {
			var iSelectedIndex = parseInt(oEvent.getParameter('selectedIndex'));
			this.byId("oIdInput").setValueState("None");
			this.byId("oIdInput").setValueStateText("");
			if (iSelectedIndex === 1) {
				//Radio Button No&nbsp;
				this.byId("lblID").setText("Proxy Passport Number");
				this.byId("oIdInput").setValue("");
			} else {
				this.byId("lblID").setText("Proxy ID Number");
				this.byId("oIdInput").setValue("");
			}
		},
		handlefileSizeExceed: function() {
			MessageToast.show("File size exceeded, File cannot be larger than 5MB");
		},

		onAddButton: function(oEvent) {
			this.count = this.count + 1;
			var _oTable = this.byId("uploadTable");
			var columnListItemNewLine = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Label({
						text: "Copy of owners ID/Passport"
					}),
					new sap.ui.unified.FileUploader({
						id: "OwnerID" + this.count,
						visible: "{ViewModel>/isEditable}",
						fileType: "docx,doc,jpg,pdf,gif,jpeg,bmp",
						change: this.onUploadDocuments().bind(this),
						fieldGroupIds: "OwnerID" + this.count,
						maximumFileSize: "{ViewModel>/fileSize}",
						placeholder: "click browse to upload",
						uploadUrl: "upload/",
						fileSizeExceed: this.handlefileSizeExceed()
					}),

					new sap.m.Link({
						id: "OwnersCopy" + this.count,
						text: "Link to URL"

					}),
					new sap.ui.core.Icon({
						src: "sap-icon://complete",
						visible: "{ViewModel>/viewMode}",
						color: "green",
						size: "2em"
					})
				]
			});
			_oTable.addItem(columnListItemNewLine);
		},

		onGetUploadCollectionDocuments: function() {
			var oUploadSet = this.byId("UploadSet");
			var oItems = oUploadSet._getAllItems();
			var counter = 0;
			var oProp = {};
			var that = this;
			if (oItems.length > 0) {
				for (var i = 0; i < oItems.length; i++) {
					var reader = new FileReader();
					reader.onloadend = function(oEvent) {
						oProp = {};
						var base64 = oEvent.target.result.split(",")[1];
						oProp.Filename = oItems[counter].getFileObject().name;
						var sfileType = oItems[counter].getFileObject().type;
						if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
							oProp.Filetype = "docx";
						} else {
							oProp.Filetype = sfileType.substring(sfileType.indexOf('/') + 1);
						}
						counter++;
						oProp.Docdisc = "Owner_ID" + counter;
						oProp.Content = base64;
						that.Documents.push(oProp);

						if (oItems.length === counter) {
							that._createHeader();
						}
						// send the base64 data to the backend
					};
					var oFile = oItems[i].getFileObject();
					reader.readAsDataURL(oFile);
				}
			} else {
				this._createHeader();
			}
		}

	});

});