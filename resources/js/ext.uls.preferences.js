/**
 * ULS preferences system for MediaWiki.
 * Local storage for anonymous users, preferences for logged in users.
 *
 * Copyright (C) 2012 Alolita Sharma, Amir Aharoni, Arun Ganesh, Brandon Harris,
 * Niklas Laxström, Pau Giner, Santhosh Thottingal, Siebrand Mazeland and other
 * contributors. See CREDITS for a list.
 *
 * UniversalLanguageSelector is dual licensed GPLv2 or later and MIT. You don't
 * have to do anything special to choose one license or the other and you don't
 * have to notify anyone which license you are using. You are free to use
 * UniversalLanguageSelector in commercial projects as long as the copyright
 * header is left intact. See files GPL-LICENSE and MIT-LICENSE for details.
 *
 * @file
 * @ingroup Extensions
 * @licence GNU General Public Licence 2.0 or later
 * @licence MIT License
 */
( function ( $, mw ) {
	'use strict';

	var ULSPreferences,
		cachedOptionsToken = null;

	/**
	 * Post to options API with correct token.
	 * If we have no token, get one and try to post.
	 * If we have a cached token try using that,
	 * and if it fails, blank out the cached token and start over.
	 *
	 * @param params {Object} API parameters
	 * @param ok {Function} callback for success
	 * @param err {Function} [optional] error callback
	 * @return {jqXHR}
	 */
	function saveOptionsWithToken( params, ok, err ) {
		if ( cachedOptionsToken === null ) {
			// We don't have a valid cached token, so get a fresh one and try posting.
			// We do not trap any 'badtoken' or 'notoken' errors, because we don't want
			// an infinite loop. If this fresh token is bad, something else is very wrong.
			return getOptionsToken( function ( token ) {
				params.token = token;
				new mw.Api().post( params, ok, err );
			}, err );
		} else {
			params.token = cachedOptionsToken;

			return new mw.Api().post( params, {
				ok: ok,
				err: function ( code, result ) {
					// We do have a token, but it might be expired.
					// So if it is 'bad', then start over with a new token.
					if ( code === 'badtoken' ) {
						// force a new token, clear any old one
						cachedOptionsToken = null;
						saveOptionsWithToken( params, ok, err );
					} else {
						err( code, result );
					}
				}
			} );
		}
	}

	/**
	 * Api helper to grab an options token
	 *
	 * token callback has signature ( String token )
	 * error callback has signature ( String code, Object results, XmlHttpRequest xhr, Exception exception )
	 * Note that xhr and exception are only available for 'http_*' errors
	 * code may be any http_* error code (see mw.Api), or 'token_missing'
	 *
	 * @param tokenCallback {Function} received token callback
	 * @param err {Function} error callback
	 * @return {jqXHR}
	 */
	function getOptionsToken( tokenCallback, err ) {
		return new mw.Api().get( {
			action: 'tokens',
			type: 'options'
		}, {
			ok: function ( data ) {
				var token;

				// If token type is not available for this user,
				// key 'translationreviewtoken' is missing or can contain Boolean false
				if ( data.tokens && data.tokens.optionstoken ) {
					token = data.tokens.optionstoken;
					cachedOptionsToken = token;
					tokenCallback( token );
				} else {
					err( 'token-missing', data );
				}
			},
			err: err,
			// Due to the API assuming we're logged out if we pass the callback-parameter,
			// we have to disable jQuery's callback system, and instead parse JSON string,
			// by setting 'jsonp' to false.
			jsonp: false
		} );
	}

	/**
	 * Wrapper for localStorage, falls back to cookie
	 * when localStorage not supported by browser.
	 */
	function preferenceStore() {

		// If value is detected, set new or modify store
		return {
			/*
			 * Set the value to the given key
			 * @param {string} key
			 * @param {Object} value value to be set
			 */
			set: function ( key, value ) {
				// Convert object values to JSON
				if ( typeof value === 'object' ) {
					value = JSON.stringify( value );
				}
				// Set the store
				try {
					localStorage.setItem( key, value );
				} catch ( e ) { // Use cookie
					$.cookie( key, value, { path: '/' } );
				}
			},
			/*
			 * Returns the value of the given key
			 * @param {string} key
			 * @retun {Object} value of the key
			 */
			get: function ( key ) {
				var data;

				// No value supplied, return value
				try {
					data = localStorage.getItem( key );
					if ( !data ) {
						// Try to restore the old preferences, if any, if possible.
						try {
							data = JSON.parse( localStorage.getItem( 'jStorage' ) )['uls-preferences'];
							// And try to remove it.
							localStorage.removeItem( 'jStorage' );
						} catch ( e ) {
							// Don't bother about it.
						}
					}
				} catch ( e ) { // Use cookie
					data = $.cookie( key );
				}

				// Try to parse JSON
				try {
					data = JSON.parse( data );
				} catch ( e ) {
					data = data;
				}

				return data;
			}
		};
	}

	ULSPreferences = function () {
		this.preferenceName = 'uls-preferences';
		this.username = mw.user.getName();
		this.isAnon = mw.user.isAnon();
		this.preferences = null;
		this.init();
	};

	ULSPreferences.prototype = {
		/**
		 * Initialize
		 */
		init: function () {
			if ( this.isAnon ) {
				this.preferences = preferenceStore().get( this.preferenceName );
			} else {
				var options = mw.user.options.get( this.preferenceName );

				// Try to parse JSON
				try {
					this.preferences = JSON.parse( options );
				} catch ( e ) {
					this.preferences = {};
				}
			}

			this.preferences = this.preferences || {};
		},

		/**
		 * Set the preference
		 *
		 * @param {String} key
		 * @param value
		 */
		set: function ( key, value ) {
			this.preferences[key] = value;
		},

		/**
		 * Get a preference value for the given preference name
		 *
		 * @param key
		 */
		get: function ( key ) {
			return this.preferences[key];
		},

		/**
		 * Save the preferences
		 *
		 * @param callback
		 */
		save: function ( callback ) {
			var ulsPreferences = this;

			callback = callback || $.noop;
			if ( this.isAnon ) {
				// Anonymous user. Save preferences in local storage
				preferenceStore().set( this.preferenceName, this.preferences );
				callback.call( this, true );
			} else {

				// Logged in user. Use MW APIs to change preferences
				saveOptionsWithToken( {
					action: 'options',
					optionname: ulsPreferences.preferenceName,
					optionvalue: JSON.stringify( ulsPreferences.preferences )
				}, function () {
					callback.call( this, true );
				}, function () {
					callback.call( this, false );
				} );
			}
		}
	};

	mw.uls = mw.uls || {};
	mw.uls.preferences = function () {
		var data = $( 'body' ).data( 'preferences' );

		if ( !data ) {
			$( 'body' ).data( 'preferences', ( data = new ULSPreferences() ) );
		}
		return data;
	};

}( jQuery, mediaWiki ) );
