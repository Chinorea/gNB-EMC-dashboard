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
  DialogActions,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { getThemeColors } from '../theme';

export default function NodeIdCard({ nodeId, isLoading, nodeStatus, data, nodeInfo }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({
    open: false,
    field: '',
    label: ''
  });
  const [editValue, setEditValue] = useState('');

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',     // increased modal width
    maxWidth: 800,    // increased maxWidth
    bgcolor: 'background.paper',
    border: `2px solid ${colors.border.dark}`,
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleEditClick = (field, currentValue, label) => {
    setEditDialog({ open: true, field, label });
    setEditValue(currentValue);
  };
  const handleEditClose = () => {
    setEditDialog({ open: false, field: '', label: '' });
    setEditValue('');
  };  const handleEditSave = async () => {
    if (!nodeInfo) {
      alert('NodeInfo instance not available');
      return;
    }

    const result = await nodeInfo.editConfigWithRefresh(editDialog.field, editValue);
    
    if (result.success) {
      console.log('Configuration updated successfully!');
      handleEditClose();
    } else {
      alert(`Failed to update: ${result.error || 'Unknown error'}`);
    }
  };

  if (nodeId === undefined || nodeId === null) return null;

  return (
    <>
      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
        <Card
          elevation={3}
          onClick={handleOpenModal}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            transition: 'transform 0.1s ease-in-out',            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: 6,
              backgroundColor: colors.background.hover
            },
            backgroundColor: colors.background.paper,
            cursor: 'pointer'
          }}
        >          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="subtitle2"
              sx={{ fontSize: '1.2rem' }}
            >
              Node ID (Configuration)
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }} justifyContent="center" alignItems="flex-start">
              <Grid item xs={4}>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.0rem' }}
                >
                  Node ID
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                  {String(nodeId)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.0rem' }}
                >
                  GNB ID Length
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {data?.gnb_id_length || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.0rem' }}
                >
                  NR Band
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {data?.nr_band || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

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
                Node ID Details
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
                Do note that it takes a few seconds for the changes to take effect after pressing "Save". 
                Configurations cannot be changed when the node is broadcasting.
              </Typography>
            </Box>            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Node ID */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    Node ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {String(nodeId)}
                  </Typography>
                </Box>                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleEditClick('gNBId', nodeId, 'Node ID'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {/* GNB ID Length */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    GNB ID Length
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {data?.gnb_id_length || 'N/A'}
                  </Typography>
                </Box>                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleEditClick('gNBIdLength', data?.gnb_id_length, 'GNB ID Length'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {/* NR Band */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    NR Band
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {data?.nr_band || 'N/A'}
                  </Typography>
                </Box>                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleEditClick('band', data?.nr_band, 'NR Band'); }}
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
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}