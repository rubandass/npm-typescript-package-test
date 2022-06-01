import jQuery from './jquery-1.8.2';
import Localize from './Localize';
import Utilities from './Utilities';
/**
 * Shim methods to run Bracken JavaScript Analysis tool in Webpack.
 */
/**
 * Analysis tool namespace.
 */
var AnalysisTool = {
    Drawbar: function () { },
    DualControl: function () { },
    Events: function () { },
    SingleControl: function () { },
    SyncBar: function () { },
    Timeline: function () { },
    VideoPlayer: function () { },
    singleAnalysisTool: function () { },
    delegate: {},
    icon: function () { return ''; },
    toolbars: {},
};
/** jQuery alternate name. */
var $ = jQuery;
export { AnalysisTool, Localize, Utilities, $ };
