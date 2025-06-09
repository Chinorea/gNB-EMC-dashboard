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

export default function CellIdentityCard({ data, isLoading, nodeStatus }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  
  const cellIdentityModalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 800,
    bgcolor: colors.background.paper,
    border: `2px solid ${colors.border.dark}`,
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };
  
  const [isCellIdentityModalOpen, setIsCellIdentityModalOpen] = useState(false);
  const [cellIdentityEditDialog, setCellIdentityEditDialog] = useState({ open: false, field: '', currentValue: '', label: '' });
  const [cellIdentityEditValue, setCellIdentityEditValue] = useState('');

  const handleOpenCellIdentityModal = () => setIsCellIdentityModalOpen(true);
  const handleCloseCellIdentityModal = () => setIsCellIdentityModalOpen(false);

  const handleCellIdentityEditClick = (field, currentValue, label) => {
    setCellIdentityEditDialog({ open: true, field, currentValue, label });
    setCellIdentityEditValue(currentValue);
  };

  const handleCellIdentityEditClose = () => {
    setCellIdentityEditDialog({ open: false, field: '', currentValue: '', label: '' });
    setCellIdentityEditValue('');
  };

  const handleCellIdentityEditSave = async () => {
    try {
      // Get the node IP from the current URL or pass it as a prop
      const nodeIp = window.location.pathname.split('/node/')[1];
      
      const response = await fetch(`http://${nodeIp}:5000/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: cellIdentityEditDialog.field,
          value: cellIdentityEditValue
        })
      });

      if (response.ok) {
        console.log(`Successfully updated ${cellIdentityEditDialog.field} to ${cellIdentityEditValue}`);
        // You might want to trigger a refresh of the data here
        handleCellIdentityEditClose();
      } else {
        const error = await response.json();
        console.error('Failed to update config:', error);
        alert(`Failed to update: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Error updating configuration');
    }
  };

  if (!data) return null;
  return (
    <>
      <Card
        elevation={3}
        onClick={handleOpenCellIdentityModal}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
          height: '100%',
          transition: 'transform 0.1s ease-in-out',
          backgroundColor: colors.background.paper,
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: colors.background.hover,
          },
          cursor: 'pointer'
        }}
      >
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 1, width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.2rem', flexGrow: 1 }}
                >
                  5G Cell Identity
                </Typography>              </Box>
              <Grid container spacing={1} sx={{ mt: 1 }} justifyContent="center" alignItems="flex-start">
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                  >
                    MCC
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.MCC || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    MNC
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.MNC || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    Cell ID
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.cell_id || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>          </Box>
         </Card>

       <Modal
         open={isCellIdentityModalOpen}
         onClose={handleCloseCellIdentityModal}
         closeAfterTransition
         BackdropComponent={Backdrop}
         BackdropProps={{ timeout: 150 }}
       >
         <Fade in={isCellIdentityModalOpen} timeout={150}>
           <Box sx={cellIdentityModalStyle}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
               <Typography variant="h6" sx={{ fontWeight: 'bold' }}>5G Cell Identity Details</Typography>
               <IconButton onClick={handleCloseCellIdentityModal}>
                 <CloseIcon />
               </IconButton>
             </Box>
             {/* Optional subtitle or description below the title */}
             <Box sx={{ mt: 1 }}>
               <Typography
                 color="textSecondary"
                 variant="subtitle2"
                 sx={{ fontSize: '1.1rem', textAlign: 'justify' }}
               >
                Do note that it takes a few seconds for the changes to take effect after pressing "Save". Configurations cannot be changed when the node is broadcasting.
               </Typography>
             </Box>
             <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    Mobile Country Code (MCC)
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.MCC || 'N/A'}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleCellIdentityEditClick('MCC', data.MCC, 'MCC'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    Mobile Network Code (MNC)
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.MNC || 'N/A'}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleCellIdentityEditClick('MNC', data.MNC, 'MNC'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    Cell Identity (Cell ID)
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.cell_id || 'N/A'}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleCellIdentityEditClick('cell_id', data.cell_id, 'Cell ID'); }}
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
       <Dialog open={cellIdentityEditDialog.open} onClose={handleCellIdentityEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit {cellIdentityEditDialog.label}
        </DialogTitle>
         <DialogContent>
           <TextField
             autoFocus
             margin="dense"
             label={cellIdentityEditDialog.label}
             fullWidth
             variant="outlined"
             value={cellIdentityEditValue}
             onChange={(e) => setCellIdentityEditValue(e.target.value)}
             onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCellIdentityEditSave();
              }
            }}
             InputProps={{
              sx: { fontSize: '1.2rem' }  // larger input text
            }}
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCellIdentityEditClose}>Cancel</Button>
           <Button onClick={handleCellIdentityEditSave} variant="contained">Save</Button>         </DialogActions>
       </Dialog>
     </>
   );
}
