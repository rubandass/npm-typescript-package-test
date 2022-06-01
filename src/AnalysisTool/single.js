/* eslint-disable default-case, no-unused-vars, no-cond-assign */
import { AnalysisTool, $, Utilities } from './shim';
export {}

/***********************************************************
* Single control implementation
*
*  .analysisControl___________________________
*  |                                          |
*  |   .ac-viewwrapper_____________________   |
*  |   |                 ^                 |  |
*  |   |                 |                 |  |
*  |   |                 V                 |  |
*  |   |    video________________________  |  |
*  |   |    |                            | |  |
*  |   |    |                            | |  |
*  |   |    |                            | |  |
*  |   |  ^ |____________________________| |  |
*  |   |  :                                |  |
*  |   |  :.canvas_______________________  |  |
*  |   |    | position:absolute          | |  |
*  |   |  ^ |____________________________| |  |
*  |   |  :     :                          |  |
*  |   |  :.canvas_______________________  |  |
*  |   |    | position:absolute          | |  |
*  |   |    |____________________________| |  |
*  |   |                 ^                 |  |
*  |   |                 |                 |  |
*  |   |                 V                 |  |
*  |   |___________________________________|  |
*  |                                          |
*  |   .ac-toolbars_______________________    |
*  |   |                                  |   |
*  | ^ |__________________________________|   |
*  | :                                        |
*  | :..ac-cmask__________________________    |
*  |   | position: absolute               |   |
*  |   |                                  |   |
*  |   |   .ac-imagepreview_____________  |   |
*  |   |   |    :                       | |   |
*  |   |   |  <img>                     | |   |
*  |   |   |    :                       | |   |
*  |   |   |____________________________| |   |
*  |   |                                  |   |
*  | ^ |__________________________________|   |
*  | :                                        |
*  | :..ac-capturingMsg___________________    |
*  |   | position: absolute               |   |
*  |   |                                  |   |
*  |   |      .ac-capturingMsg-msg__      |   |
*  |   |      |                     |     |   |
*  |   |      |_____________________|     |   |
*  |   |                                  |   |
*  |   |__________________________________|   |
*  |                                          |
*  |__________________________________________|
********************************************************** */
AnalysisTool.SingleControl = function (options) {

	this.settings = options;
	this.id = this.settings.tagID;
	this.container = $('#' + this.settings.targetID);

	// this.viewContainer;

	// this.videoObj;

	// this.toolbarContainer;

	// this.drawCanvas;
	// this.scratchCanvas;

	this.captureCallback = null; // {function} Method to invoke once image capture is complete.
	this.captureAsImage = false; // {boolean} Value indicating that the caller wants image, not uploaded GUID.

	this.mediaID = null;
	this.hasLoaded = false;
};

AnalysisTool.SingleControl.prototype = {
	constructor: AnalysisTool.SingleControl,

	alert: function () {
		var str = 'Copyright (c) Siliconcoach\nAll rights reserved.';
		alert(str);
		return str;
	},

	render: function () {
		var self = this,
			toolBarsH = 90;

		this.wrapper = $('<div></div>')
			.attr('class', 'analysisControl')
			.attr('analysis-type', 'single')
			.attr('state', 'wait')
			.appendTo(this.container);

		this.container = this.wrapper;

		this.el = this.container[0];
		this.$ = this.container;

		this.viewContainer = $('<div class="ac-viewwrapper"></div>');
		if (this.settings.height) {
			this.viewContainer.css('height', (this.settings.height - toolBarsH) + 'px');
		}
		window.addEventListener('resize', function () {
			if (self.container.attr('data-auto-height') === 'true') {
				self.resizeTool();
			}
		});

		this.container.append(this.viewContainer);

		this.videoObj = new AnalysisTool.VideoPlayer(this.viewContainer, 'single');
		this.videoObj.addEventListener('canplay', function () { self.videoCanPlay(); });
		this.videoObj.addEventListener('loadedmetadata', function (params) { self.videoMetaLoaded(params); });
		this.videoObj.addEventListener('timeupdate', function (newTime) { self.videoTimeUpdate(newTime); });
		this.videoObj.render();

		this.drawCanvas = new AnalysisTool.h5controls.objCanvas('draw');
		this.drawCanvas.appendTo(this.viewContainer);
		this.scratchCanvas = new AnalysisTool.h5controls.objCanvas('scratch');
		this.scratchCanvas.appendTo(this.viewContainer);

		this.toolbarContainer = document.createElement('div');
		$(this.toolbarContainer)
			.addClass('ac-toolbar-container')
			.html('<div class="ac-draw-controls"></div>')
			.appendTo(this.container);

		this.drawingToolbar = new AnalysisTool.Drawbar();
		this.drawingToolbar
			.appendTo(this.toolbarContainer.querySelector('.ac-draw-controls'))
			.setBarDisabled(true);

		this.videoControls = new AnalysisTool.toolbars.singlevideoControls('ac-video-controls-single', this.settings);
		this.videoControls.setVideoObject(this.videoObj);
		this.videoControls.appendTo($(this.toolbarContainer));
		this.videoControls.scrubber.listenVideoProgress(true, this.videoObj); // smooth updates on single video

		this.drawingEngine = new AnalysisTool.drawingEngine(this.drawingToolbar, this.drawCanvas, this.scratchCanvas);
		this.drawingEngine.setOuterContainer(this.viewContainer); //container to constrain dialogs to;
		this.drawingEngine.formatTimeHandler = this.videoControls.scrubber;

		this.cmask = $('<div></div>');
		this.cmask.addClass('ac-cmask');
		this.container.append(this.cmask);

		this.previewContainer = $('<div class="ac-imagepreview"></div>');
		this.cmask.append(this.previewContainer);
		this.previewContainer.hide();

		this.capturingMsg = $('<div></div>')
			.addClass('ac-capturingMsg')
			.append($('<div class=\'ac-capturingMsg-msg\'>' + AnalysisTool.localize('Saving image.<br />Please wait...') + '</div>'))
			.hide()
			.appendTo(this.container);
		this.videoControls.$.on('fullscreen', function (e, isFullScreen) {
			self.fullScreen(isFullScreen);
		});

		$(document).on('keydown', this.videoObj, function (ev) {
			switch (ev.keyCode) {

				case 39:
					ev.data.step(1);
					break;

				case 37:
					ev.data.step(-1);
					break;
			}
		});

		return this;
	},

	on: function (type, fn, uid) {
		$(this.el).off(type);
		$(this.el).on(type, $.proxy(fn, this));
		return this;
	},

	trigger: function (type, e) {
		$(this.el).trigger(type, e);
		return this;
	},


	// @param {string} videoUrl Address of video media to load
	// @param {string} thumbUrl Address of poster frame to load
	// @param {number} fps Video frame rate
	loadvideo: function (videoUrl, thumbUrl, fps) {
		var self = this;
		this.hasLoaded = false;

		// Save the media ID specified within the url for use
		// with iPad / server-side video frame extraction
		this.mediaID = (this.mediaID = videoUrl.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g)) ? this.mediaID[this.mediaID.length - 1] : null;
		
		delete this.settings.initState;

		this.videoObj.load(videoUrl, thumbUrl, fps, function (obj) { self.resizeTool(true); });
		this.videoControls.scrubber.step = 1.0 / (this.videoObj.FPS || 1.0);
		this.resizeTool();
		if (this.mediaID) {
			AnalysisTool.delegate.mediaInfo(this.mediaID, function (data) {
				if (data.fps) {
					self.videoObj.setMediaDimensions(data.fps, data.width, data.height);
				}
				self.videoControls.scrubber.setRange(null, null, 1.0 / (self.videoObj.FPS || 1.0));
				self.trigger('framerate');
			});
		}
	},

	// Fire the completion handlers.
	// @param {string.guid|Image?} data Media identifier or Image object.
	fireCaptureComplete: function (data) {
		if (this.captureCallback) {
			this.captureCallback(null, data);
		}
		this.trigger('imageuploaded', data);
	},

	// <summary>Set the callback function to call after image capture.
	// Function will be passed one param, the uuid of image
	// -or- an Image object, if captureAsImage is set.
	// @param {function} callBackFunction Function to fire when capture complete.
	// @param {boolean} val Value indicating whether captured image should be returned as GUID (TRUE) or as Image (FALSE).
	setCaptureCallback: function (callBackFunction, asImage) {
		this.captureCallback = callBackFunction;
		this.captureAsImage = !!asImage;
	},

	// Capture a video, composite drawing, and post to server.
	// On iPad, context.drawImage(videoElement) doesn't work,
	// so we use the html5manager to extract the video frame
	// for us. Note that the extracted frame may not be exactly
	// the same as that shown by the tool, since browser video
	// element seeks aren't frame-accurate.
	// On iPhone, we can't capture drawings over top of video
	// element to start with.
	// @param {boolean=} region Set to TRUE to capture only a region of the video.
	captureImage: function (region) {
		var
			// Step 2: Capture the video frame. On iPad, have the server extract the
			// required frame, otherwise use drawImage direct from <video> element.
			continueCapture = function () {
				var self = this,
					img, captureTime;
				this.showCapturingMsg();

				// Capture video frame
				if (this.videoObj.getDomElementType() === 'video'
					&& Utilities.isIPadBrowser
					&& parseInt(Utilities.iOSVersion) <= 7) {
					img = new Image();
					captureTime = self.videoObj.currentTime();
					img.onload = function () {
						continueCaptureImage.call(self, this); // here 'this' is the loaded image.
					};
					img.src = AnalysisTool.delegate.extractFrameUrl(this.mediaID, captureTime);
				} else {
					continueCaptureImage.call(this, this.videoObj.getDomElement());
				}
			},

			// Step 3: Continue with capture, either with video element or server
			// response video frame. Composite frame and drawings, upload to server.
			// @this {tool} The drawing tool from the outer closure
			// @param {HtmlVideoElement|Image} primaryImage Video frame to place in background
			continueCaptureImage = function (primaryImage) {
				var k, base64,
					tempcanvas = document.createElement('canvas'),
					ctx = tempcanvas.getContext('2d'),
					cw = this.drawCanvas.el.width,
					ch = this.drawCanvas.el.height,
					rx = region ? region.rx : 0,
					ry = region ? region.ry : 0,
					rw = region ? region.rw : cw,
					rh = region ? region.rh : ch;

				tempcanvas.width = rw;
				tempcanvas.height = rh;
				ctx.save();
				if (this.videoObj.isFlipped) {
					ctx.translate(cw - rx, -ry);
					ctx.scale(-1, 1);
				} else {
					ctx.translate(-rx, -ry);
				}
				ctx.drawImage(primaryImage, 0, 0, cw, ch);
				ctx.restore();

				// Drawing layer.
				ctx.drawImage(this.drawCanvas.el, -rx, -ry, cw, ch);

				// Now upload data from temp canvas
				base64 = tempcanvas.toDataURL('image/jpeg', 0.9);
				finishCaptureImage.call(this, base64);
			},

			// Finish processing. Depending on caller, this is
			// uploading the image to the server and responding
			// with the GUID, or passing the image object back.
			// @this {tool} The drawing tool from the outer closure.
			// @param {string} base64 Encoded image data.
			finishCaptureImage = function (base64) {
				var me = this, // {tool} Drawing tool from outer closure.
					img;        // {Image=} Image object, if passing back as image.

				////$(tempcanvas).click(function () { $(tempcanvas).remove() }).appendTo(document.body).css({ position: 'fixed', left: '0px', top: '0px', border: '1px solid red' }); return; if (!confirm('send to server?')) { completeFunction(null); return; }
				////this.fireCaptureComplete(null); me.hideCapturingMsg();return;
				if (this.captureAsImage) {
					img = new Image();
					img.onload = function () {
						me.fireCaptureComplete(this);
						me.hideCapturingMsg();
					};
					img.src = base64;
				} else {
					AnalysisTool.delegate.saveImage(base64, function (data) {
						me.fireCaptureComplete(!data ? null : {
							ImageNameGuid: data // So called from Silverlight days.
						});
						me.hideCapturingMsg();
					});
				}
			};

		// Step 1: If a region is to be selected, show dialog.
		// If no region selected, continue to step grabbing frame
		if (region === true) {
			this.drawingEngine.getCaptureRegion(this.viewContainer, this.drawingToolbar, function (r) {
				region = r;
				if (region) {
					continueCapture.call(this);
				} else {
					this.fireCaptureComplete(null);
				}
			}, this);
		} else {
			continueCapture.call(this);
		}
	},

	getState: function () {
		var state,
			videoObj = this.videoObj,
			videoControls = this.videoControls;
		videoControls.isWithinSelection(true); // collapse if beyond selection
		state = videoObj.getDomElementType() === 'img'
			? {
				drawmru: this.drawingToolbar.getMru()
			} : {
				looped: videoControls.is.looped,
				flipped: videoControls.is.flipped,
				muted: videoControls.is.muted,
				position: videoObj.currentTime(),
				selection: this.videoControls.scrubber.getSelection(),
				duration: videoObj.duration(),
				drawmru: this.drawingToolbar.getMru()
			};
		return JSON.stringify(state);
	},

	setState: function (incomingState) {
		var state = typeof incomingState==='string' 
			? JSON.parse(unescape(incomingState))
			: incomingState,

			// Translate old Silverlight states 'False' to false
			// @param {boolean|string} invalue Value to set
			// @return {boolean} Translated value
			istrue = function (invalue) {
				return (invalue === true
					|| invalue === 'True'
				|| invalue === 'true'
				) ? true : false;
			};
		if (!this.hasLoaded) {
			this.settings.initState = incomingState;
		} else if (state) {
			this.videoObj.playpause(false);
			this.videoControls.setLoop(istrue(state.looped));
			this.videoControls.setFlip(istrue(state.flipped));
			this.videoControls.setMute(istrue(state.muted));
			this.videoControls.seek(state.position);
			this.videoControls.scrubber.setSelection(state.selection || null);
			// if (state.selection) {
			// 	this.videoControls.seek(state.selection[0]);
			// 	//?? this.videoControls.playpause(true);
			// }
		}

		// Always update tools drawer, if known.
		if (state && state.drawmru) {
			this.drawingToolbar.setMru(state.drawmru);
		}
	},

	/** ***************************************************
	* Set an array of highlight states in the timeline.
	* @param {Array<object>} states Array of states with position / selection to highlight.
	**************************************************** */
	setHighlights: function (states) {
		this.videoControls.scrubber.setHighlights(states);
	},

	/** ***************************************************
	* Clear the drawings.
	**************************************************** */
	clearDrawings: function () {
		this.drawingEngine.clearDrawings();
	},

	/**
	* Show or hide the image preview.
	* @param {string=} url Address of image to load, or falsy to hide the image again.
	*/
	showImage: function (url) {
		if (url) {
			this.previewContainer
				.css({
					width:  this.viewContainer.width() + 'px',
					height: this.viewContainer.height() + 'px'
				})
				.show();
			Utilities.loadImageToElement(url, this.previewContainer, { zoomToFill: true, replaceContent: true });

			this.cmask.fadeIn("fast");
					
		} else {
			this.previewContainer.html('').hide();
			this.cmask.stop().hide();
		}
	},

	showCapturingMsg: function() {
		this.capturingMsg.show();
	},

	hideCapturingMsg:function () {
		this.capturingMsg.hide();
	},

	videoCanPlay:function () {
		this.hasLoaded = true;
		if (this.settings.initState) {
			this.setState(this.settings.initState);
		} else {
			this.videoObj.seek(0);
			this.drawingToolbar.setMru();
		}

		this.trigger('videoloaded', '');
	},

	videoTimeUpdate: function (newTime) {
		this.drawingEngine.upDateClock(newTime);
	},

	// Callback when video meta data has loaded. On iPad and
	// iPhone, this doesn't fire until the user plays the
	// video for the first time.
	videoMetaLoaded: function (params) {
		var timeControls = this.videoObj.getDomElementType() !== 'img';
		this.videoControls.show(!!timeControls);       // Hide the play bar for image-only analysis.
		this.drawingEngine.showClock = !!timeControls; // Hide clock for images.
		this.videoControls.scrubber.setRange(0, this.videoObj.domElement.duration, 1.0 / this.videoObj.FPS);
		this.drawingToolbar.setBarDisabled(false, timeControls);
		if (timeControls) {
			this.$.attr('state', this.videoObj.domElement.paused ? 'pause' : 'play');
			this.videoControls.setBarDisabled(false);
		} else {
			this.videoControls.setBarDisabled(true, timeControls);
		}
		this.resizeTool(true);
	},


	// Resize the tool, in response to video dimensions
	// becoming available, or full screen change, or on
	// first load.
	// @param {boolean=} adjustCanvas Set to TRUE to adjust canvas width and height (drawing resolution) attributes
	resizeTool: function (adjustCanvas) {
		var domVideo = this.videoObj.getDomElement(),//domElement,       // {HTMLVideoElement} video element
			domDraw = this.drawCanvas.domElement,       // {HTMLCanvasElement} canvas where drawings are drawn
			domScratch = this.scratchCanvas.domElement, // {HTMLCanvasElement} buffer canvas for blit
			vid = {                                     // dimensions of video, or best guess
				w: domVideo.videoWidth || +domVideo.getAttribute('data-poster-width') || domVideo.clientWidth,
				h: domVideo.videoHeight || +domVideo.getAttribute('data-poster-height') || domVideo.clientHeight
			},
			autoHeight = this.container.attr('data-auto-height') === 'true'
				|| this.viewContainer.height() === 0,    // {boolean} Value indicating that height should be driven here.
			outer = {                                   // dimensions of container, prevent #DIV/0!
				w: this.viewContainer.width() || 1,
				h: this.viewContainer.height() || 1
			},
			ar = {                                      // ratio scale: max video scale to fit in space
				w: outer.w / vid.w,
				h: outer.h / vid.h
			},
			dims = {
				w: autoHeight || ar.w < ar.h ? outer.w : ar.h * vid.w,
				h: autoHeight || ar.w < ar.h ? ar.w * vid.h : outer.h
			},
			css = {
				top: autoHeight ? '' : Math.round((outer.h - dims.h) / 2) + 'px',
				left: Math.round((outer.w - dims.w) / 2) + 'px',
				width: Math.round(dims.w) + 'px',
				height: Math.round(dims.h) + 'px'
			};


		if (!isNaN(dims.w) && !isNaN(dims.h)) {
			// Adjust canvas dimension attributes, if needed.
			if (adjustCanvas === true) {
				domDraw.width = domScratch.width =   dims.w;//vid.w;
				domDraw.height = domScratch.height = dims.h;//vid.h;
			}

			// Auto-height.
			if (autoHeight) {
				this.container.attr('data-auto-height', 'true');
			}

			// Set styles.
			$(domVideo).css(css);
			$(domDraw).css(css);
			$(domScratch).css(css);
			this.videoControls.scrubber.resize();
			this.drawingEngine.renderAll();
		}
	},


	// Set the full screen view
	// @param {boolean} toFullScreen Set to TRUE or FALSE for full screen or restored
	fullScreen: function (toFullScreen) {
		if (toFullScreen) {
			//===Full Screen View============================
			this.container
				.attr('view', 'fullscreen')
				.css({
					width: window.innerWidth + 'px',
					height: window.innerHeight + 'px'
				});
			this.viewContainer
				.attr('restore-height', this.viewContainer.attr('restore-height') || this.viewContainer.height())
				.css({
					height: (window.innerHeight - 75) + 'px'
				});
			
		} else {
			//===Normal View=================================
			this.container
				.removeAttr('view')
				.css({
					width: '',
					height: ''
				});
			this.viewContainer
				.css({
					height: this.viewContainer.attr('restore-height') + 'px'
				});
		}
		this.resizeTool();
	},

	/**
	* Set a user-defined frame rate, which is passed to the video element.
	* @param {number} fps (1/s) Frame rate to set.
	*/
	setFps: function (fps) {
		this.videoObj.setMediaDimensions(fps);
	}
};

function singleAnalysisTool(options) {
	var settings = options;
	var tool = {};

	this.render = function () {

		tool = new AnalysisTool.SingleControl(settings);
		tool.setCaptureCallback(settings.onImageUploadedCallback);
		tool.render();
		tool.loadvideo(settings.mediaUrl[0], settings.mediaUrl[1], 25);
		return this;
	};

	this.setCaptureCallback = function (fnCallback, asImage) {
		tool.setCaptureCallback(fnCallback, asImage);
	};

	this.captureImage = function (region) {
		var currentVideoState = tool.getState();
		tool.captureImage(region);
	};

	this.getState = function () {
		return tool.getState();
	};

	this.setState = function (state) {
		tool.setState(state);
	};

	this.loadMedia = function (newMedia) {
		tool.loadvideo(newMedia[0], newMedia[1], 25);
	};

	this.showImage = function (id) {
		tool.showImage(id);
	};

	this.on = function (type, fn, uid) {
		tool.on(type, fn, uid);
		return this;
	};

	this.hideImage = function () {
		this.showImage(null);
	};

	this.setHighlights = function (states, callback) {
		if (tool.setHighlights) {
			tool.setHighlights(states);
		}
	};

	this.clearDrawings = function () {
		tool.clearDrawings();
	};

	this.setFps = function (fps) {
		tool.setFps(fps);
	};

	this.resizeTool = function (width, height) {
		if(tool && tool.viewContainer) {
			if (width) {
				tool.viewContainer.width(width + "px");
			}
			if (height) {
				tool.viewContainer.height(height + "px");
			}
			tool.resizeTool(true); // Resize, adjust canvas.
		}
	}

	return this;

}

AnalysisTool.singleAnalysisTool = singleAnalysisTool;
