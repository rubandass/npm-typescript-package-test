import Localize from './Localize';
import { TAnalysisTool } from './types';
import Utilities from './Utilities';
/**
 * Shim methods to run Bracken JavaScript Analysis tool in Webpack.
 */
/**
 * Analysis tool namespace.
 */
declare const AnalysisTool: TAnalysisTool;
/** jQuery alternate name. */
declare const $: any;
export { AnalysisTool, Localize, Utilities, $ };
