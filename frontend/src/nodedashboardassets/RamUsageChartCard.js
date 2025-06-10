// frontend/src/nodedashboardassets/RamUsageChartCard.js
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

export default function RamUsageChartCard({ data, isLoading }) { // Removed smoothRam from props
  const theme = useTheme();
  const colors = getThemeColors(theme);
  if (!data || !data.ram_usage_history) { // Check for history existence
    return null;
  }

  // --- Start of moved smoothing logic ---
  const rawRam = data.ram_usage_history
    .slice(-100)
    .map((v,i) => ({ name: i+1, value: v }));
  const smoothRam = rawRam.map((pt, i, arr) => {
    const win  = 20;
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
    <Card
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        transition: 'transform 0.1s ease-in-out',
        backgroundColor: colors.background.paper,
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: 6,
          backgroundColor: colors.background.hover
        },
      }}
    >        <CardContent>
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
          <ResponsiveContainer width="100%" height={222}>
            {/* Use the internally calculated smoothRam */}
            <AreaChart data={smoothRam}>
              <defs>                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.charts.ram} stopOpacity={0.6}/>
                  <stop offset="75%" stopColor={colors.charts.ramGradient} stopOpacity={0.2}/>
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
                labelFormatter={(val) => `${5*(100 - val)}s ago`}
              />
              <Area
                type="basis"
                dataKey="value"
                stroke={colors.charts.ram}
                strokeWidth={3}
                fill="url(#colorRam)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>        </CardContent>
      </Card>
  );
}