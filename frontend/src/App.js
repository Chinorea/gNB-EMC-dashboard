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
    const id = setInterval(fetchAttrs, 10000);
    return () => clearInterval(id);
  }, []);

  if (!attrs) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5">Loading…</Typography>
      </Container>
    );
  }

  const firstLayerItems = [
    { label: 'Node ID',    value: attrs.gnb_id },
    { label: 'Time',       value: attrs.board_time },
    { label: 'Date',       value: attrs.board_date },
  ];

  const otherItems = [
    { label: 'CPU Usage',      value: `${attrs.cpu_usage}%` },
    { label: 'RAM Usage',      value: `${attrs.ram_usage}%` },
    { label: 'Total RAM',      value: `${attrs.ram_total} GB` },
    { label: 'CPU Temperature',value: `${attrs.cpu_temp}C` },
    { label: 'Core Connection',value: `${attrs.core_connection}` },
  ];

  return (
    <Box sx={{ 
      backgroundColor:
        attrs.raptor_status === 'RUNNING'
          ? '#f3f7f2'       // green when RUNNING
          : attrs.raptor_status === 'INITIALISING'
          ? '#f2f1ed'       // yellow when INITIALISING
          : '#faf2f0',      // red when other
      minHeight: '100vh' 
    }}>
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
          {/* Combined Disk Card */}
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* reduce vertical padding to shorten content height */}
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
                    mt: 0.5,
                  }}
                >
                  {/* Total */}
                  <Grid item xs={12}>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.0rem',
                        mb: 0.25,      // reduce bottom margin
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
                      {attrs.drive_total} GB
                    </Typography>
                  </Grid>

                  {/* Used */}
                  <Grid item xs={6}>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.0rem',
                        mb: 0.25,      // reduce bottom margin
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
                      {attrs.drive_used} GB
                    </Typography>
                  </Grid>

                  {/* Free */}
                  <Grid item xs={6}>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.0rem',
                        mb: 0.25,      // reduce bottom margin
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
                      {attrs.drive_free} GB
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
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
                  <Grid item xs={6}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                    >
                      Downlink
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {attrs.frequency_down_link} GHz
                    </Typography>
                    <Typography variant="h5" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.3rem',
                      mt: 0.5 }}>
                      {attrs.bandwidth_down_link} MHz
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                    color="textSecondary"
                    gutterBottom variant="subtitle2"
                    sx={{fontSize: '1.0rem'}}
                    >
                      Uplink
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {attrs.frequency_up_link} GHz
                    </Typography>
                    <Typography variant="h5" sx={{
                      fontWeight: 'bold',
                      fontSize: '1.3rem',
                      mt: 0.5 }}>
                      {attrs.bandwidth_up_link} MHz
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
                      {attrs.ip_address_gnb}
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
                      {attrs.ip_address_ngc}
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
                      {attrs.ip_address_ngu}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="caption">
            &copy; {new Date().getFullYear()} 5G Dashboard
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default App;