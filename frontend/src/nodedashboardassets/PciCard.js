// frontend/src/nodedashboardassets/PciCard.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Box,
  Modal,
  Fade,
  Backdrop,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function PciCard({ pci, isLoading, nodeStatus }) {
  const label = "PCI";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, field: '', label: '' });
  const [editValue, setEditValue] = useState('');

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleEditClick = (field, currentValue, label) => {
    setEditDialog({ open: true, field, label });
    setEditValue(String(currentValue));
  };
  const handleEditClose = () => {
    setEditDialog({ open: false, field: '', label: '' });
    setEditValue('');
  };
  const handleEditSave = async () => {
    try {
      const nodeIp = window.location.pathname.split('/node/')[1];
      const res = await fetch(`http://${nodeIp}:5000/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: editDialog.field, value: editValue })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to update: ${err.error||'Unknown error'}`);
      }
      handleEditClose();
    } catch {
      alert('Error updating configuration');
    }
  };

  if (pci === undefined || pci === null) return null;

  return (
    <>
      {/* Card Summary */}
      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
        <Card
          elevation={3}
          onClick={handleOpenModal}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            cursor: 'pointer',
            transition: 'transform 0.1s ease-in-out',
            '&:hover': { transform: 'scale(1.01)', boxShadow: 6, backgroundColor: '#fff' },
            backgroundColor: '#fafafa'
          }}
        >
          <CardContent sx={{
            textAlign: 'center',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{ fontSize: '1.2rem', mb: 1 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '1.5rem', wordBreak: 'break-word' }}>
              {String(pci)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Expanded Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 150 }}
      >
        <Fade in={isModalOpen} timeout={150}>
          <Box sx={modalStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                PCI Details
              </Typography>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                sx={{ fontSize: '1.1rem', textAlign: 'justify' }}
              >
                Do note that it takes a few seconds for the changes to take effect after pressing "Save". Configurations cannot be changed when the node is broadcasting.
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography color="textSecondary" variant="subtitle2">
                  PCI
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {String(pci)}
                </Typography>
              </Box>
              {nodeStatus === 'OFF' && !isLoading && (
                <IconButton
                  onClick={e => { e.stopPropagation(); handleEditClick('PCI', pci, 'PCI'); }}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {editDialog.label}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={editDialog.label}
            fullWidth
            variant="outlined"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            InputProps={{ sx: { fontSize: '1.2rem' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}