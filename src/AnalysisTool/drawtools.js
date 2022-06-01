/* eslint-disable no-redeclare, no-unused-vars, eqeqeq */
import { AnalysisTool, $ } from './shim';
export {};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Drawing tools
*
* @class: drawTools	
* @param: {object} tempCanvas The temp canvas object
* @param: {object} drawCanvas The canvas object the drawing is rended to
* @param: {function} onDrawFinishedCallback 
* Function called when each tool finishes a drawing.
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
AnalysisTool.drawTools = function drawTools(tempCanvas, drawCanvas, onToolCallback) {
	this.tempCanvas = tempCanvas;
	this.drawCanvas = drawCanvas;
	this.tempCtx = tempCanvas.getContext('2d');
	this.drawCtx = drawCanvas.getContext('2d');
	this.started = false;
	this.measureRatio = 0; //pixels per cm
	this.currentTime = 0.00;
	var self = this;
	var drawColor = '#FF0000';
	var lineWidth = '2';

	function copyToDrawLayer() {
		// *************************************************
		//                 CHROME MAC BUG
		// -------------------------------------------------
		// On Chrom 50.0.2661.75 (64-bit) on OS X 10.11.4 El
		// Capitan,  the following  sequence results  in the
		// drawCanvas being rendered blank:
		//  1. Analysis tool in Analyses area or Module.
		//  2. Make any drawing(s), ending with one of
		//      - Line 
		//      - Horizontal line
		//      - Vertical line
		//      - Rectangle
		//     Ending  with  other  tools  including  arrow,
		//     ellipse,  and circle  does  not  present  the
		//     issue.
		//  3. Click to capture a  REGION (full  screen cap-
		//     ture does not present the issue).
		//  4. Mark the  region with  vignette tool  and re-
		//     lease to specify the selection.
		// At this point, the call stack is roughly:
		//    drawingEngine::getCaptureRegion
		//     -> captureWithRegion
		//      -> renderAll
		//       -> (drawing tool)::Render
		//        -> copyToDrawLayer
		// The fix  seems to be to touch the canvas  data in
		// some way, either getImageData() or toDataURL().
		// Weird, right?!
		self.drawCtx.getImageData(0, 0, 1, 1);

		self.drawCtx.drawImage(self.tempCanvas, 0, 0);
		self.tempCtx.clearRect(0, 0, self.tempCanvas.width, self.tempCanvas.height);
	};

	this.setColor = function (color) {
		drawColor = color;
	};

	this.getColor = function () {
		return drawColor;
	};

	this.setLineWidth = function (width) {
		lineWidth = width;
	};

	// Mark the current tool as started. This is used to
	// notify the drawing engine to add the tool to the
	// tool stack, and enable the undo/delete buttons.
	// @param {object} tool Current drawing tool.
	this.startTool = function (tool) {
		self.started = true;
		onToolCallback('start', tool);
	}

	// Standard finish tool handler, called from drawingEngine on mouseup unless otherwise handled.
	// @param {object.Tool} tool The currently modifying tool to finish.
	this.finishTool = function (tool) {
		if (self.started) {
			self.started = false;
			copyToDrawLayer();
			onToolCallback('end', tool);
		}
	};

	this.Text = function () {
		this.name = 'Text';
		this.data = {
			drawColor: drawColor,
			lineWidth: +lineWidth,
			x: 0, y: 0,
			text: null
		};
	};
	this.Text.prototype = {
		isValid: function () {
			return !!this.data.text;
		},
		getText: function () {
			this.data.text = prompt(AnalysisTool.localize('Text:'), '');
			self.startTool(this);
		},
		getPos: function (ev) {
			this.data.x = ev._x;
			this.data.y = ev._y;
			this.data.drawColor = drawColor;
			this.data.lineWidth = +lineWidth;
		},
		beforeUse: function() {
			this.data.drawColor = drawColor;
			this.data.lineWidth = +lineWidth;
			this.Render(false);
		},
		mousedown: function (ev) {
			// iPad sometimes doesn't give accurate coordinates on mouseup only
			this.getPos(ev);
			this.getText();
			if (this.data.text) {
				this.Render(true);
			}
			self.finishTool(this);
		},
		mousemove: function (ev) {
			this.getPos(ev);
			this.Render(false);
		},
		mouseup: function(){
			// nop, cancel default action
		},
		Render: function (doComplete) {
			var ctx = self.tempCtx,
				cnv = ctx.canvas,
				width = cnv.width,
				height = cnv.height,
				data = this.data,
				text = data.text || AnalysisTool.localize('Click to type');
			ctx.clearRect(0, 0, width, height);
			if (text) {
				ctx.font = (data.lineWidth * 8) + 'px sans-serif';
				ctx.fillStyle = data.drawColor;
				ctx.fillText(text, data.x || 0.1 * width, data.y || 0.2 * height);
			}
			if (doComplete) {
				copyToDrawLayer();
			}
		}
	};


	this.Freeline = function () {
		this.name = 'Freeline';
		this.data = {
			drawColor: drawColor,
			lineWidth: lineWidth,
			pts: []
		};
	}
	this.Freeline.prototype = {
		mousedown: function (ev) {
			self.startTool(this);
			self.x0 = ev._x;
			self.y0 = ev._y;
			this.data.pts = [
				{ x: ev._x, y: ev._y }, // starting point, not modified
				{ x: ev._x, y: ev._y }  // current end point
			];
		},

		mousemove: function (ev) {
			var dx, dy, pt,
				pts = this.data.pts,
				thr = Math.ceil(0.015 * self.tempCtx.canvas.width); // threshold
			if (self.started) {
				this.data.drawColor = drawColor;
				this.data.lineWidth = lineWidth;

				pt = pts[pts.length - 2]; // reference point before last
				dx = pt.x - ev._x;
				dy = pt.y - ev._y;
				if (Math.sqrt(dx * dx + dy * dy) > thr) {
					this.data.pts.splice(pts.length - 1, 0, { x: ev._x, y: ev._y });
				}
				pts[pts.length - 1].x = ev._x;
				pts[pts.length - 1].y = ev._y;
				this.Render(false);
			}
		},

		Render: function (doComplete) {
			var k, xc, yc,
				data = this.data,
				pts = data.pts,
				ctx = self.tempCtx;
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.strokeStyle = data.drawColor;
			ctx.lineWidth = data.lineWidth;
			ctx.beginPath();
			ctx.moveTo(pts[0].x, pts[0].y);
			for (k = 1; k < pts.length - 2; k += 1) {
				xc = (pts[k].x + pts[k + 1].x) / 2;
				yc = (pts[k].y + pts[k + 1].y) / 2;
				ctx.quadraticCurveTo(pts[k].x, pts[k].y, xc, yc);
			}
			ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
			ctx.stroke();
			ctx.fillStyle = ctx.strokeStyle;
			if (doComplete) {
				copyToDrawLayer();
			}
		}
	}; //End FREELINE


	this.RectTypeObject = function (name) {
		return {
			newData: function () {
				return {
					drawColor: drawColor,  // {string.colorref} Color to draw
					lineWidth: lineWidth,  // {number} Stroke width
					x0: 0, y0: 0,          // {number} Start coordinate
					x1: 0, y1: 0           // {number} End coordinate
				}
			},
			mousedown: function (ev) {
				this.data.drawColor = drawColor;
				this.data.lineWidth = lineWidth;
				this.data.x0 = this.data.x1 = ev._x;
				this.data.y0 = this.data.y1 = ev._y;
				self.startTool(this);
			},
			mousemove: function (ev) {
				if (self.started) {
					this.data.x1 = ev._x;
					this.data.y1 = ev._y;
					this.Render(false);
				}
			},
			Render: function (doComplete) {
				var data = this.data,
					ctx = self.tempCtx;       // {HTMLCanvasContext} Context to draw onto

				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.strokeStyle = data.drawColor;
				ctx.lineWidth = data.lineWidth;
				this.renderShape(ctx, data.x0, data.y0, data.x1, data.y1);
				if (doComplete) {
					copyToDrawLayer();
				}
			}
		}
	};

	this.Rect = function () {
		this.name = 'Rect';
		this.data = this.newData();
	};
	this.Rect.prototype = $.extend(new this.RectTypeObject(), {
		renderShape: function (ctx, x0, y0, x1, y1) {
			ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
		}
	});

	this.Circle = function () {
		this.name = 'Circle';
		this.data = this.newData();
	};
	this.Circle.prototype = $.extend(new this.RectTypeObject(), {
		renderShape: function(ctx,x0,y0,x1,y1){
			var w = Math.abs(x1 - x0),
				h = Math.abs(y1 - y0),
				r = Math.sqrt(w * w + h * h);
			ctx.beginPath();
			ctx.arc(x0, y0, r, 0, 2 * Math.PI);
			ctx.stroke();
		}
	});

	this.Ellipse = function () {
		this.name = 'Ellipse';
		this.data = this.newData();
	};
	this.Ellipse.prototype = $.extend(new this.RectTypeObject(), {
		renderShape: function (ctx, x0, y0, x1, y1) {
			var w = Math.abs(x1 - x0) / 2,   // half-width
				h = Math.abs(y1 - y0) / 2,    // half-height
				x0 = Math.min(x0, x1) + w,    // horizontal center
				y0 = Math.min(y0, y1) + h,    // vertical center
				K = 4 * (Math.SQRT2 - 1) / 3, // 'magic' kappa value
				rw = w * K,
				rh = h * K;
			ctx.translate(x0, y0);
			ctx.beginPath();
			ctx.moveTo(w, 0);
			ctx.bezierCurveTo(+w, -rh, +rw, -h, +0, -h);
			ctx.bezierCurveTo(-rw, -h, -w, -rh, -w, +0);
			ctx.bezierCurveTo(-w, +rh, -rw, +h, +0, +h);
			ctx.bezierCurveTo(+rw, +h, +w, +rh, +w, +0);
			ctx.stroke();
			ctx.translate(-x0, -y0);
		}
	});

	this.Vignette = function () {
		this.name = 'Vignette';
		this.data = this.newData();
		this.data.moved = false; // {boolean} Starting before mouse move
		this.Render(false);
	};
	this.Vignette.prototype = $.extend(new this.RectTypeObject(), {
		mousemove: function (ev) {
			var cnv = self.tempCanvas,
				x = ev._x < 0 ? 0 : ev._x > cnv.width ? cnv.width : ev._x,
				y = ev._y < 0 ? 0 : ev._y > cnv.height ? cnv.height : ev._y;
			if (!self.started) {
				this.data.x0 = x;
				this.data.y0 = y;
			}
			this.data.x1 = x;
			this.data.y1 = y;
			this.data.moved = true;
			this.Render(false);
		},
		renderShape: function (ctx, x0, y0, x1, y1) {
			var k,
				text = AnalysisTool.localize('Drag to select capture region.\nClick to cancel.').split('\n'),
				cnv = ctx.canvas;

			ctx.save();
			ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
			if (self.started) {
				ctx.fillRect(0, 0, cnv.width, cnv.height);
				ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
			} else if (!this.data.moved) {
				ctx.fillRect(0, 0, cnv.width, cnv.height);
				ctx.font = 'bold ' + Math.round(0.06 * cnv.height) + 'px sans-serif';
				ctx.textAlign = 'center';
				for (k = 0; k < text.length; k += 1) {
					ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
					ctx.fillText(text[k], 0.5 * cnv.width, (0.35 + 0.08 * k) * cnv.height);
				}
			} else {
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				AnalysisTool.drawTools.drawGuides(ctx, x0, y0, 0x07);
				ctx.strokeStyle = '#fff';
				ctx.lineWidth = 1;
				AnalysisTool.drawTools.drawGuides(ctx, x0, y0, 0x03);
			}
			ctx.restore();
		}
	});

	this.Line = function () {
		this.name = 'Line';
		this.data = this.newData(null);
	};
	this.LineH = function () {
		this.name = 'LineH';
		this.data = this.newData('h');
	};
	this.LineV = function () {
		this.name = 'LineV';
		this.data = this.newData('v');
	};
	this.Arrow = function () {
		this.name = 'Arrow';
		this.data = this.newData(null, 0x02);
	};
	this.Distance = function () {
		this.name = 'Distance';
		this.data = this.newData(null, 0x03);
	};
	this.Cal = function () {
		this.name = 'Cal';
		this.data = this.newData(null, 0x03);
	}
	this.LineTypeObject = function () {
		return {
			newData: function (constrain, arrow) {
				return {
					drawColor: drawColor,  // {string.colorref} Color to draw
					lineWidth: lineWidth,  // {number} Stroke width
					x0: 0, y0: 0,          // {number} Start coordinate
					x1: 0, y1: 0,          // {number} End coordinate
					length: 0,             // {number} Length of line in canvas units
					constrain: constrain,  // {?string} 'v'|'h' Line constraint
					arrow: arrow || 0x00,  // {number} Bit field 0x01=start, 0x02=end arrowheads
					text: null             // {?string} Label to display (e.g. distance)
				};
			},
			updateText: function () {
				// Overload if needed
			},
			distanceText: function () {
				var d = this.data.length;
				if (self.measureRatio > 0) {
					d *= self.measureRatio;
					this.data.text = d.toFixed(d < 10 ? 1 : 0) + ' cm';
				} else {
					this.data.text = d.toFixed(0);
				}
				return d;
			},

			setStart: function (ev) {
				this.data.drawColor = drawColor;
				this.data.lineWidth = +lineWidth;
				this.data.x0 = ev._x;
				this.data.y0 = ev._y;
			},
			mousedown: function (ev) {
				self.startTool(this);
				this.setStart(ev);
				this.mousemove(ev);
			},
			mousemove: function (ev) {
				var dx, dy;
				if (self.started) {
					this.data.x1 = this.data.constrain === 'v' ? this.data.x0 : ev._x;
					this.data.y1 = this.data.constrain === 'h' ? this.data.y0 : ev._y;
					dx = this.data.x1 - this.data.x0;
					dy = this.data.y1 - this.data.y0;
					this.data.length = Math.sqrt(dx * dx + dy * dy);
					this.updateText();
					this.Render(false);
				} else if (this.data.constrain) {
					this.setStart(ev);
					this.Render(false);
				}
			},
			mouseup: function (ev) {
				var ctx = self.tempCtx,
					data = this.data;
				if (Math.abs(data.x1 - data.x0) < 2 && Math.abs(data.y1 - data.y0) < 2) {
					self.started = false;
					data.x1 = data.y1 = 0;
					this.setStart(ev);
					this.Render(false);
				} else {
					self.finishTool(this);
				}
			},

			// Draw a line between two points.
			// @param {HTMLCanvasContext} ctx Context where to draw line.
			// @param {Array<number>} x (by_ref) Horizontal start/end.
			// @param {Array<number>} y (by_ref) Vertical start/end.
			drawLine: function (ctx, x, y) {
				ctx.beginPath();
				ctx.moveTo(x[0], y[0]);
				ctx.lineTo(x[1], y[1]);
				ctx.stroke();
			},

			// Render an arrow line, shortening the line's x/y coordinates as needed.
			// @param {HTMLCanvasContext} ctx Context where to draw line.
			// @param {Array<number>} x (by_ref) Horizontal start/end.
			// @param {Array<number>} y (by_ref) Vertical start/end.
			// @param {number.bitfield} arrow Start 0x01, end 0x02 arrow bitfield.
			drawArrowLine: function (ctx, x, y, arrow) {
				var q0 = Math.atan2(y[1] - y[0], x[1] - x[0]),  // {number} (rad) rotation angle
					s = 6 + 3 * this.data.lineWidth,  // {number} size of arrowhead

				// Draw an arrowhead and offset the line length.
				// @param {number} end 0|1 Which end being drawn
				// @param {number} q (rad) Angle at which to draw angle
				drawArrow = function (end, q) {
					var beg = 1 - end;  // {number} Beginning coordinates
					ctx.save();
					ctx.translate(x[end], y[end]);
					ctx.rotate(q);
					ctx.scale(s, s);
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(-1.2, -0.5);
					ctx.lineTo(-1, 0);
					ctx.lineTo(-1.2, 0.5);
					ctx.closePath();
					ctx.fill();
					ctx.restore();
					x[end] -= s * Math.cos(q);
					y[end] -= s * Math.sin(q);
				};
				if (arrow & 0x01) {
					drawArrow(0, q0 + Math.PI); // draw start arrow
				}
				if (arrow & 0x02) {
					drawArrow(1, q0); // draw arrow end
				}
				this.drawLine(ctx, x, y); // draw line
			},

			// Draw the given text at the center of the line.
			// @param {HTMLCanvasContext} ctx Context where to draw line.
			// @param {string} text Text to display.
			// @param {number} x0 Horizontal position to draw text.
			// @param {number} y0 Vertical position to draw text.
			// @param {number} q0 (rad) Rotation angle
			// @param {number} align Alignment offset: 0=left, 0.5=center, 1=right align
			drawText: function (ctx, text, x0, y0, q0, align) {
				ctx.save();
				ctx.font = '14px sans-serif';
				ctx.translate(x0, y0);
				ctx.rotate(q0 + (q0 > Math.PI / 2 || q0 < -Math.PI / 2 ? Math.PI : 0));
				ctx.fillText(text, -align * ctx.measureText(text).width, -4);
				ctx.restore();
			},

			Render: function (doComplete) {
				var data = this.data,
					ctx = self.tempCtx,       // {HTMLCanvasContext} Context to draw onto
					x = [data.x0, data.x1],   // {number} horizontal coordinates
					y = [data.y0, data.y1];   // {number} end coordinate

				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.strokeStyle = ctx.fillStyle = data.drawColor;
				ctx.lineWidth = data.lineWidth;
				if (data.x1 && data.y1) { // draw once line complete
					if (data.text) {
						this.drawText(ctx, data.text,
							(x[0] + x[1]) / 2,
							(y[0] + y[1]) / 2,
							Math.atan2(y[1] - y[0], x[1] - x[0]), 0.5);  // {number} (rad) rotation angle
					}
					this.drawArrowLine(ctx, x, y, data.arrow);
				} else if (data.constrain) {
					ctx.lineWidth = 1;
					AnalysisTool.drawTools.drawGuides(ctx, data.x0, data.y0, data.constrain !== 'h' ? 0x02 : 0x01);
				}
				if (doComplete && this.name !== 'CAL') {
					copyToDrawLayer();
				}
			}
		}
	};

	this.Line.prototype =
	this.LineH.prototype =
	this.LineV.prototype =
	this.Arrow.prototype = new this.LineTypeObject();
	this.Distance.prototype = new this.LineTypeObject();
	this.Distance.prototype.updateText = function () {
		this.distanceText();
	};

	this.Cal.prototype = $.extend(new this.LineTypeObject(), {
		mouseup: function () {
			var ctx = self.tempCtx;
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			self.finishTool(this);
		},
		Render: function (doComplete) {
			var d, data = this.data,
				ctx = self.tempCtx,       // {HTMLCanvasContext} Context to draw onto
				x = [data.x0, data.x1],   // {number} horizontal coordinates
				y = [data.y0, data.y1];   // {number} end coordinate

			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.strokeStyle = ctx.fillStyle = data.drawColor;
			ctx.lineWidth = 2;
			if (data.x1 && data.y1) { // draw once line complete
				ctx.save();
				ctx.translate(data.x0, data.y0);
				ctx.rotate(Math.atan2(y[1] - y[0], x[1] - x[0]));  // {number} (rad) rotation angle
				ctx.beginPath();
				ctx.lineWidth = 1;
				for (d = 0 + 12; d < data.length - 12; d += 5) {
					ctx.moveTo(d, (d % 50) < 5 ? -6 : -4);
					ctx.lineTo(d, 0);
				}
				ctx.stroke();
				ctx.restore();
				this.drawArrowLine(ctx, x, y, data.arrow);
			}
		}
	});

	this.BikeH = function () {
		this.name = 'BikeH';
		this.data = this.newData(true, 0x03);
	};
	this.BikeV = function () {
		this.name = 'BikeV';
		this.data = this.newData(true, 0x03);
	};
	this.BikeH.prototype =
	this.BikeV.prototype = $.extend(new this.LineTypeObject(), {
		updateText: function () {
			this.data.length = this.getPts().length;
			this.distanceText();
		},
		getPts: function () {
			var data = this.data,
				isH = this.name === 'BikeH',
				x0 = data.x0, x1 = data.x1, x2 = (x0 + x1) / 2,
				y0 = data.y0, y1 = data.y1, y2 = (y0 + y1) / 2;
			return {
				x0: x0, x1: x1, x2: x2,
				y0: y0, y1: y1, y2: y2,
				//        arrow  line1   line2       arrow   line1   line2
				x: isH ? [x0, x1, x0, x0, x1, x1] : [x2, x2, x0, x1, x0, x1],
				y: isH ? [y2, y2, y0, y1, y0, y1] : [y0, y1, y0, y0, y1, y1],
				length: isH ? Math.abs(x1 - x0) : Math.abs(y1 - y0)
			}
		},
		Render: function (doComplete) {
			var ctx = self.tempCtx,           // {HTMLCanvasContext} Context to draw onto
				data = this.data,              // {object} This drawing object's data
				isH = this.name === 'BikeH',   // {boolean} Horizontal constrained disposition
				pts = this.getPts();

			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.strokeStyle = ctx.fillStyle = data.drawColor;
			ctx.lineWidth = data.lineWidth;
			if (data.x1 && data.y1) { // draw once line complete
				if (data.text) {
					if (!isH) {
						this.drawText(ctx, data.text, pts.x2 + 8, pts.y2 + 8, 0, 0);
					} else if (pts.x1 < pts.x0) {
						this.drawText(ctx, data.text, pts.x1 - 8, pts.y2 + 8, 0, 1);
					} else {
						this.drawText(ctx, data.text, pts.x1 + 8, pts.y2 + 8, 0, 0);
					}
				}
				ctx.beginPath();
				ctx.moveTo(pts.x[2], pts.y[2]);
				ctx.lineTo(pts.x[3], pts.y[3]);
				ctx.moveTo(pts.x[4], pts.y[4]);
				ctx.lineTo(pts.x[5], pts.y[5]);
				ctx.stroke();
				this.drawArrowLine(ctx, pts.x, pts.y, data.arrow); // modifies x and y arrays!
			} else {
				ctx.lineWidth = 1;
				AnalysisTool.drawTools.drawGuides(ctx, pts.x0, pts.y0, isH ? 0x02 : 0x01);
			}
			if (doComplete) {
				copyToDrawLayer();
			}
		}
	});

	// Three point angle.
	// The newData and Render functions are used by constrained angles as well.
	this.Angle = function () {
		this.name = 'Angle';
		this.data = this.newData();
	};
	this.AngleV = function () {
		this.name = 'AngleV';
		this.data = this.newData(false, 2); // no reflex angles, drawing stage 2
		this.constrain = 'h';
	};
	this.AngleH = function () {
		this.name = 'AngleH';
		this.data = this.newData(false, 2); // no reflex angles, drawing stage 2
		this.constrain = 'v';
	};
	this.Angle.prototype = {
		newData: function (reflex, stage) {
			return {
				drawColor: drawColor,
				lineWidth: lineWidth,
				reflex: reflex !== false, // allow reflex angles
				stage: stage || 0,        // drawing stage
				dir: 0,                   // direction for constrained angles
				x0: 0, y0: 0,
				x1: 0, y1: 0,
				x2: 0, y2: 0
			};
		},
		isValid: function () {
			return this.data.stage >= 2;
		},
		mousedown: function (ev) {
			self.startTool(this);
			if (this.data.stage === 0) {
				this.data.x0 = this.data.x1 = ev._x;
				this.data.y0 = this.data.y1 = ev._y;
				this.data.stage = 1;
			}
		},
		mousemove: function (ev) {
			var stage = this.data.stage;
			this.data['x' + stage] = ev._x;
			this.data['y' + stage] = ev._y;
			this.data.drawColor = drawColor;
			this.data.lineWidth = lineWidth;
			this.Render(false);
		},
		mouseup: function () {
			if (this.data.stage < 2
				&& this.data.x1 !== this.data.x0
				&& this.data.y1 !== this.data.y0) {
				this.data.stage += 1;
			} else if (this.data.stage == 2) {
				self.finishTool(this);
			} else {
				this.data.stage = 0;
			}
		},
		Render: function (doComplete) {
			var qt,        // {number} (rad >= 0) angle where text to be written
				text,       // {string} Text to be written
				r,          // {number} arc distance for text
				ctx = self.tempCtx,
				data = this.data,
				x0 = data.x0, y0 = data.y0,        // {number} starting coordinates
				x1 = data.x1, y1 = data.y1,        // {number} center coordinates
				x2 = data.x2, y2 = data.y2,        // {number} end coordinates
				q0 = Math.atan2(y0 - y1, x0 - x1), // {number} (rad) starting angle
				q1 = Math.atan2(y2 - y1, x2 - x1), // {number} (rad) ending angle
				dq = q1 - q0 + (q1 < q0 ? 2 * Math.PI : 0), // {number} (rad >= 0) measured angle
				arc = data.stage > 1 && data.x2 && data.y2; // {boolean} show arc and second line

			if (data.stage > 0) {
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.strokeStyle = ctx.fillStyle = data.drawColor;
				ctx.lineWidth = data.lineWidth;
				ctx.beginPath();
				ctx.moveTo(x0, y0);
				ctx.lineTo(x1, y1);
				if (arc) {
					if (data.reflex === false && dq > Math.PI) { // prevent reflex angles
						dq = 2 * Math.PI - dq;     // complementary angle
						qt = q0; q0 = q1; q1 = qt; // swap angles
					}
					text = (dq * 180 / Math.PI).toFixed(0) + '\u00b0';  // {string} Text to be written
					qt = q0 + 0.5 * dq + (dq < 0.7 ? Math.PI : 0); // {number} (rad >= 0) angle where to draw text
					r = dq < 0.7 ? 16 : 33;                        // {number} arc distance for text

					ctx.lineTo(x2, y2);
					ctx.moveTo(x1 + 15 * Math.cos(q0), y1 + 15 * Math.sin(q0));
					ctx.arc(x1, y1, 15, q0, q1);

					ctx.font = '14px sans-serif';
					ctx.fillText(
						text,
						x1 + r * Math.cos(qt) - 0.5 * ctx.measureText(text).width,
						y1 + r * Math.sin(qt) + 8);
				}
				ctx.stroke();
				if (doComplete) {
					copyToDrawLayer();
				}
			}
		}
	};

	// Constrained angle.
	// Uses the ANGLE newData and Render functions.
	this.AngleV.prototype = this.AngleH.prototype = {
		newData: this.Angle.prototype.newData,
		Render: this.Angle.prototype.Render,
		mousedown: function (ev) {
			self.startTool(this);
			this.data.x0 = this.data.x1 = this.data.x2 = ev._x;
			this.data.y0 = this.data.y1 = this.data.y2 = ev._y;
			this.data.drawColor = drawColor;
			this.data.lineWidth = lineWidth;
		},
		mousemove: function (ev) {
			var data = this.data,
				isV = this.constrain === 'v', // constrain horizontal or vertical
				z1 = isV ? data.x1 : data.y1,
				dz = (isV ? ev._x : ev._y) - z1,

				r = Math.max(20, Math.abs(dz));
			if (self.started) {
				if (data.dir === 0) {
					data.dir = dz < 0 ? -1 : dz > 0 ? +1 : 0;
				}
				data.x0 = data.x1 + (isV ? data.dir * r : 0);
				data.y0 = data.y1 + (isV ? 0 : data.dir * r);
				data.x2 = ev._x;
				data.y2 = ev._y;
				this.Render();
			}
		}
	};


	//DOT
	this.Dot = function () {
		this.name = 'Dot';
		this.data = {};
		var me = this;
		this.mousedown = function (ev) {
			self.startTool(this);
			self.x0 = ev._x;
			self.y0 = ev._y;
			me.data.sx = ev._x;
			me.data.sy = ev._y;
			me.data.drawColor = drawColor;
			me.data.lineWidth = lineWidth;
			me.Render(false);
		};

		this.touchstart = this.mousedown;
		this.touchend = this.mouseup;

		this.Render = function (doComplete) {

			self.tempCtx.clearRect(0, 0, self.tempCanvas.width, self.tempCanvas.height);

			self.tempCtx.strokeStyle = me.data.drawColor;
			self.tempCtx.fillStyle = me.data.drawColor;
			self.tempCtx.lineWidth = 0;
			self.tempCtx.beginPath();
			var rad = me.data.lineWidth;
			self.tempCtx.arc(me.data.sx, me.data.sy, rad, 0, Math.PI * 2, true)
			self.tempCtx.stroke();
			self.tempCtx.fill();
			self.tempCtx.closePath();
			if (doComplete) {
				copyToDrawLayer();
			}
		};

	}; //End DOT

	// Polygon line type object
	// Used for Bezier and PolyAngle
	this.PolyLineTypeObject = function () {
		return {
			newData: function () {
				return {
					pts: [],  // {Array<pointEx>} Anchor points and times
					firstUse: true, // {boolean} On first use, add to tool stack
					drawColor: drawColor,
					lineWidth: lineWidth
				};
			},

			mousedown: function (ev) {
				if (this.data.firstUse) {
					self.startTool(this);
					this.data.firstUse = false;
				}
				this.data.pts.push({
					x: ev._x,
					y: ev._y,
					t: self.currentTime
				});
				this.data.drawColor = drawColor;
				this.data.lineWidth = lineWidth;
				if (this.classMouseDown) {
					this.classMouseDown(ev);
				}
				this.Render(false);
			},
			mouseup: function (ev) {
				//NOP - but cancel standard
			},
			Render: function (doComplete) {
				var k,
					ctx = self.tempCtx,
					cnv = ctx.canvas,
					data = this.data,
					pts = data.pts;    // Source data points

				ctx.clearRect(0, 0, cnv.width, cnv.height);
				ctx.strokeStyle = ctx.fillStyle = data.drawColor;
				ctx.lineWidth = data.lineWidth;
				ctx.font = '14px sans-serif';

				// Draw points
				for (k = 0; k < pts.length; k += 1) {
					ctx.beginPath();
					ctx.arc(pts[k].x, pts[k].y, 1.5 * data.lineWidth, 0, 2 * Math.PI);
					ctx.fill();
				}

				this.classRender(ctx, data, pts);
				
				if (doComplete) {
					copyToDrawLayer();
				}
			}
		}
	};
	
	// Bezier - joined dots with cumulative distance
	this.Bezier = function () {
		this.name = 'Bezier';
		this.data = $.extend(this.newData(), {
			ctl: []  // {Array<point>} Control points (for Bezier)
		});
	};

	this.Bezier.prototype = $.extend(new this.PolyLineTypeObject(), {
		// Calculate the array of control points suitable for use
		// with context.bezierCurveTo.
		controlPoints: function () {
			var k, pt, s, l,
				L = 0.414,  // Distance along slope for Bezier control point sqrt(2)
				pts = this.data.pts,
				n = pts.length,
				dist = function (k) {
					var dx = pts[k].x - pts[k - 1].x,
						dy = pts[k].y - pts[k - 1].y;
					return Math.sqrt(dx * dx + dy * dy);
				},
				ctl = [];
			if (n > 0) {
				// First point - natural boundary
				ctl.push({ x: pts[0].x, y: pts[0].y });
				ctl.push({ x: pts[0].x, y: pts[0].y });
				// Each point
				for (k = 1; k < n - 1; k += 1) {
					// Current point
					pt = { x: pts[k].x, y: pts[k].y };
					// Normalized slope between adjacent points
					s = { x: pts[k + 1].x - pts[k - 1].x, y: pts[k + 1].y - pts[k - 1].y };
					l = Math.sqrt(s.x * s.x + s.y * s.y) || 1;
					s.x /= l;
					s.y /= l;
					// Previous segment control point
					l = L * dist(k);
					ctl.push({ x: pt.x - l * s.x, y: pt.y - l * s.y });
					// This segment endpoint
					ctl.push({ x: pt.x, y: pt.y });
					// Next segment control point
					l = L * dist(k + 1);
					ctl.push({ x: pt.x + l * s.x, y: pt.y + l * s.y });
				}
				// Last point - natural boundary
				if (n > 1) {
					ctl.push({ x: pts[n - 1].x, y: pts[n - 1].y });
					ctl.push({ x: pts[n - 1].x, y: pts[n - 1].y });
				}
			}
			this.data.ctl = ctl;
		},
		// Determine the cumulative distances and velocities
		// for each segment.
		cumulativeDistance: function () {
			var k, f, d, ptPrev, pt, dt,
				df = .05,  // fractional step size
				pts = this.data.pts,
				ctl = this.data.ctl,
				dist = function (pt0, pt1) {
					var dx = pt1.x - pt0.x,
						dy = pt1.y - pt0.y;
					return (self.measureRatio || 1) * Math.sqrt(dx * dx + dy * dy);
				};
			for (k = 0; k < pts.length - 1; k += 1) {
				f = 0;  // fractional distance along curve
				d = 0;  // distance
				ptPrev = pts[k];  // starting point
				for (f = df; f < 1; f += df) {
					pt = this.bezierPt(3 * k, f);
					d += dist(ptPrev, pt);
					ptPrev = pt;
				}
				d += dist(pts[k + 1], ptPrev);
				dt = pts[k + 1].t - pts[k].t; // {number} (s) Timeline time between points
				this.data.pts[k + 1].dist = d + (pts[k].dist || 0); // {number} (cm) cumulative distance
				this.data.pts[k + 1].velo = dt ? d / dt / 100 : 0; // {number} (m/s) Velocity
			}
		},
		// Return a point along the bezier curve of control points.
		// @param {number} k Index of starting control point.
		// @param {number} f Distance along curve, 0 <= f <= 1.
		// @returns {point} Point on the curve.
		bezierPt: function (k, f) {
			var ctl = this.data.ctl,
				F = 1 - f,
				k0 = F * F * F,
				k1 = 3 * F * F * f,
				k2 = 3 * F * f * f,
				k3 = f * f * f;
			return {
				x: k0 * ctl[k].x + k1 * ctl[k + 1].x + k2 * ctl[k + 2].x + k3 * ctl[k + 3].x,
				y: k0 * ctl[k].y + k1 * ctl[k + 1].y + k2 * ctl[k + 2].y + k3 * ctl[k + 3].y
			};
		},
		// Mouse down event after default processing [optional]
		classMouseDown: function (ev) {
			this.controlPoints();
			this.cumulativeDistance();
		},
		// Draw content between the points
		classRender: function (ctx, data, pts) {
			var k,
				ctl = data.ctl;    // Control data points
			// Draw Bezier lines
			if (ctl.length > 0) {
				ctx.beginPath();
				ctx.moveTo(ctl[0].x, ctl[0].y);
				for (k = 1; k < ctl.length - 2; k += 3) {
					ctx.bezierCurveTo(
						ctl[k].x, ctl[k].y,
						ctl[k + 1].x, ctl[k + 1].y,
						ctl[k + 2].x, ctl[k + 2].y);
				}
				ctx.stroke();
			}
			// Draw distance texts
			for (k = 1; k < pts.length; k += 1) {
				ctx.fillText(
					pts[k].dist.toFixed(0) + ' cm' + (pts[k].velo ? ' ' + Math.abs(pts[k].velo).toFixed(2) + ' m/s' : ''),
					pts[k].x + 10, pts[k].y);
			}
		}
	});

	// Contiguous multiple angle
	this.PolyAngle = function () {
		this.name = 'PolyAngle';
		this.data = this.newData();
	};


	this.PolyAngle.prototype = $.extend(new this.PolyLineTypeObject(), {
		classRender: function (ctx, data, pts) {
			var k, pt0, vp, vn, q, vt, text,
				R = 10 + 2 * this.data.lineWidth, // {number} Radius of arc to draw
				// Return normalized vector between points pt0 and pt1, or of vector pt0.
				norm = function (pt0, pt1) {
					var
						dx = pt0.x - (!pt1 ? 0 : pt1.x),
						dy = pt0.y - (!pt1 ? 0 : pt1.y),
						d = 1 / (Math.sqrt(dx * dx + dy * dy) || 1);
					return {
						x: dx * d,
						y: dy * d
					};
				};
			ctx.font = '14px sans-serif';

			// Draw poly line
			ctx.beginPath();
			ctx.moveTo(pts[0].x, pts[0].y);
			for (k = 1; k < pts.length; k += 1) {
				ctx.lineTo(pts[k].x, pts[k].y);
			}
			ctx.stroke();
			// Draw angles
			ctx.beginPath();
			for (k = 1; k < pts.length - 1; k += 1) {
				pt0 = pts[k];
				vp = norm(pts[k], pts[k - 1]);
				vn = norm(pts[k], pts[k + 1]);
				q = Math.acos(vp.x * vn.x + vp.y * vn.y);// Angle is dot product
				ctx.moveTo(pt0.x - R * vp.x, pt0.y - R * vp.y);
				ctx.arc(pt0.x, pt0.y, R,
					Math.atan2(pts[k - 1].y - pt0.y, pts[k - 1].x - pt0.x),
					Math.atan2(pts[k + 1].y - pt0.y, pts[k + 1].x - pt0.x),
					vp.x * vn.y - vp.y * vn.x < 0); // Sense is sign of cross product
				// Text
				text = (q * 180 / Math.PI).toFixed(0) + '\u00b0';
				vt = norm({
					x: (vp.x + vn.x) / 2,
					y: (vp.y + vn.y) / 2
				});
				vt.x = (q < 0.7 ? 1.0 : -1.2) * R * vt.x - ctx.measureText(text).width * (vt.x > .5 ? 1 : vt.x > -0.5 ? 0.5 : 0);
				vt.y = (q < 0.7 ? 1.0 : -1.2) * (R * vt.y - 14 * (vt.y < 0 ? 1 : 0));
				ctx.fillText(text, pt0.x + vt.x, pt0.y + vt.y);
			}
			ctx.stroke();
		}
	});

	// Speed 
	this.Speed = function () {
		this.name = 'Speed';
		this.data = $.extend(this.newData(null, 0x03), {
			t0: 0.00, t1: 0.00,   // {number} Start and end frame time
			stage: 0              // {number} 0-before start, 1-placed start, 2-drag end
		});
	}
	this.Speed.prototype = $.extend(new this.LineTypeObject(), {
		isValid: function () {
			return this.data.stage === 2;
		},

		mousedown: function (ev) {
			if (this.data.stage === 0) {
				this.data.x0 = ev._x;
				this.data.y0 = ev._y;
				this.data.t0 = self.currentTime;
				this.data.stage = 1;
				self.startTool(this);
				this.Render(false);
			} else {
				this.data.stage = 2;
				this.mousemove(ev);
			}
		},

		mousemove: function (ev) {
			var dx, dy, d, dt;
			if(this.data.stage === 2){
				this.data.x1 = ev._x;
				this.data.y1 = ev._y;
				this.data.t1 = self.currentTime;
				this.data.drawColor = drawColor;
				this.data.lineWidth = lineWidth;
				dx = this.data.x1 - this.data.x0;
				dy = this.data.y1 - this.data.y0;
				this.data.length = Math.sqrt(dx * dx + dy * dy);
				d = this.distanceText();
				dt = this.data.t1 - this.data.t0;
				if (dt !== 0) {
					this.data.text += ' ' + Math.abs(d / dt / 100).toFixed(2) + ' m/s'
				}
				this.Render(false);
			}
		},

		mouseup: function (ev) {
			if (this.data.stage === 2) {
				self.finishTool(this);
			}
		},

		Render: function (doComplete) {
			var ctx = self.tempCtx,
				data = this.data,
				x = [data.x0, data.x1],
				y = [data.y0, data.y1];
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.strokeStyle = ctx.fillStyle = data.drawColor;
			ctx.lineWidth = data.lineWidth;
			ctx.font = '14px sans-serif';
			ctx.fillText(data.text, data.x1 - (data.x1 < data.x0 ? ctx.measureText(data.text).width : 0), data.y1);
			if (data.x1 && data.y1) {
				this.drawArrowLine(ctx, x, y, data.arrow);
			} else if (data.stage === 1) {
				ctx.beginPath();
				ctx.moveTo(x[0], y[0] - 8);
				ctx.lineTo(x[0], y[0] + 8);
				ctx.moveTo(x[0] - 8, y[0]);
				ctx.lineTo(x[0] + 8, y[0]);
				ctx.stroke();
			}
			if (doComplete) {
				copyToDrawLayer();
			}
		}
	}); //End SPEED

};
//END drawTools


// Draw a dashed guide the full extent of the canvas.
// Flags:
//     0x01  Horizontal guide
//     0x02  Vertical guide
//     0x04  Solid line (else dashed)
// @param {HTMLCanvasContext} ctx Context where to draw line.
// @param {number} x Horizontal offset where to draw line.
// @param {number} y Vertical offset where to draw line.
// @param {number} flags Use flags from table above.
AnalysisTool.drawTools.drawGuides = function (ctx, x, y, flags) {
	var
		// Draw a single guide.
		drawGuide = function (y, w, flip) {
			var k, x;
			ctx.save();
			if (flip) {
				// transform(a, b, c, d, e, f) (note order!)
				//    [ x ]   [ a   c   e ] [ x ]
				//    [ y ] = [ b   d   f ] [ y ]
				//    [ 1 ]   [ 0   0   1 ] [ 1 ]
				ctx.transform(0, 1, 1, 0, 1, 1);
			}
			ctx.beginPath();
			if ((flags & 0x04) > 0) {
				ctx.moveTo(0, y);
				ctx.lineTo(w, y);
			} else {
				for (k = x = 0; x < w; k += 1, x += 3) {
					ctx[k % 2 === 0 ? 'moveTo' : 'lineTo'](x, y);
				}
			}
			ctx.stroke();
			ctx.restore();
		};
	if ((flags & 0x01) > 0) {
		drawGuide(y, ctx.canvas.width, false);
	}
	if ((flags & 0x02) > 0) {
		drawGuide(x, ctx.canvas.height, true);
	}
};






