/* eslint-disable no-unused-vars */
import './events';
import { $, AnalysisTool, Utilities } from './shim';
export { };

/** ******************************************************
* Drawing button bar for analysis tools.
******************************************************* */
AnalysisTool.Drawbar = function () {
	this.eventListeners = {
		toolchange: [],     // {Array<function>} Handlers when tool is changed
		flip: []            // {Arary<function>} Handler on flip video button
	};
	this.domElement = {
		bar: null,          // {?HTMLDivElement} Main toolbar container.
		mru: null,          // {?HTMLDivElement} Recent used list container.
		menu: null,         // {?HTMLDivElement} Tool selection panel.
		documentDown: null  // {?function} Function closure to handle document down to close menu
	};

	this.tools = [];       // {Array<Array>} All available tools grouped with titles
	this.actions = [];     // {Array<string>} Action buttons
	this.colors = [];      // {Array<string.colorref>} Available colors
	this.widths = [];      // {Array<number>} Available line widths
	this.options = {};     // {object<object>} Tool options
	this.defaults = {
		color: null,
		lineWidth: null
	};
	this.current = {
		tool: null,         // {?string} Current tool name
		menu: null,         // {?string} Tool for which menu is shown (may be active tool or 'more')
		mru: {}             // {object<string>} Current selected mru tools
	};
	this.toolState = {};   // {object<boolean>} Explicitly set button states, e.g. Clock

	this.setColors([
		'#fb5f62', // 0 red
		'#f4ba5c', // 1 yellow
		'#1a6caa', // 2 blue
		'#37b1be', // 3 turquoise
		'#77bc7f', // 4 green
		'#000000', // 5 black
		'#ffffff'  // 6 white
	], 1); // default color
	this.setWidths([7, 6, 5, 4, 3, 2, 1], 3);
	this.setTools([
		['Outline', 'Rect', 'Ellipse', 'Circle'],
		['Lines', 'Line', 'LineH', 'LineV', 'Arrow'],
		['Freeform', 'Freeline', 'Dot', 'Text'],
		['Angles', 'Angle', 'AngleV', 'AngleH'],
		['Measurement', 'Clock', 'Cal', 'Bezier'],
		[null, 'Distance', 'Speed', 'BikeV', 'BikeH']
	]);
	this.setMru();
	this.setActions(['More', 'Undo', 'Delete']);
};

// Default most recent drawing tools.
AnalysisTool.Drawbar.defaultMru = [
	{ tool: 'Rect', color: 0 },
	{ tool: 'Ellipse', color: 4 },
	{ tool: 'Freeline', color: 1 },
	{ tool: 'Arrow', color: 2 }
];

// Map our tool names to those defined by drawing engine.
AnalysisTool.Drawbar.toolInfo = {
	Align: { css: 'film', title: 'Toggle align and synchronise' },
	Angle: { css: 'angl', title: 'Angle' },
	AngleH: { css: 'hang', title: 'Horizontal angle' },
	AngleV: { css: 'vang', title: 'Vertical angle' },
	Arrow: { css: 'arrw', title: 'Arrow' },
	Bezier: { css: 'bezi', title: 'Cumulative distance' },
	BikeH: { css: 'bikh', title: 'Horizontal distance' },
	BikeV: { css: 'bikv', title: 'Vertical distance' },
	Cal: { css: 'rule', title: 'Calibrate screen units' },
	Circle: { css: 'circ', title: 'Circle' },
	Clock: { css: 'wtch', title: 'Stopwatch' },
	Delete: { css: 'dele', title: 'Delete all drawings' },
	Distance: { css: 'dist', title: 'Distance' },
	Dot: { css: 'dots', title: 'Dot' },
	Ellipse: { css: 'elli', title: 'Ellipse' },
	Flip: { css: 'flip', title: 'Mirror video' },
	Freeline: { css: 'free', title: 'Freeform' },
	Fullscreen: { css: 'full', title: 'Toggle fullscreen' },
	Line: { css: 'line', title: 'Line' },
	LineH: { css: 'hlin', title: 'Horizontal line' },
	LineV: { css: 'vlin', title: 'Vertical line' },
	More: { css: 'more', title: 'More tools' },
	//-> need to add PolyAngle: { css: 'bezi', title: 'Poly line with angles' },
	Rect: { css: 'rect', title: 'Rectangle' },
	Speed: { css: 'velo', title: 'Speed' },
	Text: { css: 'text', title: 'Text' },
	Undo: { css: 'undo', title: 'Undo drawing' }
};

/** ***************************************************
* Add a divider element to the given bar.
* @param {HTMLDivElement=} bar Bar to which to attach the divider, or undefined to return html.
* @returns {string} The content html if bar isn't supplied.
**************************************************** */
AnalysisTool.Drawbar.makeDivider = function (bar) {
	var div = '<span class="ac-drawbar-divider"><span class="lines"></span></span>';
	if (bar) {
		$(div).appendTo(bar);
	}
	return div;
};
AnalysisTool.Drawbar.prototype = $.extend(new AnalysisTool.Events(), {
	/** ***************************************************
	* Create buttons attached to given element.
	* @param {jQuery.HTMLElement} $parent Parent element where to attach.
	**************************************************** */
	appendTo: function ($parent) {
		var k, elActions, elMru,        // {HTMLDivElement} Elements for actions and tool buttons
			actions = this.actions,      // {Array<string>} Action buttons
			mru = this.current.mru,      // {object<string>} Most recent tools list
			bar = document.createElement('div');

		//---Create---------------------
		$(bar)
			.addClass('ac-drawbar')
			.html([
				'<div class="ac-drawbar-actions"></div>',
				'<div class="ac-drawbar-tools">',
				'<div class="ac-drawbar-mru"></div>',
				'</div>',
				'</div>'
			].join(''));
		elActions = bar.querySelector('.ac-drawbar-actions');
		elMru = bar.querySelector('.ac-drawbar-mru');

		//---Actions (More, Undo)-------
		for (k = 0; k < actions.length; k += 1) {
			this.makeButton(actions[k], elActions, false);
			if (k === 0 || k === actions.length - 1) {
				AnalysisTool.Drawbar.makeDivider(elActions);
			}
		}

		//---Finalize-------------------
		$(bar).appendTo($parent);
		this.domElement.bar = bar;
		this.domElement.mru = elMru;
		this.updateMru();
		return this;
	},

	/** ***************************************************
	* Set the available color set including default.
	* @param {Array<string.colorref>} colors Palette of available colors.
	* @param {number} def Index of color to use as default.
	**************************************************** */
	setColors: function (colors, def) {
		this.colors = $.extend([], colors);
		this.defaults.color = colors[def || 0];
	},

	/** ***************************************************
	* Set the available line widths including default.
	* @param {Array<number>} widths Available widths.
	* @param {number} def Index of width to use as default.
	**************************************************** */
	setWidths: function (widths, def) {
		this.widths = $.extend([], widths);
		this.defaults.lineWidth = widths[def || 0];
	},

	/** ***************************************************
	* Set the tool action buttons to display.
	* @param {Array<string>} actions Action buttons to display.
	**************************************************** */
	setActions: function (actions) {
		this.actions = actions;
	},

	/** ***************************************************
	* Set the tool set available to the drawing bar.
	* @param {object<Array>} tools Tool set, in order of display.
	* @returns {Drawbar} Reference to self for chaining.
	**************************************************** */
	setTools: function (tools) {
		var g, grp, k, tool;

		//---Tools and Options----------
		this.options = {};
		this.tools = $.extend([], tools);
		for (g = 0; g < tools.length; g += 1) {
			grp = tools[g];
			for (k = 1; k < grp.length; k += 1) {
				tool = grp[k];
				this.options[tool] = {
					color: tool === 'Cal' || tool === 'Clock' 
						? null
						: this.defaults.color, // {string.colorref} Color for this tool
					lineWidth: this.defaults.lineWidth    // {number} Line width for this tool
				};
			}
		}

		return this;
	},

	/**
	* Set the most recently used tools.
	* @param {Array<object>} mru Tools and colors to set, as objects { tool: 'Tool', color: 0 }.
	*/
	setMru: function (mru) {
		var k, tool, color;
		mru = mru || AnalysisTool.Drawbar.defaultMru;
		this.current.mru = {};
		for (k = 0; k < mru.length; k += 1) {
			tool = mru[k].tool;
			color = mru[k].color;
			this.current.mru[tool] = true;
			if (color !== undefined && color >= 0) {
				this.options[tool].color = this.colors[color];
			}
		}
		this.updateMru();
	},

	/**
	* Retrieve the current tool state.
	* @returns {Array<object>} Array of tools and colors, as objects { tool: 'Tool', color: 0 }.
	*/
	getMru: function () {
		var tool, mru = [];
		for (tool in this.current.mru) {
			if (this.current.mru.hasOwnProperty(tool)) {
				mru.push({
					tool: tool,
					color: this.colors.indexOf(this.options[tool].color)
				});
			}
		}
		return mru;
	},

	/** ************************************************
	* Set the button disabled states.
	* @param {boolean} isDisabled TRUE to disable buttons, FALSE to enable
	* @param {boolean=} timeTools Set to FALSE to keep time tools (clock) locked.
	************************************************* */
	setBarDisabled: function (isDisabled, timeTools) {
		if (isDisabled) {
			$('button', this.domElement.bar).attr('disabled', 'disabled');
		} else {
			$('button', this.domElement.bar).removeAttr('disabled');
		}
		if (!timeTools) {
			// Tools only available for video
			$('button[tool="Clock"], button[tool="Speed"]', this.domElement.bar)
				.attr('disabled', 'disabled');
		}
		return this;
	},

	// ----------------------------------------------------
	//                 Button actions
	// ----------------------------------------------------

	/** ***************************************************
	* Add and remove buttons on the Most Recent List.
	**************************************************** */
	updateMru: function () {
		var g, grp, k, tool,
			elMru = this.domElement.mru,  // {HTMLDivElement} List
			mru = this.current.mru,       // {object<string>} Current most recent tools
			tools = this.tools;           // {Array<Array>} All tools grouped

		// If this is called from a call to setMru,
		// then the DOM elements may not yet exist.
		if (!elMru) return;

		elMru.innerHTML = '';            // Clear existing content.
		for (g = 0; g < tools.length; g += 1) {
			grp = tools[g];
			for (k = 1; k < grp.length; k += 1) {
				tool = grp[k];
				if (mru[tool]) {
					this.makeButton(tool, elMru);
					this.setToolButtonColor(tool);
				}
			}
		}
	},

	/** ***************************************************
	* Create and activate a single tool button on the most-recent used list.
	* @param {string} tool Tool for which to create the button.
	* @param {HTMLElement} el Element where to add button.
	* @returns {jQuery.HTMLDivElement} HTML code for button.
	**************************************************** */
	makeButton: function (tool, el) {
		var self = this,
			info = AnalysisTool.Drawbar.toolInfo,
		$frm = $([
			'<div class="ac-drawbar-frame" tool="' + tool + '">',
			'<button class="ac-drawbar-button ac-drawbar-sprite" ',
			'tool="' + tool + '" ',
			't="' + info[tool].css + '" ',
			'>',
			AnalysisTool.icon(tool) || '',
			'</button>',
			'</div>'].join(''))
			.appendTo(el)
			.find('button')
			.attr('title', AnalysisTool.localize(info[tool].title))
			.css('fill', this.options[tool]
				? this.options[tool].color : '')
			.click(function (e) {
				self.onButtonClick(e);
			});
	},

	/** ***************************************************
	* One of the drawing bar buttons is clicked.
	* @param {MouseEvent} e Event triggering action.
	**************************************************** */
	onButtonClick: function (e) {
		var tgt = e.currentTarget,                 // {HTMLButtonElement} Button triggering click
			tool = tgt.getAttribute('tool'),        // {string} New tool to select
			prevTool = this.current.tool,           // {string} Currently selected tool
			prevMenu = this.current.menu,           // {?number|string} Group number, 'more', or NULL
			hadMenu = !!this.domElement.menu,       // {boolean} A menu is currently visible
			options = this.options[tool];           // {object=} Tool options

		this.removeMenu(); // always remove menu
		switch (tool) {
			case 'More':
				if (!hadMenu || prevMenu !== 'More') {
					this.toolsPalette(tool);
				}
				break;

			case 'Undo':
			case 'Delete':
				this.fireEvent('toolchange', tool, true);
				break;

			case 'Clock':
			case 'Flip':
				this.toggleTool(tool);
				break;

			default:
				this.selectTool(tool, true);
				if (tool !== 'Cal'				// Don't show format selection menu for calibrate
					&& !hadMenu && prevTool === tool) {  // re click same tool
					this.stylePalette(tool);
				}
				break;
		}
	},

	/** ***************************************************
	* Set the explicit toggle state of a button. This is
	* called from external e.g. for Clock when time offset.
	* @param {string} name Name of tool to set.
	* @param {boolean=} set Explicity selected state of button.
	**************************************************** */
	setToolState: function (name, set) {
		this.toolState[name] = set;
		this.setToolButtonSelected();
	},

	/** ***************************************************
	* Set the visibility state of the given tool.
	**************************************************** */
	setToolButtonSelected: function () {
		var curTool = this.current.tool,
			toolState = this.toolState;
		$('.ac-drawbar-mru button[tool]', this.domElement.bar).each(function (k, el) {
			var tool = el.getAttribute('tool');
			$(el).toggleClass('selected',
				toolState.hasOwnProperty(tool)
				? toolState[tool] 
				: curTool === tool);
		});
	},

	/** ***************************************************
	* Update the color of the given button group.
	* @param {string} tool Tool whose color to update. If not supplied, updates all tools.
	**************************************************** */
	setToolButtonColor: function (forTool) {
		var options = this.options;
		$('.ac-drawbar-mru button[tool]', this.domElement.bar).each(function (k, el) {
			var tool = el.getAttribute('tool');
			if (forTool === undefined || forTool === tool) {
				el.style.fill = options[tool].color;
			}
		});
	},

	/** ***************************************************
	* Select the given tool.
	* This is called when the tool is clicked, either in the
	* main bar or from the tool selection palette.
	* @param {string} tool Name of tool to use.
	* @param {boolean} isSelected Set to FALSE to deselect the tool.
	**************************************************** */
	selectTool: function (tool, isSelected) {
		if (isSelected === 'delete') {
			delete this.current.mru[tool];
			isSelected = false;
		}
		if (isSelected === true || isSelected === undefined) {
			this.current.mru[tool] = true;
			this.current.tool = tool;
			this.fireEvent('toolchange', tool, true);
			this.fireEvent('toolchange', 'Palette', true);
			this.fireEvent('toolchange', 'Linewidth', true);
			this.fireEvent('toolchange', tool, true);
		} else {
			this.current.tool = null;
			this.fireEvent('toolchange', tool, isSelected);
		}
		this.updateMru();
		this.setToolButtonSelected();
	},

	/** ***************************************************
	* Toggle a tool button. This is usually only used for
	* the clock.
	* @param {string} tool Tool name to toggle.
	**************************************************** */
	toggleTool: function (tool) {
		var $but = $('button[tool="' + tool + '"]', this.domElement.bar),
			isSelected = !$but.hasClass('selected');
		switch (tool) {
			case 'Flip':
				this.fireEvent('flip', isSelected);
				break;
			default:
				this.fireEvent('toolchange', tool, isSelected);
		}
		$but.toggleClass('selected', isSelected);
	},

	// ----------------------------------------------------
	//                  Tool attributes
	// ----------------------------------------------------

	/** ***************************************************
	* Select a new color or linewidth (for the currently selected tool).
	* @param {string} attr Attribute to set 'color'|'lineWidth'
	* @param {string.colorref|number} value Color or linewidth value to set
	**************************************************** */
	selectAttribute: function (attr, value) {
		if (this.options[this.current.tool]) {
			this.options[this.current.tool][attr] =
				attr === 'lineWidth' ? +value
				: value;
		} else {
			this.defaults[attr] = value;
		}
		this.setToolButtonColor(this.current.tool);
		this.fireEvent('toolchange', 'Palette', true);
		this.fireEvent('toolchange', 'Linewidth', true);
	},

	/** ***************************************************
	* Get the current tool or default attribute.
	* @param {string} attr Attribute to retrieve 'color'|'lineWidth'.
	* @returns {string|number} The requested attribute value.
	**************************************************** */
	getAttribute: function (attr) {
		return (this.options[this.current.tool] || this.defaults)[attr];
	},

	/** ***************************************************
	* Retrieve the current color.
	* @returns {string.colorref} Color for currently selected tool.
	**************************************************** */
	getColor: function () {
		return this.getAttribute('color');
	},

	/** ***************************************************
	* Retrieve the current line width.
	* @returns {number} (px) Stroke width selected.
	**************************************************** */
	getLineWidth: function () {
		return this.getAttribute('lineWidth');
	},

	/** ***************************************************
	* Create a style palette for the given tool.
	* @param {string} tool Tool where to attach.
	**************************************************** */
	stylePalette: function (tool) {
		var r, c, t, label,
			tbl = [],                       // {string} HTML code for tool selection panel
			colors = this.colors,            // {Array<string>} Available colors
			widths = this.widths,            // {Array<number>} Available line widths
			curColor = this.getColor(),      // {string.colorref} Color for current tool
			curWidth = this.getLineWidth(),  // {number} Current line width
			rows = Math.max(colors.length, widths.length); // {number} Max number of tools / colors / widths in a group
		//---Build table---
		tbl.push('<table>');
		for (r = 0; r < rows; r += 1) {
			tbl.push('<tr>');
			// Color
			tbl.push(r < colors.length
				? '<td><button class="ac-drawbar-menu-button ac-drawbar-sprite color" color-value="' + colors[r] + '">'
				+ '<span style="border-bottom-color: ' + colors[r] + '"></span>'
				+ '</button>'
				: '<td></td>');
			// Linewidth
			tbl.push(r < widths.length
				? '<td><button class="ac-drawbar-menu-button ac-drawbar-sprite width" line-width="' + widths[r] + '">'
				+ '<span style="border-bottom: ' + widths[r] + 'px solid;"></span>'
				+ '</button>'
				: '<td></td>');
			tbl.push('</tr>');
		}

		label = AnalysisTool.Drawbar.toolInfo[tool].title;
		label = Utilities.stringFormat(AnalysisTool.localize('{1} properties'), null, label); // Substitution {0} reserved for Localize.
		this.attachPalette(label, tbl.join(''), tool);
		this.activateStylePalette();
		this.updateStylePalette();
	},

	/** ***************************************************
	* Activate a single tool style palette.
	* @param {HTMLDivElement} pnl Panel containing buttons.
	**************************************************** */
	activateStylePalette: function(){
		var self = this,
			pnl = this.domElement.menu,   // {HTMLDivElement} Current menu element.
			bits = {
				color: 0x01,      // {number.bit} Choose a color
				lineWidth: 0x02,  // {number.bit} Choose a width
				all: 0x03         // {number.bitmask} All choices made
			},
			domAttr = {          // {object<string>} DOM node attributes
				color: 'color-value',
				lineWidth: 'line-width'
			},
			chosen = 0x00,       // {number.bitfield} Chosen one of each

			// Set color or linewidth attribute from a button click.
			// @param {Event} e Event from which to determine clicked button.
			// @param {string} attr Tool attribute to set 'color'|'lineWidth'
			// @param {boolean} close Force close of menu, or use selection auto close.
			setAttributeFromEvent = function (e, attr, close) {
				self.selectAttribute(attr, e.currentTarget.getAttribute(domAttr[attr]));
				chosen |= bits[attr];
				if (close || (chosen === bits.all)) {
					self.removeMenu();
				} else {
					self.updateStylePalette(pnl);
				}
			};
		$('button[color-value]', pnl).click(function (e) {
			setAttributeFromEvent(e, 'color', false);
		}).dblclick(function (e) {
			setAttributeFromEvent(e, 'color', true);
		});

		$('button[line-width]', pnl).click(function (e) {
			setAttributeFromEvent(e, 'lineWidth', false);
		}).dblclick(function (e) {
			setAttributeFromEvent(e, 'lineWidth', true);
		});
	},
	
	/** ***************************************************
	* Update the style selection in the current style palette.
	**************************************************** */
	updateStylePalette: function () {
		var pnl = this.domElement.menu,
			color = this.getColor(),      // {?string.colorref} Current tool group color
			width = this.getLineWidth();  // {number} Current linewidth

		$('button[color-value]', pnl).each(function (k, el) {
			$(el).toggleClass('selected', el.getAttribute('color-value') === color);
		});
		$('button[line-width]', pnl).each(function (k, el) {
			$(el).toggleClass('selected', +el.getAttribute('line-width') === width);
		});
	},

	// ----------------------------------------------------
	//               Tools Palettes
	// ----------------------------------------------------

	/** ***************************************************
	* Create the tools palette.
	* @param {string} tool Tool where to attach - usually 'more'.
	**************************************************** */
	toolsPalette: function (tool) {
		var g, grp, k, t,
			str = [],                             // {string} HTML code for tool selection panel
			info = AnalysisTool.Drawbar.toolInfo, // {object} Css and title attributes for tools
			tools = this.tools;                   // {Array<string>} Available tools

		//---Build table---
		for (g = 0; g < tools.length; g += 1) {
			grp = tools[g];
			if (grp[0]) {
				str.push('<div class="tool-group-heading">' + AnalysisTool.localize(grp[0]) + '</div>');
			}
			str.push('<div class="tool-group">');
			for (k = 1; k < grp.length; k += 1) {
				t = grp[k];
				str.push(k > 1 ? '<span class="separator">&nbsp;</span>' : ''); // separator
				str.push('<button class="ac-drawbar-menu-button ac-drawbar-sprite" '
						+ 'tool="' + t + '" '
						+ 't="' + info[t].css + '" '
						+ 'title="' + AnalysisTool.localize(info[t].title) + '">'
						+ (AnalysisTool.icon(t) || '')
						+ '</button>');
			}
			str.push('</div>');
		}
		this.attachPalette(AnalysisTool.localize('Tool selector'), str.join(''), tool)
		this.activateToolsPalette();
		this.updateToolsPalette();
	},

	/** ***************************************************
	* Attach the given content as a menu panel. Assumes that
	* any existing palette has already been closed.
	* @param {string} title Title to write across top.
	* @param {string} content Content for panel.
	* @param {string} tool Tool name where to attach panel.
	* @returns {HTMLDivElement} The newly created panel element.
	**************************************************** */
	attachPalette: function (title, content, tool) {
		var bar = this.domElement.bar,       // {HTMLDivElement} Main drawing bar
			pnl = document.createElement('div'), // {HTMLDivElement} Palette element
			anchor = bar.querySelector('.ac-drawbar-frame[tool="' + tool + '"]');

		// Because the mru list element has overflow hidden, we have
		// to attach the menu above it in the dom, then position it.
		//    .ac-drawbar-menu-anchor   -> Positioned to same place as button frame using left/top
		//       .ac-drawbar-menu-align -> Use bottom / right to bottom-right align menu
		//          .ac-drawbar-menu    -> Menu proper with content
		$(pnl)
			.addClass('ac-drawbar-menu-anchor')
			.html([
				'<div class="ac-drawbar-menu-align" tool-anchor="' + tool + '">',
				'<div class="ac-drawbar-menu">',
				'<div class="ac-drawbar-menu-title">',
				title,
				'<a href="javascript:void(0)" class="pathwayIcon block closePalette" pathway-icon="crossgrey"></a>',
				'</div>',
				'<div class="ac-drawbar-menu-content">' + content + '</div>',
				'</div>',
				'<div class="ac-drawbar-winglet"></div>',
				'</div>'].join(''))
			.appendTo(bar)
			.offset($(anchor).offset());
		this.domElement.menu = pnl;   // {HTMLDivElement} Menu element
		this.current.menu = tool;     // {?string} Tool or 'more' for which menu is shown
		this.activatePalette();       // Activate document down handlers to close palette
		return pnl;                   // {HTMLDivElement} Menu panel element
	},

	/** ***************************************************
	* Activate the document down to close current palette.
	**************************************************** */
	activatePalette: function () {
		var self = this;
		// Close the tool palette if a click event happens outside our drawbar.
		// @param {MouseEvent|TouchesEvent} ev Event triggering action
		this.domElement.documentDown = function (ev) {
			var e = ev.touches && ev.touches.length === 1 ? ev.touches.item(0) : ev;
			if ($(e.target).closest('.ac-drawbar').length <= 0 || $(e.target).hasClass('ac-drawbar-mru')) {
				self.removeMenu();
				ev.preventDefault();
			}
		};
		this.domElement.menu.querySelector('.closePalette').onclick = function () {
			self.removeMenu();
		};
		document.addEventListener('mousedown', this.domElement.documentDown, false);
		document.addEventListener('touchstart', this.domElement.documentDown, false);
	},

	/** ***************************************************
	* Activate the tool buttons in the tool selection palette.
	**************************************************** */
	activateToolsPalette: function () {
		var self = this,
			pnl = this.domElement.menu,   // {HTMLDivElement} Current menu element.

			// Set the tool from the click event.
			// @param {Event} e Event from which to determine tool.
			// @param {boolean} close Force close of menu.
			setToolFromEvent = function (e, close) {
				var k, count = 0,
					tgt = e.currentTarget,
					tool = tgt.getAttribute('tool'),  // {string} Tool being clicked
					mru = self.current.mru;           // {object<string>} Currently shown recent tools
				if (!mru[tool] || close) {           // Always select if double click to close palette
					self.selectTool(tool, true);
				} else {
					// Ensure at least one tool remains on bar.
					for (k in mru) {
						if (mru.hasOwnProperty(k)) {
							count += 1;
						}
					}
					if (count > 1) {
						self.selectTool(tool, 'delete');
					}
				}
				if (close) {
					self.removeMenu();
				} else {
					self.updateToolsPalette();
				}
			};

		$('button[t]', pnl).click(function (e) {
			setToolFromEvent(e, false);
		}).dblclick(function (e) {
			setToolFromEvent(e, true);
		});
	},

	/** ***************************************************
	* Update the selected width and color in the given menu.
	**************************************************** */
	updateToolsPalette: function () {
		var pnl = this.domElement.menu,
			mru = this.current.mru;    // {object<string>} Currently selected tools in most recent list
		$('button[t]', pnl).each(function (k, el) {
			$(el).toggleClass('selected', !!mru[el.getAttribute('tool')]);
		});
	},

	/** ***************************************************
	* Remove the tools palette.
	**************************************************** */
	removeMenu: function () {
		$(this.domElement.menu).remove();
		document.removeEventListener('mousedown', this.domElement.documentDown, false);
		document.removeEventListener('touchstart', this.domElement.documentDown, false);
		this.domElement.menu = null;   // {HTMLDivElement} Menu element
		this.current.menu = null;      // {?string} Tool or 'more' for which menu is shown
	},

	// ----------------------------------------------------
	//    Undo Button States
	// ----------------------------------------------------

	/** ***************************************************
	* Update the Undo and Delete button states. This is
	* typically called from the caller when a drawing has
	* been made or deleted.
	* @param {boolean} canUndo TRUE if there are tools to undo, else FALSE.
	**************************************************** */
	updateCanUndo: function (canUndo) {
		// TODO: This may conflict with setBarDisabled
		$('button[tool="Undo"], button[tool="Delete"]', this.domElement.bar)
			.prop('disabled', !canUndo);
	}
});