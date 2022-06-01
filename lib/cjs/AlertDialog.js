"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Button_1 = __importDefault(require("@material-ui/core/Button"));
var Dialog_1 = __importDefault(require("@material-ui/core/Dialog"));
var DialogActions_1 = __importDefault(require("@material-ui/core/DialogActions"));
var DialogContent_1 = __importDefault(require("@material-ui/core/DialogContent"));
var DialogTitle_1 = __importDefault(require("@material-ui/core/DialogTitle"));
var react_1 = __importDefault(require("react"));
var Typography_1 = __importDefault(require("@material-ui/core/Typography"));
var AlertDialog = function (props) {
    return (react_1.default.createElement(Dialog_1.default, { open: true, "aria-labelledby": "alert-dialog-title", "aria-describedby": "alert-dialog-description" },
        react_1.default.createElement(DialogTitle_1.default, { id: "alert-dialog-title" }, props.title),
        react_1.default.createElement(DialogContent_1.default, null,
            react_1.default.createElement(Typography_1.default, { variant: "body1" }, props.message),
            react_1.default.createElement(Typography_1.default, { variant: "caption" }, props.details)),
        react_1.default.createElement(DialogActions_1.default, null,
            react_1.default.createElement(Button_1.default, { onClick: props.onClose, color: "primary", autoFocus: true }, "OK"))));
};
exports.default = AlertDialog;
