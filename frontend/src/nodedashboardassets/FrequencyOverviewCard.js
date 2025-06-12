// frontend/src/nodedashboardassets/FrequencyOverviewCard.js
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
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

// helper: convert kHz → GHz and round to 2 decimal places
const formatGhz = (khz) => {
  const num = parseFloat(khz);
  if (isNaN(num)) return 'N/A';
  return (num / 1e6).toFixed(2);
};

export default function FrequencyOverviewCard({ data, isLoading, nodeStatus }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',    // increased width
    maxWidth: 800,   // increased maxWidth
    bgcolor: 'background.paper',
    border: `2px solid ${colors.border.dark}`,
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({
    open: false,
    field: '',
    currentValue: '',
    label: ''
  });
  const [editValue, setEditValue] = useState('');

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleEditClick = (field, currentValue, label) => {
    setEditDialog({ open: true, field, currentValue, label });
    setEditValue(String(currentValue));
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, field: '', currentValue: '', label: '' });
    setEditValue('');
  };

  const handleEditSave = async () => {
    try {
      const nodeIp = window.location.pathname.split('/node/')[1];
      const response = await fetch(`http://${nodeIp}:5000/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: editDialog.field,
          value: editValue
        })
      });
      if (response.ok) {
        handleEditClose();
      } else {
        const err = await response.json();
        alert(`Failed to update: ${err.error || 'Unknown error'}`);
      }
    } catch {
      alert('Error updating configuration');
    }
  };

  if (!data) return null;

  return (
    <>
      {/* Card view */}
      <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
        <Card
          elevation={3}
          onClick={handleOpenModal}
          sx={{
            display: 'flex',
            flexDirection: 'column',            flex: 1,
            transition: 'transform 0.1s ease-in-out',
            backgroundColor: colors.background.paper,
            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: 6,
              backgroundColor: colors.background.hover
            },
            cursor: 'pointer'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 1 }}>            <Typography
              color="textSecondary"
              gutterBottom
              variant="subtitle2"
              sx={{ fontSize: '1.2rem' }}
            >
              Frequency Overview
            </Typography>
            <Grid container spacing={1} columnSpacing={4} sx={{ mt: 1 }} justifyContent="center" alignItems="flex-start">
              <Grid item xs={4}>
                <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{ fontSize: '1.0rem' }}>
                  Center Frequency
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatGhz(data.frequency_down_link)} GHz
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.0rem' }}
                >
                  TX Power
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {data.tx_power}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{ fontSize: '1.0rem' }}>
                  SCS
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {data.scs || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
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
                Frequency Details
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
            </Box>            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Center Frequency */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    Center Frequency (kHz)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {data.frequency_down_link} KHz
                  </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton                    onClick={e => {
                      e.stopPropagation();
                      handleEditClick('dl_centre_freq', data.frequency_down_link, 'Center Frequency (KHz)');
                    }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {/* TX Power */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    TX Power
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {data.tx_power}
                  </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton                    onClick={e => {
                      e.stopPropagation();
                      handleEditClick('txMaxPower', data.tx_power, 'TX Power');
                    }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {/* SCS */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    SCS
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {data.scs || 'N/A'}
                  </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => {
                      e.stopPropagation();
                      handleEditClick('scs', data.scs, 'SCS');
                    }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit {editDialog.label}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={editDialog.label}
            fullWidth
            variant="outlined"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEditSave();
              }
            }}
            InputProps={{ sx: { fontSize: '1.2rem' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}