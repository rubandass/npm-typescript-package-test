import { TextField, Button, Grid } from "@material-ui/core";
import AlertDialog from "./AlertDialog";
import React, { ChangeEvent, useState } from "react";

const Greeter = () => {
  const [textFiledValue, setTextFieldValue] = useState<string>("");
  const [showAlert, setShowAlert] = useState(false);

  const handleTextFieldValue = (event: ChangeEvent<HTMLInputElement>) => {
    setTextFieldValue(event.target.value);
  };

  const handleSubmit = () => {
    setShowAlert(true);
  };

  const handleClose = () => {
    setShowAlert(false);
  };

  return (
    <>
      <Grid container alignItems="center">
        <p>Hello user</p>
        <TextField
          variant="outlined"
          label="Enter your name"
          onChange={handleTextFieldValue}
        />
        <Button onClick={handleSubmit}>Submit</Button>
        {showAlert && (
          <AlertDialog
            title="Welcome"
            message={`Hello ${textFiledValue}!`}
            onClose={handleClose}
          />
        )}
      </Grid>
    </>
  );
};

export default Greeter;
