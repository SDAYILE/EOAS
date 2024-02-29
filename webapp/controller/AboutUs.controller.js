sap.ui.define([
	"capetown/gov/zaEnergyApplication/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("capetown.gov.zaEnergyApplication.controller.AboutUs", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf capetown.gov.zaEnergyApplication.view.AboutUs
		 */
		onInit: function() {

			var oOverviewModel = new JSONModel({
				HTML: "<h4>Welcome to Energy Services Applications</h4>" +
					"<p>Energy Services Applications allows customers who own properties within the City of Cape Town electricity supply areas <strong>to apply for the authorisation of small-scale embedded generation (SSEG) such as solar PV installations or a new or modified electricity supply.</strong></p>" +
					"<p><em>Important: If you are an Eskom customer living within the City's metropolitan boundary but located in an Eskom-supplied area, you must apply to Eskom.</em>  <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Maps%20and%20statistics/Electricity%20Distribution%20Licence%20and%20Area%20Boundaries.pdf\"  font-weight:600;\">'View the City's electricity supply areas.'</a> </p>" +

					"<p>Other online energy services also offered include:</p>" +
					"<li><strong>Proxy authorisation.</strong> This service allows a property owner to grant another e-Services user the ability to apply for energy services on their behalf.</li>" +
					"<li><strong>Energy service providers registration. </strong> This service allows electrical contractors, SSEG installers and ECSA registered persons who offer energy-related services within the Cape Town area to register and have relevant credentials verified by City staff. This process eliminates document verification during application processing.</li>" +
					"<p><strong>Please note that service providers operating within the City of Cape Town supply area must be registered in order to provide services on energy applications submitted via e-Services.</strong></p>" +

					"<p><strong>Please visit our</strong>  <a href=\"https://www.capetown.gov.za/Family%20and%20home/Greener-living/Saving-electricity-at-home/going-solar\"  font-weight:600;\">'Going Solar'</a> or <a href=\"https://www.capetown.gov.za/Family%20and%20home/Residential-utility-services/Residential-electricity-services/Electricity-application-forms\"  font-weight:600;\">'Electricity Applications' </a><strong>web pages for more information</strong></p>" +
				    "<p>For any support-related queries on Energy Services Applications, email Electricityapplication.queries@capetown.gov.za or call one of the electricity area offices:  North: 021 444 1394/6; East: 021 444 8511/2; South 021 400 4750/1/2/3.</p>" +
				    
				    "<li> For any of the application services where an identity document (ID) is required, the following forms of identification are accepted: <ul>" +
					"<li> Green-coded SA ID; </li>" +
					"<li> SA smart ID card; </li>" + 
					"<li> Valid driver's licence; </li>" + 
					"<li> Valid passport document.</li> </ul> </li>" +
					"<p>The below are the Energy Online Application that you can assess to apply for a service. Please expand each application to view more information:</p>"
			});

			this.getView().setModel(oOverviewModel, "OverviewModelModel");

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

			var oSssegModel = new JSONModel({
				HTML: "<p>A property owner or proxy (who has been granted permission by the property owner) must apply for connecting embedded generation and solar PV geysers to residential, commercial, or industrial electrical systems by submitting an application with installation details of the system. </p>" +
					"<p>There is no application fee associated to the application, however, if the application is for a grid-tied installation with export (to participate in the SSEG Feed-in Tariff), a bi-directional AMI or smart meter is required, that the City will supply and install at the customer’s cost. In this case, a separate 'Application for a new or modified electricity supply service' will be created to replace the existing meter with an AMI meter. For installations bigger than 350kVA, a network study fee will be charged.</p>" +
					"<p><strong>Before submitting your application, please note the following:</strong></p>" +

					"<ol>" +
					"<li>Registration is required for all embedded generation systems including solar PV systems with and without batteries, <strong>geysers connected to photovoltaic (PV) solar panels,</strong> geysers as well as <strong>battery-only</strong> grid-tied systems</li>" +
					"<li>Only a property owner or proxy (who has been granted proxy authorisation by the property owner) can submit an application. Due to the technical nature of these requests, we recommended that a <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Procedures%2c%20guidelines%20and%20regulations/Guideline_for_Electrical_Contractors__1st_edition_June_2014_.pdf\"  font-weight:600;\">registered electrical contractor</a>, ECSA registered person or an SSEG installer submit the application on behalf of property owners.</li>" +
					"<li>The SSEG installer, electrical contractor and ECSA Registered Person indicated on the application must be e-Services users who have registered as service providers through the Energy Services Application Service Providers Registration prior to submission of SSEG application. Please ensure that you have their correct profile information, as this will be verified before being able to submit.</li>" +
					"<li>Only City of Cape Town approved grid-tied inverters are allowed for embedded generation systems. Visit the <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Forms,%20notices,%20tariffs%20and%20lists/Approved%20Photovoltaic%20(PV)%20Inverter%20List.pdf\"  font-weight:600;\"> City's List of Approved Inverters.</a> </li>" +
					"<li>Applicants are required to read the latest, published  <a href=\"https://resource.capetown.gov.za/documentcentre/Documents/Procedures%2c%20guidelines%20and%20regulations/Requirements%20for%20Small-Scale%20Embedded%20Generation.pdf\"  font-weight:600;\"> Requirements for Small-Scale Embedded Generation</a> , where the application and approval process for small-scale embedded generation in the City of Cape Town is explained. </li>" +
					"</ol>" +

					"<p><strong>As part of your application, you must have the following information / documentation at hand:</strong></p>" +

					"<ol>" +
					"<li>Electrical contractor information including Dept of Employment and Labour Registration number.</li>" +
					"<li>ECSA registered person information including ECSA registration number (unless the application is for geysers connected to photovoltaic (PV) solar panels).</li>" +
					"<li>Information about the <strong>existing supply</strong> at the </li>" +
					"<li>Commercial applicants must supply a <strong>Schematics Design Drawing document</strong> as part of their application</li>" +
					"<li>If a <strong>new meter installation</strong> is required, a new meter request will be initiated the application (please note: there is a cost associated to the installation of new meters)</li>" +
					"</ol>" 
			});

			this.getView().setModel(oSssegModel, "SsegModel");
			
			
			var oContactUsModel = new JSONModel({
				HTML: "<p>For any support-related queries on Energy Services Applications, email Electricityapplication.queries@capetown.gov.za or call one of the electricity area offices:   </p>" +

					"<ol>" +
					"<li>North: 021 444 1394/6; </li>" +
					"<li>East: 021 444 8511/2; </li>" +
					"<li>South 021 400 4750/1/2/3.</li>" +
					"</ol>" 
			});

			this.getView().setModel(oContactUsModel, "ContactUsModel");

		},

		onContactCity: function(oEvent) {
			if (!this._oDisplayCityContact) {
				this._oDisplayCityContact = sap.ui.xmlfragment("capetown.gov.zaEnergyApplication.view.fragment.Generic.ContactUs", this);
				this.getView().addDependent(this._oDisplayCityContact);
			}
			this._oDisplayCityContact.openBy(oEvent.getSource());
		},

		onOkCityContact: function() {
			this._oDisplayCityContact.close();
		}


	});

});