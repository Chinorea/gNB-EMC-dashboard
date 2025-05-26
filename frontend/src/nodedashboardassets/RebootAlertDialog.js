// frontend/src/nodedashboardassets/RebootAlertDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

export default function RebootAlertDialog({ open, onClose: parentOnClose }) { // Renamed onClose to parentOnClose for clarity
  const handleDialogClose = (event, reason) => {
    if (reason && reason === 'backdropClick') {
      // Prevent dialog from closing on backdrop click
      return;
    }
    // For other reasons (like escape key, if not disabled), or if called programmatically without a reason
    if (parentOnClose) {
      parentOnClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose} // Use the new handler
      aria-labelledby="reboot-alert-title"
      aria-describedby="reboot-alert-description"
      // To also prevent closing with the Escape key, you could add:
      // disableEscapeKeyDown={true}
    >
      <DialogTitle
        id="reboot-alert-title"
        sx={{
          textAlign: 'center',
          fontSize: '1.8rem',
          fontWeight: 'bold'
        }}
      >
        Initialisation Timeout
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="reboot-alert-description"
          sx={{
            textAlign: 'center',
            fontSize: '1.2rem'
          }}
        >
          The initialisation has timed out. In this version the node cannot start
          again once stopped—you must do a hard reboot.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {/* This button will still correctly close the dialog by calling parentOnClose */}
        <Button onClick={parentOnClose} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}