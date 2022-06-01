/* eslint-disable no-unused-vars, eqeqeq, default-case */
import { AnalysisTool, $, Utilities } from './shim';
export {};

/***********************************************************
* Dual control impl
********************************************************** */

/**
* Dual video analysis controler
* @class dualControler
* @constructor
* @param {String} id of hostong container
* @param {string} uid for control
*/
AnalysisTool.DualControl = function (opts) {
	this.settings = opts;
	this.container = $('#' + this.settings.targetID);
	// this.viewContainer;
	// this.toolbarContainer;
	// this.videoControlsContainer;
	// this.drawCanvas;
	// this.scratchCanvas;

	this.panelContainer = {
		left: null,
		right: null
	};
	this.videoObj = {
		left: null,
		right: null
	};
	this.videoControls = {
		left: null,
		right: null,
		both: null
	};
	this.zoom = {
		left: { left: 0, top: 0, scale: 1.0 },
		right: { left: 0, top: 0, scale: 1.0 }
	};
	this.captureCallback = null;
	this.mediaID = {  // save MediaID for iPad / server side video frame extraction
		left: null,
		right: null
	}; 
	this.has = {
		meta: {
			left: false,
			right: false
		},
		canplay: {
			left: false,
			right: false
		}
	};

	this.currentMode = 'draw';
	this.currentView = 'sidebyside';
	this.currentVideoControlBar = {};
	this.currentSyncPanel = 'left';     // {string} 'left'|'right'|'both' for single panel being sync'd
	this.isFullscreen = false;
};

AnalysisTool.DualControl.prototype = {
	constructor: AnalysisTool.DualControl,
	alert: function () {
		var str = 'Copyright (c) Siliconcoach\nAll rights reserved.';
		alert(str);
		return str;
	},
	/**
	* Render control in to page
	*
	* @method render
	*/
	render: function () {
		var self = this,
			p,
			toolBarsH = 90,      // height occupied by toolbars
			avalableHeight = parseInt(self.settings.height) - toolBarsH,
			avalableWidth = parseInt(self.settings.width),

			// Create the view wrapper and video objects
			// @this {DualControl} THIS from outer closure
			// @param {string} panel Left or right panel to create
			createViewVideo = function (panel) {
				var panelName = panel,    // 'left' or 'right'
					panelContainer = $('<div></div>')
						.attr('class', 'ac-view' + panelName)
						.appendTo(this.viewContainer),
					videoObj = new AnalysisTool.VideoPlayer(panelContainer, panelName),
					videoControls = new AnalysisTool.toolbars.singlevideoControls('ac-' + panelName + 'video-controls', self.settings, true);

				videoObj.addEventListener('canplay', function () { self.videoCanPlay(panel) });
				videoObj.addEventListener('loadedmetadata', function (param) { self.metaLoaded(panel); });
				videoObj.render();

				videoControls.setVideoObject(videoObj);
				videoControls.appendTo(self.videoControlsContainer);
				videoControls.scrubber.listenVideoProgress(videoObj);

				this.panelContainer[panel] = panelContainer;
				this.videoObj[panel] = videoObj;
				this.videoControls[panel] = videoControls;
			};

		this.wrapper = $('<div></div>')
			.addClass('analysisControl')
			.attr('analysis-type', 'dual')
			.attr('state', 'wait')
			.attr('sync-panel', this.currentSyncPanel)
			//??.css('width', this.settings.width + 'px') // not needed??
			.appendTo(this.container);

		this.container = this.wrapper;
		this.el = this.container[0];

		this.viewContainer = $('<div></div>')
			.addClass('ac-viewwrapper')
			.attr('view', this.currentView)
			.width(Math.round(avalableWidth))
			.height(Math.round(avalableHeight))
			.appendTo(this.container);

		this.toolbarContainer = document.createElement('div');
		$(this.toolbarContainer)
			.addClass('ac-toolbar-container')
			.html([
				'<div class="ac-draw-controls-container">', // offset for overlapping..
				'<div class="ac-draw-controls"></div>',     //..drawing tools
				'<div class="ac-sync-controls"></div>',     //..and synchronization / layout tools
				'</div>'
			].join(''))
			.appendTo(this.container);

		this.videoControlsContainer = $('<div></div>')
			.addClass('ac-video-controls')
			.attr('mode', 'draw')
			.appendTo(this.toolbarContainer);

		this.settings.simpleview = true;
		createViewVideo.call(this, 'left');
		createViewVideo.call(this, 'right');

		this.drawCanvas = new AnalysisTool.h5controls.objCanvas('draw');
		this.drawCanvas.appendTo(this.viewContainer);
		this.scratchCanvas = new AnalysisTool.h5controls.objCanvas('scratch');
		this.scratchCanvas.appendTo(this.viewContainer);

		this.videoControls.both = new AnalysisTool.toolbars.dualvideoControls('ac-bothvideo-controls', this.settings);
		this.videoControls.both.setVideoObjects(this.videoObj.left, this.videoObj.right);
		this.videoControls.both.appendTo(this.videoControlsContainer);
		this.videoControls.both.$.on('dualtimerupdate', $.proxy(this.dualtimerUpdate, this));
		this.videoControls.left.$.on('fullscreen', function (e, isFullScreen) { self.fullScreen(isFullScreen); });
		this.videoControls.right.$.on('fullscreen', function (e, isFullScreen) { self.fullScreen(isFullScreen); });
		this.videoControls.both.$.on('fullscreen', function (e, isFullScreen) { self.fullScreen(isFullScreen); });
		this.videoControls.left.$.on('alignmode', $.proxy(this.modeChangedHandler, this));
		this.videoControls.right.$.on('alignmode',  $.proxy(this.modeChangedHandler, this));
		this.videoControls.both.$.on('alignmode', $.proxy(this.modeChangedHandler, this));

		this.videoControls.both.scrubber.listenVideoProgress(this.videoObj.left, this.videoObj.right);

		this.syncControls = new AnalysisTool.SyncBar(
			this.toolbarContainer.querySelector('.ac-sync-controls'),
			{
				left: this.videoObj.left,
				right: this.videoObj.right
			})
			.addEventListener('player', function (name) {
				self.playerToControlChangedHandler(name);
			})
			.addEventListener('layout', function (name) {
				self.changeView(name);
			});

		this.drawingToolbar = new AnalysisTool.Drawbar();
		this.drawingToolbar.appendTo(this.toolbarContainer.querySelector('.ac-draw-controls'));

		this.drawingEngine = new AnalysisTool.drawingEngine(this.drawingToolbar, this.drawCanvas, this.scratchCanvas);
		this.drawingEngine.setOuterContainer(this.viewContainer); //container to constrain dialogs to;
		this.drawingEngine.formatTimeHandler = this.videoControls.both.scrubber;

		this.cmask = $('<div></div>');
		this.cmask.addClass('ac-cmask');
		this.container.append(this.cmask);

		this.previewContainer = $('<div class="ac-imagepreview"></div>');
		this.container.append(this.previewContainer);
		this.previewContainer.hide();

		var capturingMsg = $('<div></div>');
		capturingMsg.addClass('ac-capturingMsg');
		$(capturingMsg).append($('<div class="ac-capturingMsg-msg"></div>')
			.html(AnalysisTool.localize('Saving image.<br />Please wait...')));

		this.container.append(capturingMsg);
		capturingMsg.hide();
		this.capturingMsg = capturingMsg;
		this.currentVideoControlBar = this.videoControls.left; // during alignment for stepping with arrow keys

		this.container
			.attr('align-mode', 'draw')
			.attr('sync-panel', 'left');

		$(document).on('keydown', $.proxy(function (ev) {
			if (this.currentMode == 'draw') {
				switch (ev.keyCode) {

					case 39:
						this.videoControls.both.commands.stepfwd()
						break;

					case 37:
						this.videoControls.both.commands.stepbwd();
						break;
				}
			}

			if (this.currentMode == 'align') {
				switch (ev.keyCode) {
				
					case 39:
						this.currentVideoControlBar.commands.stepfwd()
						break;
				
					case 37:
						this.currentVideoControlBar.commands.stepbwd();
						break;
				}
			}
		}, this));

		AnalysisTool.forceVisibilities(this.wrapper);
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


	// Load videos and poster frames into both video players
	// @param {string} leftUrl, rightUrl Addresses of videos to load
	// @param {string} leftPoster, rightPoster Addresses of poster frame images to load
	// @param {number} fps Video frame rate
	loadvideos: function (leftUrl, rightUrl, leftThumb, rightThumb, fps) {
		var self = this,
			sem = 1,
			// Callback once each panel ready, before calling resizeTool.
			ready = function () {
				if ((sem -= 1, sem) > 0) return;
				self.resizeTool(true);
			},

			// Extract media identifier from video url. For now, assume
			// that the url includes the mediaID as the last guid. In
			// future, we may need to pass in the mediaID separately.
			// @param {string} url Address to extract from
			// @return {string.guid} Extracted media identifier, or null
			idFromUrl = function (url) {
				var id = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g);
				return id ? id[id.length - 1] : null;
			},

			// Set the content for an individual panel.
			// We retain loaded media IDs for iPad / server-
			// side video frame extraction
			// @this {DualControl} THIS from outer closure
			// @param {string} panel Left or right panel
			// @param {string} url Media url to load
			// @param {string} thumb Poster image url to load
			setPanel = function (panel, url, thumb) {
				this.mediaID[panel] = idFromUrl(url);
				this.has.meta[panel] = false;
				this.has.canplay[panel] = false;
				this.videoObj[panel].load(url, thumb, fps, ready);
				if (this.mediaID[panel]) {
					AnalysisTool.delegate.mediaInfo(this.mediaID[panel], function (data) {
						if (data.fps) {
							self.videoObj[panel].setMediaDimensions(data.fps, data.width, data.height);
						}
					});
				}
			};

		setPanel.call(this, 'left', leftUrl, leftThumb);
		setPanel.call(this, 'right', rightUrl, rightThumb);
		this.drawingToolbar.setMru();
		ready();
	},

	// Resize the tool, in response to video dimensions
	// becoming available, on full screen change, or on
	// align/analyse change, or first load
	// @param {boolean=} adjustCanvas Set to TRUE to adjust canvas width and height (drawing resolution) attributes
	resizeTool: function (adjustCanvas) {
		var setViewCss = false,       // set to TRUE to use css styles instead of absolute positioning - may yield better results
			viewWidth = this.viewContainer.width(),
			viewHeight = this.viewContainer.height(),
			css = {
				width: viewWidth + 'px',
				height: viewHeight + 'px'
			},
			domDraw = this.drawCanvas.domElement,        // {HTMLCanvasElement}
			domScratch = this.scratchCanvas.domElement,  // {HTMLCanvasElement}

			// Set the position of a single panel
			// Note that these are also affected by css positioning
			// @param {string} panel Left or right panel to set
			positionPanel = function (panel) {
				var $container = this.panelContainer[panel],
					videoObj = this.videoObj[panel],
					pos = this.getLayoutCoordinates(this.currentView, panel,
						videoObj.getWidth(), videoObj.getHeight(), viewWidth, viewHeight);
				if (setViewCss) {
					$container.css({
						position: 'absolute',
						left: pos.outer.x + 'px',
						top: pos.outer.y + 'px',
						width: pos.outer.w + 'px',
						height: pos.outer.h + 'px'
					});
				}

				$(videoObj.getDomElement()).css({
					left: pos.inner.x + 'px',
					top: pos.inner.y + 'px',
					width: pos.inner.w + 'px',
					height: pos.inner.h + 'px'
				});
			};

		if (adjustCanvas === true) {
			domDraw.width = domScratch.width = viewWidth;
			domDraw.height = domScratch.height = viewHeight;
		}
		this.drawCanvas.$.css(css);
		this.scratchCanvas.$.css(css);
		//icon.css({
		//	left: Math.round((viewWidth - icon.width()) / 2) + 'px',
		//	top: Math.round((viewHeight - icon.height()) / 2) + 'px'
		//});

		positionPanel.call(this, 'left');
		positionPanel.call(this, 'right');
		this.updateScrubbers();
		this.drawingEngine.renderAll();
	},

	// Establish the outer (container) and inner (video) positions
	// for a given panel (left / right) and view. The video dimen-
	// sions are  taken from the HTMLVideoElement's naturalWidth /
	// naturalHeight attributes, or if they're missing, the custom
	// poster-width / poster-height attribute set by the preloaded
	// thumbnail, or mediaWidth / mediaHeight read from the media-
	// infomanager.  The video  positions are  additionally offset
	// by the scroll positions determined in align mode.
	// @param {string} view 'sidebyside'|'topbottom'|... View to display
	// @param {string} panel Left or right panel
	// @param {number} videoWidth, videoHeight Dimensions of video being fitted
	// @param {number} viewWidth, viewHeight Dimensions of outermost container to fill
	// @return {object} Object positions: outer, inner: x, y, w, h
	getLayoutCoordinates: function (view, panel, videoWidth, videoHeight, viewWidth, viewHeight) {
		var sx, sy, sw, sh, scale,
			outer,
			inner,
			source,
			target,
			zoom = this.zoom[panel],
			coords = this.layoutCoordinates(view, panel) || this.layoutCoordinates('sidebyside', panel);

		// SOURCE: area in SOURCE VIDEO visible in TARGET (source video coords)
		// TARGET: Area of PANEL occupied in TARGET, not including whitespace
		// OUTER: area of TARGET occupied by PANEL (target coords)
		// INNER: position of SCALED VIDEO relative to PANEL (target coords)
		// ZOOM: fractional relative to VIDEO size
		// Note that SOURCE and TARGET are usually used for blitting on screen
		// capture, while OUTER and INNER are for on-screen layout of elements
		// 
		//    source
		//   :<-x->:<-w->:
		//   :     :     :
		//   .-----:-----:---.
		//   |`````.-----.```|<--Source video
		//   |`````|#####|```|
		//   |`````|#####|<--Area visible in target view
		//   |`````|#####|```|
		//   |`````'-----'```|
		//   '---------------'
		//
		//      outer                                            
		//   :<-- x -->:<--- w --->:                                           
		//   :         :           :                             
		//   :    inner            :                             
		//   :   :<-x->:<---- w ---------->:
		//   :   :     :           :       :
		//   .---:-----:-----------:-------:--------.
		//   |   .-----:-----------:-------.        |<--Target view
		//   |   |`````.-----------.```````|        |
		//   |   |`````|###########|```````|<--Scaled video
		//   |   |`````|###########|```````|        |
		//   |   |`````|###########|<--Target View  |
		//   |   |`````|###########|```````|        |
		//   |   |`````|###########|```````|        |
		//   |   |`````|###########|```````|        |
		//   |   |`````|###########|```````|        |
		//   |   |`````|###########|```````|        |
		//   |   |`````|###########|```````|        |
		//   |   |`````'-----------'```````|        |
		//   |   |`````````````````````````|        |
		//   |   '-------------------------'        |
		//   '--------------------------------------'
		//

		// Outer dimensions of panel in target view (scaled up)
		outer = {
			x: coords.x * viewWidth,
			y: coords.y * viewHeight,
			w: coords.w * viewWidth,
			h: coords.h * viewHeight
		}

		// Scale video to fit according to view (not including zoom.scale)
		sw = outer.w / videoWidth;
		sh = outer.h / videoHeight;
		scale = coords.fit ? Math.min(sw, sh) : Math.max(sw, sh);

		// Coordinates of video relative to panel
		sw = videoWidth * scale * zoom.scale;
		sh = videoHeight * scale * zoom.scale;
		inner = {
			x: (outer.w - sw) / 2 - zoom.left * sw,
			y: (outer.h - sh) / 2 - zoom.top * sh,
			w: sw,
			h: sh
		};

		// Area of video visible in panel
		sx = Math.max(0, -inner.x / scale / zoom.scale);
		sy = Math.max(0, -inner.y / scale / zoom.scale);
		source = {
			x: sx,
			y: sy,
			w: Math.min(videoWidth - sx, outer.w  / scale / zoom.scale),
			h: Math.min(videoHeight - sy, outer.h / scale / zoom.scale)
		};

		// Area of panel occupied by video
		sw = Math.min(inner.w, outer.w);
		sh = Math.min(inner.h, outer.h);
		target = {
			x: outer.x + Math.max(0, (outer.w - inner.w) / 2),
			y: outer.y + Math.max(0, (outer.h - inner.h) / 2),
			w: sw,
			h: sh
		};

		return {
			outer: outer,       // Coordinates of panel on on target view
			inner: inner,       // Coordinates on panel view occupied by inner video
			source: source,     // Coordinates on video visible in panel
			target: target      // Coordinates occupied by video in panel
		};
	},


	// Raw fractional layout coordinates for layout views
	// @param {string} view 'sidebyside'|'topbottom'|... View
	// @param {string} panel Left or right panel
	// @return {object}
	layoutCoordinates: function (view, panel) {
		return {
			sidebyside: {
				left: { x: 0.0, y: 0.0, w: 0.5, h: 1.0, fit: false },
				right: { x: 0.5, y: 0.0, w: 0.5, h: 1.0, fit: false }
			}
			,topbottom: {
				left: { x: 0.0, y: 0.0, w: 1.0, h: 0.5, fit: false },
				right: { x: 0.0, y: 0.5, w: 1.0, h: 0.5, fit: false }
			}
			,thirdleft: {
				left: { x: 0.0, y: 0.0, w: 0.33, h: 1.0, fit: false },
				right: { x: 0.33, y: 0.0, w: 0.67, h: 1.0, fit: false }
			}
			, sidebysidefitted: {
				left: { x: 0.0, y: 0.0, w: 0.5, h: 1.0, fit: true },
				right: { x: 0.5, y: 0.0, w: 0.5, h: 1.0, fit: true }
			}
			, sidefittedbyside: { // left full view, right fitted
				left: { x: 0.0, y: 0.0, w: 0.5, h: 1.0, fit: true },
				right: { x: 0.5, y: 0.0, w: 0.5, h: 1.0, fit: false }
			}
			, pictureinpicture: {
				left: { x: 0.0, y: 0.0, w: 1.0, h: 1.0, fit: false },
				right: { x: 0.63, y: 0.02, w: 0.35, h: 0.35, fit: true }
			}
		}[view][panel];
	},


	// Change the view from the toolbar or on initialization.
	// The tool and then each panel need to be updated to ensure
	// all dimensions are correct.
	// @param {string} view View to switch to (sidebyside, etc.)
	changeView: function (view) {
		this.viewContainer.attr('view', view);
		this.currentView = view;
		this.resizeTool();
		this.adjustPanelAlignment('left');
		this.adjustPanelAlignment('right');
	},


	// Change the tool draw/align mode. When changing back
	// from align to draw, ensure that the video sync points
	// are kept
	// @param {string} mode 'align'|'draw' Mode to switch to
	changeMode: function (mode) {
		var setControlButtons = function (controls, set) {
			controls.left.buttons.alignclips.setIsSelected(set);
			controls.right.buttons.alignclips.setIsSelected(set);
			controls.both.buttons.alignclips.setIsSelected(set);
		};
		this.videoControls.both.playpause(false);
		this.currentMode = mode;
		this.videoControls.both.currentMode = mode;  // so that we can prevent slow motion in align mode
		this.container.attr('align-mode', mode);
		switch (mode) {
			case 'draw':
				this.updateSyncPanel();
				this.videoControls.both.seek(this.videoControls.both.syncPoints.tmin + 0.02);
				break;
			case 'align':
				this.videoObj.left.seek(this.videoControls.both.syncPoints.left.tsync);
				this.videoObj.right.seek(this.videoControls.both.syncPoints.right.tsync);
				break;
		}

		this.attachAlignHandlers('left' , mode === 'align'); // attach or remove drag..
		this.attachAlignHandlers('right', mode === 'align'); //..handlers and zoom buttons
		setControlButtons(this.videoControls, mode === 'align');
		this.trigger('modechanged', {
			Value: mode === 'align' ? 0 : 1,   // old handlers listen for Value{number}
			mode: mode
		});
		AnalysisTool.forceVisibilities(this.wrapper);
		this.resizeTool();
	},


	// Capture an composite image of the videos and drawing
	// layer and post to server. As with the single tool,
	// we use ffmpeg on the server (via the html5manager)
	// to retrieve a frame if on iPad or other browser that
	// doesn't blit from HTMLVideoElement to HTMLCanvasElement.
	// @param {boolean=} region Set to TRUE to select just a region.
	captureImage: function (region) {
		var isIPad = Utilities.isIPadBrowser,
			semaphore = 2,
			primaryImages = { left: null, right: null },

			// Step 2: If a region is to be selected, show dialog.
			// If no region selected, continue to step grabbing frame
			continueCapture = function () {
				this.showCapturingMsg();
				sourceImage.call(this, 'left');
				sourceImage.call(this, 'right');
			},
			
			// Blit or retrieve source image for given panel
			// @this {DualControl} THIS from outer closure
			// @param {string} panel Left or right panel
			sourceImage = function (panel) {
				var img, captureTime;
				if (isIPad) {
					captureTime = this.videoObj[panel].currentTime();
					img = new Image();
					img.onload = (function (self) {
						return function () {
							primaryImages[panel] = this;
							if ((--semaphore) <= 0) {
								self.continueCaptureImage(primaryImages, region);
							}
						}
					}(this));
					img.src = AnalysisTool.delegate.extractFrameUrl(this.mediaID[panel], captureTime);
				} else {
					primaryImages[panel] = this.videoObj[panel].getDomElement();
					if((--semaphore) <= 0) {
						this.continueCaptureImage(primaryImages, region);
					}
				}
			};

		// Step 1: Region of interest.
		if (region) {
			this.drawingEngine.getCaptureRegion(this.viewContainer, this.drawingToolbar, function (r) {
				region = r;
				if (region) {
					continueCapture.call(this);
				} else {
					this.captureComplete(null);
				}
			}, this);
		} else {
			continueCapture.call(this);
		}
	},


	// Continue with capture, either with video element or server
	// response video frame. Assumes that each primary image has
	// the same dimensions as its source video.
	// When blitting from a video, ensure that the source coords
	// don't exceed the video dimensions
	// @param {object<HTMLVideoElement|Image>} primaryImage Video frame to process
	// @param {object=} region Capture region if used { rx, ry, rw, rh }
	continueCaptureImage: function (primaryImages, region) {
		var drawCanvas = this.drawCanvas.domElement,
			tempcanvas = document.createElement('canvas'),
			ctx = tempcanvas.getContext('2d'),
			cw = drawCanvas.width,
			ch = drawCanvas.height,
			rx = region ? region.rx : 0,
			ry = region ? region.ry : 0,
			rw = region ? region.rw : cw,
			rh = region ? region.rh : ch,

			// Blit each panel onto the canvas in the correct place
			// @this {DualControl} THIS from outer closure
			// @param {string} panel Left or right panel to blit
			blitPanel = function (panel) {
				var primaryImage = primaryImages[panel],
					videoObj = this.videoObj[panel],
					coords = this.getLayoutCoordinates(this.currentView, panel, videoObj.getWidth(), videoObj.getHeight(), cw, ch),
					tgt = coords.target,
					src = coords.source;
				ctx.drawImage(primaryImage,
					Math.floor(src.x), Math.floor(src.y), Math.floor(src.w), Math.floor(src.h),
					Math.floor(tgt.x), Math.floor(tgt.y), Math.floor(tgt.w), Math.floor(tgt.h));
			},

			// Completion function reference
			captureComplete = (function(self){
				return function(data){
					self.captureComplete(data);
				}
			}(this));

		tempcanvas.width = rw;
		tempcanvas.height = rh;
		ctx.translate(-rx, -ry);

		// Source videos
		blitPanel.call(this, 'left');
		blitPanel.call(this, 'right');

		// Overlay drawing
		ctx.drawImage(this.drawCanvas.domElement, 0, 0);
		this.sendImageToServer(tempcanvas, captureComplete);
	},


	// Capture image continues when upload has finished.
	// For historical reasons, the captureCallback expects
	// arguments captureCallback(type, args).
	// @param {string.guid} guid Capture image identifier returned by POST
	captureComplete: function (guid) {
		this.showCapturingMsg(false);
		if (this.captureCallback) {
			this.captureCallback(null, { ImageNameGuid: guid });
		}
		this.trigger('imageuploaded', { ImageNameGuid: guid });
	},


	setCaptureCallback: function (callBackFunction) {
		this.captureCallback = callBackFunction;
	},

	// Retrieve the current state of the tool, suitable for restoring
	// with setState.
	// @return {string} Stringified structure
	getState: function () {
		var state,
			controlsBoth = this.videoControls.both,
			syncPoints = controlsBoth.syncPoints,
			currentTime = controlsBoth.scrubber.value,

			// Add panel ('left' -> 'VideoOne') of legacy data
			// See comments at setState for description of calculations
			// @this {DualControl} THIS from outer closure
			// @param {string} panel Left or right panel
			addLegacy = function (panel) {
				var videoWidth = this.videoObj[panel].getWidth(),
					videoHeight = this.videoObj[panel].getHeight(),
					zoom = this.zoom[panel],
					sync = this.videoControls.both.syncPoints[panel],

					// Screen dimensions of legacy Silverlight player
					legacyWidth = 509,
					legacyHeight = 383,
					ComposeZoom = zoom.scale,
					ActualWidth = legacyWidth * ComposeZoom,
					ActualHeight = legacyHeight * ComposeZoom,
					coords = this.layoutCoordinates(this.currentView, panel),
					scale = Math.min(legacyWidth / videoWidth, legacyHeight / videoHeight),
					width = coords.w * scale * videoWidth,
					height = coords.h * scale * videoHeight,

					// Establish a legacy named parameter
					// @param {string} name Parameter name with {0} ot be replaced with 'One'|'Two'
					Param = function (name) {
						return name.replace(/\{0\}/g, panel === 'left' ? 'One' : 'Two');
					};
					
				state[Param('CurrentVideo{0}ComposeZoom')] = ComposeZoom;
				state[Param('CurrentVideo{0}SyncPosition')] = Math.round(sync.tsync * 1000)
				state[Param('CurrentVideo{0}SyncTrimEnd')] = Math.round(sync.duration * 1000);
				state[Param('CurrentVideo{0}SyncTrimStart')] = 0;
				state[Param('Video{0}ActualWidth')] = ActualWidth;
				state[Param('Video{0}ActualHeight')] = ActualHeight;
				state[Param('Video{0}ActualHOffset')] = zoom.left * ActualWidth + (ActualWidth - width)/2;
				state[Param('Video{0}ActualVOffset')] = zoom.top * ActualHeight + (ActualHeight - height)/2;
			}

		controlsBoth.isWithinSelection(true); // collapse if beyond selection
		state = {
			looped: false,
			flipped: false,
			view: this.currentView,           // {string} View mode (sidebyside, etc.)
			zoom: this.zoom,                  // {object} Video layout status
			sync: {                           // {object} Synchronization points
				left: syncPoints.left.tsync,   // {number} (s) Left clip sync
				right: syncPoints.right.tsync  // {number} (s) Right clip sync
			},
			duration: {
				left: syncPoints.left.duration,  // {number} (s) Left video duration
				right: syncPoints.right.duration // {number} (s) Right video duration
			},
			time: currentTime,                // {number} (s) Current playhead time
			selection: controlsBoth.scrubber.getSelection(), // {?Array<number>} Selection range
			drawmru: this.drawingToolbar.getMru()
		};

		// Backward-compatibility Silverlight legacy
		state.VideoComposition = this.currentView === 'topbottom' ? 1 : 0;
		state.CurrentVideoTwoComposeOpacity = 1;
		state.PlayHeadPosition = Math.round(currentTime * 1000);
		state.SliderOverlayOpacity = 0.5;
		addLegacy.call(this, 'left');
		addLegacy.call(this, 'right');

		return JSON.stringify(state);
	},

	// Set the state of the tool to restore a previously captured
	// position. The state may be called to set before the videos
	// are ready to play, so we keep a copy to apply once ready.
	// The state structure comprises "view", "zoom", "sync", and
	// "time". We make a minimal effort to restore states stored
	// by the earlier Silverlight tool:
	// {
	//    "CurrentVideoOneComposeZoom": 1.3310000000000004,
	//    "CurrentVideoOneSyncPosition": 2047,
	//    "CurrentVideoOneSyncTrimEnd": 10020,
	//    "CurrentVideoOneSyncTrimStart": 0,
	//    "CurrentVideoTwoComposeOpacity": 1,
	//    "CurrentVideoTwoComposeZoom": 1.2100000000000002,
	//    "CurrentVideoTwoSyncPosition": 12095,
	//    "CurrentVideoTwoSyncTrimEnd": 20040,
	//    "CurrentVideoTwoSyncTrimStart": 0,
	//    "PlayHeadPosition": 16100,
	//    "SliderOverlayOpacity": 0.5,
	//    "VideoComposition": 1,
	//    "VideoOneActualHOffset": 77.2394790649414,
	//    "VideoOneActualHeight": 509.77301025390625,
	//    "VideoOneActualVOffset": 123.13650512695313,
	//    "VideoOneActualWidth": 677.47900390625,
	//    "VideoTwoActualHOffset": 0.44498825073242188,
	//    "VideoTwoActualHeight": 463.42999267578125,
	//    "VideoTwoActualVOffset": 181.96501159667969,
	//    "VideoTwoActualWidth": 615.8900146484375
	// }
	// In particular, most of the geometry parameters will be
	// inaccurate, but the sync times should match.
	// @param {object|string} incomingState State to set tool to
	setState: function (incomingState) {
		var controlsBoth = this.videoControls.both,
			state = (typeof incomingState === 'string')
				? JSON.parse(unescape(incomingState))
				: incomingState,
			view = state.hasOwnProperty('view')
				? state.view
				: (
					state.VideoComposition === 0 ? 'sidebyside' : (
					state.VideoComposition === 1 ? 'topbottom' : (
					'sidebyside'))),

			// Determine the zoom position for legacy layout values.
			// The old Silverlight ActualDimension values represent a
			// 4x3 video in which the video is fitted, keeping the
			// aspect ratio constant. The offsets are then relative
			// to the top-left corner of the viewport.
			// @this {DualControl} THIS from outer closure
			// @param {string} panel Left or right panel
			calculatePanelZoom = function (panel) {
				var video = this.videoObj[panel],
					videoWidth = video.getWidth(),
					videoHeight = video.getHeight(),

					//---Legacy---
					// Retrieve a named legacy parameter
					// @param {string} name Parameter name with {0} to be replaced with 'One'|'Two'
					State = function (name) {
						return state[name.replace(/\{0\}/g, panel === 'left' ? 'One' : 'Two')];
					},

					// Declared dimensions of container
					ActualWidth = State('Video{0}ActualWidth'),
					ActualHeight = State('Video{0}ActualHeight'),
					ActualHOffset = State('Video{0}ActualHOffset'),
					ActualVOffset = State('Video{0}ActualVOffset'),
					ComposeZoom = State('CurrentVideo{0}ComposeZoom'),
					legacyWidth = ActualWidth / ComposeZoom,     // {number=509} Catered viewport from old..
					legacyHeight = ActualHeight / ComposeZoom,   // {number=383}..legacy Silverlight tool

					// Equivalent legacy viewport
					coords = this.layoutCoordinates(view, panel),

					// Fit video into legacy 4x3 bounding box
					scale = Math.min(legacyWidth / videoWidth, legacyHeight / videoHeight),
					width = coords.w * scale * videoWidth,
					height = coords.h * scale * videoHeight;

				this.zoom[panel] = {
					left: (ActualHOffset - (ActualWidth - width) / 2) / ActualWidth,
					top: (ActualVOffset - (ActualHeight - height) / 2) / ActualHeight,
					scale: ComposeZoom
				};
			};


		//===Ready================================
		// obsolete image analysis -> if (this.has.canplay.left && this.has.canplay.right) {
		if (this.has.meta.left && this.has.meta.right) {
			controlsBoth.playpause(false);            // stop playing

			//---Layout View---
			this.changeView(view);

			//---Geometry---
			if (state.hasOwnProperty('zoom')) {
				this.zoom = state.zoom;
			} else {
				calculatePanelZoom.call(this, 'left');
				calculatePanelZoom.call(this, 'right');
			}
			this.resizeTool();

			//---Syncronization---
			controlsBoth.updateSyncPoints(
				state.sync || {
					left: (state.CurrentVideoOneSyncPosition || 0) / 1000.00,
					right: (state.CurrentVideoTwoSyncPosition || 0) / 1000.00
				});

			//---Temporal---
			controlsBoth.scrubber.setSelection(state.selection || null);
			if (state.selection) {
				controlsBoth.seek(state.selection[0]);
				controlsBoth.playpause(true);
			} else {
				controlsBoth.seek(state.time);
			}

			//---Drawing---
			this.drawingToolbar.setMru(state.drawmru);
		} else {
			//===Not Ready=========================
			this.settings.initState = incomingState;
		}
	},

	/**
	* Show or hide the image preview.
	* @param {string=} url Address of image to load, or falsy to hide the image again.
	*/
	showImage: function (url) {
		if (url) {
			this.previewContainer
					.css({
						width:this.viewContainer.width() + 'px',
						height:this.viewContainer.height() + 'px'
					}).show();
			Utilities.loadImageToElement(url, this.previewContainer, { zoomToFill: true, replaceContent: true });
			this.cmask.show();
		} else {
			this.previewContainer.html('').hide();
			this.cmask.hide();
		}
	},

	// Clear drawings
	clearDrawings: function () {
		this.drawingEngine.clearDrawings();
	},

	dualtimerUpdate: function (type, data) {
		if (this.currentMode == 'draw') {
			this.drawingEngine.upDateClock(data);
		}
	},

	modeChangedHandler: function (e, isSelected) {
		this.changeMode(isSelected ? 'align' : 'draw');
	},

	// Show or hide the capturing message
	// @param {boolean} show Default show, FALSE to hide the message
	showCapturingMsg: function(show) {
		this.capturingMsg.toggle(show !== false);
		this.cmask.toggle(show !== false);
	},

	// Callback to notify that video is ready to play
	// @param {string} panel Left or right panel
	videoCanPlay: function (panel) {
		var controlsBoth = this.videoControls.both,
			videoObj = this.videoObj[panel],
			videoControls = this.videoControls[panel];
		this.has.canplay[panel] = true;
		
		videoObj.setMute(true);
		videoControls.scrubber.setRange(0, videoObj.domElement.duration, 1.0 / videoObj.FPS);

		if (this.has.canplay.left && this.has.canplay.right) {
			controlsBoth.scrubber.setRange(null, null, 1.00 / (Math.max(this.videoObj.left.FPS, this.videoObj.right.FPS) || 1.0));
			controlsBoth.updateSyncPoints({ left: 0.0, right: 0.0 });
			controlsBoth.seek(0.04); // lift off origin to activate video element
			this.trigger('videoloaded', '');
		}
		this.setInitialState();
		AnalysisTool.forceVisibilities(this.wrapper);
	},


	// When videos are ready or static images loaded,
	// this is called to set initial state. For static
	// images, the canplay state is set at metaLoaded,
	// since the videoCanPlay event is not fired.
	setInitialState: function () {
		if (this.has.canplay.left && this.has.canplay.right) {
			if (this.settings.initState) {
				this.setState(this.settings.initState);
			}
			this.settings.initState = null;
		}
	},


	// Callback once left or right videos have loaded
	// @param {string} panel Left or right panel has loaded
	metaLoaded: function (panel) {
		this.has.meta[panel] = true;
		if (this.has.meta.left && this.has.meta.right) {
			this.changeMode('draw'); // draw
			this.container.attr('state', 'pause');
			this.setBarsDisabled(false);
			AnalysisTool.forceVisibilities(this.wrapper);
		}
		if (this.videoObj[panel].getDomElementType() === 'img') {
			this.has.canplay[panel] = true;
			this.setInitialState();
		}
		this.resizeTool();
	},

	// Set the disabled states of all toolbars. The bars should
	// remain locked until the videos are ready for use by the
	// user.
	// @param {boolean} disabled Disabled status to set bars to
	setBarsDisabled: function (disabled) {
		var time = {
			left: this.videoObj.left.getDomElementType() !== 'img',
			right: this.videoObj.right.getDomElementType() !== 'img',
			both: false
		};
		time.both = time.left || time.right;
		time.neither = !(time.left && time.right);
		this.videoControls.left.setBarDisabled (time.neither);
		this.videoControls.right.setBarDisabled(time.neither);
		this.videoControls.both.setBarDisabled (disabled, time.both);
		this.drawingToolbar.setBarDisabled     (disabled, time.both);
	},

	fullScreen: function (toFullScreen) {
		var viewWid = this.viewContainer.width(), // current dimensions
			viewHig = this.viewContainer.height(),
			winWid = window.innerWidth,          // available fullscreen dimensions
			winHig = window.innerHeight - 75,
			s = Math.min(winWid / viewWid, winHig / viewHig);   // scale to fit

		if (toFullScreen) {
			//===Change to Full Screen=======================
			this.container
				.attr('view', 'fullscreen')
				.css({
					width: window.innerWidth + 'px',
					height: window.innerHeight + 'px'
				});
			this.viewContainer
				.attr('restore-width', viewWid)
				.attr('restore-height', viewHig)
				.css({
					width: s * viewWid + 'px',
					height: s * viewHig + 'px'
				});
		} else {
			//===Restore=====================================
			this.container
				.removeAttr('view')
				.css({
					width: '',
					height: ''
				});
			this.viewContainer
				.css({
					width: this.viewContainer.attr('restore-width') + 'px',
					height: this.viewContainer.attr('restore-height') + 'px'
				});
		}
		this.resizeTool();
	},

	// Post the content of the specified canvas to the
	// server as a captured image
	// @param {HTMLCanvasElement} tempcanvas Canvas whose content is to be posted
	// @param {function} completeFunction Callback function to call when posting completes
	sendImageToServer: function (tempcanvas, completeFunction) {
		var self = this,
			data = tempcanvas.toDataURL('image/jpeg', 0.9);

		AnalysisTool.delegate.saveImage(data, function (data) {
			if (!data) {
				self.showCapturingMsg(false);
			} else {
				completeFunction(data);
			}
		});
	},

	// Event handler when changing the clip panel being synchronized.
	// This is called when the A|B|AB buttons are clicked, but also
	// when the tool enters align mode.
	// @param {string} name 'left'|'right'|'both' Synchronization panels
	playerToControlChangedHandler: function (name) {
		var t,
			controlsBoth = this.videoControls.both,
			syncPoints = controlsBoth.syncPoints;
		controlsBoth.playpause(false);
		this.updateSyncPanel();

		switch (name) {
			case 'left':
			case 'right':
				this.videoObj.left.seek (syncPoints.left.tsync);
				this.videoObj.right.seek(syncPoints.right.tsync);
				break;
			case 'both':
				t = syncPoints.left.tsync + syncPoints.left.t0;
				//----t = this.videoControls.both.syncPoints.tmin;
				controlsBoth.seek(t);
				controlsBoth.scrubber.setSliderValue(t);
				break;
		}
		this.currentVideoControlBar = this.videoControls[name];
		this.currentSyncPanel = name;
		this.container.attr('sync-panel', name);
		AnalysisTool.forceVisibilities(this.wrapper);
		this.updateScrubbers();
	},

	// Update the sync point for the currently-edited panel
	updateSyncPanel: function () {
		var controlsBoth = this.videoControls.both,
			tsyncs = {
				left: controlsBoth.syncPoints.left.tsync,
				right: controlsBoth.syncPoints.right.tsync
			},
			panel = this.currentSyncPanel;
		if (panel && panel !== 'both') {
			tsyncs[panel] = this.videoObj[panel].currentTime();
			controlsBoth.updateSyncPoints(tsyncs);
		}
		this.updateScrubbers();
	},

	/** ***************************************************
	* Update the scrubber ticks. This is called when the
	* player to control changes, or on fullscreen.
	**************************************************** */
	updateScrubbers: function () {
		var self = this, panel = this.currentMode === 'draw' ? 'both' : this.currentSyncPanel;
		this.videoControls[panel].scrubber.resize();
	},

	// Attach the alignment mouse handlers (drag, zoom)
	// @param {string} panel Left or right panel to attach to
	// @param {boolean} attach Set to TRUE to attach, FALSE to remove handlers
	attachAlignHandlers: function (panel, attach) {
		var self = this,
			panelContainer = this.panelContainer[panel][0],
			ptDown = null,

			// Mouse move handler during drag
			// @param {Event} e Mouse event down
			mouseMove = function (e) {
				var x = e.clientX || e.pageX,
					y = e.clientY || e.pageY;
				if(ptDown){
					self.adjustPanelAlignment(panel, x - ptDown.x, y - ptDown.y);
				}
				ptDown = { x: x, y: y };
			},

			// Mouse up handler at end of drag
			// @param {Event} e Mouse event down
			mouseUp = function (e) {
				document.removeEventListener('mousemove', mouseMove, false);
				document.removeEventListener('mouseup', mouseUp, false);
				ptDown = null;

			},

			// Mouse down handler at start of drag
			// @param {Event} e Mouse event down
			mouseDown = function (e) {
				mouseMove(e);
				document.addEventListener('mousemove', mouseMove, false);
				document.addEventListener('mouseup', mouseUp, false);
				self.syncControls.onButtonAction('player', panel);
				if (e.preventDefault) {
					e.preventDefault();
				}
				return false;
			},

			// Handler when touch moves. Only one touch is allowed
			// @param {Event.Touches} e Moved events
			touchMove = function (e) {
				//**TODO** Consider implementing two-touch zooming
				if (e.touches.length === 1) {
					mouseMove(e.touches.item(0));
				}
				e.preventDefault();
				return false;
			},

			// Handler when touches end
			touchEnd = function (e) {
				document.removeEventListener('touchmove', touchMove, false);
				document.removeEventListener('touchend', touchEnd, false);
				ptDown = null;
			},

			// Handler for touch start
			// @param {Event.Touches} e Touch event down
			touchStart = function (e) {
				mouseMove(e.touches.item(0));
				document.addEventListener('touchmove', touchMove, false);
				document.addEventListener('touchend', touchEnd, false);
			},

			// Create a zoom in or out button
			// @param {string} className Class to assign to button (for css positioning)
			// @param {string} t Button sprite type reference
			// @param {number} dscale Scale factor when clicked
			createZoomButton = function (className, t, dscale) {
				$('<button>')
					.attr('t', t)
					.addClass('ac-panel-zoom-button')
					.addClass('ac-drawbar-sprite')
					.addClass('ac-button-' + className)
					.click(function (e) {
						self.adjustPanelAlignment(panel, 0.0, 0.0, dscale);
						e.preventDefault();
						e.stopPropagation && e.stopPropagation();
						return false;
					})
					.appendTo(panelContainer);
			};


		if (attach) {
			createZoomButton('zoom-in', 'zmin', 1.05);
			createZoomButton('zoom-out', 'zout', 1/1.05);
			panelContainer.onmousedown = mouseDown;
			panelContainer.ontouchstart = touchStart;
		} else {
			$('.ac-panel-zoom-button', panelContainer).remove();
			panelContainer.onmousedown = null;
			panelContainer.ontouchstart = null;
		}
	},


	// Adjust panel parameters when in align mode
	// @param {string} panel Left or right panel
	// @param {number} dx, dy (pixel) Distance mouse has moved
	// @param {number=} dscale Scale factor for zoom level
	adjustPanelAlignment: function (panel, dx, dy, dscale) {
		var scale,
			panelContainer = $(this.panelContainer[panel]),
			videoObj = this.videoObj[panel],
			video = videoObj.getDomElement(),
			vidWid = videoObj.getWidth(),
			vidHig = videoObj.getHeight(),
			zoom = this.zoom[panel],

			// Constrained translation
			// @param {number} x0 (fractional) Current / initial translation
			// @param {number} dx (pixel) Translation displacement
			// @param {number} vidWid (pixel) Size of inner video
			// @param {number} outWid (pixel) Size of outer container
			constrained = function (x0, dx, vidSize, outSize) {
				var
					xmax = (vidSize - outSize)/2,
					xmin = -xmax,
					x = x0 * vidSize + dx;
				if(vidSize > outSize) {
					x = x < xmin ? xmin : x > xmax ? xmax : x;
				} else {
					x =0;
				}
				return x / (vidSize || 1);
			};

		if (dscale) {
			vidWid /= zoom.scale;
			vidHig /= zoom.scale;
			scale = zoom.scale * dscale;
			scale = scale < 1.0 ? 1.0 : scale > 2.0 ? 2.0 : scale;
			zoom.scale = scale;
			vidWid *= zoom.scale;
			vidHig *= zoom.scale;
		}
		zoom.left = constrained(zoom.left, -dx || 0, vidWid, panelContainer.width());
		zoom.top = constrained(zoom.top, -dy || 0, vidHig, panelContainer.height());
		this.resizeTool();
	}
};

// Safari 5.1.9 on Mac OSX 10.6 Snow Leopard doesn't honor css
// display visibilities (none/initial). We here try to force the
// relevant items, mirroring the css but using explicity calls
// to show and hide. We cannot improve performance of video
// layouts (sidebyside, topbottom, etc) because none of the
// browsers respond correctly.
// @param {jQuery.HTMLDivElement} $top Wrapper element with mode attributes and .analysisControl class
AnalysisTool.forceVisibilities = function ($top) {
	if ($top === undefined || $top.length <= 0) {
		throw new Error('this_is_an_error.throwme = 3');
	}
	var mode = $top.attr('align-mode'),   // 'draw'|'align'
		sync =  $top.attr('sync-panel'),    // 'left'|'right'|'both' during mode=align
		state = $top.attr('state'),        // 'wait'|'pause'|'play'
		view =  $('.ac-viewwrapper', $top).attr('view');           // 'sidebyside' etc.

	//---Align---
	$('.ac-sync-controls                         ', $top).toggle(mode === 'align');
	$('canvas.ac-canvas-draw                     ', $top).toggle(mode === 'align');
	$('canvas.ac-canvas-scratch                  ', $top).toggle(mode === 'align');

	$('.ac-video-controls .ac-leftvideo-controls ', $top).toggle(mode === 'align' && sync === 'left');
	$('.ac-video-controls .ac-rightvideo-controls', $top).toggle(mode === 'align' && sync === 'right');
	$('.ac-video-controls .ac-bothvideo-controls ', $top).toggle(mode === 'draw' || sync === 'both');

	$('.ac-viewleft', $top).css({ opacity: mode === 'align' && sync === 'right' ? '0.3' : '' });
	$('.ac-viewright', $top).css({ opacity: mode === 'align' && sync === 'left' ? '0.3' : '' });

	//---Draw---
	$('.ac-draw-controls                         ', $top).toggle(mode !== 'align');
	$('canvas.ac-canvas-draw                     ', $top).toggle(mode !== 'align');
	$('canvas.ac-canvas-scratch                  ', $top).toggle(mode !== 'align');

	//---Play---
	$('.ac-button.ac-button-download             ', $top).toggle(state === 'wait');
	$('.ac-button.ac-button-playpause            ', $top).toggle(state === 'pause');
	$('.ac-button.ac-button-pause                ', $top).toggle(state === 'play');
};



function dualAnalysisTool(options) {
	var settings = options;
	var tool = {};
	this.render = function () {

		tool = new AnalysisTool.DualControl(settings);
		tool.setCaptureCallback(settings.onImageUploadedCallback);
		tool.render();
		tool.loadvideos(settings.mediaUrl[0], settings.mediaUrl[1], settings.mediaUrl[2], settings.mediaUrl[3], 25);
		return this;
	};

	this.captureImage = function (useRegion) {
		tool.captureImage(useRegion);
	};

	this.setState = function (state) {
		tool.setState(state);
	};

	this.getState = function () {
		return tool.getState();
	};

	this.setCaptureCallback = function (fnCallback) {
		tool.setCaptureCallback(fnCallback);
	};

	this.loadMedia = function (newMedia) {
		tool.loadvideos(newMedia[0], newMedia[1], newMedia[2], newMedia[3], 25);
	};

	this.showImage = function (id) {
		tool.showImage(id);
	};

	this.hideImage = function () {
		this.showImage(null);
	};

	this.clearDrawings = function () {
		tool.clearDrawings();
	};

	this.on = function (type, fn, uid) {
		tool.on(type, fn, uid);
		return this;
	};

	return this;

};