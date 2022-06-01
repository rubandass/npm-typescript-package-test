"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@material-ui/core");
var AlertDialog_1 = __importDefault(require("./AlertDialog"));
var react_1 = __importStar(require("react"));
var Greeter = function () {
    var _a = (0, react_1.useState)(""), textFiledValue = _a[0], setTextFieldValue = _a[1];
    var _b = (0, react_1.useState)(false), showAlert = _b[0], setShowAlert = _b[1];
    var handleTextFieldValue = function (event) {
        setTextFieldValue(event.target.value);
    };
    var handleSubmit = function () {
        setShowAlert(true);
    };
    var handleClose = function () {
        setShowAlert(false);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(core_1.Grid, { container: true, alignItems: "center" },
            react_1.default.createElement("p", null, "Hello user"),
            react_1.default.createElement(core_1.TextField, { variant: "outlined", label: "Enter your name", onChange: handleTextFieldValue }),
            react_1.default.createElement(core_1.Button, { onClick: handleSubmit }, "Submit"),
            showAlert && (react_1.default.createElement(AlertDialog_1.default, { title: "Welcome", message: "Hello ".concat(textFiledValue, "!"), onClose: handleClose })))));
};
exports.default = Greeter;
