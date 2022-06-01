/* eslint-disable no-unused-vars, default-case */
import { AnalysisTool, $, Utilities } from './shim';
export {}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Single video analysis toolbar
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.toolbars = AnalysisTool.toolbars || {};
AnalysisTool.toolbars.singlevideoControls = function (name, options, simpleview) {
	this.settings = options;
	this.simpleview = !!simpleview; // {boolean} Set to TRUE to show minimal bars, e.g. when used individually in dual analysis
	this.videoObject = null;
	this.buttons = [];
	this.labels = [];
	this.scrubber = null;
	this.name = name;
	this.domElement = document.createElement('div');
	this.domElement.setAttribute('class', name);
	this.$ = $(this.domElement);
	this.previousStyle = {};
	this.hasLoaded = false;
	this.is = {
		looped: false,
		flipped: false,
		muted: false
	};
	this.selection = null; // {?Array<number>} (s) Start and end of selection, or NULL.
	this.playSelection = false; // {boolean} Play only selection if available
	var self = this;
};

AnalysisTool.toolbars.singlevideoControls.prototype = {
	constructor: AnalysisTool.toolbars.singlevideoControls,

	setVideoObject: function (videoobj) {
		this.videoObject = videoobj;
	},

	appendTo: function ($object) {
		$object.append(this.$);
		this.addButtons();
		this.addlisteners();
		this.addCommands();

	},

	setModeAttr: function (val) {
		this.domElement.setAttribute('mode', val);
	},

	setFlip: function (isFlipped) {
		this.is.flipped = isFlipped;
		this.videoObject.flip(isFlipped);
	},

	setLoop: function (isLooped) {
		this.is.looped = isLooped;
		this.videoObject.setLoop(isLooped);
		this.buttons.loop.setIsSelected(isLooped);
	},

	setMute: function (isMuted) {
		this.is.muted = isMuted;
		this.videoObject.setMute(isMuted);
		this.buttons.mute.setIsSelected(isMuted);
	},

	handleToggleButtonClick: function (e, name, isSelected) {
		var func = this.commands[name];
		if (func) {
			func();
		}
	},

	handleButtonClick: function (e, name) {
		var func = this.commands[name];
		if (func) {
			func();
		}
	},

	addlisteners: function () {
		var self = this;
		this.videoObject.addEventListener('ended', function () {
			return self.videoEndedHandler();
		});
		this.videoObject.addEventListener('timeupdate', function (newTime) {
			return self.videoTimeUpdatedHandler(newTime)
		});
		this.videoObject.addEventListener('canplay', function (newDuration) {
			return self.videoCanPlayHandler(newDuration)
		});
	},

	videoEndedHandler: function () {
		this.videoObject.playpause(false);
		if (!this.settings.simpleview && this.buttons.loop.selected) {
			this.videoObject.playpause(true);
		}
	},

	videoTimeUpdatedHandler: function (newTime) {
		var videoObj = this.videoObject;
		this.scrubber.setSliderValue(newTime);
		this.domElement.setAttribute('playhead-within-selection', this.isWithinSelection());
		this.$.trigger('timeupdate', newTime);
		if (videoObj.isPlaying && this.playSelection && this.atSelectionEnd()) {
			videoObj.playpause(false);
			if (this.is.looped) {
				videoObj.seek(this.selection[0]);
				videoObj.playpause(true);
			}
		}
	},

	videoCanPlayHandler: function (newDuration) {
		this.addScrubberBar();
		this.hasLoaded = true;
		AnalysisTool.forceVisibilities(this.$.closest('.analysisControl'));
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

		if (!this.simpleview) {
			this.buttons.advanced = new Togglebutton('advanced', 'adva', 'Show advanced playback tools', handleToggleButtonClick, $L);
			this.buttons.mute = new Togglebutton('mute', 'mute', 'Mute', handleToggleButtonClick, $L);
			this.buttons.flip = new Togglebutton('flip', 'flip', 'Flip', handleToggleButtonClick, $L);
			this.buttons.slowmotion = new Togglebutton('slowmotion', 'slow', 'Slow motion', handleToggleButtonClick, $L);
			this.buttons.loop = new Togglebutton('loop', 'loop', 'Loop', handleToggleButtonClick, $L);
			AnalysisTool.Drawbar.makeDivider($L);
		}

		this.buttons.playpause = new Button('playpause', 'play', 'Play/Pause', handleButtonClick, $L);
		this.buttons.pause = new Button('pause', 'paus', 'Pause', handleButtonClick, $L);
		this.buttons.download = new Button('download', 'load', 'Download and play', handleButtonClick, $L);

		this.buttons.stepbwd = new Button('stepbwd', 'sbwd', 'Step Backwards', handleButtonClick, $R);
		this.buttons.stepfwd = new Button('stepfwd', 'sfwd', 'Step Forwards', handleButtonClick, $R);
		if (this.simpleview) {
			// Dual analysis: Leave align mode.
			this.buttons.alignclips = new Togglebutton('alignclips', 'algn', 'Align', handleToggleButtonClick, $R);
			this.buttons.alignclips.setIsSelected(true);
		}
		this.buttons.fullscreen = new Button('fullscreen', 'full', 'Fullscreen', handleButtonClick, $R);
		this.buttons.restorescreen = new Button('restorescreen', 'rest', 'Restore', handleButtonClick, $R);

		this.scrubber = new AnalysisTool.Timeline();
		this.scrubber.appendTo(this.$);

		this.setBarDisabled(true);
	},

	addScrubberBar: function () {
		var self = this;
		this.scrubber
			.addEventListener('change', function (value) {
				self.seek(value);
			})
			.addEventListener('selectionchange', function (sel) {
				self.selection = sel;
				self.domElement.setAttribute('playhead-within-selection', self.isWithinSelection());
			});
	},

	addCommands: function () {
		var self = this;

		this.commands = {};

		// download / play / pause: All three buttons do the same thing, but at different times
		this.commands.playpause =
		this.commands.pause =
		this.commands.download = function () { self.playpause(); }

		this.commands.advanced = function () { self.showAdvanced(self.buttons.advanced.selected); }
		this.commands.mute = function () { self.setMute(self.buttons.mute.selected); }
		this.commands.flip = function () { self.setFlip(self.buttons.flip.selected); }
		this.commands.loop = function () { self.setLoop(self.buttons.loop.selected); }
		this.commands.slowmotion = function () { self.videoObject.setSlowMotion(self.buttons.slowmotion.selected); }

		this.commands.stepfwd = function () { self.videoObject.step(1); }
		this.commands.stepbwd = function () { self.videoObject.step(-1); }
		this.commands.alignclips = function () { self.$.trigger('alignmode', false); } // leave align mode in dual analysis
		this.commands.fullscreen = function () { self.$.trigger('fullscreen', true); }
		this.commands.restorescreen = function () { self.$.trigger('fullscreen', false); }
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
	* whether the video is ready to play and browser.
	* @param {boolean} isDisabled Set to TRUE to disable buttons until video ready.
	* @param {boolean=} timeControls Set to FALSE to disable time controls
	**************************************************** */
	setBarDisabled: function (isDisabled, timeControls) {
		var name, dis,
			iBrowser = Utilities.isIPadBrowser,   // is iPad, iPhone, iPod
			iPhone = Utilities.isIPhoneBrowser;   // is iPhone

		for (name in this.buttons) {
			if (this.buttons.hasOwnProperty(name) && this.buttons[name].setIsDisabled) {
				dis = isDisabled;
				if (timeControls === false) {
					switch (name) {
						case 'download':
							dis = true;  // can't download for image analysis
							break;
						case 'fullscreen':
						case 'restorescreen':
							dis = false;    // fullscreen always available
							break;
					}
				} else {
					switch (name) {
						case 'download':   // download should always be available (except iPhone, below)
							dis = false;
							break;

						case 'mute':
							if (iBrowser) {
								dis = true;  // ipad doesn't honor mute
							}
							break;
						case 'alignmode':
						case 'drawmode':
							dis = true;     // no Align for single analysis
							break;
						case 'fullscreen':
						case 'restorescreen':
							dis = false;    // fullscreen always available
							break;
					}
				}
				if (iPhone) {
					if (name !== 'download' && name !== 'playpause' && name !== 'pause') {
						dis = true;     // can't use any controls on iPhone
					}
				}

				this.buttons[name].setIsDisabled(dis);
			}
		}
		this.scrubber.setDisabled(isDisabled);
	},

	/** ***************************************************
	* Play or pause video playback. With the exception of
	* looping playback around a selection, this is delegated
	* to the video object. Here we also establish whether
	* the playback should be restricted to the selection.
	**************************************************** */
	playpause: function (play) {
		var videoObj = this.videoObject,
			toPlay = play !== undefined ? play : !videoObj.isPlaying;
		this.playSelection = toPlay ? this.isWithinSelection() : true;
		if (toPlay && this.atSelectionEnd()) { // Within a margin beyond end segment: Loop
			videoObj.seek(this.selection[0]);
		}
		videoObj.playpause(play);
	},

	/** ***************************************************
	* Determine if the playhead is near the selection end,
	* when play needs to stop or loop.
	* @returns {boolean} TRUE if near the end, else FALSE.
	**************************************************** */
	atSelectionEnd: function () {
		var sel = this.selection,
			t = this.videoObject.currentTime(),
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
			t = this.videoObject.currentTime(),
			isWithin = !sel || (sel[0] - 0.1 <= t && t < sel[1] + 0.5);
		if (!isWithin && collapseBeyond) {
			this.scrubber.setSelection(null);
		}
		return isWithin;
	},

	/** ***************************************************
	* Seek the player to the given time. This is called e.g.
	* from Single -> Timeline -> setSelection -> here.
	* @param {number} newTime (s) Seek time.
	**************************************************** */
	seek: function (newTime) {
		this.videoObject.playpause(false);
		this.videoObject.seek(newTime);
	},

	/** ***************************************************
	* Show or hide myself.
	* @param {boolean} isVisible Value indicating whether the bar should be visible.
	**************************************************** */
	show: function (isVisible) {
		$(this.domElement).toggle(isVisible);
	}
};
/* End video tool bar */




