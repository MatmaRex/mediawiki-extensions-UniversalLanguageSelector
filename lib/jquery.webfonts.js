/**
 * jQuery Webfonts.
 *
 * Copyright (C) 2012 Santhosh Thottingal
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

(function($, window, document, undefined) {
	"use strict";

	var WebFonts = function(element, options) {
		// Load defaults
		this.options = $.extend({}, $.fn.webfonts.defaults, options);
		this.$element = $(element);
		this.repository = $.extend(WebFonts.repository, this.options.repository);
		this.fonts = [];
		this.originalFontFamily = this.$element.css('font-family');
		this.init();
	};

	WebFonts.repository = {
		base : 'fonts', // Relative or absolute path to the font repository.
		languages : {}, // languages to font mappings
		fonts : {}, // Font name to font configuration mapping

		// Utility methods to work on the repository.
		defaultFont : function(language) {
			var defaultFont;
			if (this.languages[language]) {
				return this.languages[language][0];
			}
			return defaultFont;
		},

		get : function(fontFamily) {
			return this.fonts[fontFamily];
		}
	};

	WebFonts.prototype = {
		constructor : WebFonts,

		/**
		 * Initialize.
		 */
		init : function() {
			var language, fontFamily;
			language = this.$element.attr('lang') || $('html').attr('lang');
			if (language) {
				fontFamily = this.repository.defaultFont(language);
				this.apply(fontFamily);
			}
			this.parse();
		},

		/**
		 * Apply a font for the element.
		 * @param fontFamily String: font family name
		 */
		apply : function(fontFamily, $element) {
			var fontStack;
			$element = $element || this.$element;
			fontStack = this.options.fontStack;
			console.log("Applying font family " + fontFamily);
			this.load(fontFamily);
			fontStack.unshift(fontFamily);
			$element.css('font-family', fontStack.join());
			$element.find('textarea, input').css('font-family', fontStack.join());
		},

		/**
		 * Load a given fontFamily if not loaded already
		 * @param fontFamily String font family name
		 */
		load : function(fontFamily) {
			if ($.inArray(fontFamily, this.fonts) >= 0) {
				return;
			}
			var styleString = this.getCSS(fontFamily);
			if (styleString) {
				injectCSS(styleString);
			}
			this.fonts.push(fontFamily);
		},

		/**
		 * Parse the element for custom font-family styles and
		 * for nodes with different language than element
		 */
		parse : function() {
			var that = this;
			that.$element.find('*[lang], [style], [class]').each(function(i, element) {
				var fontFamilyStyle, fontFamily,
					$element = $(element);

				fontFamilyStyle = $element.css('fontFamily');
				if (fontFamilyStyle) {
					fontFamily = fontFamilyStyle.split(',')[0];
					// Remove the ' and " characters if any.
					fontFamily = $.trim(fontFamily.replace(/["']/g, ''));
					that.load(fontFamily);
					// Font family overrides lang attribute
					return;
				}
				if (element.lang && element.lang !== that.$element.attr('lang')) {
					fontFamily = this.repository.defaultFont(element.lang);
					that.apply(fontFamily, $(element));
				}
			});
		},

		/**
		 * List all fonts for the given language
		 * @param language mixed: [optional] language code. If undefined all fonts will
		 * be listed
		 * @return Array font names array
		 */
		list : function(language) {
			var fontName,
				fontNames = [];

			if (language) {
				fontNames = this.repository.languages[language];
			}
			for (fontName in this.repository.fonts) {
				if (this.repository.fonts.hasOwnProperty(fontName)) {
					fontNames.push(fontName);
				}
			}

			return fontNames;
		},

		/**
		 * List all languages supported by the repository
		 * @return Array language codes
		 */
		languages : function() {
			var language,
				languages = [];
			for (language in this.repository.languages ) {
				if (this.repository.languages.hasOwnProperty(language)) {
					languages.push(language);
				}
			}
		},

		/**
		 * Set the font repository
		 * @param {Object} repository The font repository.
		 */
		setRepository : function(repository) {
			this.repository = $.extend(WebFonts.repository, repository);
		},

		/**
		 * Reset the font-family style.
		 */
		reset : function() {
			this.apply(this.originalFontFamily);
		},

		/**
		 * unbind the plugin
		 */
		unbind : function() {
			this.$element.data('webfonts', null);
		},

		/**
		 * Construct the CSS required for the font-family, inject it to the head of the
		 * body so that it gets loaded.
		 * @param fontFamily The font-family name
		 * @param variant The font variant, eg: bold, italic etc. Default is normal.
		 */
		getCSS : function(fontFamily, variant) {
			var fontconfig, base, version, versionSuffix, styleString, userAgent, fontStyle, fontFormats;

			variant = variant || 'normal';
			fontconfig = this.repository.get(fontFamily);
			if (variant !== 'normal') {
				if (fontconfig.variants !== undefined && fontconfig.variants[variant]) {
					fontFamily = fontconfig.variants[variant];
					fontconfig = this.repository.get(fontFamily);
				}
			}
			if (!fontconfig) {
				return false;
			}

			base = this.repository.base;
			version = fontconfig.version;
			versionSuffix = "?version=" + version + '&20120101';
			styleString = "@font-face { font-family: '" + fontFamily + "';\n";
			userAgent = window.navigator.userAgent;
			fontStyle = fontconfig.fontstyle || 'normal';
			fontFormats = [];

			if (fontconfig.eot) {
				styleString += "\tsrc: url('" + base + fontconfig.eot + versionSuffix + "');\n";
			}
			styleString += "\tsrc: ";
			// If the font is present locally, use it.
			if (userAgent.match(/Android 2\.3/) === null) {
				// Android 2.3.x does not respect local() syntax.
				// http://code.google.com/p/android/issues/detail?id=10609
				styleString += "local('" + fontFamily + "'),";
			}
			if (fontconfig.woff) {
				fontFormats.push("\t\turl('" + base + fontconfig.woff + versionSuffix + "') format('woff')");
			}
			if (fontconfig.svg) {
				fontFormats.push("\t\turl('" + base + fontconfig.svg + versionSuffix + "#" + fontFamily + "') format('svg')");
			}
			if (fontconfig.ttf) {
				fontFormats.push("\t\turl('" + base + fontconfig.ttf + versionSuffix + "') format('truetype')");
			}
			styleString += fontFormats.join() + ";\n";
			if (fontconfig.fontweight) {
				styleString += "\tfont-weight:" + fontconfig.fontweight + ";";
			}
			styleString += "\tfont-style:" + fontStyle + ";";
			styleString += "}";
			return styleString;
		}
	};

	$.fn.webfonts = function(option) {
		return this.each(function() {
			var $this, data, options;
			$this = $(this);
			data = $this.data('webfonts');
			options = typeof option === 'object' && option;
			if (!data) {
				$this.data('webfonts', (data = new WebFonts(this, options)));
			}
			if (typeof option === 'string') {
				data[option]();
			}
		});
	};

	$.fn.webfonts.defaults = {
		repository : WebFonts.repository, // Default font repository
		fontStack : ['Helvetica', 'Arial', 'sans-serif'] // Default font fall back series
	};

	$.fn.webfonts.Constructor = WebFonts;

	// Private methods for the WebFonts prototype
	//=================================

	/**
	 * Create a new style tag and add it to the DOM.
	 *
	 * @param text String: CSS text
	 * @return HTMLStyleElement
	 */
	function injectCSS(css) {
		var s = document.createElement('style');
		s.type = 'text/css';
		s.rel = 'stylesheet';
		// Insert into document before setting cssText
		document.getElementsByTagName('head')[0].appendChild(s);
		if (s.styleSheet) {
			s.styleSheet.cssText = css;
			// IE
		} else {
			// Safari sometimes borks on null
			s.appendChild(document.createTextNode(String(css)));
		}
		return s;
	}

} )(jQuery, window, document);