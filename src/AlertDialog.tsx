import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";
import Typography from "@material-ui/core/Typography";

interface AlertDialogProps {
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
}

const AlertDialog = (props: AlertDialogProps) => {
  return (
    <Dialog
      open
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{props.message}</Typography>
        <Typography variant="caption">{props.details}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
