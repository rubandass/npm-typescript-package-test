export const AnalysisToolConstants = {
  Events: {
    /** Event triggered to request the analysis tool capture an image. */
    TRIGGER_CAPTURE: 'analysis.trigger-capture',
    /** Event triggered when the image has been captured. */
    CAPTURE_COMPLETE: 'analysis.capture-complete',
    /** Event triggered to seek the player to a previously stored state. */
    SEEK: 'analysis.seek'
  }
};

/** Payload for an EVENT_TRIGGER_CAPTURE event. */
export interface ITriggerCaptureEventParams {
  /** Value indicating whether a region should be selected. */
  region?: boolean;
}

/** Payload for an EVENT_CAPTURE_COMPLETE event. */
export interface ICaptureCompleteEventParams {
  /** Data string of captured image. */
  base64: string;
  /** Capture state when the image was taken. */
  state?: ISingleAnalysisCaptureState;
}

/**
 * Analysis tool namespace.
 */
export type TAnalysisTool = {
  Drawbar: () => void;
  DualControl: () => void;
  Events: () => void;
  SingleControl: () => void;
  SyncBar: () => void;
  Timeline: () => void;
  VideoPlayer: () => void;
  singleAnalysisTool: SingleAnalysisTool | (() => void);
  delegate: IAnalysisToolDelegate | {};
  icon: (key: string) => string;
  toolbars: object;
};

export interface IAnalysisToolDelegate {
  /**
   * Retrieve information about a media item.
   * @param {string.guid} mediaID Identifier of video item whose info to load.
   * @param {function} complete Completion function called with media info.
   * @returns {object} Loaded media information.
   */
  mediaInfo?: (
    mediaID: string,
    callback: (data: { fps?: number; width: number; height: number }) => void
  ) => void;

  /**
   * Extract a frame at the given time from a video.
   * Returns a string suitable for use as the "src" attribute
   * of an Image object, e.g. a REST call or base-64 encoded
   * image data. This is used when blitting from HTML5 <video>
   * to <canvas> is not supported.
   * @param {string.guid} mediaID Identifier of video media file where to extract frame.
   * @param {number} captureTime (s) Time at which to extract frame.
   * @returns {string} Server request URL or base-64 encoded source string.
   */
  extractFrameUrl: (mediaID: string, captureTime: number) => string;

  /**
   * Save a (jpg) image to the server as base-64 encoded string.
   * @param {string} base64 Base-64 encoded image string.
   * @param {function} complete Completion function called with saved response or NULL on error.
   */
  saveImage: (
    base64: string,
    complete: (data: string | HTMLImageElement | null) => void
  ) => void;
}

/**
 * Information about a single analysis tool capture.
 */
export interface ISingleAnalysisCaptureState {
  looped?: boolean;
  flipped?: boolean;
  muted?: boolean;
  position?: number;
  selection?: number[] | null;
  duration?: number;
}

/**
 * Single video analysis tool state.
 */
export interface ISingleAnalysisToolState extends ISingleAnalysisCaptureState {
  drawmru?: { tool: string; color: number }[];
}

/**
 * Configuration options passed to the Single Video Analysis tool.
 */
export interface ISingleAnalysisToolSettings {
  /** DOM element identifier of target element. */
  targetID: string;
  /** Video and thumb media URLs. */
  mediaUrl: SingleAnalysisMediaSpecifier;
  /** Callback invoked when an image is captured. */
  onImageUploadedCallback?: CaptureCallback;
  /** Player height. */
  height?: number;
  /** Simple player view (??) */
  simpleview?: boolean;
  /** Initial state to configure the tool. */
  initState?: ISingleAnalysisToolState;
}

/** Callback function when an image is captured. */
export type CaptureCallback = (
  fnCallback: () => void | null,
  data: { ImageNameGuid: string | HTMLImageElement }
) => void;

/** Region for capturing part of the screen. */
export interface IRegion {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
}

/** Two-element array for media and thumb URL. */
export type SingleAnalysisMediaSpecifier = string[];

/** Event types for single analysis tool. */
export type SingleAnalysisEvent = 'capture';

/** Event handler. */
export type SingleAnalysisEventHandler = () => void;

/** State that can be applied to the timeline for highlighting. */
export interface ITimelineState {
  /** Offset from the bottom of the timeline. */
  index: number;
  /** Colorref to draw. */
  color: string;
  state: {
    position: number;
    selection: number[];
  };
}

export interface ISingleAnalysisTool {
  render: () => SingleAnalysisTool;
  setCaptureCallback: (fnCallback: CaptureCallback, asImage: boolean) => void;
  captureImage: (region?: boolean) => void;
  getState: () => string /* ISingleAnalysisToolState */;
  setState: (state: string | ISingleAnalysisToolState) => void;
  loadMedia: (newMedia: SingleAnalysisMediaSpecifier) => void;
  showImage: (id: string) => void;
  on: (
    type: SingleAnalysisEvent,
    fn: SingleAnalysisEventHandler,
    uid: string
  ) => SingleAnalysisTool;
  hideImage: () => void;
  setHighlights: (states: ITimelineState[]) => void;
  clearDrawings: () => void;
  setFps: (fps: number) => void;
  resizeTool: (width?: number, height?: number) => void;
}

export type SingleAnalysisTool = (
  settings: ISingleAnalysisToolSettings
) => ISingleAnalysisTool;
