// filepath: c:\Users\intern\OneDrive\Documents\Internships\STEngineering\webdashboard\frontend\src\nodedashboardassets\ManetConnectionCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

export default function ManetConnectionCard({ manetStatus, isLoading }) {
  const label = "Connection to MANET";
  // status comes from parent via props
  const status = manetStatus || 'Not Configured';

  const bg =
    status === 'Connected'    ? '#e1ede4' :
    status === 'Disconnected' ? '#f8d7da' :
    status === 'Pinging...'   ? '#fff3cd' : undefined;
  const hoverBg =
    status === 'Connected'    ? '#e9f2eb' :
    status === 'Disconnected' ? '#fae1e3' :
    status === 'Pinging...'   ? '#fff7db' : undefined;

  return (
    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
      <Card
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: bg,
          transition: 'transform 0.1s ease-in-out',
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: hoverBg,
          }
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
              color: status === 'Connected'    ? '#324a38' :
                     status === 'Disconnected' ? 'red' :
                     status === 'Pinging...'   ? '#856404' : 'inherit',
            }}
          >
            {status}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}