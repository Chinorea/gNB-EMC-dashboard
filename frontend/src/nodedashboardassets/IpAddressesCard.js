// frontend/src/nodedashboardassets/IpAddressesCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

export default function IpAddressesCard({ data, isLoading }) {
  if (!data) {
    return null;
  }

  return (
    <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
      <Card
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          transition: 'transform 0.1s ease-in-out, background-color 0.2s ease-in-out', // Added background-color to transition
          backgroundColor: '#fafafa', // Default slight grey, or loading color
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: '#ffffff', // White on hover
          },
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 1 }}>
          <Typography
            color="textSecondary"
            gutterBottom
            variant="subtitle2"
            sx={{ fontSize: '1.2rem' }}
          >
            IP Addresses
          </Typography>
          <Grid container spacing={1} sx={{ mt: 3 }}>
            <Grid item xs={4}>
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
            <Grid item xs={4}>
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
            <Grid item xs={4}>
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
      </Card>
    </Grid>
  );
}