// frontend/src/nodedashboardassets/FrequencyOverviewCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

export default function FrequencyOverviewCard({ data, isLoading }) {
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
          transition: 'transform 0.1s ease-in-out',
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: '#fff',
          },
          backgroundColor: '#fafafa' 
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 1 }}>
          <Typography
            color="textSecondary"
            gutterBottom
            variant="subtitle2"
            sx={{
              fontSize: '1.2rem',
            }}
          >
            Frequency Overview
          </Typography>
          <Grid container spacing={1} columnSpacing={4} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Typography
                color="textSecondary"
                gutterBottom variant="subtitle2"
                sx={{fontSize: '1.0rem'}}
              >
                Downlink
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {data.frequency_down_link} GHz
              </Typography>
              <Typography variant="h5" sx={{
                fontWeight: 'bold',
                fontSize: '1.3rem',
                mt: 0.5 }}>
                {data.bandwidth_down_link} MHz
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                color="textSecondary"
                gutterBottom variant="subtitle2"
                sx={{fontSize: '1.0rem'}}
              >
                Uplink
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {data.frequency_up_link} GHz
              </Typography>
              <Typography variant="h5" sx={{
                fontWeight: 'bold',
                fontSize: '1.3rem',
                mt: 0.5 }}>
                {data.bandwidth_up_link} MHz
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                color="textSecondary"
                gutterBottom variant="subtitle2"
                sx={{fontSize: '1.0rem'}}
              >
                TX Power
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {data.tx_power}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}