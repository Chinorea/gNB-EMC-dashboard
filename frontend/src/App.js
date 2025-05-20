import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
} from '@mui/material';

function App() {
  const [attrs, setAttrs] = useState(null);

  useEffect(() => {
    const fetchAttrs = () => {
      fetch('http://192.168.2.26:5000/api/attributes')
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then((data) => setAttrs(data))
        .catch((err) => console.error('Failed to load attributes:', err));
    };

    fetchAttrs();
    const id = setInterval(fetchAttrs, 1000);
    return () => clearInterval(id);
  }, []);

  if (!attrs) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5">Loading…</Typography>
      </Container>
    );
  }

  const firstFourItems = [
    { label: 'Node ID', value: attrs.gnb_id },
    { label: 'Time', value: attrs.board_time },
    { label: 'Date', value: attrs.board_date },
  ];

  const otherItems = [
    { label: 'CPU Usage', value: `${attrs.cpu_usage}%` },
    { label: 'RAM Usage', value: `${attrs.ram_usage}%` },
    { label: 'Total RAM', value: `${attrs.ram_total} GB` },
    { label: 'CPU Temperature', value: `${attrs.cpu_temp}C` },
    { label: 'Total Disk', value: `${attrs.drive_total} GB` },
    { label: 'Used Disk', value: `${attrs.drive_used} GB` },
    { label: 'Free Disk', value: `${attrs.drive_free} GB` },
    { label: 'Core Connection', value: `${attrs.core_connection}` },
  ];

  return (
    <>
      <CssBaseline />

      {/* Top bar with status */}
      <AppBar
        position="static"
        elevation={2}
        sx={{
          backgroundColor:
            attrs.raptor_status === 'RUNNING'
              ? '#40613d' // green
              : attrs.raptor_status === 'INITIALISING'
              ? '#805c19' // yellow
              : '#612a1f', // red
        }}
      >
        <Toolbar sx={{
          justifyContent: 'space-between',}}>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontSize: '1.5rem' }} 
          >
            {`5G Node ${attrs.gnb_id}`}
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
              {attrs.raptor_status === 'RUNNING'
                ? 'Broadcasting'
                : attrs.raptor_status === 'INITIALISING'
                ? 'Initialising'
                : 'Not Broadcasting'}
            </Typography>
            <Button
              variant="contained"
              sx={{
                fontSize: '1.1rem',
                backgroundColor:
                  attrs.raptor_status === 'RUNNING'
                    ? '#612a1f'      // red when running
                    : attrs.raptor_status === 'INITIALISING'
                    ? '#805c19'      // yellow when init
                    : '#40613d',     // green otherwise
                '&:hover': {
                  backgroundColor:
                    attrs.raptor_status === 'RUNNING'
                      ? '#4d1914'
                      : attrs.raptor_status === 'INITIALISING'
                      ? '#7a4d17'
                      : '#335e2e',
                },
              }}
            >
              {attrs.raptor_status === 'RUNNING' ? 'Turn Off' : 'Turn On'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Layer 1 */}
        <Grid
          container
          spacing={3}
          justifyContent="center"   // center items horizontally
        >
          {firstFourItems.map(item => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Card elevation={3}>
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

        {/* Layer 2 */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {otherItems.map(item => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {item.label}
                  </Typography>
                  <Typography variant="h5">{item.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Broadcast Frequencies */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Downlink Frequency
              </Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {attrs.frequency_down_link} MHz
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Uplink Frequency
              </Typography>
              <Typography variant="h5">
                {attrs.frequency_up_link} MHz
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* IP Addresses */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                gNB IP
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {attrs.ip_address_gnb}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                NgC IP
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {attrs.ip_address_ngc}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                NgU IP
              </Typography>
              <Typography variant="body1">
                {attrs.ip_address_ngu}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="caption">
            &copy; {new Date().getFullYear()} 5G Dashboard
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default App;