// frontend/src/nodedashboardassets/CpuUsageChartCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CpuUsageChartCard({ data, isLoading }) { // Removed smoothCpu from props
  if (!data || !data.cpu_usage_history) { // Check for history existence
    return null;
  }

  // --- Start of moved smoothing logic ---
  const rawCpu = data.cpu_usage_history.slice(-100)
    .map((v,i) => ({ name: i+1, value: v }));
  const smoothCpu = rawCpu.map((pt, i, arr) => {
    const win = 20;
    const half = Math.floor(win/2);
    const start = Math.max(0, i-half);
    const end   = Math.min(arr.length, i+half+1);
    const slice = arr.slice(start, end).map(x => x.value);
    const avg   = slice.reduce((s,v) => s+v, 0) / slice.length;
    const rounded = Math.round(avg * 10) / 10;
    return { name: pt.name, value: rounded };
  });
  // --- End of moved smoothing logic ---

  return (
    <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex', width: '25%' }}>
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
            backgroundColor: '#fff'
          },
          backgroundColor: '#fafafa'
        }}
      >
        <CardContent>
          <Typography
            color="textSecondary"
            variant="subtitle2"
            sx={{ mb: 2, textAlign: 'center' }}
          >
            CPU Statistics
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
                CPU Usage
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {data.cpu_usage}%
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="subtitle2">
                CPU Temp
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {data.cpu_temp}°C
              </Typography>
            </Grid>
          </Grid>

          <Typography color="textSecondary" gutterBottom variant="subtitle2">
            CPU Usage (Last 100 Seconds)
          </Typography>

          <ResponsiveContainer width="100%" height={250}>
            {/* Use the internally calculated smoothCpu */}
            <AreaChart data={smoothCpu}> 
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8884d8" stopOpacity={0.6}/>
                  <stop offset="75%" stopColor="#8884d8" stopOpacity={0.2}/>
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
                labelFormatter={(val) => `${2*(100 - val)}s ago`}
              />
              <Area
                type="basis"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={3}
                fill="url(#colorCpu)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  );
}