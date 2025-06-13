// frontend/src/nodedashboardassets/DiskOverviewCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

export default function DiskOverviewCard({ data, isLoading }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  if (!data) {
    return null;
  }

  return (
    <Grid item xs={12} md={6} sx={{ display: 'flex' }}> {/* Adjust Grid sizing as needed */}
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
        <CardContent sx={{ textAlign: 'center', py: 1 }}>
          <Typography
            color="textSecondary"
            gutterBottom variant="subtitle2"
            sx={{ fontSize: '1.1rem' }}
          >
            Disk Overview
          </Typography>          <Grid
            container
            spacing={0.5}
            columnSpacing={2}
            justifyContent="center"
            alignItems="flex-start"
            sx={{
              mt: 3.3,
            }}
          >
            <Grid item xs={12}>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                sx={{
                  fontSize: '1.0rem',
                  mb: 1.0,
                }}
              >
                Total
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  mt: 0.25,
                }}
              >
                {data.drive_total} GB
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                sx={{
                  fontSize: '1.0rem',
                  mb: 1,
                }}
              >
                Used
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  mt: 0.25,
                }}
              >
                {data.drive_used} GB
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                sx={{
                  fontSize: '1.0rem',
                  mb: 1,
                }}
              >
                Free
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  mt: 0.25,
                }}
              >
                {data.drive_free} GB
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}