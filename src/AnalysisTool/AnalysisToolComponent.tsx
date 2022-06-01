import PubSub from "pubsub-js";
import React, { useEffect, useState } from "react";
import "./analysistool.css";
import "./common";
import "./delegate";
import "./drawbar";
import "./drawingengine";
import "./drawtools";
import "./dual";
import "./dualvideocontrol";
import "./events"; // Events must be before other imports.
import "./icon";
import "./images/AnalysisTools/MuiPlayArrow.svg";
import { AnalysisTool } from "./shim";
import "./single";
import "./singlevideocontrol";
import "./syncbar";
import "./timeline";
import {
  AnalysisToolConstants,
  ISingleAnalysisCaptureState,
  ISingleAnalysisTool,
  ITriggerCaptureEventParams,
} from "./types";
import "./videoplayer";

/** Configuration properties for an AnalysisToolComponent. */
export interface IAnalysisToolComponentProps {
  /** Fully qualified URL to media item to play. */
  mediaUrl: string;
  /** Fully qualified URL to poster image, if the media is a video. */
  thumbUrl?: string;
  /** Optional width of the analysis tool. */
  width?: number;
  /** Optional height of the analysis tool. */
  height?: number;
}

/** Returns a unique identifier each time it's called. */
const uniqueTargetID = (() => {
  let id = 1;
  return () => `analysis-${id++}`;
})();

/**
 * Analysis tool component to run the Bracken 1 JavaScript analysis tool.
 */
const AnalysisToolComponent = (props: IAnalysisToolComponentProps) => {
  const [targetID] = useState(uniqueTargetID());
  const [currentTool, setCurrentTool] = useState<
    ISingleAnalysisTool | undefined
  >();

  useEffect(() => {
    if (currentTool) {
      currentTool.loadMedia([props.mediaUrl, props.thumbUrl || ""]);
    }
  }, [currentTool, props.mediaUrl, props.thumbUrl]);

  useEffect(() => {
    if (currentTool) {
      currentTool.resizeTool(props.width, props.height);
    }
  }, [currentTool, props.width, props.height]);

  // Listen for events that request a screenshot to be captured.
  useEffect(() => {
    const tokens = [
      PubSub.subscribe(
        AnalysisToolConstants.Events.TRIGGER_CAPTURE,
        (msg: string, data: ITriggerCaptureEventParams) => {
          if (currentTool) {
            currentTool.captureImage(data.region);
          }
        }
      ),
      PubSub.subscribe(
        AnalysisToolConstants.Events.SEEK,
        (msg: string, data: ISingleAnalysisCaptureState) => {
          if (currentTool) {
            currentTool.setState(data);
          }
        }
      ),
    ];
    return () => void tokens.forEach((token) => PubSub.unsubscribe(token));
  }, [currentTool]);

  useEffect(() => {
    if (currentTool) {
      currentTool.setCaptureCallback(
        /**
         * Callback from the tool when it has captured a screenshot.
         * @param _ Callback function. The parameter is not used.
         * @param data Callback payload. The AnalysisTool.delegate has been configured
         * to pass the captured image base64 data.
         */
        (_, data) => {
          const base64 = data.ImageNameGuid;
          const toolStateString: string | undefined = currentTool.getState();
          const toolState = toolStateString && JSON.parse(toolStateString);
          const state: ISingleAnalysisCaptureState | undefined =
            !toolStateString
              ? undefined
              : {
                  looped: toolState.looped,
                  flipped: toolState.flipped,
                  muted: toolState.muted,
                  position: toolState.position,
                  selection: toolState.selection,
                  duration: toolState.duration,
                };
          PubSub.publish(AnalysisToolConstants.Events.CAPTURE_COMPLETE, {
            base64,
            state,
          });
        },
        false
      );
    }
  }, [currentTool]);

  // Tool setup.
  useEffect(() => {
    const tool = AnalysisTool.singleAnalysisTool({
      mediaUrl: ["", ""],
      targetID,
      // TODO: Allow auto height for video analysis!
      height: 500,
    });

    if (tool) {
      tool.render();
      setCurrentTool(tool);
    }

    return () => {
      setCurrentTool(undefined);
      const el = document.querySelector(`#${targetID}`);
      if (el) {
        el.innerHTML = "";
      }
    };
  }, [targetID]);

  return <div id={targetID} style={{ height: 570 }}></div>;
};

export default AnalysisToolComponent;
