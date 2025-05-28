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
  width: '90%',      // increased width
  maxWidth: 800,     // increased maxWidth
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function IpAddressesCard({ data, isLoading, nodeStatus }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, field: '', currentValue: '', label: '' });
  const [editValue, setEditValue] = useState('');

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleEditClick = (field, currentValue, label) => {
    setEditDialog({ open: true, field, currentValue, label });
    setEditValue(currentValue);
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, field: '', currentValue: '', label: '' });
    setEditValue('');
  };

  const handleEditSave = async () => {
    try {
      // Get the node IP from the current URL or pass it as a prop
      const nodeIp = window.location.pathname.split('/node/')[1];
      
      const response = await fetch(`http://${nodeIp}:5000/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: editDialog.field,
          value: editValue
        })
      });

      if (response.ok) {
        console.log(`Successfully updated ${editDialog.field} to ${editValue}`);
        // You might want to trigger a refresh of the data here
        handleEditClose();
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
      <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
        <Card
          elevation={3}
          onClick={handleOpenModal}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            transition: 'transform 0.1s ease-in-out, background-color 0.2s ease-in-out',
            backgroundColor: '#fafafa',
            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: 6,
              backgroundColor: '#ffffff',
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
                  IP Addresses
                </Typography>
              </Box>
              <Grid container spacing={1} sx={{ mt: 3 }}>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                  >
                    gNB IP
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.ip_address_gnb}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    NgC IP
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.ip_address_ngc}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    NgU IP
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {data.ip_address_ngu}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Box>
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
               <Typography variant="h6" sx={{ fontWeight: 'bold' }}>IP Address Details</Typography>
               <IconButton onClick={handleCloseModal}>
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
                    gNB IP
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.ip_address_gnb}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleEditClick('gnbIP', data.ip_address_gnb, 'gNB IP'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    NgC IP
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.ip_address_ngc}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleEditClick('ngcIp', data.ip_address_ngc, 'NgC IP'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                 <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                    NgU IP
                  </Typography>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {data.ip_address_ngu}
                 </Typography>
                </Box>
                {nodeStatus === 'OFF' && !isLoading && (
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleEditClick('nguIp', data.ip_address_ngu, 'NgU IP'); }}
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
             onChange={(e) => setEditValue(e.target.value)}
             InputProps={{
              sx: { fontSize: '1.2rem' }  // larger input text
            }}
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