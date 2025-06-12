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

export default function NetworkSliceCard({ data, isLoading, nodeStatus, nodeInfo }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  
  const networkSliceModalStyle = {
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
  
  const [isNetworkSliceModalOpen, setIsNetworkSliceModalOpen] = useState(false);
  const [networkSliceEditDialog, setNetworkSliceEditDialog] = useState({ open: false, field: '', currentValue: '', label: '' });
  const [networkSliceEditValue, setNetworkSliceEditValue] = useState('');

  const handleOpenNetworkSliceModal = () => setIsNetworkSliceModalOpen(true);
  const handleCloseNetworkSliceModal = () => setIsNetworkSliceModalOpen(false);

  const handleNetworkSliceEditClick = (field, currentValue, label) => {
    setNetworkSliceEditDialog({ open: true, field, currentValue, label });
    setNetworkSliceEditValue(currentValue);
  };

  const handleNetworkSliceEditClose = () => {
    setNetworkSliceEditDialog({ open: false, field: '', currentValue: '', label: '' });
    setNetworkSliceEditValue('');
  };  const handleNetworkSliceEditSave = async () => {
    if (!nodeInfo) {
      alert('NodeInfo instance not available');
      return;
    }

    const result = await nodeInfo.editConfigWithRefresh(networkSliceEditDialog.field, networkSliceEditValue);
    
    if (result.success) {
      console.log('Configuration updated successfully!');
      handleNetworkSliceEditClose();
    } else {
      alert(`Failed to update: ${result.error || 'Unknown error'}`);
    }
  };

  if (!data) return null;
  return (
    <>      <Card
        elevation={3}
        onClick={handleOpenNetworkSliceModal}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '45%',
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
                  5G Network Slice
                </Typography>              </Box>
              <Grid container spacing={1} sx={{ mt: 1 }} justifyContent="center" alignItems="flex-start">
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                  >
                    NRTAC
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.NRTAC || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    SST
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.SST || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    SD
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.SD || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>          </Box>
         </Card>

       <Modal
         open={isNetworkSliceModalOpen}
         onClose={handleCloseNetworkSliceModal}
         closeAfterTransition
         BackdropComponent={Backdrop}
         BackdropProps={{ timeout: 150 }}
       >
         <Fade in={isNetworkSliceModalOpen} timeout={150}>
           <Box sx={networkSliceModalStyle}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
               <Typography variant="h6" sx={{ fontWeight: 'bold' }}>5G Network Slice Details</Typography>
               <IconButton onClick={handleCloseNetworkSliceModal}>
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
                    NR Tracking Area Code (NRTAC)
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.NRTAC || 'N/A'}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (                  <IconButton
                    onClick={e => { e.stopPropagation(); handleNetworkSliceEditClick('nrTAC', data.NRTAC, 'NRTAC'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    Slice/Service Type (SST)
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.SST || 'N/A'}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (                  <IconButton
                    onClick={e => { e.stopPropagation(); handleNetworkSliceEditClick('sst', data.SST, 'SST'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    Slice Differentiator (SD)
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.SD || 'N/A'}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (                  <IconButton
                    onClick={e => { e.stopPropagation(); handleNetworkSliceEditClick('sd', data.SD, 'SD'); }}
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
       <Dialog open={networkSliceEditDialog.open} onClose={handleNetworkSliceEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit {networkSliceEditDialog.label}
        </DialogTitle>
         <DialogContent>
           <TextField
             autoFocus
             margin="dense"
             label={networkSliceEditDialog.label}
             fullWidth
             variant="outlined"
             value={networkSliceEditValue}
             onChange={(e) => setNetworkSliceEditValue(e.target.value)}
             onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleNetworkSliceEditSave();
              }
            }}
             InputProps={{
              sx: { fontSize: '1.2rem' }  // larger input text
            }}
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={handleNetworkSliceEditClose}>Cancel</Button>
           <Button onClick={handleNetworkSliceEditSave} variant="contained">Save</Button>
         </DialogActions>
       </Dialog>
     </>
   );
}
