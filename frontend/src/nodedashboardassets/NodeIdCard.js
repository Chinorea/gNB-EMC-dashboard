import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

export default function NodeIdCard({ nodeId, isLoading }) {
  const label = "Node ID";

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
          backgroundColor: '#fff'
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
              wordBreak: 'break-word'
            }}
          >
            {nodeId !== undefined && nodeId !== null ? String(nodeId) : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}