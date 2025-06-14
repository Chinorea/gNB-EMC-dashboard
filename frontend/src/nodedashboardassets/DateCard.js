// frontend/src/nodedashboardassets/DateCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

export default function DateCard({ boardDate, isLoading }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const label = "Date";

  return (
    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
      <Card
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,          transition: 'transform 0.1s ease-in-out',
          backgroundColor: colors.background.paper,
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
            backgroundColor: colors.background.hover
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
              wordBreak: 'break-word'
            }}
          >
            {boardDate !== undefined && boardDate !== null ? String(boardDate) : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}