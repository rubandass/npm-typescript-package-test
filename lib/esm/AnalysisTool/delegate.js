import './common';
import { AnalysisTool } from './shim';
/**
 * Delegate overrides to JavaScript tool.
 */
AnalysisTool.delegate = {
    extractFrameUrl: function (mediaId, captureTime) { return ''; },
    saveImage: function (base64, complete) {
        complete(base64);
    }
};
