/* eslint-disable default-case, eqeqeq */
import { AnalysisTool, $, Localize } from './shim';
export {};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Drawing engine
* Handles the events from tool bars and mouse.
* Selects the drawing tool and passes the mouse down and move events to the correct tool.
*
* @class: mymodule	
* @param: {String} myparam  
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.drawingEngine = function (drawToolsBar, drawCanvas, scratchCanvas) {
	this.tool = null;
	this.toolsbar = drawToolsBar;
	this.drawCanvas = drawCanvas;
	this.tempCanvas = scratchCanvas
	this.drawCtx = this.drawCanvas.el.getContext('2d');
	this.toolsbar.addEventListener('toolchange', (function (self) {
		return function (name, isSelected) {
			return self.onToolChanged(name, isSelected);
		}
	}(this)));
	this.formatTimeHandler = null; // {object=} Object that implements formatTime
	this.deselectToolOnEnd = false; // {boolean} Value indicating whether all tools should be de-select after use. (There's no accessor; just set it.)

	this.isIpad = (new RegExp("iPad", "i")).test(
		  navigator.userAgent
	  );

	// Attach the mousedown, mousemove and mouseup event listeners. WEB Browser
	this.attachCanvasHandlers();

	this.tools = new AnalysisTool.drawTools(this.tempCanvas.el, this.drawCanvas.el, (function (self) {
		return function (action, tool) {
			switch (action) {
				case 'start':
					self.onDrawStart(tool);
					break;
				case 'end':
					return self.onDrawFinished(tool);
			}
		}
	}(this)));
	this.clockOffset = null;       // {?number} (s) Offset for clock tool
	this.lastClockRect = null;     // {object.Rect} Rectangle occupied by last-drawn clock
	this.toolstack = [];
	this.domElement = {
		dialog: null        // {?HTMLDivElement} Info or data dialog.
	};
	this.showClock = true;         // {boolean} Show or hide clock.
};

AnalysisTool.drawingEngine.prototype = {
	constructor: AnalysisTool.drawingEngine,

	/** ***************************************************
	* Callback when a drawing tool starts being used. This
	* is typically on the first mouse down action. We add
	* the tool to the toolstack here so that the Undo and
	* Delete buttons become activated. If a tool is started
	* but not completed, it is removed from the tool stack
	* during onDrawFinished.
	* @param {object} tool Tool being started.
	**************************************************** */
	onDrawStart: function (tool) {
		if (tool.name !== 'Cal') {
			this.toolstack.push(tool);
		}
		this.updateCanUndo(); // update the selected buttons delete / undo
	},

	/** ***************************************************
	* Callback from draw tools when a tool finishes drawing,
	* or when a new tool is selected from the palette.
	* !!   This function is temporarily overwritten    !!
	* !!  when capturing a region in getCaptureRegion  !!
	* @param {object} tool The tool that just finished drawing.
	**************************************************** */
	onDrawFinished: function (tool) {
		if (tool.name === 'Cal') {
			if (tool.data.length > 0) { // a distance has been marked
				this.showDataDialog(this.$outerContainer, tool.data.length);
			} else { // no distance selected
				this.onToolChanged('Cal');
			}
		} else {
			if (tool.isValid && !tool.isValid()) { // declares valid test, but not valid drawing
				this.toolstack.pop(); // remove last tool pushed at Start
			}
			this.renderAll();
			if (this.deselectToolOnEnd
				|| tool.name === 'Text') {
				// Deselect current tool
				this.toolsbar.selectTool(tool.name, false);
			} else {
				// Reselect current tool
				this.onToolChanged(tool.name);
			}
		}
		this.updateCanUndo();
	},

	renderAll: function () {
		this.drawCtx.clearRect(0, 0, this.drawCanvas.el.width, this.drawCanvas.el.height);
		$.each(this.toolstack, function (i) {
			if (this.Render) {
				this.Render(true);
			}
		});
		this.drawTime();
		this.updateCanUndo();
	},

	onToolChanged: function (name, isSelected) {
		var c;
		if (this.tools.started) {
			this.tools.finishTool(this.tool);
		}
		this.tempCanvas.erase();
		if (isSelected !== false) {
			switch(name){
				case 'Delete':
				case 'Undo':
				case 'Palette':
				case 'Linewidth':
				case 'Clock':
				case 'Cal':
					break;

				default:
					this.toolstack.last = name;
					break;
			}
		} else if (name !=='Clock') {
			this.tool = null;
			this.toolstack.last = null;
			name = null;
		}
		switch (name) {
			case 'Delete':
				this.toolstack = [];
				this.renderAll();
				break;

			case 'Palette':
				c = this.toolsbar.getColor();
				this.tools.setColor(c);
				break;

			case 'Linewidth':
				c = this.toolsbar.getLineWidth();
				this.tools.setLineWidth(c);
				break;


			case 'Undo':
				this.toolstack.pop(); //Remove last item in tool stack;
				this.renderAll();
				break;


			case 'Bezier':
			case 'BikeH':
			case 'BikeV':
			case 'Distance':
			case 'Speed':
				if (this.tools.measureRatio == 0) {
					this.showInfoDialog(this.$outerContainer);
					name = null;
				}
				break;

			case 'Clock':
				if (isSelected) {
					this.clockOffset = this.tools.currentTime;
					this.toolsbar.setToolState('Clock', true);
				} else {
					this.clockOffset = null;
					this.toolsbar.setToolState('Clock', false);
				}
				this.drawTime();
				break;
		}

		if (this.tools[name]) {
			this.tool = new this.tools[name]();
			this.tempCanvas.domElement.setAttribute('tool-name', name);
		} else {
			this.tempCanvas.domElement.removeAttribute('tool-name');
		}
		if (this.tool && this.tool.beforeUse) {
			// Optional implementation for tool to show something before it's used
			this.tool.beforeUse();
		}
	},

	// Update the drawing toolbar's undo buttons.
	updateCanUndo: function () {
		this.toolsbar.updateCanUndo(this.toolstack.length > 0);
	},

	// Clear the drawings.
	clearDrawings: function () {
		this.toolsbar.fireEvent('toolchange', 'Delete', true);
	},

	attachCanvasHandlers: function () {
		var self = this,
			onup = function (ev) {
				document.removeEventListener('mousemove', onMouseCanvasHandler, false);
				document.removeEventListener('touchmove', onMouseCanvasHandler, false);
				document.removeEventListener('mouseup', onup, false);
				document.removeEventListener('touchend', onup, false);
				onMouseCanvasHandler(ev);
				self.tempCanvas.el.addEventListener('mousemove', onMouseCanvasHandler, false);
			},
			ondown = function (ev) {
				self.tempCanvas.el.removeEventListener('mousemove', onMouseCanvasHandler, false);
				document.addEventListener('mousemove', onMouseCanvasHandler, false);
				document.addEventListener('touchmove', onMouseCanvasHandler, false);
				document.addEventListener('mouseup', onup, false);
				document.addEventListener('touchend', onup, false);
				onMouseCanvasHandler(ev);
			},
			onMouseCanvasHandler = function (ev) {
				return self.onMouseCanvasHandler(ev);
			};
		this.tempCanvas.el.addEventListener('mousedown', ondown, false);
		this.tempCanvas.el.addEventListener('touchstart', ondown, false);

		// moves (not drags)
		this.tempCanvas.el.addEventListener('mousemove', onMouseCanvasHandler, false); // moves (not drags)
	},

	onMouseCanvasHandler: function (ev) {
		var t,
			eventMap = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			};
		if (this.tool) {
			ev.preventDefault();
			var offset = $(this.drawCanvas.el).offset(),
				$doc = $(document);
			var scalex = this.drawCanvas.el.width / this.drawCanvas.el.clientWidth;
			var scaley = this.drawCanvas.el.height / this.drawCanvas.el.clientHeight;
			if (ev.touches && ev.touches.length) {
				t = ev.touches.item(0);
				ev._x = t.clientX;
				ev._y = t.clientY;
			} else {
				ev._x = ev.clientX || ev.pageX;
				ev._y = ev.clientY || ev.pageY;
			}

			//Scale mouse position
			ev._x = (ev._x - offset.left + $doc.scrollLeft()) * scalex;
			ev._y = (ev._y - offset.top + $doc.scrollTop()) * scaley;

			// Call the event handler of the tool.
			if (this.tool[ev.type]) {
				return this.tool[ev.type](ev);           // Event handler defined.
			} else if (eventMap[ev.type] && this.tool[eventMap[ev.type]]) {
				return this.tool[eventMap[ev.type]](ev); // Touch event mapping
			} else if (ev.type === 'mouseup' || eventMap[ev.type] === 'mouseup'){
				this.tools.finishTool(this.tool);
			}
		}
	},

	setOuterContainer: function ($element) {
		this.$outerContainer = $element;
	},


	// Called from external when the clock time on the
	// video changes. The current time is stored as a
	// member of the drawing tools because the measure
	// tool needs to know time(s) for speed measurements
	// @param {number} newTime (s) New time on video
	upDateClock: function (newTime) {
		this.tools.currentTime = newTime;
		this.drawTime();
	},

	// Draw the current time onto the canvas, taking into
	// account the clock offset, if any. The current time
	// is retrieved from the drawing tools currentTime.
	drawTime: function () {
		var self = this,
			k, w, h,
			pad = 4,
			ctx = this.drawCtx,
			clockOffset = this.clockOffset,
			currentTime = this.tools.currentTime,
			formatTime = function (t) {
				return self.formatTimeHandler ? self.formatTimeHandler.formatTime(t) : typeof t === 'number' ? t.toFixed(2) : '---';
			},
			txt = [
				formatTime(currentTime) + ' / ' + formatTime('max'),
				clockOffset !== null ? formatTime(currentTime - clockOffset) : null
			],
			lastRect = this.lastClockRect || [];

		if (this.showClock) {
			ctx.save();
			ctx.font = 'normal 16px sans-serif';
			ctx.textBaseline = 'top';

			for (k = 0; k < txt.length; k += 1) {
				let rect = lastRect ? lastRect[k] : null;
				if (rect) {
					ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
				}
				if (txt[k]) {
					w = ctx.measureText(txt[k]).width;
					h = 20;
					rect = {
						x: k === 0 ? (ctx.canvas.width - w) / 2 - pad : 1,
						y: k === 0 ? ctx.canvas.height - h - 1 : 1,
						w: w + 2 * pad,
						h: h
					};
					ctx.globalAlpha = 0.2;
					ctx.fillStyle = '#000';
					ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
					ctx.globalAlpha = 1.0;
					ctx.fillStyle = '#fff';
					ctx.fillText(txt[k], rect.x + pad, rect.y);
					lastRect[k] = rect;
				} else {
					lastRect[k] = null;
				}
			}
			this.lastClockRect = lastRect;
			ctx.restore();
		}
	},

	// ----------------------------------------------------
	//                  Data dialog
	// ----------------------------------------------------

	/** ***************************************************
	* Show a data dialog for calibrating the video zoom.
	* @param {jQuery.HTMLDivElement} $element Element in which to center dialog.
	**************************************************** */
	showInfoDialog: function ($element) {
		this.hideDialog();
		this.showDialog($element, [
			'<p>Before using the distance measurement tools, you need to calibrate the video.</p>',
			'<p>Select OK then draw a line between the two calibration points and enter the real world distance in cm in the box that appears.</p>'
		].join(''), function (ok) {
			this.toolsbar.selectTool('Cal', ok); // keep calibration or deselect tool
			this.hideDialog();
		});
	},


	/** ***************************************************
	* Show a data dialog for calibrating the video zoom.
	* @param {jQuery.HTMLDivElement} $element Element in which to center dialog.
	* @param {function} fnSetValue Callback function called with numerical value on Ok.
	**************************************************** */
	showDataDialog: function ($element, len) {
		this.hideDialog();
		this.showDialog($element, '<p>Enter the corresponding distance.</p><p>{input} cm</p>', function (ok, val) {
			val = parseFloat(val);
			var last = this.toolstack.last;
			if (ok && !isNaN(val)) { // Ok with valid number: select last selected tool.
				this.tools.measureRatio = val / len;
				this.toolsbar.selectTool(last, !!last);
				this.hideDialog();
			} else if (!ok){ // Cancel: Keep calibration tool
				this.hideDialog();
			}
		});
	},

	/** ***************************************************
	* Show a dialog.
	* @param {jQuery.HTMLDivElement} $element Element in which to center dialog.
	* @param {function} fn Callback function passed TRUE on Ok or FALSE on cancel.
	**************************************************** */
	showDialog: function ($element, text, fn) {
		var self = this,
			dialog = document.createElement('div'),
			onOkClick = function (ok) {
				fn.call(self, ok, $('input[type="text"]', dialog).val());
			};

		text = text.replace(/{input}/g,
			'<input type="text" class="ac-drawdialog-input" />');

		this.domElement.dialog = dialog;
		$(dialog)
			.addClass('ac-drawdialog-anchor')
			.html(Localize.replace([
				'<div class="ac-drawdialog">',
				'<div class="ac-drawdialog-head"></div>',
				'<div class="ac-drawdialog-content">',
				'<div class="ac-drawdialog-text">',
				text,
				'</div>',
				'<div class="ac-drawdialog-buttons">',
				'<button class="vanillaButton" dialog-action="ok">$L{Ok}</button> ',
				'<button class="vanillaButton" dialog-action="cancel">$L{Cancel}</button> ',
				'</div>',
				'</div>'
			].join('')))
			.appendTo($element)
			.find('input[type="text"]')
			.keydown(function (e) {
				switch (e.which || e.keyCode) {
					case 13:
					case 10:
						onOkClick(true);
						e.preventDefault();
				}
			})
			.focus();
		dialog.querySelector('button[dialog-action="ok"]').onclick = onOkClick;
		dialog.querySelector('button[dialog-action="cancel"]').onclick = function () {
			onOkClick(false);
		};
	},

	/** ***************************************************
	* Close the dialog.
	**************************************************** */
	hideDialog: function () {
		$(this.domElement.dialog).remove();
		this.domElement.dialog = null;
	},

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//               Capture With Region
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	
	/** ***************************************************
	* Capture with a region if needed.
	* @param {jQuery.HTMLDivElement} $element Element in which to show dialog.
	* @param {?object=} bar Bar called with setBarDisabled.
	* @param {function} callback Callback function on continue or cancel.
	* @param {object} thisArg Argument passed as THIS to callback functions.
	**************************************************** */
	getCaptureRegion: function ($element, bar, callback, thisArg) {
		var self = this,
			toolstack = this.toolstack,
			lastTool = toolstack.last || null,

			// Step 2: Select a region to capture.
			// Set the drawing engine to use the vignette tool and overload the
			// tool completion function to catch when the vignette is finished.
			captureWithRegion = function () {
				var region;
				bar.setBarDisabled(true);                 // disable buttons
				self.onToolChanged('Vignette');          // select tool
				self.onDrawFinished = function (tool) {  // overload finish function
					bar.setBarDisabled(false);             // re-enable buttons
					delete self.onDrawFinished;          // remove overloaded function
					region = {
						rx: Math.min(tool.data.x0, tool.data.x1),  // {number} Left edge of selection
						ry: Math.min(tool.data.y0, tool.data.y1),  // {number} Top of selection
						rw: Math.abs(tool.data.x1 - tool.data.x0), // {number} Width of selection
						rh: Math.abs(tool.data.y1 - tool.data.y0)  // {number} Height of selection
					};
					toolstack.pop();                   // remove Vignette from tool stack
					self.renderAll();
					if (lastTool) {
						self.onToolChanged(lastTool);          // restore previous tool
					} else {
						self.onToolChanged('Vignette', false); // restore previous tool
						delete toolstack.last;            // ignore this last tool
					}
					// Continue to next step
					callback.call(thisArg, region.rw > 4 && region.rh > 4 ? region : null);
				}
			};

		if (lastTool !== 'Vignette') {
			captureWithRegion();
		} else {
			bar.selectTool('Vignette', false);
			delete this.onDrawFinished;
			bar.setBarDisabled(false);
			callback.call(thisArg, null);
		}
		//this.showCaptureDialog($element, function (ok) {
		//	if (ok) {
		//		captureWithRegion();
		//	} else {
		//		callback.call(thisArg, null);
		//	}
		//});
	}
};


