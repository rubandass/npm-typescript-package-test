/* eslint-disable no-redeclare */
import { AnalysisTool, $, Localize, Utilities } from './shim';
export  {};

/**
* HTML5 controls
* Main object that holds the object definitions for most of the
* obgject controls used in the analysis controls.
*
* @class: h5controls	
* @constructor
*/

// AnalysisTool = typeof AnalysisTool === 'undefined' ? {} : AnalysisTool;

/**
* Localization method.
* @param {string} phrase Phrase to localize.
* @returns {string} Localized phrase.
*/
AnalysisTool.localize = function (phrase) {
	return Localize('@Tool:' + phrase);
};

AnalysisTool.h5controls = {};

AnalysisTool.h5controls.container = function (name) {
	this.name = name;
	this.$ = $('<div></div>');
	this.$.addClass(name);
	this.el = this.$[0];

	this.appendTo = function ($object) {
		$object.append(this.$);
		return this;
	};

	this.appendControl = function (ctl) {
		this.$.append(ctl.$);
	}
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* html5 button. Common button features
* @param {string} name Button object name (e.g. 'advanced'|'playpause')
* @param {string} t Attribute value for sprite (e.g. 'adva'|'play')
* @param {string} toolTip Tool tip for button
* @param {function=} onclick Click event handler to call
* @param {HTMLElement} parent Parent element to attach button to
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.h5controls.commonbutton = function (name, t, toolTip, onclick, parent) {
	this.name = name;

	this.clickEventListeners = [];
	this.$ = $('<button>') //</' + (tagName || this.eltype) + '>');
		.attr('t', t)
		.addClass('ac-button-' + name)
		.addClass('ac-drawbar-button')
		.addClass('ac-drawbar-sprite');
	
	this.domElement = this.$[0];

	if (toolTip) {
		this.$.attr('title', AnalysisTool.localize(toolTip));
	}

	if (onclick) {
		this.addClickEventListener(onclick);
	}
	if (parent) {
		this.$.appendTo(parent);
	}

	const icon = AnalysisTool.icon(name);
	if (icon) {
		this.domElement.innerHTML = icon;
	}

};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* html5 button. Generic (click) button
* Constructs the html tag, wires event handlers and provides a render method
*
* @class: h5controls.button	
* @param: {String} name Button object name
* @param {string} t Attribute value for sprite (e.g. 'adva'|'play')
* @param: {String} text Text for button
* @param: {String} toolTip Tool tip for button
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.h5controls.button = function (name, t, toolTip, onclick, parent) {
	AnalysisTool.h5controls.commonbutton.call(this, name, t, toolTip, onclick, parent);

	//---Standard button only---
	this.addMouseHandlers();

};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Toggle button. Generic toggle button
* Constructs the html tag, wires event hanlers and provides a render method
*
* @class: togglebutton	
* @param {string} name Button object name
* @param {string} t Attribute value for sprite (e.g. 'adva'|'play')
* @param {string} toolTip Tool tip for button
* @param {function=} onclick Click event handler to call
* @param {HTMLElement} parent Parent element to attach button to
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.h5controls.togglebutton = function (name, t, toolTip, onclick, parent) {
	AnalysisTool.h5controls.commonbutton.call(this, name, t, toolTip, onclick, parent);

	//---Toggle button only---
	this.buttonType = 'toggle';
	this.selected = false;
	this.addMouseHandlers();
};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Button methods
* Used for these button types:
*  - Standard button
*  - Toggle button
*  - Checkbox
*  - Color button
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.h5controls.button.prototype =
	AnalysisTool.h5controls.togglebutton.prototype =
	{
		appendTo: function ($object) {
			$object.append(this.$);
			return this;
		},

		appendControl: function (ctl) {
			this.$.append(ctl.$);
		},

		addClickEventListener: function (listenerFunction) {
			this.clickEventListeners.push(listenerFunction);
			return this;
		},

		setIsSelected: function (isSelected) {
			this.$.toggleClass('selected', isSelected);
			this.selected = isSelected;
		},

		setIsDisabled: function (disabled) {
			if (disabled) {
				this.domElement.setAttribute('disabled', 'disabled');
			} else {
				this.domElement.removeAttribute('disabled');
			}
		},

		fireClickEvent: function (e) {
			switch (this.buttonType) {
				case 'toggle':
					this.setIsSelected(!this.selected);
					for (var i = 0; i < this.clickEventListeners.length; i++) {
						this.clickEventListeners[i](e, this.name, this.selected);
					}
					break;
				default:
					for (var i = 0; i < this.clickEventListeners.length; i++) {
						this.clickEventListeners[i](e, this.name);
					}
					break;
			}
		},

		addMouseHandlers: function () {
			var self = this;
			this.domElement.onclick = function (e) {
				self.fireClickEvent(e);
			};
		}
	};
// Restore constructor functions
AnalysisTool.h5controls.button.prototype.constructor = AnalysisTool.h5controls.button;
AnalysisTool.h5controls.togglebutton.prototype.constructor = AnalysisTool.h5controls.togglebutton;


/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Canvas object
* Constructs the html tag, wires event hanlers and provides a render method
*
* @class: objCanvas	
* @param: {String} name Object name
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.h5controls.objCanvas = function (name) {
	this.name = name;
	this.domElement = document.createElement('canvas');
	this.domElement.setAttribute('id', 'ac-canvas-' + AnalysisTool.h5controls.objCanvas.gCvsCounter++);
	this.domElement.setAttribute('class', 'ac-canvas-' + name);
	this.el = this.domElement;
	this.$ = $(this.domElement);
	this.savedCvsValues = {};
}

AnalysisTool.h5controls.objCanvas.gCvsCounter = 0;

AnalysisTool.h5controls.objCanvas.prototype = {
	constructor: AnalysisTool.h5controls.objCanvas,

	appendTo: function ($object) {
		$object.append(this.$);
		return this;
	},

	erase: function () {
		var el = this.el
		el.getContext('2d').clearRect(0, 0, el.width, el.height);
	}
};


/** ******************************************************
* Analysis tool interaction with server.
******************************************************* */
AnalysisTool.delegate = {
	// Retrieve information about a media item.
	// @param {string.guid} mediaID Identifier of video item whose info to load.
	// @param {function} complete Completion function called with media info.
	// @returns {object} Loaded media information.
	mediaInfo: function (mediaID, callback) {
		$.ajaxp({
			url: Utilities.rest2('media/info', mediaID),
			success: function (data) {
				callback(data);
			}
		});
	},

	// Extract a frame at the given time from a video.
	// Returns a string suitable for use as the "src" attribute
	// of an Image object, e.g. a REST call or base-64 encoded
	// image data. This is used when blitting from HTML5 <video>
	// to <canvas> is not supported.
	// @param {string.guid} mediaID Identifier of video media file where to extract frame.
	// @param {number} captureTime (s) Time at which to extract frame.
	// @returns {string} Server request URL or base-64 encoded source string.
	extractFrameUrl: function (mediaID, captureTime) {
		return Utilities.stringFormat('/REST/html5manager/HOME/xxx/{0}/{1}/frame.jpg', captureTime, mediaID);
	},

	// Save a (jpg) image to the server as base-64 encoded string.
	// @param {string} base64 Base-64 encoded image string.
	// @param {function} complete Completion function called with saved response or NULL on error.
	saveImage: function (base64, complete) {
		$.ajax({
			url: Utilities.rest2('media/postbase64'),
			type: "POST",
			data: base64,
			processData: false,
			contentType: 'text/plain; charset=utf-8',
			dataType: 'json',
			headers: {
				'x-thezone-extension': 'jpg',
				'x-thezone-screenshot': 'true'
			},
			success: function (data) {
				complete(data);
			},
			error: function (data) {
				console.log('CatureImage Ajax ERROR', data);
				complete(null);
			}
		});
	}
};
