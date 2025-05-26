import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  CardActionArea,
  Box,
  Modal,
  Paper,
  Fade,
  Backdrop // Import Backdrop for modal transition
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function IpAddressesCard({ data, isLoading }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  if (!data) {
    return null;
  }

  return (
    <>
      <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
        <Card
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            transition: 'transform 0.1s ease-in-out, background-color 0.2s ease-in-out',
            backgroundColor: isLoading ? '#fff3cd' : '#f5f5f5',
            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: 6,
              backgroundColor: '#ffffff',
            },
          }}
        >
          <CardActionArea onClick={handleOpenModal} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 1, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.2rem', flexGrow: 1 }}
                >
                  IP Addresses
                </Typography>
                <ExpandMore
                  expand={isModalOpen}
                  aria-expanded={isModalOpen}
                  aria-label="show more details"
                >
                  <ExpandMoreIcon />
                </ExpandMore>
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
          </CardActionArea>
        </Card>
      </Grid>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 150,
        }}
      >
        <Fade in={isModalOpen} timeout={150}>
          <Box sx={modalStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">IP Address Details</Typography>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Same IP address fields as the card */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <Typography color="textSecondary" variant="subtitle2">
                  gNB IP
                </Typography>
                <Typography variant="h6">{data.ip_address_gnb}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography color="textSecondary" variant="subtitle2">
                  NgC IP
                </Typography>
                <Typography variant="h6">{data.ip_address_ngc}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography color="textSecondary" variant="subtitle2">
                  NgU IP
                </Typography>
                <Typography variant="h6">{data.ip_address_ngu}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}