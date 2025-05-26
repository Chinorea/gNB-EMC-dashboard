// frontend/src/nodedashboardassets/CoreConnectionCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

export default function CoreConnectionCard({ coreConnectionStatus, isLoading }) {
  const label = "Connection to Core";

  return (
    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
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
          },
          backgroundColor: isLoading ? '#fff3cd' : (coreConnectionStatus === 'Connected' ? '#d4edda' : coreConnectionStatus === 'Disconnected' ? '#f8d7da' : coreConnectionStatus === 'Unstable' ? '#fff3cd' : undefined),
        }}
      >
        <CardContent sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            color="textSecondary"
            gutterBottom
            variant="subtitle2"
            sx={{ fontSize: '1.2rem', mb: 1 }}
          >
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              fontSize: '1.5rem',
              wordBreak: 'break-word',
              color: coreConnectionStatus === 'Connected' ? 'green' : coreConnectionStatus === 'Disconnected' ? 'red' : coreConnectionStatus === 'Unstable' ? 'orange' : 'inherit',
            }}
          >
            {coreConnectionStatus !== undefined && coreConnectionStatus !== null ? String(coreConnectionStatus) : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}