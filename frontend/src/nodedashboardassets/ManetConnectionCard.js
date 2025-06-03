// filepath: c:\Users\intern\OneDrive\Documents\Internships\STEngineering\webdashboard\frontend\src\nodedashboardassets\ManetConnectionCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid, useTheme } from '@mui/material';
import { getThemeColors } from '../theme';

export default function ManetConnectionCard({ manetStatus, isLoading }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const label = "Connection to MANET";
  // status comes from parent via props
  const status = manetStatus || 'Not Configured';

  const bg =
    status === 'Connected'    ? colors.manetConnection.connected :
    status === 'Disconnected' ? colors.manetConnection.disconnected :
    status === 'Pinging...'   ? colors.manetConnection.pinging : colors.background.paper;
  const hoverBg =
    status === 'Connected'    ? colors.manetConnection.connectedHover :
    status === 'Disconnected' ? colors.manetConnection.disconnectedHover :
    status === 'Pinging...'   ? colors.manetConnection.pingingHover : colors.background.hover;

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
            variant="h5"            sx={{
              fontWeight: 'bold',
              fontSize: '1.5rem',
              wordBreak: 'break-word',
              color: status === 'Connected'    ? colors.manetConnection.connectedText :
                     status === 'Disconnected' ? colors.manetConnection.disconnectedText :
                     status === 'Pinging...'   ? colors.manetConnection.pingingText : 'inherit',
            }}
          >
            {status}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}