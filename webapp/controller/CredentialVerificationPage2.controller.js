sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/library",
	"sap/m/MessageBox",
], function(BaseController, JSONModel, CoreLibrary, MessageBox) {
	"use strict";

	var ValueState = CoreLibrary.ValueState;
	var sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.CredentialVerificationPage2", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.CredentialVerificationPage2
		 */
		onInit: function() {

			//Models
			this._oODataModel = this.getOwnerComponent().getModel("ZUI5_CREDENTIALS_VERIFICATION");

			var oCredentialModel = new JSONModel({
				HTML: "<p>All private service providers offering energy-related services supporting residential or commercial SSEG installations or new/modified electricity supply must register and submit relevant documents for verification so they can be listed on e-Services. </p>" +
					"<p>Only once the submitted documents have been <strong>successfully verified</strong> by City officials will SSEG applicants and New/Modified Service Connection applicants be able to add the service providers to applications submitted via e-services. </p>" +
					"<p>For registration-related documents that have a validity period, the registration will be revoked from the system on expiry and a new “Energy Service Providers Registration” request must be submitted with new validity dates.</p>" +
					"<p><strong>Registration for SSEG installers and Electrical Contractors can be done by a third party but for ECSA registered persons, registration must be done by the party themselves.</strong></p>" +
					"<p><strong>How to apply</strong></p>" +

					"<p><strong>SSEG installers:</strong> SSEG Installers that offer SSEG installation services to the public must register prior to being listed on SSEG or new/modified supply applications. This registration can be done by the SSEG installer or a third party. </p>" +
					"<p><strong>Electrical Contractors:</strong> that issue a Certificates of Compliance on any electrical work they have done on a premise must register and submit a valid Department of Employment and Labour Registration document for verification.  This service provider registration can be done by the electrical contractor or a third party.</p>" +

					"<p>You will need the <strong>following documents</strong> to register:</p>" +

					"<ol>" +
					"<li> A copy of the electrical contractor’s identity document (ID) </li>" +
					"<li> A copy of Employment and Labour Registration Document</li>" +
					"</ol>" +

					"<p><strong>ECSA registered person </strong> is registered with the Engineering Council of South Africa (ECSA) in the professional category and conducts commissioning and issues sign-offs on embedded generation installations on residential or commercial premises before installations can be authorised by the City. These persons must register and submit their ECSA registration number for verification. This service provider registration can only be done by the ECSA registered person themselves.</p>" +

					"<p>The professional category includes:</p>" +

					"<ol>" +
					"<li> Professional Engineer (Pr. Eng.) </li>" +
					"<li> Professional Engineering Technologist (Pr. Tech. Eng.) </li>" +
					"<li> Professional Certificated Engineer (Pr. Cert. Eng.)  </li>" +
					"<li> Professional Engineering Technician (Pr. Techni. Eng). </li>" +
					"</ol>"
			});

			this.getView().setModel(oCredentialModel, "CredentialModel");

			//Navigation
			this.getRouter().getRoute("CredentialVerificationPage2").attachPatternMatched(this._onObjectMatched, this);

			//Page properties
			this._wizard = this.byId("CVWizard");
			this._oNavContainer = this.byId("CVNavContainer");
			this._oWizardContentPage = this.byId("pgCV2");

			this.viewModel = new JSONModel({
				fileSize: 5,
				installerVisible: false,
				electricalVisible: false,
				ecsaVisible: false
			});

			this.getView().setModel(this.viewModel, "ViewModel");

			var oInstallerModel = new JSONModel({
				results: []
			});

			var oElectricalModel = new JSONModel({
				results: []
			});

			var oECSAModel = new JSONModel({
				results: []
			});

			this.byId("CVInstaller").setModel(oInstallerModel);
			this.byId("CVInstaller").bindElement({
				path: "/results"
			});

			this.byId("CVElectricContractor").setModel(oElectricalModel);
			this.byId("CVElectricContractor").bindElement({
				path: "/results"
			});

			this.byId("CVECSA").setModel(oECSAModel);
			this.byId("CVECSA").bindElement({
				path: "/results"
			});

			this.getApplicantsData();
		},

		_onObjectMatched: function(oEvent) {

			this.ServiceType = oEvent.getParameter("arguments").ServiceType;
			this.handleNavigationToStep(0);
			this._wizard.discardProgress(this._wizard.getSteps()[0]);

			this.byId("CVbtnSubmit").setEnabled(false);
			this.byId("CVchkConfirm").setSelected(false);

			switch (this.ServiceType) {
				case "INSTALLER":
					this.byId("CVInstaller").setVisible(true);
					this.byId("CVElectricContractor").setVisible(false);
					this.byId("CVECSA").setVisible(false);
					//this.byId("ContentStep").setTitle("Installer");
					this.byId("pgCV2").setTitle("SSEG Installer");
					this.getView().getModel("ViewModel").setProperty("/installerVisible", true);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", false);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", false);
					break;
				case "ELECTRICAL":
					this.byId("CVInstaller").setVisible(false);
					this.byId("CVElectricContractor").setVisible(true);
					this.byId("CVECSA").setVisible(false);
					//this.byId("ContentStep").setTitle("Electrical Contractor");
					this.byId("pgCV2").setTitle("Electrical Contractor");
					this.getView().getModel("ViewModel").setProperty("/installerVisible", false);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", true);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", false);
					break;
				case "ECSA":
					this.byId("CVInstaller").setVisible(false);
					this.byId("CVElectricContractor").setVisible(false);
					this.byId("CVECSA").setVisible(true);
					this.byId("pgCV2").setTitle("ECSA Registration");
					this.getView().getModel("ViewModel").setProperty("/installerVisible", false);
					this.getView().getModel("ViewModel").setProperty("/electricalVisible", false);
					this.getView().getModel("ViewModel").setProperty("/ecsaVisible", true);
					break;
			}

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
					MessageBox.error("Error occured while retrieving applicant details. Please make sure the user is assigned the correct BP");
				}.bind(this)
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

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.AdditionalInfo",
					this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		handleChange: function(oEvent) {
			var oDP = oEvent.getSource(),
				bValid = oEvent.getParameter("valid");

			if (bValid) {
				oDP.setValueState(ValueState.None);
			} else {
				//oDP.setValue();
				oDP.setValueState(ValueState.Error);
			}
		},

		validateVerificationSpecificFields: function() {
			switch (this.ServiceType) {
				case "INSTALLER":
					this.validateInstaller();
					break;
				case "ELECTRICAL":
					this.validateElectrical();
					break;
				case "ECSA":
					this.validateECSA();
					break;
			}
		},

		validateInstaller: function() {
			var oForm = this.byId("CVInstaller").getContent();
			this.validateAllFields(oForm);

		},

		validateElectrical: function() {
			var oForm = this.byId("CVElectricContractor").getContent();
			this.validateAllFields(oForm);
		},

		validateECSA: function() {
			var oForm = this.byId("CVECSA").getContent();
			this.validateAllFields(oForm);
		},

		validateAllFields: function(vForm) {
			try {
				vForm.forEach(function(Field) {
					if (typeof Field.getValue === "function") {
						if ((!Field.getValue() || Field.getValue().length < 1) && Field.getRequired() === true) {
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
					}

				});
			} catch (error) {
				this._wizard.previousStep();
			}
		},

		onValidateEmail: function(oEvent) {
			var emailValue = oEvent.getParameter("value");
			var item = oEvent.getSource();
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
			if (!emailValue.match(rexMail)) {
				item.setValueState("Error");
				item.setValueStateText("Invalid email address");
				this.isError = true;
			} else {
				item.setValueState("None");
				item.setValueStateText();
				this.isError = false;
			}
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
			}
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

		validateSupportingDocuments: function() {
			switch (this.ServiceType) {
				case "INSTALLER":
					this.validateInstallerSupportingDocuments();
					break;
				case "ELECTRICAL":
					this.validateElectricalSupportingDocuments();
					break;
				case "ECSA":
					this.validateECSASupportingDocuments();
					break;
			}
		},

		onValidateStartDate: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getDateValue();
			var bValid = oEvent.getParameter("valid");
			var oCurrentDay = new Date();
			
			if (bValid) {
				oSource.setValueState("None");
			} else {
		
				oSource.setValueState("Error");
				return;
			}

			oSource.setValueState("None");
			oSource.setValueStateText("");

		},

		onValidateEndDate: function(oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getDateValue();
			var bValid = oEvent.getParameter("valid");
			var startDate;
			var oDateVal;
			var oCurrentDay = new Date();


			if (bValid) {
				oSource.setValueState("None");
			} else {
				oSource.setValueState("Error");
				return;
			}

			oSource.setValueState("None");
			oSource.setValueStateText("");
			
		},

		validateInstallerSupportingDocuments: function() {

		},

		validateElectricalSupportingDocuments: function() {
			if (this.byId("ElectricalEmpRegDoc").getValue() === "") {
				this.byId("ElectricalEmpRegDoc").setValueState("Error");
				this.byId("ElectricalEmpRegDoc").setValueStateText("Please upload document");
				MessageBox.error("Please upload required supporting document");
				this._wizard.previousStep();
				return;
			}

			if (this.byId("ElectricalIDDoc").getValue() === "") {
				this.byId("ElectricalIDDoc").setValueState("Error");
				this.byId("ElectricalIDDoc").setValueStateText("Please upload document");
				MessageBox.error("Please upload required supporting document");
				this._wizard.previousStep();
				return;
			}

			this.byId("ElectricalEmpRegDoc").setValueState("None");
			this.byId("ElectricalEmpRegDoc").setValueStateText("");
			this.byId("ElectricalIDDoc").setValueState("None");
			this.byId("ElectricalIDDoc").setValueStateText("");
		},

		validateECSASupportingDocuments: function() {
			if (this.byId("ECSAPRCert").getValue() === "") {
				this.byId("ECSAPRCert").setValueState("Error");
				this.byId("ECSAPRCert").setValueStateText("Please upload document");
				MessageBox.error("Please upload required supporting document");
				this._wizard.previousStep();
				return;
			}

			if (this.byId("ECSAIDDoc").getValue() === "") {
				this.byId("ECSAIDDoc").setValueState("Error");
				this.byId("ECSAIDDoc").setValueStateText("Please upload document");
				MessageBox.error("Please upload required supporting document");
				this._wizard.previousStep();
				return;
			}

			this.byId("ECSAPRCert").setValueState("None");
			this.byId("ECSAPRCert").setValueStateText("");
			this.byId("ECSAIDDoc").setValueState("None");
			this.byId("ECSAIDDoc").setValueStateText("");
		},

		onConfirm: function() {
			if (this.byId("CVchkConfirm").getSelected() === true) {
				this.byId("CVbtnSubmit").setEnabled(true);
			} else {
				this.byId("CVbtnSubmit").setEnabled(false);
			}
		},

		onSubmit: function() {

			switch (this.ServiceType) {
				case "INSTALLER":
					this.createEntryForInstaller();
					break;
				case "ELECTRICAL":
					this.createEntryForElectrical();
					break;
				case "ECSA":
					this.createEntryForECSA();
					break;
			}

			sap.ui.core.BusyIndicator.show(0);
			if (this._oODataModel.hasPendingChanges()) {
				this._oODataModel.submitChanges({
					success: function(oData) {
						var AppID = "";
						if (oData.__batchResponses !== undefined) {
							AppID = oData.__batchResponses[0].__changeResponses[0].data.AppReqID;
						}

						this._oODataModel.resetChanges();
						sap.ui.core.BusyIndicator.hide();
						this.onShowFormattedTextInfo(AppID);
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

		handleMessageBoxOpen: function(sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.YES) {
						//this.getRouter().navTo("SuccessMessagePage");
						this.onSubmit();
					}
				}.bind(this)
			});
		},

		handleWizardSubmit: function() {
			this.handleMessageBoxOpen("Are you sure you want to submit the registration?", "confirm");
		},

		onSelectNotificationOption: function(oEvent) {
			if (oEvent.getSource().getSelectedIndex() === 0) {
				this.byId("CVECSA").getModel().getData().results.Notified = "X";
			} else {
				this.byId("CVECSA").getModel().getData().results.Notified = "";
			}
		},

		createEntryForInstaller: function() {
			var oInstallerProperties = this.byId("CVInstaller").getModel().getData().results;
			var oProperties = {};

			if (this.byId("InstallerRegDoc").getValue() !== "") {
				// create notification properties
				var oPropertiesWithDoc = {
					Partner: this.BP, //"1000095280",
					RegNumber: this.byId("installerRegNo").getValue(), //oInstallerProperties.RegNumber,
					Name: this.byId("installerName").getValue(), //oInstallerProperties.Name,
					//ValidFrom: this.convertToSAPDate(oInstallerProperties.ValidFrom),
					//ValidTo: this.convertToSAPDate(oInstallerProperties.ValidTo),
					CellNo: this.byId("installerMobile").getValue(), ////oInstallerProperties.CellNumber,
					Email: this.byId("installerEmail").getValue(),//oInstallerProperties.Email,
					File2Name: this.CompanyProperties.FileName,
					File2Type: this.CompanyProperties.FileType,
					File2Size: this.CompanyProperties.FileSize,
					File2Content: this.CompanyProperties.FileContent
				};

				oProperties = oPropertiesWithDoc;
			} else {
				// create notification properties
				var oPropertiesWithoutDoc = {
					Partner: this.BP, //"1000095280",
					RegNumber: this.byId("installerRegNo").getValue(),
					Name: this.byId("installerName").getValue(),
					CellNo: this.byId("installerMobile").getValue(),
					Email: this.byId("installerEmail").getValue()
				};

				oProperties = oPropertiesWithoutDoc;
			}

			this._oContextNotes = this._oODataModel.createEntry("/InstallerSet", {
				properties: oProperties,
				success: function() {},
				error: function(oError) {}.bind(this)
			});

		},

		createEntryForElectrical: function() {
			var oElectricalProperties = this.byId("CVElectricContractor").getModel().getData().results;

			// create notification properties
			var oProperties = {
				Partner: this.BP, //"1000095280",
				//RegNumber: oElectricalProperties.RegNumber,
				Name: this.byId("electrCompName").getValue(), //oElectricalProperties.Name,
				ContrName: this.byId("electrNameSurname").getValue(), //oElectricalProperties.NameSurname,
				EmpRegNo: this.byId("electrEmpNum").getValue(), ////oElectricalProperties.EmpRegNumber,
				Category: this.byId("ElectricalCategory").getValue(),
				ValidFrom: this.convertToSAPDate(oElectricalProperties.ValidFrom),
				ValidTo: this.convertToSAPDate(oElectricalProperties.ValidTo),
				CellNumber: this.byId("electrMobileNum").getValue(),//oElectricalProperties.CellNumber,
				Email: this.byId("electrEmail").getValue(),//oElectricalProperties.Email,
				File1Name: this.DepartmentProperties.FileName,
				File1Type: this.DepartmentProperties.FileType,
				File1Size: this.DepartmentProperties.FileSize,
				File1Content: this.DepartmentProperties.FileContent,
				File2Name: this.IDProperties.FileName,
				File2Type: this.IDProperties.FileType,
				File2Size: this.IDProperties.FileSize,
				File2Content: this.IDProperties.FileContent
			};

			this._oContextNotes = this._oODataModel.createEntry("/ElectricalSet", {
				properties: oProperties,
				success: function() {},
				error: function(oError) {}.bind(this)
			});
		},

		createEntryForECSA: function() {

			var oECSAProperties = this.byId("CVECSA").getModel().getData().results;

			// create notification properties
			var oProperties = {
				Partner: this.BP, //"1000095280",
				RegNumber: this.byId("ecsaRegNo").getValue(), //oECSAProperties.RegNumber,
				ProfName: this.byId("ecsaName").getValue(), //oECSAProperties.NameSurname,
				Category: this.byId("ECSACategory").getValue(),
				Discipline: this.byId("ECSADiscipline").getValue(),
				CellNumber: this.byId("ecsaMobile").getValue(), //oECSAProperties.CellNumber,
				Email: this.byId("ecsaEmail").getValue(), //oECSAProperties.Email,
				Notified: oECSAProperties.Notified,
				File1Name: this.ECSAProperties.FileName,
				File1Type: this.ECSAProperties.FileType,
				File1Size: this.ECSAProperties.FileSize,
				File1Content: this.ECSAProperties.FileContent,
				File2Name: this.IDProperties.FileName,
				File2Type: this.IDProperties.FileType,
				File2Size: this.IDProperties.FileSize,
				File2Content: this.IDProperties.FileContent
			};

			this._oContextNotes = this._oODataModel.createEntry("/ECSASet", {
				properties: oProperties,
				success: function() {},
				error: function(oError) {}.bind(this)
			});
		},

		onShowFormattedTextInfo: function(appID) {
			MessageBox.success("Registration Request with Registration Number  " + appID + " " + "has been submitted for review", {
				actions: [MessageBox.Action.CLOSE],
				title: "Registration Complete",
				id: "messageBoxId2",
				contentWidth: "100px",
				styleClass: sResponsivePaddingClasses,
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.CLOSE) {
						this.getRouter().navTo("CredentialVerificationPage1");
					}
				}.bind(this)
			});
		},

		onUploadBusinessRegistrationDocuments: function(oEvent) {
			this.BusinessRegProperties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				//console.log(that.Properties);
				that.BusinessRegProperties.FileContent = base64String.split(',')[1];
			});

			this.BusinessRegProperties.FileContent = that.FileContent;
			this.BusinessRegProperties.FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.BusinessRegProperties.FileType = "docx";
			} else {
				this.BusinessRegProperties.FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		onUploadCompanyRegDocuments: function(oEvent) {
			this.CompanyProperties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.CompanyProperties.FileContent = base64String.split(',')[1];
			});

			this.CompanyProperties.FileContent = that.FileContent;
			this.CompanyProperties.FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.CompanyProperties.FileType = "docx";
			} else {
				this.CompanyProperties.FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		onUploadDepartmentDocuments: function(oEvent) {
			this.DepartmentProperties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.DepartmentProperties.FileContent = base64String.split(',')[1];
			});

			this.DepartmentProperties.FileContent = that.FileContent;
			this.DepartmentProperties.FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.DepartmentProperties.FileType = "docx";
			} else {
				this.DepartmentProperties.FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		onUploadECSACertificate: function(oEvent) {
			this.ECSAProperties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.ECSAProperties.FileContent = base64String.split(',')[1];
			});

			this.ECSAProperties.FileContent = that.FileContent;
			this.ECSAProperties.FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.ECSAProperties.FileType = "docx";
			} else {
				this.ECSAProperties.FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		onUploadIDDocument: function(oEvent) {
			this.IDProperties = {};
			var that = this;
			var oParameters = oEvent.getParameters();

			//create file reader and file reader event handler
			var oFileReader = new FileReader();
			oFileReader.onload = (function() {
				var base64String = oFileReader.result;
				that.IDProperties.FileContent = base64String.split(',')[1];
			});

			this.IDProperties.FileContent = that.FileContent;
			this.IDProperties.FileName = oParameters.files[0].name;
			var sfileType = oParameters.files[0].type;
			if (sfileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				this.IDProperties.FileType = "docx";
			} else {
				this.IDProperties.FileType = sfileType;
			}

			oFileReader.readAsDataURL(oParameters.files[0]);
		},

		convertToSAPDate: function(vDate) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddTKK:mm:ss"
			});
			return dateFormat.format(new Date(vDate));
		}

	});

});