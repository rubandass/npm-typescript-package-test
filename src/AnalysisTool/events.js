import { AnalysisTool } from './shim';
export {}

/** ******************************************************
* Event handler 'base' class.
* Extend this using:
*    AnalysisTool.Drawbar = function () {
*       this.eventListeners = { trigger: [], ... }; // Define valid events
*       ...
*    }
*    AnalysisTool.Drawbar.prototype = $.extend(
*       new AnalysisTool.Events('toolchange', 'fullscreen'),
*       {
*          onButtonClick: function () {
*             this.fireEvent('toolchange', tool);
*          }
*       };
******************************************************* */
AnalysisTool.Events = function () {
};
AnalysisTool.Events.prototype = {
	// Add a delegate function as event handler.
	// @param {string} event Event name.
	// @param {function} handler Event handler function, called with thisArg.
	// @param {object=} thisArg Object passed as THIS to handler function.
	// @returns {this} Returns self object for chaining.
	addEventListener: function (event, handler, thisArg) {
		this.eventListeners[event].push({ fn: handler, thisArg: thisArg });
		return this;
	},

	// Call all registered event handlers for the given event,
	// passing additional arguments as needed.
	// @param {string} event Event being triggered.
	// @param {...} args Additional arguments passed on to handler.
	fireEvent: function (event, args) {
		var k, listener,
			listeners = this.eventListeners[event];
		for (k = 0; k < listeners.length; k += 1) {
			listener = listeners[k];
			listener.fn.apply(listener.thisArg || window, Array.prototype.slice.call(arguments, 1));
		}
	}
};

