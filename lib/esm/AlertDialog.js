import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";
import Typography from "@material-ui/core/Typography";
var AlertDialog = function (props) {
    return (React.createElement(Dialog, { open: true, "aria-labelledby": "alert-dialog-title", "aria-describedby": "alert-dialog-description" },
        React.createElement(DialogTitle, { id: "alert-dialog-title" }, props.title),
        React.createElement(DialogContent, null,
            React.createElement(Typography, { variant: "body1" }, props.message),
            React.createElement(Typography, { variant: "caption" }, props.details)),
        React.createElement(DialogActions, null,
            React.createElement(Button, { onClick: props.onClose, color: "primary", autoFocus: true }, "OK"))));
};
export default AlertDialog;
