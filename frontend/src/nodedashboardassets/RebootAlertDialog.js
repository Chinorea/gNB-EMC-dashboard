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

export default function RebootAlertDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="reboot-alert-title"
      aria-describedby="reboot-alert-description"
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
        <Button onClick={onClose} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}