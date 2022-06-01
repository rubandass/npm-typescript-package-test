/* eslint-disable no-unused-vars */
import './events';
import { $, AnalysisTool, Utilities } from './shim';
export { };

/** ******************************************************
* Timeline for analysis tools, with selection range.
******************************************************* */
AnalysisTool.Timeline = function () {
	this.range = {
		min: 0.0,           // {number} Minimum time
		max: 0.0,           // {number} Maximum time
		step: 0.0,          // {number|0} Step size (reciprocal of frame rate)
		fmt: 'm:ss',        // {string} Time format, adjusted when range is set
		fmtSeek: 'm:ss.ff'  // {string} Time format while seeking
	};
	this.value = 0.0;      // {number} Current time
	this.selection = null; // {?Array<number>} Selected range: null or [start, end]
	this.domElement = {
		container: null,    // {HTMLDivElement} Surrounding container element
		trough: null,       // {HTMLDivElement} Timeline trough (background)
		progress: null,     // {HTMLDivElement} Region where progress is attached
		thumb: null,        // {HTMLDivElement} Playhead element
		range: null,        // {HTMLDivElement} Range mark
		selection: null,    // {HTMLDivElement} Selected range marking
		highlights: null    // {HTMLDivElement} Container where highlight elements will be added.
	};
	this.highlights = [];  // {Array<object>} Highlights with position and selection for marking on timeline
	this.dragging = false; // {boolean} Don't update time update during dragging
	this.eventListeners = {
		change: [],         // {Array<function>} Event listeners when timeline value changes
		selectionchange: [] // {Array<function>} Event listeners when the selected range changes
	};
};

AnalysisTool.Timeline.prototype = $.extend(new AnalysisTool.Events(), (function () {
	var
		/** ************************************************
		* Create the container elements. The elements are
		* attached by the caller with appendTo.
		************************************************* */
		createDOMElement = function () {
			var cont = document.createElement('div');
			$(cont)
				.addClass('ac-timeline-container')
				.html([
					'<div class="ac-timeline-trough">',
					' <div class="ac-timeline-progress"></div>',
					'  <div class="ac-timeline-selection-range" anchor-type="range"></div>',
					' <div class="ac-timeline-highlights"></div>',
					' <div class="ac-timeline-selection">',
					'  <div class="ac-timeline-selection-anchor" anchor-type="start"></div>',
					'  <div class="ac-timeline-selection-anchor" anchor-type="end"></div>',
					' </div>',
					' <div class="ac-timeline-thumb"></div>',
					'</div>'//ac-timeline-trough
				].join(''));

			this.domElement = $.extend(this.domElement, {
				container: cont,
				trough: cont.querySelector('.ac-timeline-trough'),
				progress: cont.querySelector('.ac-timeline-progress'),
				thumb: cont.querySelector('.ac-timeline-thumb'),
				range: cont.querySelector('.ac-timeline-selection-range'),
				selection: cont.querySelector('.ac-timeline-selection'),
				highlights: cont.querySelector('.ac-timeline-highlights')
			});
		},

		/** ************************************************
		* Return a time number in the given format, which
		* may take the form hh:mm:ss.ff or similar, with
		* placeholders h (hours), m (minutes), s (seconds),
		* f (hundredths, always use ff), one or more times
		* to zero pad.
		* @param {number} tt (s) Time to print.
		* @param {string} fmt Format, with placeholders.
		************************************************* */
		formatTime = function (tt, fmt) {
			var range = this?.range,
				t = range && range.hasOwnProperty(tt) ? range[tt] : tt,
				T = {
					h: Math.floor(Math.abs(t) / 3600),        // hours
					m: Math.floor((Math.abs(t) % 3600) / 60), // minutes
					s: Math.floor(Math.abs(t) % 60),          // seconds
					f: Math.floor(100 * (Math.abs(t) % 1))    // hundredths
				},

				// @param {number} val Value to pad.
				// @param {boolean} deci If TRUE, keeps 2 dp of value.
				// @param {number} len Minimum length to pad to with zeroes.
				pad = function (val, len) {
					var str = val.toString();
					while (str.length < len) str = '0' + str;
					return str;
				};

			return (t < 0 ? '-' : '') +
				(fmt || this.range.fmt)        // default format
				.replace(/(h+|m+|s+|f+)/g, function (match) {
					return pad(T[match[0]], match.length)
				});
		},

		/** ************************************************
		* Attach the slider to the given element
		* @param {jQuery.HTMLElement} $object Element where to attach slider
		************************************************* */
		appendTo = function ($object) {
			createDOMElement.call(this);
			addMouseHandlers.call(this);
			$object.append(this.domElement.container);
			resize.call(this);
		},

		/** ************************************************
		* Resize the slider elements to match the surrounding container
		************************************************* */
		resize = function () {
			//NOP
		},

		/** ************************************************
		* Set the slider range.
		* @param {number} min New minimum time (usually 0).
		* @param {number} max New maximum time.
		* @param {number} step Step size (reciprocal of frame rate).
		************************************************* */
		setRange = function (min, max, step) {
			// TODO: This is supposed to get called once the video
			// time is known. Occasionally the time is not valid
			// and the format gets set wrong, so here we keep only
			// two forms, always including the minute.
			var t = max - min;
			this.range = $.extend(this.range, {
				min: min !== null ? min : this.range.min,
				max: max !== null && !isNaN(max) ? max : this.range.max,
				step: step !== null && step !== undefined ? step : this.range.step,
				fmt: t >= 3600 ? 'h:mm:ss.ff' :
					t >= 60 ? 'm:ss.ff' :
					'm:ss.ff',
				fmtSeek: t >= 3600 ? 'h:mm:ss' :  // longer than an hour
					t >= 60 ? 'm:ss.ff' :          // longer than a minute
					'm:ss.ff'
			});
			this.setSelection(null);    // remove selection
			setHighlights.call(this);   // recalculate highlight positions
			resize.call(this);
		},

		/** ************************************************
		* Retrieve the current timeline state, extending the given object.
		* @returns {object} State object with additional properties.
		************************************************* */
		getSelection = function () {
			return !this.selection ? null
				: [this.selection[0].toFixed(3) * 1, this.selection[1].toFixed(3) * 1];
		},

		/** ************************************************
		* Set the timeline state from the given state object.
		* @param {?Array<number>} sel Selection state to set to.
		************************************************* */
		setSelection = function (sel) {
			this.selection = sel;
			this.fireEvent('selectionchange', sel);
			setThumbPosition.call(this, this.value);
		},

		/** ************************************************
		* Set the width of the container to a fixed size
		* @param {number} width Width to set slider to
		************************************************* */
		setWidth = function (width) {
			$(this.domElement.container)
				.css({
					width: width + 'px'
				});
		},

		/** ************************************************
		* Set the slider to the given value. This is typically
		* called from an outside caller.
		* @param {number|string} value Value to set slider to
		* @return {number} Value rounded in step increments
		************************************************* */
		setSliderValue = function (value) {
			var range = this.range,
				min = range.min,       // {number} (s) Start time of video
				max = range.max;       // {number} (s) End time of video

			value = +value;
			value = value < min ? min : value > max ? max : value;
			this.value = value;

			setThumbPosition.call(this, value);
			return value;
		},

		/** ************************************************
		* Set the thumb and selection graphical positions. This
		* may be called in response to a video time change via
		* setSlider value or when the scrubber is being dragged.
		* @param {number} val (s) Value to set to.
		* @param {boolean} force Set to TRUE to force redraw during dragging
		************************************************* */
		setThumbPosition = function (val, force) {
			var domElement = this.domElement,
				range = this.range,

				// Set the position of a single element.
				// @param {HTMLElement} el Element to set, e.g. thumb or selection range.
				// @param {string} attr 'left'|'width' Style attribute to set.
				// @param {number} val (s) Value to set to.
				set = function (el, attr, val) {
					var k, pos = val / (range.max - range.min); // fractional position in bar
					for (k = 0; k < el.length; k += 1) {
						el[k].style[attr] = (100 * pos).toFixed(2) + '%';
					}
				};

			if (!this.dragging || force) {
				set([domElement.thumb], 'left', val - range.min);
				if (this.selection) {
					set([domElement.selection, domElement.range], 'left', this.selection[0] - range.min);
					set([domElement.selection, domElement.range], 'width', this.selection[1] - this.selection[0]);
				} else {
					set([domElement.selection, domElement.range], 'left', val - range.min);
					set([domElement.selection, domElement.range], 'width', 0);
				}
			}
		},

		/** ***************************************************
		* Set the slider disabled property. When the control
		* is disabled, no touch and mouse events are enabled.
		* @param {boolean} isDisabled Disabled state to set to.
		**************************************************** */
		setDisabled = function (isDisabled) {
			if (isDisabled === true) {
				this.domElement.container.setAttribute('disabled', 'disabled');
			} else {
				this.domElement.container.removeAttribute('disabled');
			}
		},

		/** ************************************************
		* Attach video progress handlers to display progression of video
		* @param {boolean=} smoothUpdates_optional Set to TRUE to add smooth video updates on single analysis.
		* @param {AnalysisTool.VideoPlayer} args Videos to attach to.
		************************************************* */
		listenVideoProgress = function (smoothUpdates_optional, args) {
			var k, elProgress,
				smoothUpdates= smoothUpdates_optional===true,
				n = arguments.length,

				// Attach a new bar to the given container element.
				// @param {HTMLDivElement} el Container where to attach bar.
				// @returns {HTMLDivElement} The created bar.
				attachBar = function (el) {
					var bar = document.createElement('div');
					bar.setAttribute('class', 'bar');
					el.appendChild(bar);
					return bar;
				},

				// Attach a single event. Mostly, these map through to the
				// status attribute of the element, but can be routed to
				// the given callback function if needed.
				// @param {HTMLVideoElement} video Video element to attach to.
				// @param {string} event Event name to listen for.
				// @param {HTMLDivElement|function} elfn Status container element or callback function.
				attachHandler = function (video, event, elfn) {
					video.addEventListener(event, typeof elfn === 'function' ? elfn : function () {
						elfn.setAttribute('status', event);
					});
				},

				// @param {HTMLDivElement} el Progress element whose position to set.
				// @param {number} s Start time or bytes.
				// @param {number} p Loaded time or bytes.
				// @param {number} d Video duration or total bytes.
				setBarWidth = function (el, s, p, d) {
					el.style.left = (100 * s / (d || 1)).toFixed(2) + '%';
					el.style.width = (100 * p / (d || 1)).toFixed(2) + '%';
				},

				// Attach a single video.
				// @this {AnalysisTool.Timeline} Object from outer closure
				// @param {AnalysisTool.VideoPlayer} video Video whose events to listen for.
				attachVideo = function (video) {
					var el = document.createElement('div'),
						bar = [];
					el.setAttribute('class', 'listener');
					this.domElement.progress.appendChild(el);

					attachHandler(video, 'loadstart', function () { // Start looking for media data.
						if (!Utilities.isIPadBrowser && !Utilities.isIPhoneBrowser) {
							el.setAttribute('status', 'loadstart');
						}
					});
					attachHandler(video, 'canplay', el);   // Video is ready to play.
					attachHandler(video, 'error', el);     // Video has error.
					attachHandler(video, 'progress', function (video) { // Video download progress.
						var k, len;
						el.setAttribute('status', 'progress');
						len = video.buffered.length;
						for (k = 0; k < len; k += 1) {
							bar[k] = bar[k] || attachBar(el);
							setBarWidth(bar[k], video.buffered.start(k), video.buffered.end(k), video.duration);
						}
						while (bar.length > len) {
							$(bar.pop()).remove();
						}
					});
					attachHandler(video, 'mediatype', function (tag) {
						el.setAttribute('media-type', tag);
					});
					return el;
				},

				attachVideoUpdateTimer = function (video) {
					var self = this;
					setInterval(function (e_notused) {
						setThumbPosition.call(self, video.currentTime(true));
					}, 50);
				};

			// Remove smooth updates argument
			if (typeof arguments[0] === 'boolean') {
				n -= 1;
				Array.prototype.splice.call(arguments, 0, 1);
			}

			for (k = 0; k < n; k += 1) {
				elProgress = attachVideo.call(this, arguments[k]);
				elProgress.style.top = (100 * k / n) + '%';
				elProgress.style.height = (100 / n) + '%';
				if (smoothUpdates) {
					attachVideoUpdateTimer.call(this, arguments[k]);
				}
			}
		},

		/** ------------------------------------------------
		* Mouse and touch events
		* ----------------------------------------------- */

		/** ************************************************
		* Attach mouse and touch handlers to scrubber and range anchors.
		************************************************* */
		addMouseHandlers = function () {
			var self = this,
				range = this.range,
				$scrub = null,

				tmr = null,

				// Defer seeking to prevent video failures
				// See comments for single tool
				// @param {number} val Value to seek to
				deferSeek = function (val) {
					if (tmr !== null) {
						clearTimeout(tmr);
					}
					tmr = setTimeout(function () {
						tmr = null;
						self.fireEvent('change', val); // seek player
					}, 40);
				},

				// Create, update, or remove the scrub element.
				// In order to be visible outside the clipped timeline,
				// the scrub time is attached to the document body and
				// positioned using jQuery.offset().
				// @param {number|false} val Time value to set to.
				setScrub = function (val) {
					if (val === false) {
						if ($scrub) {
							$scrub.remove();
							$scrub = null;
						}
					} else {
						if (!$scrub) {
							$scrub = $('<div class="ac-timeline-scrub-time"><div></div></div>').appendTo(document.body);
						}
						$scrub
							.offset($(self.domElement.thumb).offset())
							.show()
							.find('div').html(formatTime(val, range.fmtSeek));
					}
				},

				// Seek the thumb to the given position.
				seekTo = function (val) {
					setThumbPosition.call(this, val, true);     // quick redraw
					deferSeek.call(self, val);
					setScrub(val);
					return;
				},

				fnAnchor = {
					start: function (el, val, pt) {
						self.dragging = true;
						this.setSelection(this.selection || [this.value, this.value]);
						val = this.selection[el.getAttribute('anchor-type') === 'start' ? 0 : 1];
						seekTo.call(this, val);
						return val;
					},
					drag: function (el, val, pt) {
						if (el.getAttribute('anchor-type') === 'start') {
							val = this.selection[0] = Math.min(val, this.selection[1]);
						} else {
							val = this.selection[1] = Math.max(val, this.selection[0]);
						}
						seekTo.call(this, val);
						this.fireEvent('selectionchange', this.selection);
					},
					end: function () {
						if (this.selection[1] - this.selection[0] <= 0) {
							this.setSelection(null);
						}
						setScrub(false);
						self.dragging = false;
					}
				};

			draggable.call(this, this.domElement.thumb, {
				start: function (el, val, pt) {
					self.dragging = true;
					seekTo.call(this, this.value);
					return this.value;
				},
				drag: function (el, val, pt) {
					seekTo.call(this, val);
				},
				end: function () {
					setScrub(false);
					self.dragging = false;
				}
			});

			this.domElement.thumb.ondblclick = function (ev) {
				self.setSelection(null);
			};

			draggable.call(this, this.domElement.range, {
				start: function (el, val, pt) {
					return this.selection ? this.selection[0] : 0;
				},
				drag: function (el, val, pt) {
					var rng = this.selection[1] - this.selection[0];
					val = Math.max(range.min, Math.min(range.max - rng, val));
					this.selection[1] = val + rng;
					this.selection[0] = val;
					setThumbPosition.call(this, this.value);
					this.fireEvent('selectionchange', this.selection);
				}
			});

			draggable.call(this, this.domElement.selection.querySelector('[anchor-type="start"]'), fnAnchor);
			draggable.call(this, this.domElement.selection.querySelector('[anchor-type="end"]'), fnAnchor);
		},

		/** ************************************************
		* Establish cross-browser coordinates of mouse or touch event.
		************************************************* */
		eventPt = function (ev) {
			var e = ev || window.event;
			return {
				pageX: e.pageX || e.clientX,
				pageY: e.pageY || e.clientY,
				x: (e.pageX || e.clientX) + $(document).scrollLeft(),
				y: (e.pageY || e.clientY) + $(document).scrollTop()
			};
		},

		/** ************************************************
		* Touch / mouse drag handler for given element.
		* @this {object.AnalysisTool.Timeline} Parent object, passed to callback function.
		* @param {HTMLElement} el Element to attach handlers to.
		* @param {object<function>} fn Callback functions start, drag, end.
		************************************************* */
		draggable = function (el, fn) {
			var self = this,
				pt0 = null,           // {object} Start drag values
				range = this.range,
				trough = this.domElement.trough,

				// Mouse is released.
				mouseUp = function () {
					document.onmousemove =
					document.onmouseup = null;
					end();
				},

				// Mouse or single touch event ends.
				end = function () {
					fn.end && fn.end.call(self);
				},

				// Mouse or single touch event is moved.
				move = function (ev) {
					var pt = eventPt(ev),
						range = self.range,
						val = pt0.val + (pt.x - pt0.x) * pt0.scl;
					val = val < range.min ? range.min : val > range.max ? range.max : val;
					fn.drag && fn.drag.call(self, el, val, pt);
				},

				// Mouse or touch event is started.
				start = function (ev) {
					var range = self.range,
						trough = self.domElement.trough;
					pt0 = eventPt(ev);
					pt0.scl = (range.max - range.min) / (trough.offsetWidth || 1);
					pt0.val = fn.start ? fn.start.call(self, el, self.value, pt0) : self.value;
				},

				// Touches end.
				touchend = function (e) {
					if (e.touches.length === 0) {
						el.removeEventListener('touchmove', touchmove, false);
						el.removeEventListener('touchend', touchend, false);
						end();
					}
				},

				// Touches move.
				touchmove = function (e) {
					if (e.touches.length === 1) {
						move(e.touches.item(0));
					}
				},

				// Touch event starts.
				touchstart = function (e) {
					if (e.touches.length === 1) {
						el.addEventListener('touchmove', touchmove, false);
						el.addEventListener('touchend', touchend, false);
						start(e.touches.item(0));
						e.preventDefault();
					}
				};

			// Mouse down on element.
			el.onmousedown = function (ev) {
				start(ev);
				document.onmousemove = move;
				document.onmouseup = mouseUp;
				ev.preventDefault();
			};
			el.addEventListener('touchstart', touchstart, false);
		},

		/** ************************************************
		* Add a highlight element. The state object should
		* include position and/or selection properties.
		* @param {Array<object>} states State objects to add as highlights.
		************************************************* */
		setHighlights = function (states) {
			var k, el, h, state, index, color,
				range = this.range,
				dur = range.max - range.min,
				// Return a string as percentage occupancy of the full range.
				// @param {number} val Value on scale to cover.
				// @returns {string} Percentage length, including trailing % sign.
				percentPos = function (val) {
					return (100 * val / dur).toFixed(2) + '%';
				};
			if (states !== undefined) {
				// Remove unused at end
				while (this.highlights.length > states.length) {
					h = this.highlights.pop();
					$(h.el).remove();
				}
				// Create missing states
				for (k = 0; k < states.length; k += 1) {
					state = states[k].state;
					index = states[k].index;
					color = states[k].color;
					if (!this.highlights[k]) {
						el = document.createElement('div');
						el.className = 'ac-timeline-highlight';
						this.domElement.highlights.appendChild(el);
						this.highlights[k] = {
							el: el,
							position: 0,
							selection: []
						};
					}
					this.highlights[k].position = state.position;
					this.highlights[k].selection = state.selection;// || [state.position, state.position + 0.5];
					this.highlights[k].index = index;
					this.highlights[k].color = color;
				}
			}
			for (k = 0; k < this.highlights.length; k += 1) {
				h = this.highlights[k];
				h.el.setAttribute('highlight-type', h.selection ? 'selection' : 'position');
				h.el.style.left = percentPos((h.selection ? h.selection[0] : h.position) - range.min);
				h.el.style.width = h.selection ? percentPos(h.selection[1] - h.selection[0]) : '0';
				h.el.style.bottom = 3 * h.index + 'px';
				h.el.style.borderColor = h.color;
			}
		};

	return {
		appendTo: appendTo,                        // Create the bar and append it to given container.
		formatTime: formatTime,                    // Format a given time (in seconds) to timeline format.
		getSelection: getSelection,                // Retrieve the selection state
		listenVideoProgress: listenVideoProgress,  // Allow timeline to attach handler to given video element.
		resize: resize,                            // Cause bar to recalculate its ticks and resize itself.
		setDisabled: setDisabled,                  // Set the disabled state of bar.
		setHighlights: setHighlights,              // Replace any existing highlights with new array.
		setRange: setRange,                        // Set the video time range, e.g. once video loaded.
		setSliderValue: setSliderValue,            // Set the slider value.
		setSelection: setSelection                 // Set the timeline selection from given state.
	};
}()));