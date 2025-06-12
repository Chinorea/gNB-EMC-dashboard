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

export default function IpAddressesCard({ data, isLoading, nodeStatus, secondaryIp, nodeInfo }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  
  const ipModalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',      // increased width
    maxWidth: 800,     // increased maxWidth
    bgcolor: colors.background.paper,
    border: `2px solid ${colors.border.dark}`,
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };
  
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [ipEditDialog, setIpEditDialog] = useState({ open: false, field: '', currentValue: '', label: '' });
  const [ipEditValue, setIpEditValue] = useState('');

  const handleOpenIpModal = () => setIsIpModalOpen(true);
  const handleCloseIpModal = () => setIsIpModalOpen(false);

  const handleIpEditClick = (field, currentValue, label) => {
    setIpEditDialog({ open: true, field, currentValue, label });
    setIpEditValue(currentValue);
  };
  const handleIpEditClose = () => {
    setIpEditDialog({ open: false, field: '', currentValue: '', label: '' });
    setIpEditValue('');
  };  const handleIpEditSave = async () => {
    if (!nodeInfo) {
      alert('NodeInfo instance not available');
      return;
    }

    try {
      // If editing gNB IP, we need to update both n3_local_ip and n2_local_ip
      if (ipEditDialog.field === 'n3_local_ip') {
        // Update both N3 and N2 local IP addresses using editConfigWithRefresh
        const result1 = await nodeInfo.editConfigWithRefresh('n3_local_ip', ipEditValue);
        const result2 = await nodeInfo.editConfigWithRefresh('n2_local_ip', ipEditValue);
        
        if (result1.success && result2.success) {
          console.log(`Successfully updated both n3_local_ip and n2_local_ip to ${ipEditValue}`);
          handleIpEditClose();
        } else {
          const errors = [];
          if (!result1.success) errors.push(`n3_local_ip: ${result1.error || 'Unknown error'}`);
          if (!result2.success) errors.push(`n2_local_ip: ${result2.error || 'Unknown error'}`);
          alert(`Failed to update: ${errors.join(', ')}`);
        }
      } else {
        // For other IP fields, update normally
        const result = await nodeInfo.editConfigWithRefresh(ipEditDialog.field, ipEditValue);
        
        if (result.success) {
          console.log(`Successfully updated ${ipEditDialog.field} to ${ipEditValue}`);
          handleIpEditClose();
        } else {
          alert(`Failed to update: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Error updating configuration');
    }
  };

  if (!data) return null;

  return (
    <>
      <Grid item xs={12} md={4} sx={{ display: 'flex' }}>        <Card
          elevation={3}
          onClick={handleOpenIpModal}          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
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
                  IP Addresses (Configuration)
                </Typography>              </Box>
              <Grid container spacing={1} sx={{ mt: 1 }} justifyContent="center" alignItems="flex-start">
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
                <Grid item xs={4} sm={4}>
                  <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                    MANET IP
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                    }}>
                    {secondaryIp || 'Not Configured'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Box>
         </Card>
       </Grid>       <Modal
         open={isIpModalOpen}
         onClose={handleCloseIpModal}
         closeAfterTransition
         BackdropComponent={Backdrop}
         BackdropProps={{ timeout: 150 }}
       >
         <Fade in={isIpModalOpen} timeout={150}>
           <Box sx={ipModalStyle}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
               <Typography variant="h6" sx={{ fontWeight: 'bold' }}>IP Address Details</Typography>
               <IconButton onClick={handleCloseIpModal}>
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
                </Box>                {nodeStatus === 'OFF' && !isLoading && (                  <IconButton
                    onClick={e => { e.stopPropagation(); handleIpEditClick('n3_local_ip', data.ip_address_gnb, 'gNB IP'); }}
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
                {nodeStatus === 'OFF' && !isLoading && (                  <IconButton
                    onClick={e => { e.stopPropagation(); handleIpEditClick('n2_remote_ip', data.ip_address_ngc, 'NgC IP'); }}
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
                {nodeStatus === 'OFF' && !isLoading && (                  <IconButton
                    onClick={e => { e.stopPropagation(); handleIpEditClick('n3_remote_ip', data.ip_address_ngu, 'NgU IP'); }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
           </Box>
         </Fade>
       </Modal>       {/* Edit Dialog */}
       <Dialog open={ipEditDialog.open} onClose={handleIpEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit {ipEditDialog.label}
        </DialogTitle>
         <DialogContent>
           <TextField
             autoFocus
             margin="dense"
             label={ipEditDialog.label}
             fullWidth
             variant="outlined"
             value={ipEditValue}
             onChange={(e) => setIpEditValue(e.target.value)}
             onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleIpEditSave();
              }
            }}
             InputProps={{
              sx: { fontSize: '1.2rem' }  // larger input text
            }}
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={handleIpEditClose}>Cancel</Button>
           <Button onClick={handleIpEditSave} variant="contained">Save</Button>
         </DialogActions>
       </Dialog>
     </>
   );
}