/* eslint-disable no-undef, no-unused-expressions, no-mixed-operators, no-unused-vars, eqeqeq, no-sequences, no-extend-native, getter-return, new-parens, no-useless-escape, no-template-curly-in-string, no-redeclare, no-script-url */
import jQuery from './jquery-1.8.2';
const $ = jQuery;

/* #######################################################
## Utilities
## Class to manage utility functions such as debugging
## and displaying media content across browsers
####################################################### */
const Utilities = new function () {
	// this.Guid = {
	// 	Empty: '00000000-0000-0000-0000-000000000000'
	// };

	// Value TRUE if the browser is one of the iDevice types
	// that have limited functionality
	this.isIPadBrowser = (
		(navigator.userAgent.indexOf('iPhone') != -1)
		|| (navigator.userAgent.indexOf('iPod') != -1)
		|| (navigator.userAgent.indexOf('iPad') != -1))
		? true : false;

	// Value TRUE if on iPhone
	this.isIPhoneBrowser = (
		(navigator.userAgent.indexOf('iPhone') != -1)
	) ? true : false;

	// // Value indicating whether the device is similar to a touch device.
	// // See http://stackoverflow.com/a/4819886.
	// this.isTouchDevice =
	// 	'ontouchstart' in window        // works on most browsers 
	// 	|| navigator.maxTouchPoints;    // works on IE10/11 and Surface

	this.iOSVersion = (function (ua) {
		var v;
		if (!/iP(hone|od|ad)/.test(ua)) {
			return null;
		}
		v = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
		return v ? [+v[1], +v[2], +(v[3] || 0)]
			: null;
	}(navigator.userAgent));

	// this.ieBrowser = function () {
	// 	var agent = navigator.userAgent, // {string} Browser user agent.
	// 		indx = agent.indexOf('MSIE'); // {number} Index of version string in user agent.
	// 	return indx < 0 ? false : parseFloat(agent.substring(indx + 4));
	// };

	this.isSafari = (function (ua) {
		return (/Safari/.test(ua) || /AppleWebKit/.test(ua)) && !/Chrome/.test(ua);
	}(navigator.userAgent));

	//===Safe Log function=================================
	this.log = function (strLog) {
		if ((typeof (console) != 'undefined') && (typeof (console.log) == 'function')) console.log(strLog);
	};

	//===Sizing to Constrain============================
	// this.constrainSize = function (dimsIn, maxDim) {
	// 	var dims = { width: dimsIn.width, height: dimsIn.height };
	// 	if (dims.width < 1) dims.width = 1;
	// 	if (dims.height < 1) dims.height = 1;
	// 	if (dims.width / maxDim.width > dims.height / maxDim.height) {
	// 		dims.height = dims.height * maxDim.width / dims.width;
	// 		dims.width = maxDim.width;
	// 	} else {
	// 		dims.width = dims.width * maxDim.height / dims.height;
	// 		dims.height = maxDim.height;
	// 	}
	// 	dims.width = Math.floor(dims.width);
	// 	dims.height = Math.floor(dims.height);
	// 	return (dims);
	// };

	// //===Date Parsing===================================
	// // This function takes strings of the form
	// //
	// //    "/Date(1297119000277+1200)/"
	// //    "/Date(1297119000277)/"
	// // or        1297119000277+1200
	// // or        1297119000277
	// //
	// // and converts them to a date object
	// // (Originally developed in TheZoneCode.js)
	// this.convertDateTime = function (strDateTime) {
	// 	var date;                             // returned date structure
	// 	var parts;
	// 	var iDate = 0;                        // date time, in ms
	// 	var iTimezone = 0;                    // timezone offset, in minutes

	// 	if (!strDateTime) {
	// 		return new Date(); // Null date - return today.

	// 		//---Format: 1297119000277--------------------------
	// 	} else if (typeof (strDateTime) == 'number') {
	// 		iDate = strDateTime;

	// 		//---Format: /Date(1297119000277+1200)/----------
	// 		//           ^     ^  (UTC ms)   ^ ^ ^
	// 		//           1     2             3 4 5
	// 		//---Format: 1297119000277+1200------------------
	// 		//           ^             ^ ^
	// 		//           2             3 4
	// 	} else if ((parts = strDateTime.match(/^(\/Date\()?(-?\d+)([+\-]\d{2})(\d{2})(\)\/)?$/)) != null) {
	// 		// We don't need to offset for the +1200, because the
	// 		// numerical value is already in UTC time.
	// 		iDate = parseInt(parts[2], 10);

	// 		//---Format: /Date(1297119000277)/----------
	// 		//           ^     ^            ^
	// 		//           1     2            3
	// 	} else if ((parts = strDateTime.match(/^(\/Date\()?(-?\d+)(\)\/)?$/)) != null) {
	// 		iDate = parseInt(parts[2], 10);
	// 	} else {
	// 		iDate = parseInt(strDateTime, 10);     // try the best we can
	// 	}
	// 	date = new Date(iDate);
	// 	return (date);
	// };

// 	/** ******************************************************
// 	* Return formatted, using the Localize key if available.
// 	* The 0 plural specifies the format; subsequent plurals
// 	* the months if they differ from English. The 13 plural
// 	* specifies the am|pm codes separated by a pipe (|).
// 	* Alternatively the format can be passed in directly.
// 	* Available codes:
// 	*         [...] - removed if time not shown
// 	*    ${H} / ${HH} - 24 hour
// 	*    ${h} / ${hh} - 12 hour
// 	*         ${ampm} - replaced with am / pm
// 	*    ${m} / ${mm} - minute digit
// 	*    ${d} / ${dd} - day digit
// 	*    ${n} / ${nn} - month digit
// 	*          ${NNN} - month abbrevition from class
// 	* ${yy} / ${yyyy} - short / long year
// 	* @param {Date} date Date to process
// 	* @param {boolean=} tfnoShowTime Set to TRUE to hide the time component [..]
// 	* @param {string=} fmt Fixed input format using codes, e.g. ${yyyy}-${nn}-${dd}
//   * @returns {string} formatted date string.
// 	******************************************************* */
// 	this.dateTimeString = function (date, tfnoShowTime, fmt) {
// 		var pad = function (str, len) {
// 			str = str.toString();
// 			while (str.length < len) {
// 				str = "0" + str;
// 			}
// 			return str.substring(str.length - len, len);
// 		},
// 			dateFormat = $.extend({
// 				0: "[${hh}:${mm}${ampm}, ]${dd}-${NNN}-${yyyy}",
// 				1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
// 				7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
// 				13: "am|pm"
// 			}, Localize.dict["${dateFormat}"]),
// 			H = date.getHours(),
// 			ampm = (dateFormat[13] || "am|pm").split("|")[H >= 12 ? 1 : 0],
// 			h = H === 0 ? 12 : H > 12 ? H - 12 : H,
// 			m = date.getMinutes(),
// 			d = date.getDate(),
// 			n = date.getMonth() + 1,
// 			yyyy = date.getFullYear(),
// 			hh = pad(h, 2),
// 			HH = pad(H, 2),
// 			mm = pad(m, 2),
// 			dd = pad(d, 2),
// 			nn = pad(n, 2),
// 			yy = pad(yyyy, 2);

// 		return (typeof fmt === 'string' ? fmt : dateFormat[0])
// 			.replace(/\[([^\]]+)\]/, tfnoShowTime ? "" : "$1") // remove time
// 			.replace(/\$\{HH\}/g, HH)
// 			.replace(/\$\{H\}/g, H)
// 			.replace(/\$\{hh\}/g, hh)
// 			.replace(/\$\{h\}/g, h)
// 			.replace(/\$\{ampm\}/g, ampm)
// 			.replace(/\$\{mm\}/g, mm)
// 			.replace(/\$\{m\}/g, m)
// 			.replace(/\$\{dd\}/g, dd)
// 			.replace(/\$\{d\}/g, d)
// 			.replace(/\$\{nn\}/g, nn)
// 			.replace(/\$\{n\}/g, n)
// 			.replace(/\$\{NNN\}/g, dateFormat[n])
// 			.replace(/\$\{yyyy\}/g, yyyy)
// 			.replace(/\$\{yy\}/g, yy);
// 	};

// 	/** ***************************************************
// 	* Format a (localized) time in the past to how long ago.
// 	* @param {Date} date Date (in same time zone as browser?!) to compare to.
// 	* @param {Date=} referenceDate Date to compare to (uses NOW if omitted).
//   * @returns {string} Formatted string.
// 	**************************************************** */
// 	this.dateTimeAgo = function (date, referenceDate) {
// 		var now = referenceDate || new Date(),
// 			s = Math.floor((now - date) / 1000),  // {number} (s) Number of seconds ago
// 			m = Math.floor(s / 60),    // {number} (min) Minutes ago
// 			h = Math.floor(m / 60),    // {number} (hr) Hours ago
// 			// Beyond a day, want to say 'yesterday' if the comment was made
// 			// at 10 p.m. and we're viewing it at 10 a.m. the next morning.
// 			d = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate())
// 				- new Date(date.getFullYear(), date.getMonth(), date.getDate())) / (1000 * 60 * 60 * 24)),
// 			w = Math.floor(d / 7),     // {number} Number of weeks ago
// 			n = Math.floor(d / 30),    // {number} Months ago
// 			y = Math.floor(d / 365);   // {number} Years ago
// 		return y >= 1 ? Utilities.dateTimeString(date, true) : ////Localize('@time:{0} years ago', y) :
// 			n >= 1 ? Localize('@time:{0} months ago', n) :
// 				w >= 1 ? Localize('@time:{0} weeks ago', w) :
// 					d >= 1 ? Localize('@time:{0} days ago', d) :
// 						h >= 1 ? Localize('@time:{0} hours ago', h || 1) :
// 							m >= 1 ? Localize('@time:{0} minutes ago', m) :
// 								Localize('@time:Just now');
// 	};

	// /** ***************************************************
	// * Try parsing a date explicitly.
	// * In Internet Explorer 8, new Date(...) is a bit
	// * picky, so we'll try to parse it here.
	// * @param {string} dateString The string to be parsed as a date
	// * @return {Date} The parsed date, or NaN
	// **************************************************** */
	// this.parseDate = function (dateString) {
	// 	var d = NaN, parts = [], dates = null;
	// 	if (dateString && typeof dateString === 'string') {
	// 		// Format yyyy-mm-dd or yyyy/mm/dd
	// 		if ((parts = dateString.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/)) !== null) {
	// 			dates = {
	// 				year: +parts[1],
	// 				month: +parts[2],
	// 				day: +parts[3]
	// 			};

	// 			// -- everything else is murky becauses of the day / month order --
	// 			//	// Format xx/xx/yyyy or xx-xx-yyyy or xx.xx.yyyy
	// 			//} else if ((parts = dateString.match(/^(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{4})/)) !== null) {
	// 			//	if ((12 >= parts[1] && 12 >= parts[2] && formatUS === true) // ambiguous, force US
	// 			//		|| (12 >= parts[1] && 12<parts[2] && 31 >= parts[2])) {// mm-dd-yyy
	// 			//		dates = {
	// 			//			year: +parts[3],
	// 			//			month: +parts[1],
	// 			//			day: +parts[2]
	// 			//		};
	// 			//	} else if (31 >= parts[1] && 12 >= parts[2]) {
	// 			//		dates = {
	// 			//			year: +parts[3],
	// 			//			month: +parts[2],
	// 			//			day: +parts[1]
	// 			//		};
	// 			//
	// 			//	}
	// 		}
	// 	}
	// 	if (dates !== null
	// 		&& 12 >= dates.month
	// 		&& 31 >= dates.day) {
	// 		d = new Date(dates.year, dates.month - 1, dates.day);
	// 		d = new Date(d.valueOf() - d.getTimezoneOffset() * 60 * 1000);
	// 	}
	// 	return d;
	// };

	// /** ***************************************************
	// * Format a number to its needed decimal places.
	// * @param {number} value Value to format.
	// * @param {number} dp Maximum number of decimal places.
	// * @returns {string} Formatted number.
	// **************************************************** */
	// this.toDecimalString = function (value, dp) {
	// 	var k, str = value.toFixed(dp);
	// 	for (k = str.length - 1; k > 0 && (str[k] === '0' || str[k] === '.'); k -= 1) {
	// 		if (str[k] === '0') {
	// 			str = str.substring(0, k);
	// 		} else if (str[k] === '.') {
	// 			return str.substring(0, k);
	// 		}
	// 	}
	// 	return str;
	// };

	/** ***************************************************
	* String format command similar to c#.
	* @param {string} str String containing placeholders {0}, ...
	* @param {...} args Additional arguments to substitute.
	* @returns {string} Formatted string.
	**************************************************** */
	this.stringFormat = function (str, args) {
		args = [].slice.call(arguments, 1); // {Array<...>} Arguments as array.
		return str.replace(/\{(\d+)\}/g, function (m, k) {
			return args[k];
		});
	};

	/**
	* Create a URL formatted for a REST2 controller. For example, both
	*    rest2('media', 'profile', 'jpg', 0)
	* and
	*    rest2('media/profile', 'jpg', 0)
	* yield the URL
	*    "/rest2/media/profile/jpg/0/profile"
	* Note the method name at the end of the URL, after the last slash.
	* @param {string} controller Name of controller to call, optionally including the method.
	* @param {string} method Name of controller method to call.
	* @param {...} args Additional arguments passed to the controller.
	* @returns {string} Formatted URL string.
	*/
	this.rest2 = function rest2(controller, method, args) {
		var args = arguments[0].split('/').concat(Array.prototype.slice.call(arguments, 1));
		return [''].concat('rest2', args, args[1]).join('/');
	};

	// this.brackenApi = function brackenApi(url, args) {
	// 	var args = arguments[0].split('/').concat(Array.prototype.slice.call(arguments, 1));
	// 	return [''].concat('bracken', args).join('/');
	// };

	// //===Play All-In-One Video Player======================
	// // Modified to play HTML5 mp4 if possible, or Flash if
	// // not. Silverlight is no longer used as a fallback,
	// // it must be explicitly requested, e.g. if the video
	// // is a WMV.
	// //
	// // @param {string} id
	// //    ID of element to write into
	// // @param {string} url
	// //    Url of video. Has server.baseUrl added
	// // @param {number} wid
	// //    Width of player
	// // @param {number} hig
	// //    Height of player
	// // @param {object<string>:<boolean>} options
	// //    { 
	// //        autoPlay: {boolean}
	// //        loop: {boolean}
	// //        controls: {boolean}
	// //        muted: {boolean}
	// //        thumb: {string} Url of image for background (only HTML5, wid and hig must be supplied)
	// //    }
	// //    Not all of these are supported on all players
	// // @param {string} method
	// //    (IGNORED) no longer used. 'silverlight' or ignored
	// // @param {boolean} forceReload
	// //   If TRUE, append random parameter to url to force
	// //   the video to reload
	// this.videoPlayer = function (id, url, wid, hig, options, method, forceReload) {
	// 	var video, anchor, w, h,              // video element
	// 		str = "",                          // string written into div
	// 		mediaFragment = /#t=([\d.]+),([\d.]+)/.exec(url), // {Array<string>?} Match media fragment #t=1.234,5.678
	// 		el = document.getElementById(id),  // containing element

	// 		// Attach event handlers to a VIDEO element for the
	// 		// given start and end times of a media fragment.
	// 		// @param {HTMLVideoElement} vid Video element where to attach.
	// 		// @param {number} startTime Starting time of fragment to play.
	// 		// @param {number} endTime Ending time of fragment.
	// 		attachFragmentHandlers = function (vid, startTime, endTime) {
	// 			if (vid && !isNaN(startTime) && !isNaN(endTime)) {
	// 				vid.addEventListener('play', function () {
	// 					if (this.currentTime > endTime) {
	// 						this.currentTime = startTime; // Rewind when playing beyond fragment
	// 					}
	// 				}, false);

	// 				vid.addEventListener('timeupdate', function () {
	// 					if (this.currentTime < startTime - 0.5) {
	// 						this.currentTime = startTime; // Skip iPad to start of play once playing
	// 					} else if (this.currentTime > endTime) {
	// 						this.pause();                 // Pause beyond end of fragment
	// 					}
	// 				}, false);
	// 			}
	// 		};

	// 	//---Parameters-----------------
	// 	options = options || {};              // options if not defined
	// 	if (forceReload == true) {            // randomize url
	// 		url += ((url.match(/\?/) != null) ? '&' : '?') + 'r=' + Math.round(1e6 * Math.random());
	// 	}

	// 	//---Prepare------------------------------
	// 	el.innerHTML = "";                    // remove existing content
	// 	if (typeof wid === 'number') {
	// 		el.style.width = wid + 'px';
	// 	}
	// 	if (typeof hig === 'number') {
	// 		el.style.height = hig + 'px';
	// 	}

	// 	//===HTML 5=========================================
	// 	//---Play / Pause-------------------------
	// 	function localTogglePlay(e) {
	// 		var v = (e = e || window.event).target || e.srcElement;
	// 		if (v.paused || v.ended) {
	// 			v.play();
	// 		} else {
	// 			v.pause();
	// 		}
	// 	}

	// 	//---Create-------------------------------
	// 	if (this.canPlayHtml5MP4()) {
	// 		video = document.createElement('video');
	// 		////video.style.position = 'relative'; // Remove this because it breaks full screen mode. Was added 25-nov-2013 for "Wizard selector in Bracken, edit and learner modes."
	// 		if (typeof wid === 'number') {
	// 			video.setAttribute('width', wid);
	// 		}
	// 		if (typeof hig === 'number') {
	// 			video.setAttribute('height', hig);
	// 		}
	// 		video.setAttribute('class', 'video-js utilities-html5Video');

	// 		if (options.autoPlay === true) {
	// 			video.setAttribute('autoplay', 'autoplay'); // iPad doesn't support autoplay
	// 		}
	// 		if (options.loop === true) {
	// 			video.setAttribute('loop', 'loop');
	// 		}
	// 		if (options.muted === true) {
	// 			// Setting as attribute doesn't work, needs to be done on element.
	// 			// See https://stackoverflow.com/questions/14111917/html5-video-muted-but-stilly-playing
	// 			video.oncanplay = function () {
	// 				this.muted = "muted";
	// 			}
	// 		}
	// 		if (typeof options.poster === 'string') {
	// 			video.setAttribute('poster', options.poster);
	// 		}
	// 		if (typeof options.thumb === 'string' && typeof wid === 'number' && typeof hig === 'number') {
	// 			// This method is obsolete; use options.poster instead of options.thumb.
	// 			var img = new Image();
	// 			img.onload = function () {
	// 				var sx = this.width / (wid - 2),
	// 					sy = this.height / (hig - 2);
	// 				if (sx > 1 || sy > 1) {
	// 					w = Math.round(this.width / Math.max(sx, sy));
	// 					h = Math.round(this.height / Math.max(sx, sy));
	// 					this.width = w;
	// 					this.height = h;
	// 				}
	// 				if (el.style.position !== 'absolute' && el.style.position !== 'relative') {
	// 					el.style.position = 'relative';
	// 				}
	// 				img.style.position = 'absolute';
	// 				img.style.left = Math.round((wid - this.width) / 2) + 'px';
	// 				img.style.top = Math.round((hig - this.height) / 2) + 'px';
	// 			};
	// 			img.src = options.thumb;
	// 			el.appendChild(img);
	// 		}

	// 		if (!window.fullScreenApi) {
	// 			Utilities.createFullScreenApi();
	// 		}


	// 		video.addEventListener('dblclick', function (e) {
	// 			fullScreenApi.toggle((e = e || window.event).target || e.srcElement);
	// 		});

	// 		video.setAttribute('controlsList', 'nodownload');
	// 		if (options.controls !== false) {
	// 			video.setAttribute('controls', 'controls');
	// 			el.appendChild(video);
	// 		} else {
	// 			video.addEventListener('click', function (e) {
	// 				if (!fullScreenApi.is() && !video.hasAttribute('controls')) {
	// 					localTogglePlay(e);
	// 				}
	// 			});
	// 			video.addEventListener('touchstart', function (e) {
	// 				localTogglePlay(e);
	// 			});
	// 			anchor = document.createElement('a');
	// 			anchor.setAttribute('href', 'javascript:void(0)');
	// 			el.style.position = 'relative';
	// 			anchor.appendChild(video);
	// 			el.appendChild(anchor);

	// 			if (!Utilities.isIPadBrowser) {
	// 				video.addEventListener('loadstart', function () {
	// 					var loading = new Image();
	// 					loading.className = 'loading';
	// 					$(loading).css({
	// 						position: 'absolute',
	// 						left: '50%',
	// 						top: '40%',
	// 						background: 'none'
	// 					});
	// 					loading.onload = function () {
	// 						this.style.marginLeft = Math.round(-this.width / 2) + 'px';
	// 						this.style.marginTop = Math.round(-this.height / 2) + 'px';
	// 					};
	// 					loading.src = '/rest2/media/skinasset/LoadingSprite/LoadingSprite';
	// 					el.appendChild(loading);
	// 				});
	// 				video.addEventListener('canplay', function () {
	// 					$('.loading', el).remove();
	// 				});
	// 			}
	// 			video.addEventListener('error', function () {
	// 				var err = document.createElement('div');
	// 				$('.loading', el).remove();
	// 				err.className = 'error';
	// 				err.innerHTML = Localize('Error');
	// 				el.appendChild(err);
	// 			});
	// 		}

	// 		if (mediaFragment) {
	// 			attachFragmentHandlers(video, +mediaFragment[1], +mediaFragment[2]);
	// 		}

	// 		video.src = url;
	// 		return;
	// 	}

	// 	//===Live Flash Player==============================
	// 	// TODO: Flash can't resize its container, so set defaults here
	// 	wid = wid || 640;
	// 	hig = hig || 360;
	// 	str = '<param name="play" value="true" />'
	// 		+ '<param name="allowFullScreen" value="true" />'
	// 		+ '<param name="FlashVars" value="'
	// 		+ 'url=' + encodeURIComponent(url)
	// 		+ '&autoplay=' + (options.autoPlay === true ? 'true' : 'false')
	// 		+ '&loop=' + (options.loop === true ? 'true' : 'false')
	// 		+ '&muted=' + (options.muted === true ? 'true' : 'false')
	// 		+ '&controls=' + (options.controls !== false ? 'true' : 'false')
	// 		+ '" />';

	// 	el.innerHTML =
	// 		'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" '
	// 		+ 'width="' + wid + '" '
	// 		+ 'height="' + hig + '" '
	// 		+ 'align="middle">'
	// 		+ '<param name="movie" value="' + this.flashPlayerUrl + '" />'
	// 		+ str
	// 		+ '<!--[if !IE]>-->'
	// 		+ '<object name="movie2" type="application/x-shockwave-flash" data="' + this.flashPlayerUrl + '" '
	// 		+ 'width="' + wid + '" '
	// 		+ 'height="' + hig + '" '
	// 		+ '>'
	// 		+ str
	// 		+ '</object>'
	// 		+ '<!--<![endif]-->'
	// 		+ '</object>';
	// };

	// this.flashPlayerUrl = '/resources/LiveVideoPlayer.swf';

	// /** ***************************************************
	// * Create the full-screen api
	// * after: http://www.longtailvideo.com/html5/fullscreen
	// * el.Enter                 el.Exit                 document.Check
	// * requestFullScreen        cancelFullScreen        fullScreen
	// *                                                  webkitIsFullScreen
	// * prefixRequestFullScreen  prefixCancelFullScreen  prefixFullScreen
	// **************************************************** */
	// this.createFullScreenApi = function () {
	// 	var api = {
	// 		support: false,
	// 		is: function () { return false; },
	// 		request: function (el) { },
	// 		cancel: function () { },
	// 		prefix: '',
	// 		toggle: function (el) { },
	// 		keydown: function (e) {
	// 			if ((e = e || window.event).which || e.keyCode === 27) {
	// 				fullScreenApi.cancel();
	// 			}
	// 		}
	// 	},
	// 		browserPrefixes = 'webkit moz o ms'.split(' ');

	// 	// check for native support
	// 	if (typeof document.cancelFullScreen != 'undefined') {
	// 		api.support = true;
	// 	} else {
	// 		// check for fullscreen support by vendor prefix
	// 		for (var i = browserPrefixes.length - 1; i >= 0; i -= 1) {
	// 			api.prefix = browserPrefixes[i];
	// 			if (typeof document[api.prefix + 'CancelFullScreen'] != 'undefined') {
	// 				api.support = true;
	// 				break;
	// 			}
	// 		}
	// 	}

	// 	// update methods to do something useful
	// 	if (api.support) {
	// 		api.is = function () {
	// 			return document[this.prefix === 'webkit' ? "webkitIsFullScreen" : this.prefix == '' ? "fullScreen" : (this.prefix + "FullScreen")];
	// 		};
	// 		api.request = function (el) {
	// 			return el[this.prefix === '' ? "requestFullScreen" : (this.prefix + "RequestFullScreen")]();
	// 		};
	// 		api.cancel = function () {
	// 			return document[this.prefix === '' ? "cancelFullScreen" : (this.prefix + "CancelFullScreen")]();
	// 		};
	// 		api.toggle = function (el) {
	// 			return this.is() ? this.cancel() : this.request(el);
	// 		};
	// 	} else {
	// 		api.is = function () {
	// 			return $(".fullscreen").length > 0;
	// 		};
	// 		api.request = function (el) {
	// 			this.cancel();
	// 			document.addEventListener('keydown', this.keydown);
	// 			$(el).addClass('fullscreen');
	// 		};
	// 		api.cancel = function () {
	// 			document.removeEventListener('keydown', this.keydown);
	// 			$(".fullscreen").removeClass('fullscreen');
	// 		};
	// 		api.toggle = function (el) {
	// 			return this.is() ? this.cancel() : this.request(el);
	// 		};
	// 	}

	// 	// export api
	// 	window.fullScreenApi = api;
	// };


	// //===Audio Player======================================
	// // id:
	// //    ID of element to write into
	// // url:
	// //    Url of audio. Has server.baseUrl added
	// // forceReload:
	// //   If TRUE, append random parameter to url to force
	// //   the video to reload
	// //
	// // The problems here are:
	// //  - If you wrap an AUDIO tag around an EMBED or OB-
	// //    JECT tag, then Firefox and Opera don't play
	// //  - If you wrap the EMBED around the AUDIO, then Sa-
	// //    fari and Internet Explorer play the audio twice,
	// //    and Opera shows missing plugin
	// //  - If the player is written into a display:none
	// //    element, then Firefox won't play. We use an ab-
	// //    solutely positioned, 1x1, overflow:hidden SPAN
	// //    to minimally impact on the layout
	// //                EMBED  OBJECT  HTML5
	// // Win:
	// //    Chrome:     YES    -       YES
	// //    Firefox 8   YES    -       -
	// //    IE 9        YES    -       YES
	// //    IE 8 (f. 9) YES    YES     -
	// //    IE 7 (f. 9) YES    YES     -
	// //    Opera       -      YES     -
	// // Mac:
	// //    Chrome:	   YES    YES     YES
	// //    Firefox:    YES    -       -
	// //    Safari:     YES    YES     YES
	// // iPad:
	// //    Safari:     -      -       YES

	// this.audioPlayerOld = function (id, url, method, forceReload) {
	// 	if ((url.match(/^http:/) == null) && (typeof (server) != 'undefined') && (server.baseUrl)) url = server.baseUrl + url;
	// 	if (forceReload == true) url += ((url.match(/\?/) != null) ? '&' : '?') + 'r=' + Math.round(1e6 * Math.random());

	// 	if ((typeof (method) == 'undefined') || (method == null)) {
	// 		if ((navigator.userAgent.indexOf('iPhone') != -1) || (navigator.userAgent.indexOf('iPod') != -1) || (navigator.userAgent.indexOf('iPad') != -1) || (navigator.userAgent.match(/chrome/i) != null)) {
	// 			method = 'html5';
	// 		} else if ((navigator.userAgent.match(/opera/i) != null)) {
	// 			method = 'object';
	// 		} else {
	// 			method = 'embed';
	// 		}
	// 	}

	// 	var strSpan = '<span style="position:absolute;width:1px;height:1px;overflow:hidden">';
	// 	if (method == 'html5') {
	// 		$("#" + id).html(strSpan + '<audio id="' + id + '_audio" src="' + url + '" autoplay="true"></audio></span>');
	// 		if (document.getElementById(id + "_audio") != null) document.getElementById(id + "_audio").play();
	// 	} else if (method == 'embed') {
	// 		$("#" + id).html(strSpan + '<embed src="' + url + '" hidden="true" autostart="true" autoplay="true" type="audio/mp3"></embed></span>');
	// 	} else {
	// 		$("#" + id).html(strSpan + '<object><param name="src" value="' + url + '" /><param name="autoplay" value="true" /><param name="autostart" value="true" /></object></span>');
	// 	}
	// };

	// //===Audio Player======================================
	// // Browsers have advanced and many now support HTML5.
	// // Our approach is now that suggested by
	// //    http://www.w3schools.com/html/html_sounds.asp
	// // where an HTML5 <audio> tag  falls back to an <embed>.
	// // Some browsers (Firefox 23 on OSX Lion - Mountain Lion
	// // is ok)  support the HTML5 <audio> tag but  can't play
	// // mp3's, so we  include a canPlayType  check and insert
	// // the <embed> tag without the <audio> wrapper.
	// //
	// // We've expanded the 'target' parameter to allow a dom
	// // element or jQuery selector in addition to id string.
	// //    http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
	// // 
	// // We can also be more clever with callbacks when audio
	// // is loaded and finishes playing.
	// //
	// // @param {string|object.jQuery|HTMLElement} target Identifier, jQuery, HTMLElement to write into.
	// // @param {string} url Address of media file.
	// // @param {string} method_not_used Obsolete. Not used.
	// // @param {boolean} forceReload Set to TRUE to add random number to ensure audio is reloaded.
	// // @param {function=} fnEnded Callback function once media stops playing
	// this.audioPlayerCallback = null;
	// this.audioPlayer = function (target, url, method_not_used, forceReload, fnEnded) {
	// 	var html, audio,
	// 		canPlayMp3 = (function () {
	// 			var a = document.createElement('audio');
	// 			return a && a.canPlayType && a.canPlayType('audio/mp3').length > 0;
	// 		}()),
	// 		isElement = function (o) {
	// 			return (
	// 				typeof HTMLElement === 'object' ? o instanceof HTMLElement : // DOM2
	// 					o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeType === 'string'
	// 			);
	// 		},
	// 		$el = isElement(target) ? $(target) :
	// 			target.constructor === jQuery ? target :
	// 				$('#' + target),
	// 		ended = function () {
	// 			if (Utilities.audioPlayerCallback) {
	// 				Utilities.audioPlayerCallback();
	// 				Utilities.audioPlayerCallback = null;
	// 			}
	// 		};

	// 	ended(); // Stop previous play

	// 	if (forceReload === true) {
	// 		url += ((url.match(/\?/) !== null) ? '&' : '?') + 'r=' + Math.round(1e6 * Math.random());
	// 	}
	// 	html = [
	// 		'<span style="position: absolute; width: 1px; height: 1px; overflow: hidden">',
	// 		canPlayMp3
	// 			? '<audio src="' + url + '" autoplay="true"></audio>'
	// 			: '<embed src="' + url + '" autostart="true" autoplay="true" type="audio/mp3"></embed>',
	// 		'</span>'
	// 	].join('');
	// 	audio = $el.html(html).find('audio').get(0);
	// 	if (audio && audio.play) {
	// 		audio.play();
	// 	}
	// 	if (fnEnded) {
	// 		if (audio && audio.addEventListener) {
	// 			Utilities.audioPlayerCallback = fnEnded;
	// 			audio.addEventListener('ended', ended, false);
	// 		} else {
	// 			setTimeout(fnEnded, 5000);
	// 		}
	// 	}
	// };


	// //===Flash Player======================================
	// // As with Video and Audio, we have here a centralized
	// // renderer that inserts the Flash code, with options
	// // as needed.
	// this.flashPlayer = function (id, url, wid, hig, options) {
	// 	var strHtml = "";

	// 	if ((url.match(/^http:/) == null) && (typeof (server) != 'undefined') && (server.baseUrl)) url = server.baseUrl + url;
	// 	if (typeof (options) == 'undefined') options = {};
	// 	if (options.autoPlay === undefined) options.autoPlay = true;

	// 	//strHtml = "<object class='vjs-flash-fallback' width='" + wid + "' height='" + hig + "' type='application/x-shockwave-flash' data='" + url + "'>";
	// 	//strHtml += "</object>";

	// 	strHtml = ''
	// 		+ '<object id="' + id + '_vidFlash" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" class="vjs-flash-fallback" width="' + wid + '" height="' + hig + '" type="application/x-shockwave-flash" data="' + url + '">'
	// 		+ '   <param name="movie" value="' + url + '" />'
	// 		+ '   <param name="play" value="' + ((options.autoPlay == false) ? '0' : '1') + '" />'
	// 		+ ((options.flashVars !== undefined) ? ('   <param name="flashvars" value="' + options.flashVars + '" />') : '')
	// 		+ '   <!--[if !IE]>-->'
	// 		+ '      <object type="application/x-shockwave-flash" data="' + url + '" width="' + wid + '" height="' + hig + '">'
	// 		+ '         <param name="movie" value="' + url + '" />'
	// 		+ '         <param name="play" value="' + ((options.autoPlay == false) ? 'false' : 'true') + '" />'
	// 		+ ((options.flashVars !== undefined) ? ('         <param name="flashvars" value="' + options.flashVars + '" />') : '')
	// 		+ '   <!--<![endif]-->'
	// 		+ 'This content requires <a href="http://www.adobe.com/flashplayer">Adobe Flash Player</a>.'
	// 		+ '   <!--[if !IE]>-->'
	// 		+ '      </object>'
	// 		+ '   <!--<![endif]-->'
	// 		+ '</object>';

	// 	$("#" + id).html(strHtml);
	// };

	// /* ****************************************************
	// * createTouchDraggable
	// * Creates the touchDraggable class on jQuery
	// **************************************************** */
	// this.createTouchDraggable = function () {
	// 	(function ($) {                   // extend for touch events
	// 		var
	// 			// Trigger a mouse event for the given touch event.
	// 			// @param {string} typeArg Type of mouse event to create 'mousedown'|'mousemove'|'mouseup'.
	// 			// @param {TouchesEvent} event Original touches event, whose properties are passed to the mouse event.
	// 			touchToMouseEvent = function (ev, typeArg) {
	// 				var e, t = ev.changedTouches[0],
	// 					useLegacy = true; // {boolean} Value indicating whether to use discontinued MouseEvents.
	// 				if (useLegacy) {
	// 					// It seems that jQuery 1.8 Draggable doesn't respond to
	// 					// MouseEvent dispatches, so we have to use MouseEvents.
	// 					// According to the MDN, this should be replaced.
	// 					e = document.createEvent("MouseEvents");
	// 					e.initMouseEvent(typeArg,
	// 						true,
	// 						true,
	// 						window,
	// 						0,
	// 						t.screenX,
	// 						t.screenY,
	// 						t.clientX,
	// 						t.clientY,
	// 						ev.ctrlKey,
	// 						ev.altKey,
	// 						ev.shiftKey,
	// 						ev.metaKey,
	// 						0,
	// 						null);
	// 				} else {
	// 					e = new MouseEvent(typeArg, {
	// 						screenX: t.screenX,
	// 						screenY: t.screenY,
	// 						clientX: t.clientX,
	// 						clientY: t.clientY,
	// 						ctrlKey: ev.ctrlKey,
	// 						altKey: ev.altKey,
	// 						shiftKey: ev.shiftKey,
	// 						metaKey: ev.metaKey
	// 					});
	// 					e.currentTarget = e.target;
	// 				}
	// 				t.target.dispatchEvent(e);
	// 			},

	// 			// A touch event finishes. Remove document handlers at end.
	// 			// @this {HTMLElement} Element that triggered the touch event.
	// 			// @param {TouchesEvent} ev Triggered event.
	// 			touchesEnd = function (ev) {
	// 				document.removeEventListener('touchmove', touchesMove, false);
	// 				document.removeEventListener('touchend', touchesEnd, false);
	// 				touchToMouseEvent(ev, 'mouseup');
	// 			},

	// 			// A touch event moves.
	// 			// @this {HTMLElement} Element that triggered the touch event.
	// 			// @param {TouchesEvent} ev Triggered event.
	// 			touchesMove = function (ev) {
	// 				if (ev.changedTouches.length > 1) return;
	// 				touchToMouseEvent(ev, 'mousemove');
	// 			},

	// 			// A touch event starts on the attached element. Add
	// 			// document handlers on first event.
	// 			// @this {HTMLElement} Element that triggered the touch event.
	// 			// @param {TouchesEvent} jev Triggered event.
	// 			touchesStart = function (ev) {
	// 				ev.preventDefault(); // Don't let browser scroll.
	// 				ev = ev.originalEvent || ev; // jQuery passes original event.
	// 				document.addEventListener('touchmove', touchesMove, false);
	// 				document.addEventListener('touchend', touchesEnd, false);
	// 				touchToMouseEvent(ev, 'mousedown');
	// 			};

	// 		$.fn.touchDraggable = function () {
	// 			return this
	// 				.addClass('touchDraggable')
	// 				.on('touchstart', touchesStart);
	// 		};
	// 	})(jQuery);
	// };

	// /** ***************************************************
	// * Creates the .placeholderText jQuery extension
	// * To set/retrieve value, use
	// *    .placeholderText('val' [,'value-to-set'])
	// */
	// this.createPlaceholderText = function () {
	// 	var
	// 		// Returns a string of the DOM element property
	// 		// that represents the element's value.
	// 		// @returns {string} Property of DOM element tha represents the element's value.
	// 		prop = function (el) {
	// 			return { DIV: 'innerHTML' }[el.tagName] || 'value';
	// 		},

	// 		// Set the value property of the given element.
	// 		// @param {jQuery:HTMLElement} $this Element whose value to set.
	// 		// @param {string=} val Value to set.
	// 		// @returns {jQuery:HTMLElement} Original $this element.
	// 		set = function ($this, val) {
	// 			$this.each(function () {
	// 				this[prop(this)] = val || '';
	// 			});
	// 			return $this;
	// 		},

	// 		// Retrieve the value property of the given element.
	// 		// @param {jQuery:HTMLElement} $this Element whose value to set.
	// 		// @param {string} The element's value, or the empty string.
	// 		get = function ($this) {
	// 			var el = $this.get(0);
	// 			return !el ? '' : el[prop(el)];
	// 		},

	// 		// Limit the length of the input, if set.
	// 		// @param {jQuery:HTMLElement=} $this Element to apply to, if specified as argument..
	// 		maxLen = function ($this) {
	// 			if (!isNaN(max = parseInt($this.attr('placeholder-max-length'))) && get($this).length > max) {
	// 				set($this, get($this).substring(0, max));
	// 			}
	// 		},

	// 		// Returns the CSS class to apply for placeholder state.
	// 		// @param {jQuery:HTMLElement=} $this Element to apply to, if specified as argument..
	// 		// @returns {string} CSS class to apply for placeholder state.
	// 		placeholderClass = function ($this) {
	// 			return $this.attr('data-placeholder-class');
	// 		},

	// 		// Update the placeholder content when the element receives focus.
	// 		// @this {HTMLElement=} Element to apply to.
	// 		onfocus = function () {
	// 			var $this = $(this);
	// 			if ($this.attr('user-input') !== 'true') { ////val() === $this.attr('placeholder-text')) {
	// 				set($this, "");
	// 			}
	// 			$this.removeClass(placeholderClass($this));
	// 		},

	// 		// Update the placeholder content on blur or val.
	// 		// @this {HTMLElement} Element to apply to.
	// 		onblur = function () {
	// 			var $this = $(this);
	// 			if (get($this) === "") {
	// 				set($this, $this.attr('placeholder-text'))
	// 					.attr('user-input', 'false')
	// 					.addClass(placeholderClass($this));
	// 			} else {
	// 				$this
	// 					.attr('user-input', 'true')
	// 					.removeClass(placeholderClass($this));
	// 				maxLen($this);
	// 			}
	// 		},

	// 		// A key is released in the input element.
	// 		// @this {HTMLElement} Triggering element.
	// 		onkeyup = function () {
	// 			maxLen($(this));
	// 		};

	// 	(function ($) {
	// 		// Calling patterns:
	// 		//   $el.placeholderText()
	// 		//       Create the placeholder element with default CSS class.
	// 		//   $el.placeholderText('cssClass')
	// 		//      Create the placeholder element with given CSS class.
	// 		//   $el.placeholderText('val')
	// 		//      Retrieve the current value, or empty string if the
	// 		//      element is in placeholder state.
	// 		//   $el.placeholderText('val', 'valueToSet')
	// 		//      Set the element value. Use the empty string to set
	// 		//      to the default value.
	// 		$.fn.placeholderText = function (args) {
	// 			var placeholderClass, val;
	// 			if (arguments[0] === 'val') {
	// 				if (arguments.length > 1) {
	// 					val = arguments[1];
	// 					this.each(function () {
	// 						set($(this), val);
	// 						onblur.call(this);
	// 					});
	// 				}
	// 				return (this.length > 0 && get($(this[0])) !== $(this[0]).attr('placeholder-text')) ? get($(this[0])) : "";
	// 			}
	// 			placeholderClass = arguments[0] || "placeholder";
	// 			return this.each(function () {
	// 				var $this = $(this);
	// 				if (!this.hasAttribute('user-input')) { // user-input attribute prevents multiple overloading
	// 					onblur.call($this
	// 						.attr('data-placeholder-class', placeholderClass)
	// 						.attr('user-input', 'false')
	// 						.focus(onfocus)
	// 						.blur(onblur)
	// 						.keyup(onkeyup)
	// 					);
	// 				}
	// 			});
	// 		};
	// 	}(jQuery));
	// };


	/** ******************************************************
	* Load the given image url and adds it to the item
	* @param {string} url
	*    URL from which to load image
	* @param {jQuerySelector} $el
	*    Element into which to load the image
	* @param {object} opt
	*    Optional settings for displaying the image. Includes:
	*    replaceContent: If TRUE, erases previous content in $el
	*    fnDone: function(Image, $el) Function called with the image
	*       and elementbefore the item is attached. The function can
	*       return FALSE to suppress the native attaching here
	*    zoomToFill: {boolean} If set to TRUE, enlarges the image to
	*       fit if it is smaller than the box
	*    autoH|W: {number} Acts as an automatic-minimum dimension.
	*       For example, use autoH to specify an auto-min height for
	*       an element that has no natural height. The image will be
	*       sized to its maximum size, the auto-height, or the width
	*       whichever is smallest.
	*/
	this.loadImageToElement = function (url, $el, opt) {
		var imgwid = null, imghig = null,
			img = new Image(),
			zoomToFill = opt && opt.zoomToFill || false,
			xhr = new XMLHttpRequest(),

			// Place the image with its known dimensions.
			// @this {Image} The image object being placed.
			placeImage = function () {
				var w = this.width, h = this.height,
					W0 = $el.width(), H0 = $el.height(),
					W = (opt.autoW && W0 < opt.autoW) ? opt.autoW : W0;
				H = (opt.autoH && H0 < opt.autoH) ? opt.autoH : H0,
					aw = W / w, ah = H / h;
				////console.log("autoW=" + opt.autoW + ", W0=" + W0 + ", W=" + W);
				if (!opt || !opt.fnDone || opt.fnDone(this, $el) !== false) {
					if (aw < ah) {
						this.width = Math.max(!zoomToFill ? Math.min(W, w) : W, 1);
						this.height = Math.max(h * this.width / w, 1);
					} else {
						this.height = Math.max(!zoomToFill ? Math.min(H, h) : H, 1);
						this.width = Math.max(w * this.height / h, 1);
					}
					if (opt.replaceContent === true) {
						$el.html(''); ////children().remove();
					}
					$(this)
						.prependTo($el)
						.css({
							position: 'relative',
							left: ((W0 >= W) ? Math.floor((W - this.width) / 2) : 0) + 'px',
							top: ((H0 >= H) ? Math.floor((H - this.height) / 2) : 0) + 'px'
						});
					if (opt.fnComplete) {
						opt.fnComplete(this, $el);
					}
				}
			};

		opt = opt || {};
		if ($el.length > 0) {
			if (typeof url === 'object' && url.nodeName && 'img' === url.nodeName.toLowerCase()) {
				// Passed in an image - place it.
				placeImage.call(url.cloneNode(true));
			} else if (imgwid !== null && imghig !== null) {
				// Try loading our custom x-image-dimensions headers
				// with a synchronous, head-only null ajax call.
				//xhr.open('GET', url, false);
				//xhr.send(null);
				//imgwid = xhr.getResponseHeader('X-Image-Width');
				//imghig = xhr.getResponseHeader('X-Image-Height');

				// Dimensions known from header, place immediately
				img.width = +imgwid;
				img.height = +imghig;
				img.src = url;
				placeImage.call(img);
			} else {
				// Dimensions need to be read from preloaded image
				img = new Image();
				img.onload = function () {  // this is the Image object
					placeImage.call(this);
				};
				img.src = url;
			}
		}
	};

// 	/** ***************************************************
// 	* Read an annotated JSON file. The file can include C-
// 	* style line and block comments, which are stripped
// 	* before the text is parsed.
// 	* @param {string} url Source url to load from
// 	* @param {function} fnComplete
// 	*    Function to call once data has been parsed. The
// 	*    function receives the parsed data.
//   * @returns parsed json data.
// 	*/
// 	this.readAnnotatedJson = function (url, fnComplete) {
// 		$.ajax({
// 			url: '/REST/zoneskinassetmanager/HOME/xxx/AssetPinboardJson/AssetPinboardJson.json',
// 			dataType: 'text', // **TODO** Change this to 'json'
// 			success: function (data) {
// 				data = data || "{}";
// 				data = data
// 					.replace(/\/\*[\s\S]*?\*\//g, "")
// 					.replace(/\/\/.*?[\n\r]+/g, "");
// 				if (fnComplete) {
// 					fnComplete(JSON.parse(data));
// 				}
// 			}
// 		});
// 	},

	// 	/*****************************************************
	// 	* createDOM
	// 	* simple method to make a control
	// 	* @param {string} name name of control eg div, img, input
	// 	* @param {array} parameters dictionary of items for setting control options eg {"class": "blue", name: "ctl", value:"xxx"}
	// 	* @param {string} txt inner text value of control
	//   * @returns DOM control.
	// 	*****************************************************/
	// 	this.createDOM = function (name, parameters, txt) {
	// 		var
	// 			control = document.createElement(name),
	// 			key;
	// 		if (parameters) {
	// 			for (key in parameters) {
	// 				if (parameters.hasOwnProperty(key)) {
	// 					control.setAttribute(key, parameters[key]);
	// 				}
	// 			}
	// 		}
	// 		if (txt) {
	// 			control.appendChild(document.createTextNode(txt));
	// 		}
	// 		return control;
	// 	},

		// /** ***************************************************
		// * canPlayHtml5MP4
		// * simple method to test if browser supports html5 video and can play mp4
		// **************************************************** */
		// this.canPlayHtml5MP4 = function () {
		// 	var v = document.createElement('video');
		// 	return v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.4D401E, mp4a.40.2"') == 'probably';
		// },

		// /** ***************************************************
		// * canPlayHtml5WEBM
		// * simple method to test if browser supports html5 video and can play webm
		// **************************************************** */
		// this.canPlayHtml5WEBM = function () {
		// 	var v = document.createElement('video');
		// 	return v.canPlayType && v.canPlayType('video/webm; codecs="vp8.0, vorbis"') == 'probably';
		// },

		// this.getAnalysisControl = function (options) {
		// 	var control;
		// 	if (options.type === 'WEBGL') {
		// 		control = new WebGLAnalysisTool(options);
		// 	} else if (options.type == 'DUAL') {
		// 		control = this.getDualAnalysisControl(options);
		// 	} else {
		// 		control = this.getSingleAnalysisControl(options);
		// 	}

		// 	control.render();

		// 	if (options.onVideosLoadedCallback) {
		// 		control.on('videoloaded', options.onVideosLoadedCallback);
		// 	}

		// 	if (options.onImageUploadedCallback) {
		// 		control.on('imageuploaded', options.onImageUploadedCallback);
		// 	}

		// 	if (options.onViewChangedCallback) {
		// 		control.on('modechanged', options.onViewChangedCallback);
		// 	}


		// 	return control;
		// },

		// this.getDualAnalysisControl = function (options) {
		// 	return new dualAnalysisTool(options);
		// },

		// this.getSingleAnalysisControl = function (options) {
		// 	return new singleAnalysisTool(options);
		// },

		// /**
		// * Copy the given value to the clipboard.
		// * As of 2017-04, some main browsers don't support the ClipboardEvent
		// * constructor so we still need to use document.execCommand, see
		// * http://caniuse.com/#feat=clipboard.
		// * This code adapted from jquery.copy-to-clipboard plugin
		// * https://github.com/mmkyncl/jquery-copy-to-clipboard
		// * @param {string} val Value to set to clipboard.
		// * @returns {string} Original string that was copied.
		// */
		// this.copyToClipboard = function (val) {
		// 	var $txt = $('<textarea style="position: absolute; top: 0; opacity: 0; pointer-events: none;">')
		// 		.appendTo(document.body)
		// 		.html(val)
		// 		.select();
		// 	document.execCommand('copy');
		// 	$txt.remove();
		// 	return val;
		// },

		// /**
		//  * Truncate a string to maxLength
		//  * @param {string} str Source string.
		//  * @param {number} maxLength Max length of string.
		//  * @param {bool} useEllipse Append an ellipse to end of string.
		//  * @returns {string} Truncated string.
		//  */
		// this.truncateString = function (str, maxLength, useEllipse) {
		// 	if (str.length <= maxLength)
		// 		return str;
		// 	else {
		// 		str = str.substring(0, maxLength);
		// 		if (useEllipse) {
		// 			str = str.substring(0, str.length - 3) + '...';
		// 		}
		// 		return str;
		// 	}
		// };
}; // Utilities

// /** ******************************************************
// * Enum try parse for diagnostic tests.
// * @param {object} e Enum object to try.
// * @param {object} val Value to look for.
// * @returns {?string} The enum's field corresponding to val, or null if not found.
// ******************************************************* */
// Enum.tryParse = function (e, val) {
// 	var k;
// 	for (k in e) {
// 		if (e.hasOwnProperty(k) && e[k] === val) {
// 			return k;
// 		}
// 	}
// 	return null;
// };

// /** ******************************************************
// * Test for passive eventhandler support.
// * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
// */
// (function () {
// 	var passive = false;
// 	try {
// 		var options = Object.defineProperty({}, "passive", {
// 			get: function () {
// 				passive = true;
// 			}
// 		});
// 		window.addEventListener("test", null, options);
// 	}
// 	catch (err) { }
// 	Utilities.passiveSupported = passive;
// }());

// /** ******************************************************
// * Overloaded ajax request method to use json or jsonp
// * depending on browser capabilities. Use this for GET
// * calls only.
// ******************************************************* */
// (function ($) {
// 	// Internet Explorer overzealously caches calls, so append
// 	// random time string to make each call unique. Don't use 
// 	// jsonp because the server needs to wrap the delivered
// 	// data, which means it can't cache the compressed response.
// 	// See https://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
// 	var // ieAgent = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent)
// 		// || new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent),
// 		// ieVer = ieAgent ? parseFloat(RegExp.$1) : null,
// 		useJsonp = true; // ieVer !== null; // All versions of Internet Explorer.
// 	$.ajaxp = function (args) {
// 		if (useJsonp) {
// 			args.url += (args.url.indexOf('?') >= 0 ? '&' : '?') + new Date().valueOf();
// 		}
// 		args.dataType = args.dataType || 'json';
// 		return $.ajax(args);
// 	};
// }(jQuery));

// /**
// * jQuery swipe utility, used for smartphone view.
// */
// (function ($) {
// 	var
// 		active = [],   // {Array<object>} Handlers for cancelling.

// 		// Attach the swipe handler.
// 		// @this {jQuery.Array<HTMLElement>} Elements where to attach swipe.
// 		// @param {object<function>} fn Function to call on events.
// 		// @returns {jQuery.Array<HTMLElement>} Elements.
// 		swipe = function (fn) {
// 			var
// 				ptDown = null, // {object?} Down location.
// 				ptLast = null, // {object?} Last location.
// 				tol = 30,     // {number} (px) Pixel tolerance for vertical drag before swipe cancels.

// 				// Coordinates from a touch item.
// 				// @param {TouchesEvent} e Event whose (first) item to use.
// 				// @returns {object} Coordinates on page.
// 				eventPt = function (e) {
// 					var pt = {
// 						x: e.touches.item(0).clientX,
// 						y: e.touches.item(0).clientY,
// 						scrollLeft: document.body.scrollLeft,
// 						scrollTop: document.body.scrollTop
// 					};

// 					// Prevent swipe while scrolling within the window.
// 					if (ptLast) {
// 						if (pt.scrollLeft > 0
// 							&& pt.scrollLeft < ptDown.maxScrollLeft) {

// 							// If the page has scrolled horizontally, cancel any
// 							// swipe effect. (So you have to scroll all the way 
// 							// to the edge before the swipe will take effect.)
// 							ptDown.x = ptLast.x = pt.x;
// 							ptDown.y = ptLast.y = pt.y;
// 							ptDown.scrollLeft = ptLast.scrollLeft = pt.scrollLeft;
// 							ptDown.scrollTop = ptLast.scrollTop = pt.scrollTop;
// 						}
// 					}
// 					return pt;
// 				},

// 				// Remove listeners.
// 				cancel = function () {
// 					document.removeEventListener('touchmove', touchMove, false);
// 					document.removeEventListener('touchend', touchEnd, false);
// 					ptDown = ptLast = null;
// 				},

// 				// Touch ends.
// 				// @this {HTMLElement} Element receiving touches event.
// 				// @param {TouchesEvent} e Triggering event.
// 				touchEnd = function (e) {
// 					var dx, dy,
// 						el = ptDown.el,
// 						fn = ptDown.fn;
// 					if (e.touches.length === 0 && ptDown) {
// 						dx = ptLast.x - ptDown.x;
// 						dy = ptLast.y - ptDown.y;
// 						cancel();
// 						fn.call(el, 'swipe', dx, dy);
// 					}
// 				},

// 				// Touch moves. Update the last touch position for single touches.
// 				// @param {TouchesEvent} e Triggering event.
// 				touchMove = function (e) {
// 					var dx, dy, el = ptDown.el;
// 					if (e.touches.length === 1) {
// 						ptLast = eventPt.call(this, e);
// 						dx = ptLast.x - ptDown.x;
// 						dy = ptLast.y - ptDown.y;
// 						if (Math.abs(dy) > tol) {
// 							fn.call(el, 'cancel');
// 							cancel();
// 						} else {
// 							fn.call(el, 'drag', dx, dy);
// 						}
// 					}
// 				},

// 				// Start touch event.
// 				// @this {HTMLElement} Element receiving touches event.
// 				// @param {TouchesEvent} e Triggering event.
// 				// @param {string} dir Direction to expect swipe in.
// 				touchStart = function (e) {
// 					if (e.touches.length === 1 && !ptDown) {
// 						ptDown = ptLast = eventPt.call(this, e);
// 						ptDown.fn = fn;
// 						ptDown.el = this;
// 						ptDown.maxScrollLeft = this.offsetWidth - window.innerWidth;
// 						document.addEventListener('touchmove', touchMove, false);
// 						document.addEventListener('touchend', touchEnd, false);
// 						active.push({
// 							elem: this,
// 							fn: fn,
// 							cancel: cancel
// 						});
// 					}
// 				};

// 			if (fn === 'cancel') {
// 				return this.each(function (k, el) {
// 					var m;
// 					for (m = active.length - 1; m >= 0; m -= 1) {
// 						if (active[m].elem === el) {
// 							active[m].cancel();
// 							active[m].fn.call(active[m].elem, 'cancel');
// 							active.splice(m, 1);
// 						}
// 					}
// 				});
// 			}
// 			return this.each(function (k, el) {
// 				el.addEventListener('touchstart', touchStart, false);
// 			});
// 		};
// 	$.fn.swipe = swipe;
// }(jQuery));


// /* Cookie Utilities */
// function setCookie(c_name, value, exdays, path_optional) {
// 	var exdate = new Date();
// 	exdate.setDate(exdate.getDate() + exdays);
// 	var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
// 	if (path_optional !== undefined) {
// 		c_value += "; path=" + path_optional;
// 	}
// 	document.cookie = c_name + "=" + c_value;
// }

// function getCookie(c_name) {
// 	var i, x, y, ARRcookies = document.cookie.split(";");
// 	for (i = 0; i < ARRcookies.length; i++) {
// 		x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
// 		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
// 		x = x.replace(/^\s+|\s+$/g, "");
// 		if (x == c_name) {
// 			return unescape(y);
// 		}
// 	}
// }

// /**
// * Format a date to WCF /Date(7000000+0500)/ format.
// * The Date.getTime() gives time in UTC, so we don't
// * bother with the timezone offset.
// * Could use something like this: (not tested!)
// *    Utilities.stringFormat('/Date({0}{1}{2}{3})/',
// *       this.getTime(),
// *       this.getTimezoneOffset() >= 0 ? '+' : '-',
// *       ('0' + Math.floor(this.getTimezoneOffset() / 60).toString()).slice(-2),
// *       ('0' + this.getTimezoneOffset() % 60).toString()).slice(-20);
// * See  http://stackoverflow.com/a/5310986,
// * http://www.epochconverter.com/
// */
// Date.prototype.toWCF = function () {
// 	return '/Date(' + this.getTime() + ')/';
// };

// /**
//  * Scroll the selected element into view
//  * @param {jQuery.HTMLElement} $el Element in list to scroll into view
//  * @param {jQuery.HTMLElement} $list List to scroll.
//  * @param {string=} dir Direction, default 'vertical', optional 'horizontal'.
//  * @param {boolean=} animate Value indicating whether to animate (default FALSE).
//  */
// Utilities.scrollIntoView = function ($el, $list, dir, animate) {
// 	var horizontal = dir === "horizontal",
// 		extent = horizontal ? $list.parent().width() : $list.parent().height(),
// 		scroll = horizontal ? $list.scrollLeft() : $list.scrollTop(),
// 		el = horizontal 
// 			? $el.offset().left - $list.offset().left
// 			: $el.offset().top - $list.offset().top,
// 		off = Math.round(el - (el < 0 ? 0.3 : 0.5) * extent + scroll);
			
// 	if (el < 0 || el > extent) {
// 		if (animate) {
// 			$list.animate(horizontal ? { scrollLeft: off } : { scrollTop: off });
// 		} else {
// 			$list.get(0)[horizontal ? "scrollLeft" : "scrollTop"] = off;
// 		}
// 	}
// };

// /**
//  * 
//  * @param {jQuery.HTMLElement} $el Element to be scrolled.
//  */
// Utilities.dragScroller = function ($el) {
// 	var draggedClass = "dragScrollerDragged",
// 		settings = {
// 			// Static.
// 			horizontal: true,
// 			vertical: false,
// 			threshold: 8,

// 			// Dynamic.
// 			isDown: false,
// 			el: null,
// 			target: null,
// 			dragged: false,
// 			downX: 0,
// 			downY: 0,
// 			downScrollLeft: 0,
// 			downScrollTop: 0,
// 		},
// 		mousemove = function (e) {
// 			if (!settings.dragged) {
// 				if (Math.abs(e.pageX - settings.downX) > settings.threshold
// 					|| Math.abs(e.pageY - settings.downY) > settings.threshold) {
// 					settings.dragged = true;
// 					$(settings.el).addClass(draggedClass);
// 				}
// 			}

// 			if (settings.dragged) {
// 				if (settings.horizontal) {
// 					settings.el.scrollLeft = settings.downScrollLeft + settings.downX - e.pageX;
// 				}
// 				if (settings.vertical) {
// 					settings.el.scrollTop = settings.downScrollTop + settings.downY - e.pageY;
// 				}
// 			}
// 		},
// 		mouseup = function (e) {
// 			document.removeEventListener("mousemove", mousemove);
// 			setTimeout(function () {
// 				// Callers can use the ".dragScrollerDragged" class to
// 				// suppress links within the scroller by checking for
// 				// the class in the click handler.
// 				$(settings.el).removeClass(draggedClass)
// 				settings.el = null;
// 			});
// 		},
// 		mousedown = function (e) {
// 			var el = e.currentTarget;
// 			$(el).removeClass(draggedClass);
// 			if (!settings.el) {
// 				settings.el = el;
// 				settings.target = e.target;
// 				settings.dragged = false;
// 				settings.downX = e.pageX;
// 				settings.downY = e.pageY;
// 				settings.downScrollLeft = settings.el.scrollLeft;
// 				settings.downScrollTop = settings.el.scrollTop;
// 				document.addEventListener("mousemove", mousemove);
// 				document.addEventListener("mouseup", mouseup, true);
// 				e.preventDefault();
// 			}
// 		};
// 	$el.each(function (k, el) {
// 		el.addEventListener("mousedown", mousedown, true);
// 	});
// };

export default Utilities;
