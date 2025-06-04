// frontend/src/nodedashboardassets/CoreConnectionCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

export default function CoreConnectionCard({ coreConnectionStatus, isLoading }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const label = "Connection to Core";

  const getStatusColors = (status) => {
    switch (status) {
      case 'Connected':
        return {
          bg: colors.coreConnection.connected,
          hoverBg: colors.coreConnection.connectedHover,
          text: colors.coreConnection.connectedText,
        };
      case 'Disconnected':
        return {
          bg: colors.coreConnection.disconnected,
          hoverBg: colors.coreConnection.disconnectedHover,
          text: colors.coreConnection.disconnectedText,
        };
      case 'Unstable':
        return {
          bg: colors.coreConnection.unstable,
          hoverBg: colors.coreConnection.unstableHover,
          text: colors.coreConnection.unstableText,
        };
      default:
        return {
          bg: colors.background.paper,
          hoverBg: colors.background.hover,
          text: colors.text.primary,
        };
    }
  };

  const statusColors = getStatusColors(coreConnectionStatus);

  return (
    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>      <Card
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          transition: 'transform 0.1s ease-in-out',
          backgroundColor: statusColors.bg,
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: statusColors.hoverBg,
          },
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
              color: statusColors.text,
            }}
          >
            {coreConnectionStatus !== undefined && coreConnectionStatus !== null ? String(coreConnectionStatus) : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}