// frontend/src/nodedashboardassets/TimeCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid, useTheme } from '@mui/material';
import { getThemeColors } from '../theme';

export default function TimeCard({ boardTime, isLoading }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const label = "Time";

  return (
    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
      <Card
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          transition: 'transform 0.1s ease-in-out',          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: colors.background.hover
          },
          backgroundColor: colors.background.paper
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
            {boardTime !== undefined && boardTime !== null ? String(boardTime) : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}