import './common';
import { AnalysisTool } from './shim';

/**
 * Delegate overrides to JavaScript tool.
 */
AnalysisTool.delegate = {
  extractFrameUrl: (mediaId: string, captureTime: number) => '',
  saveImage: (
    base64: string,
    complete: (data: string | HTMLImageElement | null) => void
  ) => {
    complete(base64);
  }
};
