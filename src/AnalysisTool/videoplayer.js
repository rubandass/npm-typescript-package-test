import './events';
import { $, AnalysisTool } from './shim';
export { };

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Video Player
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.VideoPlayer = function ($container, leftOrRight) {

	this.className = 'ac-video-' + leftOrRight;// + '-' + this.id;

	this.container = $container;
	this.domElement = document.createElement('video');
	this.domElement.crossOrigin = 'anonymous';

	this.domImage = document.createElement('img');
	this.el = this.domElement;
	this.$ = $(this.el);
	this.srcUrl = null;
	this.FPS = 25;
	this.mediaWidth = 0;		// Dimensions loaded..
	this.mediaHeight = 0;   //..from media info call.
	this.posterWidth = 0;
	this.posterHeight = 0;
	this.stepTimerId = 0;
	this.startingHeight = 0;
	this.startingWidth = 0;
	this.videoParams = {};
	this.isFlipped = false;
	this.isSinglePlayerOnly = (leftOrRight === 'single');
	this.loop = false;
	this.playSlowMotion = false;
	this.canPlay = false;
	this.isPlaying = false;
	this.useDomElement = this.domElement; // use video or static image

	this.eventListeners = {
		loadedmetadata: [],    // <video> Media meta data has been loaded.
		loadstart: [],         // <video> Load start event
		progress: [],          // <video> Media download progress
		canplay: [],           // <video> Media has been buffered and can play.
		timeupdate: [],        // <video> Time changed during play or seek.
		ended: [],             // <video> Play ended.
		error: [],             // <video> Error event
		mediatype: []          // (Custom) Media type image or video
	};
};

AnalysisTool.VideoPlayer.gVidCounter = 0;

// Over-step when seeking to a specific video frame.
AnalysisTool.VideoPlayer.frameRoundoff = 0.05; // {number} Fractional frame to step over.

AnalysisTool.VideoPlayer.prototype = $.extend(new AnalysisTool.Events(), {
	fireMetaLoaded: function () {
		this.videoParams = {
			naturalWidth: this.getWidth(),
			naturalHeight: this.getHeight(),
			duration: this.domElement.duration,
			fps: this.FPS
		};
		this.fireEvent('loadedmetadata', this.videoParams);
	
	},
	fireProgress: function () {
		this.fireEvent('progress', this.domElement);
	},
	fireCanplay: function () {
		this.startingHeight = this.domElement.clientHeight;
		this.startingWidth = this.domElement.clientWidth;
		this.fireEvent('canplay', this.domElement.duration);
	},

	fireTimeupdate: function () {
		var currentTime = this.domElement.currentTime;
		this.fireEvent('timeupdate', currentTime);
	},
	fireEnded: function () {
		this.fireEvent('ended');
	},
	fireMediaType: function () {
		this.fireEvent('mediatype', this.getDomElementType());
	},

	getWidth: function () {
		if (this.getDomElementType() === 'img') {
			return +this.domImage.getAttribute('data-poster-width');
		} else {
			return this.domElement.videoWidth || this.mediaWidth || this.posterWidth;
		}
	},

	getHeight: function () {
		if (this.getDomElementType() === 'img') {
			return +this.domImage.getAttribute('data-poster-height');
		} else {
			return this.domElement.videoHeight || this.mediaHeight || this.posterHeight;
		}
	},

	render: function () {
		this.domElement.setAttribute('id', this.className + AnalysisTool.VideoPlayer.gVidCounter++);
		this.domElement.setAttribute('class', this.className);
		this.domElement.setAttribute('type', 'video/mp4; codecs=avc1.42E01E, mp4a.40.2');
		this.addHandlers();
		this.container.append(this.$);
		this.domImage.setAttribute('class', this.className + '-static');
		this.container.append(this.domImage);
	},

	addHandlers: function () {
		var self = this,
			domElement = this.domElement;
		domElement.addEventListener('loadedmetadata', function (e) {
			self.fireMetaLoaded();
		}, false);

		domElement.addEventListener('timeupdate', function (e) {
			self.fireTimeupdate();
		}, false);

		domElement.addEventListener('canplay', function (e) {
			// Firefox fires canplay on every seek (!) so only allow first time
			if (self.canPlay === false) {
				self.canPlay = true;
				self.fireCanplay(e);
			}
		}, false);

		domElement.addEventListener('ended', function (e) {
			self.fireEnded();
		}, false);

		domElement.addEventListener('progress', function (e) {
			self.fireProgress();
		}, false);
		domElement.addEventListener('loadstart', function (e) {
			self.fireEvent('loadstart');
		});
		domElement.addEventListener('error', function (e) {
			self.fireEvent('error');
		});
	},

	// Called to toggle the play state, e.g. from an interface
	// button. Includes a switchyard to check whether normal
	// or slow motion should be played.
	// This function uses low-level access to video element's
	// properties and methods, no external handlers are called
	// from here.
	//              domElement     this          this.
	//               .paused    .isPlaying  playSlowMotion
	//   ---------- ----------- ----------- --------------
	//   Paused        true        false     (true|false)
	//   Playing       false       true         false
	//   Slow Play     true        true         true
	// @param {boolean=} play Set to TRUE to play, FALSE to pause, or undefined to toggle
	playpause: function (play) {
		var self = this,
			$analysisControl = this.container.closest('.analysisControl');

		play = play !== undefined ? play : !this.isPlaying;

		//---Stop Slow Motion Timer---------------
		if (this.stepTimerId > 0) {
			clearInterval(this.stepTimerId);
			this.stepTimerId = 0;
		}

		if (this.playSlowMotion) {
			//---Slow Motion-----------------------
			if (play) {
				if (this.domElement.currentTime >= this.domElement.duration) {
					this.domElement.currentTime = 0.02;
				}
				this.stepTimerId = setInterval(function () {
					self.step(+1, true);
				}, 400);
			}

		} else {
			//---Normal Speed-----------------------
			if (play) {
				this.domElement.play();
			} else {
				this.domElement.pause();
			}
		}

		this.isPlaying = play;
		if ($analysisControl.attr('state') !== 'wait') {
			$analysisControl.attr('state', this.isPlaying ? 'play' : 'pause');
			AnalysisTool.forceVisibilities($analysisControl);
		}
	},

	// @param {number} n Time to seek to, which is here rounded to nearest frame time.
	// @param {boolean} roundToNearestFrame Value indicating whether to round position to nearest frame. Default is TRUE; set to FALSE e.g. in Dual Analysis tool.
	seek: function (t, roundToNearestFrame) {
		if (this.canPlay) {
			if (roundToNearestFrame === false) {
				this.domElement.currentTime = t;
			} else {
				// Round to the nearest frame.
				t = (Math.floor(t * this.FPS) + AnalysisTool.VideoPlayer.frameRoundoff) / this.FPS;
				this.domElement.currentTime = t;
			}
		}
	},

	/**
	 * @param {string} srcUrl Address of video media to load
	 * @param {string} thumbUrl Address of poster frame to load
	 * @param {number=} fps Video frame rate
	 * @param {function=} complete Function to call when thumbnail dims have loaded, e.g. to resize tool
	 */
	load: function (srcUrl, thumbUrl, fps, complete) {
		/**
		 * Load into image element in case it's not a movie.
		 * The execution  flow used to rely on attempting to
		 * load the "video" into the image.
		 * The problem is that Safari, bless it, now happily
		 * loads videos into image tags, so that  the onload
		 * event fires for  the image even  when the  loaded
		 * media is actually a video.
		 * Instead, we'll try the video first  and the  image
		 * second:
		 * 1. Load the  srcUrl into the  <video> element.
		 * 2. Load the  thumbnail as  the poster image.  This
		 *    will usually  result in the <video>  element at
		 *    least showing the  poster frame.  The thumbnail
		 *    is also  loaded separately as an Image  to read
		 *    its dimensions  and use that as an estimate for
		 *    the video dimensions.
		 * 3. If the  media is not  a valid video, the  video
		 *    element  will throw a MediaError  with  message
		 *    Unsupported source type.
		 * 4. At this point, attempt to load the source  into
		 *    the image element.
		 * 5. If the image loads, the onload event will fire,
		 *    so we continue with the image.
		 * 6. In both cases, the complete function is assumed
		 *    to reposition  the <img> or <video> dom element
		 *    returned by getDomElement() as though  the tool
		 *    was just resized.
		 * @param {Event?} e Optional error event.  The event
		 * handler is removed in all cases.
		 */
		const imageFallback = (e) => {
			this.domElement.removeEventListener('error', imageFallback);
			if (e && e.target.error && e.target.error.constructor === MediaError) {
				this.domImage.onload = function () {
					this.onload = null;
					$(self.domElement).hide();
					this.setAttribute('data-poster-width', this.width);
					this.setAttribute('data-poster-height', this.height);
					$(this).show();
					self.useDomElement = self.domImage;
					complete && complete();
					self.fireMetaLoaded();
					self.fireMediaType();
				};
				this.domImage.src = srcUrl;
			}
		};
		
		this.playpause(false);
		if (srcUrl.length <= 0) return;
		if (srcUrl === this.srcUrl) {
			// To prevent gaps when resetting the tool without changing
			// the media, we don't modify the <video>'s src. The callbacks
			// need to be deferred here to work properly
			setTimeout((function (self) {
				return function (e) {
					complete && complete();
					self.fireMetaLoaded();
					self.fireCanplay();
					self.fireTimeupdate();
				};
			}(this)), 100);
		} else {
			this.srcUrl = srcUrl;
			this.canPlay = false;
			this.useDomElement = this.domElement; // assume video unless find otherwise
			this.domElement.addEventListener('error', imageFallback);
			this.domElement.addEventListener('canplay', imageFallback);
			this.domElement.setAttribute('poster', thumbUrl);
			this.domElement.setAttribute('src', srcUrl);
			this.domElement.setAttribute('video-frame-rate', fps);
			if (srcUrl.substr(-3, 3) === 'ebm') {
				this.domElement.setAttribute('type', 'video/webm; codecs=vp8, vorbis');
			} else {
				this.domElement.setAttribute('type', 'video/mp4; codecs=avc1.42E01E, mp4a.40.2');
			}

			// Load the poster frame as an image and set dimensions
			// attributes on the video element. This allows the
			// resize function to determine an approximate size on
			// iPad, where the video's poster frame doesn't resize
			// the video element.
			// Note: The thumbnail may not exist or be omitted
			var self = this,
				img = new Image();
			img.onload = function () {
				self.posterWidth = this.width;
				self.posterHeight = this.height;
				complete && complete();
			};
			img.src = thumbUrl;

			$(this.domElement).show();
			$(this.domImage).hide();
		}
	},

	// Retrieve the dom element to use.
	// @returns {HTMLVideoElement|HTMLImageElement} Video or static image element.
	getDomElement: function () {
		return this.useDomElement;
	},

	// Determine if the tool is using the video element or static image.
	// @returns {string} 'video'|'img' Currently visible element type
	getDomElementType: function () {
		return this.useDomElement === this.domElement ? 'video' : 'img';
	},

	// Set the media dimensions if known from caller,
	// e.g. retrieved from media info call.
	// @param {number=} fps Frame rate
	// @param {number=} width, height Dimensions to set
	setMediaDimensions: function (fps, width, height) {
		this.FPS = fps;
		if (width) this.mediaWidth = width;
		if (height) this.mediaHeight = height;
		this.domElement.setAttribute('video-frame-rate', fps);
	},

	// Retrieve the current time on the video element
	// @return {number} Current time of video element
	currentTime: function () {
		return this.domElement.currentTime.toFixed(3) * 1;
	},

	// Retrieve the duration of the video element.
	// @returns {number} Duration of video element.
	duration: function () {
		return this.domElement.duration.toFixed(3) * 1;
	},

	// Step the video by a single step. This is called both from
	// the step button event handlers, and from slowMotion interval
	// @param {number} dir (frames - approx.) Step direction
	// @param {boolean=} asSlowMotion Set to TRUE during slow motion steps to keep playing
	step: function (dir, asSlowMotion) {
		var t, fr,
			spf = 1 / this.FPS; // {number} (s) Seconds per frame for step calculation.

		// Stop play through on button click.
		if (!asSlowMotion && this.isPlaying) {
			this.playpause(false);
		}

		// Calculate next frame time.
		// We want to try to prevent roundoff errors. Since this
		// is a numerical artefact, we have to divide by the FPS
		// reciprocal, rather than multiplying.
		t = this.domElement.currentTime; // {number} (s) Current video time.
		fr = Math.floor(t / spf);        // {number} Corresponding current frame number.
		t = (fr + dir + AnalysisTool.VideoPlayer.frameRoundoff) * spf;     // Take a time step in the requested direction, plus a squidge for roundoff errors.

		this.domElement.currentTime = t;

		if (asSlowMotion) {
			if (t >= this.domElement.duration || t <= 0) {
				this.playpause(false);
				if (this.loop) {
					this.playpause(true);
				} else {
					this.fireEnded(null);
				}
			}
		}
	},

	flip: function (flipVideo) {
		if (flipVideo) {
			this.useDomElement.setAttribute('flip', 'true');
		} else {
			this.useDomElement.removeAttribute('flip');
		}
		this.isFlipped = flipVideo;
	},

	setLoop: function (val) {
		this.loop = val;
	},

	setSlowMotion: function (val) {
		var wasPlaying = this.isPlaying;
		if (wasPlaying) {
			this.playpause();
		}

		this.playSlowMotion = val;

		if (wasPlaying) {
			this.playpause();
		}
	},

	setMute: function (val) {
		//this.$.attr('muted', val);
		this.domElement.muted = val;
		$(this.domElement).prop('muted', val);

	}
});


/* End video player */



