import { TextField, Button, Grid } from "@material-ui/core";
import AlertDialog from "./AlertDialog";
import React, { useState } from "react";
var Greeter = function () {
    var _a = useState(""), textFiledValue = _a[0], setTextFieldValue = _a[1];
    var _b = useState(false), showAlert = _b[0], setShowAlert = _b[1];
    var handleTextFieldValue = function (event) {
        setTextFieldValue(event.target.value);
    };
    var handleSubmit = function () {
        setShowAlert(true);
    };
    var handleClose = function () {
        setShowAlert(false);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(Grid, { container: true, alignItems: "center" },
            React.createElement("p", null, "Hello user"),
            React.createElement(TextField, { variant: "outlined", label: "Enter your name", onChange: handleTextFieldValue }),
            React.createElement(Button, { onClick: handleSubmit }, "Submit"),
            showAlert && (React.createElement(AlertDialog, { title: "Welcome", message: "Hello ".concat(textFiledValue, "!"), onClose: handleClose })))));
};
export default Greeter;
