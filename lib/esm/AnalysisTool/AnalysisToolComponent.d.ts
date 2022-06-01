/// <reference types="react" />
import "./analysistool.css";
import "./common";
import "./delegate";
import "./drawbar";
import "./drawingengine";
import "./drawtools";
import "./dual";
import "./dualvideocontrol";
import "./events";
import "./icon";
import "./images/AnalysisTools/MuiPlayArrow.svg";
import "./single";
import "./singlevideocontrol";
import "./syncbar";
import "./timeline";
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
/**
 * Analysis tool component to run the Bracken 1 JavaScript analysis tool.
 */
declare const AnalysisToolComponent: (props: IAnalysisToolComponentProps) => JSX.Element;
export default AnalysisToolComponent;
