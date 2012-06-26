/*
 * @author Amir E. Aharoni
 * Utilities for querying language data.
 */
(function ( $ ) {
	"use strict";

	// Constants
	var scriptIndex = 0,
		regionsIndex = 1;

	/*
	 * Returns all languages written in script.
	 * @param script string
	 * @return array of strings (languages codes)
	 */
	$.uls.data.languagesInScript = function( script ) {
		return $.uls.data.languagesInScripts( [ script ] );
	}

	/*
	 * Returns all languages written in the given scripts.
	 * @param scripts array of strings
	 * @return array of strings (languages codes)
	 */
	$.uls.data.languagesInScripts = function( scripts ) {
		var languagesInScripts = [];

		for ( var language in $.uls.data.languages ) {
			for ( var i = 0; i < scripts.length; i++ ) {
				if ( scripts[i] === $.uls.data.languages[language][scriptIndex] ) {
					languagesInScripts.push( language );
					break;
				}
			}
		}

		return languagesInScripts;
	}

	/*
	 * Returns all languages in a given region.
	 * @param region string
	 * @return array of strings (languages codes)
	 */
	$.uls.data.languagesInRegion = function( region ) {
		return $.uls.data.languagesInRegions( [ region ] );
	}

	/*
	 * Returns all languages in given regions.
	 * @param region array of strings.
	 * @return array of strings (languages codes)
	 */
	$.uls.data.languagesInRegions = function( regions ) {
		var languagesInRegions = [];

		for ( var language in $.uls.data.languages ) {
			for ( var i = 0; i < regions.length; i++ ) {
				if ( $.inArray( regions[i], $.uls.data.languages[language][regionsIndex] ) != -1 ) {
					languagesInRegions.push( language );
					break;
				}
			}
		}

		return languagesInRegions;
	}

	/*
	 * Returns an associative array of languages in a region,
	 * grouped by script.
	 * @param string region code
	 * @return associative array
	 */
	$.uls.data.languagesByScriptInRegion = function( region ) {
		var languagesByScriptInRegion = {};

		for ( var language in $.uls.data.languages ) {
			if ( $.inArray( region, $.uls.data.languages[language][regionsIndex] ) != -1 ) {
				var script = $.uls.data.languages[language][scriptIndex];
				if ( languagesByScriptInRegion[script] === undefined ) {
					languagesByScriptInRegion[script] = [];
				}
				languagesByScriptInRegion[script].push( language );
			}
		}

		return languagesByScriptInRegion;
	}

	/*
	 * Returns all regions in a region group.
	 * @param number groupNum
	 * @return array of strings
	 */
	$.uls.data.regionsInGroup = function( groupNum ) {
		var regionsInGroup = [];

		for ( var region in $.uls.data.regiongroups ) {
			if ( $.uls.data.regiongroups[region] === groupNum ) {
				regionsInGroup.push( region );
			}
		}

		return regionsInGroup;
	}

	/*
	 * Returns the script group of a script or 'Other' if it doesn't
	 * belong to any group.
	 */
	$.uls.data.groupOfScript = function( script ) {
		for ( var group in $.uls.data.scriptgroups ) {
			if ( $.inArray( script, $.uls.data.scriptgroups[group] ) != -1 ) {
				return group;
			}
		}

		return 'Other';
	}

} )( jQuery );