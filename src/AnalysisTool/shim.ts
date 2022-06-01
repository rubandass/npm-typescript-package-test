import jQuery from './jquery-1.8.2';
import Localize from './Localize';
import { TAnalysisTool } from './types';
import Utilities from './Utilities';

/**
 * Shim methods to run Bracken JavaScript Analysis tool in Webpack.
 */

/**
 * Analysis tool namespace.
 */
const AnalysisTool: TAnalysisTool = {
  Drawbar: function () {},
  DualControl: function () {},
  Events: function () {},
  SingleControl: function () {},
  SyncBar: function () {},
  Timeline: function () {},
  VideoPlayer: function () {},
  singleAnalysisTool: function () {},
  delegate: {},
  icon: () => '',
  toolbars: {},
};

/** jQuery alternate name. */
const $ = jQuery;

export { AnalysisTool, Localize, Utilities, $ };
