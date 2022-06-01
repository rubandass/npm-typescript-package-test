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
import { AnalysisToolConstants, } from "./types";
import "./videoplayer";
/** Returns a unique identifier each time it's called. */
var uniqueTargetID = (function () {
    var id = 1;
    return function () { return "analysis-".concat(id++); };
})();
/**
 * Analysis tool component to run the Bracken 1 JavaScript analysis tool.
 */
var AnalysisToolComponent = function (props) {
    var targetID = useState(uniqueTargetID())[0];
    var _a = useState(), currentTool = _a[0], setCurrentTool = _a[1];
    useEffect(function () {
        if (currentTool) {
            currentTool.loadMedia([props.mediaUrl, props.thumbUrl || ""]);
        }
    }, [currentTool, props.mediaUrl, props.thumbUrl]);
    useEffect(function () {
        if (currentTool) {
            currentTool.resizeTool(props.width, props.height);
        }
    }, [currentTool, props.width, props.height]);
    // Listen for events that request a screenshot to be captured.
    useEffect(function () {
        var tokens = [
            PubSub.subscribe(AnalysisToolConstants.Events.TRIGGER_CAPTURE, function (msg, data) {
                if (currentTool) {
                    currentTool.captureImage(data.region);
                }
            }),
            PubSub.subscribe(AnalysisToolConstants.Events.SEEK, function (msg, data) {
                if (currentTool) {
                    currentTool.setState(data);
                }
            }),
        ];
        return function () { return void tokens.forEach(function (token) { return PubSub.unsubscribe(token); }); };
    }, [currentTool]);
    useEffect(function () {
        if (currentTool) {
            currentTool.setCaptureCallback(
            /**
             * Callback from the tool when it has captured a screenshot.
             * @param _ Callback function. The parameter is not used.
             * @param data Callback payload. The AnalysisTool.delegate has been configured
             * to pass the captured image base64 data.
             */
            function (_, data) {
                var base64 = data.ImageNameGuid;
                var toolStateString = currentTool.getState();
                var toolState = toolStateString && JSON.parse(toolStateString);
                var state = !toolStateString
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
                    base64: base64,
                    state: state,
                });
            }, false);
        }
    }, [currentTool]);
    // Tool setup.
    useEffect(function () {
        var tool = AnalysisTool.singleAnalysisTool({
            mediaUrl: ["", ""],
            targetID: targetID,
            // TODO: Allow auto height for video analysis!
            height: 500,
        });
        if (tool) {
            tool.render();
            setCurrentTool(tool);
        }
        return function () {
            setCurrentTool(undefined);
            var el = document.querySelector("#".concat(targetID));
            if (el) {
                el.innerHTML = "";
            }
        };
    }, [targetID]);
    return React.createElement("div", { id: targetID, style: { height: 570 } });
};
export default AnalysisToolComponent;
