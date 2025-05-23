import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CssBaseline, AppBar, Toolbar, Typography,
  Container, Grid, Card, CardContent, Button, Box
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function NodeDashboard({
  statuses,
  attrs,
  loadingMap,
  setAppLoading
}) {
  const { ip } = useParams();
  // use app-level loading flag
  const loading = loadingMap[ip] || false;

  // 1) define toggle handler inside component so ip & setLoading are in scope
  const handleToggle = async () => {
    setAppLoading(ip, true);
    try {
      const res = await fetch(`http://${ip}:5000/api/setup_script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // run 'setupv2' when currently OFF, else 'stop' to stop
          action: nodeStatus === 'OFF' ? 'setupv2' : 'stop'
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      console.log('setup_script success', json);
    } catch (e) {
      console.error('setup_script error', e);
    } finally {
      setAppLoading(ip, false);
    }
  };

  const nodeStatus = statuses[ip] || 'UNREACHABLE';
  const data = attrs[ip];

  // override colors to yellow when loading
  const bgColor = loading
    ? 'f2f1ed'    // light yellow
    : nodeStatus === 'RUNNING'     ? '#f3f7f2'
    : nodeStatus === 'OFF'         ? '#faf2f0'
                                   : '#f2f2f2';

  const appBarColor = loading
    ? '#805c19'    // darker yellow
    : nodeStatus === 'RUNNING'     ? '#40613d'
    : nodeStatus === 'OFF'         ? '#612a1f'
                                   : '#2d2e2e';

  // if unreachable, show only AppBar
  if (nodeStatus === 'UNREACHABLE') {
    return (
      <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar position="static" elevation={2}
          sx={{ backgroundColor: appBarColor }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {ip}
            </Typography>
            <Typography variant="subtitle1" sx={{ mr: 2, fontSize: '1.3rem' }}>
              Status:{' '}
              {nodeStatus === 'RUNNING'
                ? 'Broadcasting'
                : nodeStatus === 'OFF'
                ? 'Not Broadcasting'
                : 'Disconnected'}
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
    );
  }

  const coreConnectionMap = {
    UP:        'Connected',
    DOWN:      'Disconnected',
    UNSTABLE:  'Unstable'
  };

  const firstLayerItems = [
    { label: 'Node ID',             value: data.gnb_id },
    { label: 'PCI',                 value: data.gnb_pci},
    { label: 'Time',                value: data.board_time },
    { label: 'Date',                value: data.board_date },
    {
      label: 'Connection to 5G Core',
      // use the combined status for display
      value: coreConnectionMap[data.core_connection]
    }
  ];

  // prepare & smooth last 100 CPU points
  const rawCpu = data.cpu_usage_history.slice(-100)
    .map((v,i) => ({ name: i+1, value: v }));
  const smoothCpu = rawCpu.map((pt, i, arr) => {
    const win = 20;
    const half = Math.floor(win/2);
    const start = Math.max(0, i-half);
    const end   = Math.min(arr.length, i+half+1);
    const slice = arr.slice(start, end).map(x => x.value);
    const avg   = slice.reduce((s,v) => s+v, 0) / slice.length;
    // round to 1 decimal place
    const rounded = Math.round(avg * 10) / 10;
    return { name: pt.name, value: rounded };
  });

  // prepare & smooth last 100 RAM points
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
    const rounded = Math.round(avg * 10) / 10;  // 1dp
    return { name: pt.name, value: rounded };
  });


  return (
    <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
      <CssBaseline />

      {/* Top bar with status */}
      <AppBar
        position="static"
        elevation={2}
        sx={{ backgroundColor: appBarColor }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {ip}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center'}}>
            <Typography
              variant="subtitle1"
              sx={{
                mr: 2,
                fontSize: '1.3rem', 
              }}
            >
              Status:{' '}
              {loading
                ? 'Initialising'
                : nodeStatus === 'RUNNING'
                ? 'Broadcasting'
                : nodeStatus === 'OFF'
                ? 'Not Broadcasting'
                : 'Disconnected'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {(nodeStatus === 'RUNNING' || nodeStatus === 'OFF') && (
                <Button
                  variant="contained"
                  onClick={handleToggle}
                  disabled={loading}
                  sx={{
                    backgroundColor:
                      nodeStatus === 'RUNNING' ? '#612a1f' : '#40613d',
                    color: 'white',
                    '&:hover': {
                      backgroundColor:
                        nodeStatus === 'RUNNING'
                          ? '#4d1914'
                          : '#335e2e',
                    },
                  }}
                >
                  {loading
                    ? 'Working…'
                    : nodeStatus === 'RUNNING'
                    ? 'Turn Off'
                    : 'Turn On'}
                </Button>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* span full viewport width */}
      <Container
        maxWidth={false}     // disable default max‐width
        disableGutters       // remove left/right padding
        sx={{ mt: 4, px: 2 }} // keep a bit of horizontal padding
      >
        {/* Layer 1 */}
        <Grid
          container
          spacing={3}
          justifyContent="center"   // center items horizontally
          alignItems="stretch"          // ← stretch all items to same height
        >
          {firstLayerItems.map(item => (
            <Grid item xs={12} sm={6} md={3} key={item.label} sx={{ display: 'flex' }}>
              <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="subtitle2" 
                    sx={{ fontSize: '1.2rem' }}  // adjust label size
                  >
                    {item.label}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1.75rem'      // adjust value size
                    }}
                  >
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Layer 2 – Usage Charts */}
        <Grid
          container
          spacing={3}
          sx={{ mt: 4 }}
          alignItems="stretch"
          justifyContent={'center'}  // center items horizontally
        >
          {/* CPU Usage Chart */}
          <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex', width: '40%' }}>
            <Card
              elevation={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 250      // make card taller
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

                <ResponsiveContainer width="100%" height={250}>  {/* increase graph height */}
                  <AreaChart data={smoothCpu}>
                    {/* optional gradient for nicer shading */}
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
                      // only show every 25th second: 1, 25, 50, 75, 100
                      ticks={[100]}
                      tickFormatter={(val) => `current usage`}
                    />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, 'Usage']}
                      labelFormatter={(val) => `${100 - val}s ago`}
                    />
                    <Area 
                      type="basis"
                      dataKey="value"
                      stroke="#8884d8"
                      strokeWidth={3}         // make the line thicker
                      fill="url(#colorCpu)"
                      fillOpacity={0.6}    // make the shaded area more opaque
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* RAM Usage Chart */}
          <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex', width: '40%' }}>
            <Card
              elevation={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 250      // make card taller
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
                <ResponsiveContainer width="100%" height={250}>  {/* increase graph height */}
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
                      // show start, middle, end
                      ticks={[100]}
                      tickFormatter={(val) => `current usage`}
                    />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, 'Usage']}
                      labelFormatter={(val) => `${100 - val}s ago`}
                    />
                    <Area 
                      type="basis"
                      dataKey="value"
                      stroke="#82ca9d"
                      strokeWidth={3}         // make the line thicker
                      fill="url(#colorRam)"
                      fillOpacity={0.6}    // more solid shading
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Layer 3 – Frequencies & IP side-by-side */}
        <Grid
          container
          spacing={3}
          sx={{ mt: 4 }}
          justifyContent="center"
          alignItems="stretch"
        >
          {/* Frequency Card */}
          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                {/* add a title above the nested grid */}
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.2rem' }}
                >
                  Frequency Overview
                </Typography>

                {/* nested grid for horizontal layout with extra horizontal gutter */}
                <Grid container spacing={1} columnSpacing={4} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                    >
                      Downlink
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {data.frequency_down_link} GHz
                    </Typography>
                    <Typography variant="h5" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.3rem',
                      mt: 0.5 }}>
                      {data.bandwidth_down_link} MHz
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                    >
                      Uplink
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {data.frequency_up_link} GHz
                    </Typography>
                    <Typography variant="h5" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.3rem',
                      mt: 0.5 }}>
                      {data.bandwidth_up_link} MHz
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography
                      color="textSecondary"
                      gutterBottom variant="subtitle2"
                      sx={{fontSize: '1.0rem'}}
                    >
                      TX Power
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {data.tx_power}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* IP Addresses Card */}
          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                {/* add a title above the nested grid */}
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="subtitle2"
                  sx={{ fontSize: '1.2rem' }}
                >
                  IP Addresses
                </Typography>

                {/* nested grid for horizontal layout */}
                <Grid container spacing={1} sx={{ mt: 3 }}>
                  <Grid item xs={4}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                    >
                      gNB IP
                    </Typography>
                    <Typography variant="body1" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                      }}>
                      {data.ip_address_gnb}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                      NgC IP
                    </Typography>
                    <Typography variant="body1" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                      }}>
                      {data.ip_address_ngc}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}>
                      NgU IP
                    </Typography>
                    <Typography variant="body1" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                      }}>
                      {data.ip_address_ngu}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Disk Overview Card */}
          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography
                color="textSecondary"
                gutterBottom variant="subtitle2"
                sx={{ fontSize: '1.1rem' }} 
                >
                  Disk Overview
                </Typography>

                {/* nested grid with custom horizontal padding & gutter */}
                <Grid
                  container
                  spacing={0.5}         // vertical & default gutter
                  columnSpacing={2}     // extra horizontal gutter
                  sx={{
                    mt: 3.3,
                  }}
                >
                  {/* Total */}
                  <Grid item xs={12}>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.0rem',
                        mb: 1.0,      // reduce bottom margin
                      }}
                    >
                      Total
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        mt: 0.25,      // optional: tighten top margin
                      }}
                    >
                      {data.drive_total} GB
                    </Typography>
                  </Grid>

                  {/* Used */}
                  <Grid item xs={6}>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.0rem',
                        mb: 1,      // reduce bottom margin
                      }}
                    >
                      Used
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        mt: 0.25,      // tighten top margin
                      }}
                    >
                      {data.drive_used} GB
                    </Typography>
                  </Grid>

                  {/* Free */}
                  <Grid item xs={6}>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.0rem',
                        mb: 1,      // reduce bottom margin
                      }}
                    >
                      Free
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        mt: 0.25,      // tighten top margin
                      }}
                    >
                      {data.drive_free} GB
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}