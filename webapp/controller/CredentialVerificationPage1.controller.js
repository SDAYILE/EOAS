sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.CredentialVerificationPage1", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.CredentialVerificationPage1
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

			this.getApplicantsData();

			//Navigation
			this.getRouter().getRoute("CredentialVerificationPage1").attachPatternMatched(this._onObjectMatched, this);

		},

		_onObjectMatched: function(oEvent) {
		
		},

		onMoreInfo: function(oEvent) {
			if (!this._oDisplayMoreInfo) {
				this._oDisplayMoreInfo = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.CredentialVerification.AdditionalInfo",
					this);
				this.getView().addDependent(this._oDisplayMoreInfo);
			}
			this._oDisplayMoreInfo.openBy(oEvent.getSource());
		},

		onNavBack: function() {
			this.getRouter().navTo("LandingPage");
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

		onSelectInstaller: function() {
			this.getRouter().navTo("CredentialsDashboard", {
				ServiceType: "INSTALLER",
				Bp: this.BP
			});
		},

		onSelectElectrical: function() {
			this.getRouter().navTo("CredentialsDashboard", {
				ServiceType: "ELECTRICAL",
				Bp: this.BP
			});
		},

		onSelectECSA: function() {
			this.getRouter().navTo("CredentialsDashboard", {
				ServiceType: "ECSA",
				Bp: this.BP
			});
		}
	});

});