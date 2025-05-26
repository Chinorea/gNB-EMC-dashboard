// frontend/src/nodedashboardassets/RamUsageChartCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RamUsageChartCard({ data, smoothRam, isLoading }) {
  if (!data || !smoothRam) {
    return null; // Or a loading indicator specific to this card
  }

  return (
    <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex', width: '40%' }}>
      <Card
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 250,
          transition: 'transform 0.1s ease-in-out',
          '&:hover': {
            transform: 'scale(1.01)',
            boxShadow: 6,
          },
          backgroundColor: '#fff'
        }}
      >
        <CardContent>
          <Typography
            color="textSecondary"
            variant="subtitle2"
            sx={{ mb: 2, textAlign: 'center' }}
          >
            RAM Statistics
          </Typography>
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="subtitle2">
                RAM Usage
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {data.ram_usage}%
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="subtitle2">
                Total RAM
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {data.ram_total} GB
              </Typography>
            </Grid>
          </Grid>

          <Typography color="textSecondary" gutterBottom variant="subtitle2">
            RAM Usage (Last 100 Seconds)
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={smoothRam}>
              <defs>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.6}/>
                  <stop offset="75%" stopColor="#82ca9d" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                type="number"
                domain={[1, 100]}
                ticks={[100]}
                tickFormatter={(val) => `current usage`}
              />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Usage']}
                labelFormatter={(val) => `${100 - val}s ago`}
              />
              <Area
                type="basis"
                dataKey="value"
                stroke="#82ca9d"
                strokeWidth={3}
                fill="url(#colorRam)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  );
}