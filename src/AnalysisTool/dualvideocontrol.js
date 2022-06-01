/* eslint-disable no-unused-vars, default-case */
import { AnalysisTool, $, Utilities } from './shim';
export {}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Dual video analysis toolbar
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.toolbars.dualvideoControls = function (id, options) {
	this.settings = options;
	this.video = {
		left: null,
		right: null
	};
	this.buttons = [];
	this.commands = [];
	this.scrubber = null;
	this.domElement = document.createElement('div');
	this.domElement.setAttribute('class', id);
	this.$ = $(this.domElement);
	this.stepTimerId = 0;
	this.playSlowMotion = false;
	this.isPlaying = false;
	this.loop = false;

	this.currentTime = 0;       // {number} (s) Current playback time
	this.selection = null;      // {?Array<number>} (s) Start and end of selection, or NULL.
	this.playSelection = false; // {boolean} Play only selection if available.

	// this.currentMode;
	this.isEnabled = false;
	this.syncPoints = {
		// {number} (s) tsync Sync time
		// {number} (s) t0 Time offset from start of both timeline
		// {number} (s) length Duration of clip
		left: { tsync: 0.0, t0: 0.0, duration: 0.0 },
		right: { tsync: 0.0, t0: 0.0, duration: 0.0 },
		tmin: 0.0,           // {number} (s) Minimum (start) time of sync'd clips
		tmax: 0.0,           // {number} (s) Maximum (end) time of sync'd clips

		// Retrieve the time in each video's timeline
		// corresponding to the given primary time
		// @param {number} T Time in main (both) timeline
		// @param {string} panel Left or right panel video time to retrieve
		// @return {number} Time in video's timeline
		tin: function (T, panel) {
			var tmax = this[panel].duration,
				t = T - this[panel].t0;
			return t < 0 ? 0 : t > tmax ? tmax : t;
		},

		// Establish  origin  points and  corresponding in-video points
		// for current synchronization.
		//
		//      :   t0           tsync
		//  left: 0 |--------------v----+---| left.duration
		//      :   |--dt->|       :    |
		// right:        0 |-------^----+----------| right.duration
		//      :          t0    tsync  |
		//      :                       |
		//  both: 0 |-------------------+----------| duration (not used)
		//  play:     tmin |============+===| tmax
		//      :                       T
		//
		// We allow play only between [tmin..tmax] so that both players
		// can be started simultaneously. When establishing the time in
		// each clip's  timeline for a given  play time T (tmin <= T <= 
		// tmax), use
		//
		//    clip  t = T - clip.t0
		//
		// For the example shown:
		//  - dt > 0 because left.tsync > right.tsync
		//    (left sync point later in its timeline than right)
		//  - left.t0 = 0 because it's at start of both timeline
		//  - right.t0 > 0 because it starts after left
		//
		// @param {object<number>} tsyncs Left and right video sync points
		sync: function (tsyncs) {
			var
				// Set the sync point for a single panel clip
				// @this {object.syncPoints} THIS from outer closure
				// @param {string} panel Left or right clip
				syncClip = function (panel) {
					var tsync = tsyncs ? tsyncs[panel] : null;
					if (tsync !== undefined && tsync !== null) {
						this[panel].tsync = tsync;
					}
				};

			// Sync points
			syncClip.call(this, 'left');
			syncClip.call(this, 'right');

			// Time offset to main timeline
			var dt = this.left.tsync - this.right.tsync;
			this.left.t0 = Math.max(0, -dt);
			this.right.t0 = Math.max(0, dt);

			// Play limits
			this.tmin = Math.max(this.left.t0, this.right.t0);
			this.tmax = Math.min(
				this.left.duration + this.left.t0,
				this.right.duration + this.right.t0);
		}
	};

	// this.has different members for controls and tool!
	this.has = {
		canplay: { left: false, right: false },
		ended: { left: false, right: false }
	};
};

AnalysisTool.toolbars.dualvideoControls.prototype = {
	constructor: AnalysisTool.toolbars.dualvideoControls,

	appendTo: function ($object) {
		$object.append(this.$);
		this.addButtons();
		this.addlisteners();
		this.addCommands();
	},

	setVideoObjects: function (leftVideo, rightVideo) {
		this.video.left = leftVideo;
		this.video.right = rightVideo;
	},

	// Update synchronization points based on the clips's current times
	// Called when changing draw/align mode, or switching between clips
	// being aligned.
	// @param {object<number>=} tsyncs Left and right panel sync times. Uses current time if omitted.
	updateSyncPoints: function (tsyncs) {
		var time = {
			left: this.video.left.getDomElementType() !== 'img',
			right: this.video.right.getDomElementType() !== 'img'
		};
		this.syncPoints.left.duration = this.video.left.domElement.duration || 0.0;
		this.syncPoints.right.duration = this.video.right.domElement.duration || 0.0;
		this.syncPoints.sync(tsyncs || {
			left: this.video.left.currentTime(),
			right: this.video.right.currentTime()
		});

		// If one of the media items is a static image, use max range
		if (!(time.left && time.right)) {
			this.syncPoints.tmin = 0.0;
			this.syncPoints.tmax = Math.max(this.syncPoints.left.duration, this.syncPoints.right.duration);
		}
		this.scrubber.setRange(this.syncPoints.tmin, this.syncPoints.tmax);
	},

	upDateCurrentTime: function (newTime) {
		this.currentTime = +newTime;
		this.scrubber.setSliderValue(this.currentTime);
		this.$.trigger('dualtimerupdate', this.currentTime);
		this.domElement.setAttribute('playhead-within-selection', this.isWithinSelection());
		if (this.isPlaying && this.playSelection && this.atSelectionEnd()) {
			this.playpause(false);
			if (this.loop) {
				this.seek(this.selection[0]);
				this.playpause(true);
			}
		}
	},


	handleToggleButtonClick: function (e, name, isSelected) {
		var func = this.commands[name]
		if (func) {
			func();
		}
	},

	handleButtonClick: function (e, name) {
		var func = this.commands[name]
		if (func) {
			func();
		}
	},

	addlisteners: function () {
		var self = this,

			// @param {string} panel Left or right panel to attach
			addListeners = function (panel) {
				var video = self.video[panel];
				video.addEventListener('ended', function () { return self.videoEndedHandler(panel); });
				video.addEventListener('timeupdate', function (newTime) { return self.videoTimeUpdatedHandler(newTime, panel); });
				video.addEventListener('canplay', function (newDuration) { return self.videoCanPlayHandler(newDuration, panel); });
			};
		addListeners('left');
		addListeners('right');
	},

	// Video handlers for left and right panels. Since we play the
	// intersection of the two clips, either clip ending means that
	// the play should terminate.
	// @param {Event} e Triggering event, not used
	// @param {string} panel Left or right panels
	videoEndedHandler: function (panel) {
		// Need to stop videos as soon as we can
		this.video.left.domElement.pause();
		this.video.right.domElement.pause();
		this.playpause(false);
		this.has.ended[panel] = true;
		if (this.loop) {
			this.seek(this.syncPoints.tmin);
			this.playpause(true);
		}
	},

	// Event listener for each panel clip's time updated. This is
	// called quite frequently, and for both left and right clips
	// @param {number} newTime Time on clip
	// @param {string} panel Left or right panel clip being updated
	videoTimeUpdatedHandler: function (newTime, panel) {
		this.upDateCurrentTime(newTime + this.syncPoints[panel].t0);
	},

	// @param {Event} e Triggering event, not used
	// @param {string} panel Left or right panels
	videoCanPlayHandler: function (newDuration, panel) {
		this.has.canplay[panel] = true;
	},

	addButtons: function () {
		var self = this,
			$L = $('<div class="ac-video-buttons-left"></div>').appendTo(this.$),
			$R = $('<div class="ac-video-buttons-right"></div>').appendTo(this.$),
			Togglebutton = AnalysisTool.h5controls.togglebutton,
			Button = AnalysisTool.h5controls.button,
			handleToggleButtonClick = function (e, name, isSelected) {
				return self.handleToggleButtonClick(e, name, isSelected);
			},
			handleButtonClick = function (e, name) {
				return self.handleButtonClick(e, name);
			};

		this.buttons.advanced = new Togglebutton('advanced', 'adva', 'Show advanced playback tools', handleToggleButtonClick, $L);
		this.buttons.slowmotion = new Togglebutton('slowmotion', 'slow', 'Slow motion', handleToggleButtonClick, $L);
		this.buttons.loop = new Togglebutton('loop', 'loop', 'Loop', handleToggleButtonClick, $L);
		AnalysisTool.Drawbar.makeDivider($L);
		this.buttons.playpause = new Button('playpause', 'play', 'Play/Pause', handleButtonClick, $L);
		this.buttons.pause = new Button('pause', 'paus', 'Pause', handleButtonClick, $L);
		this.buttons.download = new Button('download', 'load', 'Download', handleButtonClick, $L);

		this.scrubber = new AnalysisTool.Timeline();
		this.scrubber.appendTo(this.$);
		this.addScrubberHandler();

		this.buttons.stepbwd = new Button('stepbwd', 'sbwd', 'Step Backwards', handleButtonClick, $R);
		this.buttons.stepfwd = new Button('stepfwd', 'sfwd', 'Step Forwards', handleButtonClick, $R);
		this.buttons.alignclips = new Togglebutton('alignclips', 'algn', 'Align', handleToggleButtonClick, $R);
		this.buttons.fullscreen = new Button('fullscreen', 'full', 'Fullscreen', handleButtonClick, $R);
		this.buttons.restorescreen = new Button('restorescreen', 'rest', 'Restore', handleButtonClick, $R);
		this.setBarDisabled(true);
	},

	// Attach a change event handler to the scrubber bar
	addScrubberHandler: function () {
		var self = this;
		this.scrubber.addEventListener('change', function (value) {
			self.playpause(false);
			self.seek(value);
		})
		.addEventListener('selectionchange', function (sel) {
			self.selection = sel;
			self.domElement.setAttribute('playhead-within-selection', self.isWithinSelection());
		});
	},

	addCommands: function () {
		var self = this;

		// Videos should download automatically. On iPad,
		// the single analysis tool has a download button,
		// but the dual tool does not work on iPad. :-(
		this.commands.download = function () {
			self.video.left.domElement.play();
			self.video.left.domElement.pause();
			self.video.right.domElement.play();
			self.video.right.domElement.pause();
		};
		this.commands.playpause =
		this.commands.pause = function () { self.playpause() };
		this.commands.advanced = function () { self.showAdvanced(self.buttons.advanced.selected); }
		this.commands.slowmotion = function () { self.setSlowMotion(self.buttons.slowmotion.selected) };
		this.commands.loop = function () { self.loop = self.buttons.loop.selected; }

		this.commands.stepfwd = function () { self.step(1); };
		this.commands.stepbwd = function () { self.step(-1); };
		this.commands.alignclips = function () { self.$.trigger('alignmode', self.buttons.alignclips.selected); };
		this.commands.fullscreen = function () { self.$.trigger('fullscreen', true); }
		this.commands.restorescreen = function () { self.$.trigger('fullscreen', false); }
	},


	// Toggle the slow motion play, stopped or during play
	setSlowMotion: function (val) {
		var wasplaying = this.isPlaying;
		if (this.isPlaying) {
			this.playpause(false);
		}

		this.playSlowMotion = val;

		if (wasplaying) {
			this.playpause(true);
		}
	},

	/** ***************************************************
	* Show or hide the advanced video control buttons.
	* @param {boolean} show TRUE to show the buttons, or FALSE to hide.
	**************************************************** */
	showAdvanced: function (show) {
		this.domElement.setAttribute('show-advanced-controls', !!show);
		this.scrubber.resize();
	},

	/** ***************************************************
	* Update the button bar enabled states depending on
	* whether the videos are ready to play and browser caps
	* Unlike the single video analysis tool, the fullscreen
	* and Align buttons are on a modesView toolbar
	* @param {boolean} isDisabled Set to TRUE to disable buttons until video ready
	* @param {boolean=} timeControls Set to FALSE to disable time controls, e.g. for dual image analysis.
	**************************************************** */
	setBarDisabled: function (isDisabled, timeControls) {
		var name, dis,
			disScrub = isDisabled,                // scrubber disabled state
		iBrowser = Utilities.isIPadBrowser,   // is iPad, iPhone, iPod
		iPhone = Utilities.isIPhoneBrowser;   // is iPhone

		for (name in this.buttons) {
			if (this.buttons.hasOwnProperty(name) && this.buttons[name].setIsDisabled) {
				dis = isDisabled;
				if (timeControls === false) {
					disScrub = true;     // can't use scrubber
				} else {
					switch (name) {
						case 'download':
							// these buttons are always allowed
							dis = false;
							break;
					}
				}
				if (iPhone) {
					switch (name) {
						case 'download':
						case 'playpause':
							break;
						default:
							dis = true;
							break;
					}
					disScrub = true;
				}
				this.buttons[name].setIsDisabled(dis);
			}
		}
		this.scrubber.setDisabled(disScrub);
	},

	// Start, toggle, or stop playing, for example from the
	// play button, or e.g. when video auto-loops at end.
	// @param {boolean=} play Set to TRUE to force play, FALSE to pause, undefined to toggle
	playpause: function (play) {
		var self = this,
			// Start a single panel playing at correct sync point
			// @this {dualVideoControls} THIS from outer closure
			// @param {string} panel Left or right clip to play
			playPanel = function (panel) {
				var video = this.video[panel];
				if (play) {
					this.has.ended[panel] = false;
					video.playpause(true);
				} else {
					video.playpause(false);
				}
			};

		play = play === undefined ? !this.isPlaying : play;

		// Determine whether to limit playback to selection
		// if playback starts with playhead within it.
		this.playSelection = play ? this.isWithinSelection() : true;

		// Start playback loop back to start if in selection.
		if (play && this.atSelectionEnd()) {
			this.seek(this.selection[0]);
		}

		//---Stop Slow Motion Timer---------------
		if (this.stepTimerId > 0) {
			clearInterval(this.stepTimerId);
			this.stepTimerId = 0;
		}

		//---Loop---------------------------------
		if (play && this.scrubber.value >= this.syncPoints.tmax) {
			this.seek(this.syncPoints.tmin + 0.02);
		}
		if (this.playSlowMotion && this.currentMode !== 'align') {
			//---Slow Motion-----------------------
			if (play) {
				this.stepTimerId = setInterval(function () {
					self.step(+1, true);
				}, 500);
			}

		} else {
			//---Normal Speed----------------------
			//if (!play) {
			//	// When stopping, wait for videos to finish
			//	// whatever they're doing, then ensure that
			//	// the two  are synchronized.  There should
			//	// be no visible change  if the videos both
			//	// played at the correct speed.
			//	//?setTimeout((function (self) {
			//	//?	return function () {
			//	//?		self.seek(self.currentTime);
			//	//?	}
			//	//?}(this)), 100);
			//}
			playPanel.call(this, 'left');
			playPanel.call(this, 'right');
		}
		this.isPlaying = play ? true : false;
		this.$.closest('.analysisControl').attr('state', this.isPlaying ? 'play' : 'pause');
		AnalysisTool.forceVisibilities(this.$.closest('.analysisControl'));
	},

	step: function (dir) {
		var position = this.scrubber.value,
			stepValue = 1.00 / Math.max(this.video.left.FPS, this.video.right.FPS),

			// Step the panel video if needed
			// @this {ControlBar} THIS from outer closure
			// @param {number} T Time in main timeline
			// @param {string} panel Left or right panel
			// @return {number} Local timeline number, in case it's useful to the caller
			stepPanel = function (T, panel) {
				var t = this.syncPoints.tin(T, panel);
				this.video[panel].seek(t, false); // Seek to new time, don't round to nearest frame.
				return t;
			};
		position = stepValue * (Math.round(position / stepValue) + dir);
		stepPanel.call(this, position, 'left');
		stepPanel.call(this, position, 'right');
		this.upDateCurrentTime(position);
	},

	// Seek the combined synchronized timeline to given position
	// @param {number} position (s) Position to seek to
	seek: function (pos) {
		var tmin = this.syncPoints.tmin,
			tmax = this.syncPoints.tmax;
		pos = pos < tmin ? tmin : pos > tmax ? tmax : pos;
		this.currentTime = pos;
		this.seekVideo(pos, 'left');
		this.seekVideo(pos, 'right');
	},

	// Seek a single video panel to the given COMBINED timline time
	// @param {number} T (s) Time to seek to, combined timeline
	// @param {string} panel Left or right panel to seek
	seekVideo: function (T, panel) {
		var t = T - this.syncPoints[panel].t0,
			tmax = this.video[panel].domElement.duration
		t = t < 0 ? 0 : t > tmax ? tmax : t;
		this.video[panel].seek(t);
	},

	/** ***************************************************
	* Determine if the playhead is near the selection end,
	* when play needs to stop or loop.
	* @returns {boolean} TRUE if near the end, else FALSE.
	**************************************************** */
	atSelectionEnd: function () {
		var sel = this.selection,
			t = this.currentTime,
			dt = sel ? t - sel[1] : 0;
		return sel && -0.1 <= dt && dt < 0.5;
	},

	/** ***************************************************
	* Determine if the playhead is currently within the
	* selection, and optionally collapse the selection if
	* it is not. This is used when capturing a media state.
	* @param {boolean} collapseBeyond Set to TRUE to collapse if playhead is beyond selection.
	**************************************************** */
	isWithinSelection: function (collapseBeyond) {
		var sel = this.selection,
			t = this.currentTime,
			isWithin = !sel || (sel[0] - 0.1 <= t && t < sel[1] + 0.5);
		if (!isWithin && collapseBeyond) {
			this.scrubber.setSelection(null);
		}
		return isWithin;
	}

};