sap.ui.define([], function() {
	"use strict";
	return {

		/**
		 * Defines a value state based on the price
		 *
		 * @public
		 * @param {number} iPrice the price of a post
		 * @returns {string} sValue the state for the price
		 */
		propertyText: function(sProperty) {
			var rProperty = sProperty.substring(sProperty.indexOf("-") + 1, sProperty.length);
			return rProperty;
		}
	};
});