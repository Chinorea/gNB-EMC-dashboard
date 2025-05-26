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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import NodeIdCard from './nodedashboardassets/NodeIdCard';
import PciCard from './nodedashboardassets/PciCard';
import TimeCard from './nodedashboardassets/TimeCard';
import DateCard from './nodedashboardassets/DateCard';
import CoreConnectionCard from './nodedashboardassets/CoreConnectionCard';
import CpuUsageChartCard from './nodedashboardassets/CpuUsageChartCard';
import RamUsageChartCard from './nodedashboardassets/RamUsageChartCard';
import FrequencyOverviewCard from './nodedashboardassets/FrequencyOverviewCard';
import IpAddressesCard from './nodedashboardassets/IpAddressesCard'; 
import DiskOverviewCard from './nodedashboardassets/DiskOverviewCard';

export default function NodeDashboard({
  statuses,
  attrs,
  loadingMap,
  setAppLoading
}) {
  const { ip } = useParams();
  // use app-level loading flag
  const loading = loadingMap[ip] || false;
  const [showRebootAlert, setShowRebootAlert] = useState(false);

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
      // special 504 handler → stop loading, then show alert
      if (res.status === 504) {
        setAppLoading(ip, false);
        setShowRebootAlert(true);
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      console.log('setup_script success', json);
      setAppLoading(ip, false);
    } catch (e) {
      console.error('setup_script error', e);
      setAppLoading(ip, false);
    }
  };

  const nodeStatus = statuses[ip] || 'UNREACHABLE';
  const data = attrs[ip];

  // override colors to yellow when loading
  const bgColor = loading
    ? '#fcfbf2'    // light yellow
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

  // prepare & smooth last 100 CPU points
  const rawCpu = data.cpu_usage_history.slice(-100)
    .map((v,i) => ({ name: i+1, value: v }));
  const smoothCpu = rawCpu.map((pt, i, arr) => {
    const win = 20;      // increase smoothing window for 100 samples
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
    const win  = 20;    // match CPU smoothing window
    const half = Math.floor(win/2);
    const start = Math.max(0, i-half);
    const end   = Math.min(arr.length, i+half+1);
    const slice = arr.slice(start, end).map(x => x.value);
    const avg   = slice.reduce((s,v) => s+v, 0) / slice.length;
    const rounded = Math.round(avg * 10) / 10;  // 1dp
    return { name: pt.name, value: rounded };
  });


  return (
    <>
      {/* move Dialog to top‐level so it’s never clipped */}
      <Dialog
        open={showRebootAlert}
        onClose={() => setShowRebootAlert(false)}
        aria-labelledby="reboot-alert-title"
        aria-describedby="reboot-alert-description"
      >
        <DialogTitle
          id="reboot-alert-title"
          sx={{
            textAlign: 'center',
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}
        >
          Initialisation Timeout
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="reboot-alert-description"
            sx={{
              textAlign: 'center',
              fontSize: '1.2rem'
            }}
          >
            The initialisation has timed out. In this version the node cannot start
            again once stopped—you must do a hard reboot.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRebootAlert(false)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

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
            <NodeIdCard nodeId={data.gnb_id} isLoading={loading} />
            <PciCard pci={data.gnb_pci} isLoading={loading} />
            <TimeCard boardTime={data.board_time} isLoading={loading} />
            <DateCard boardDate={data.board_date} isLoading={loading} />
            <CoreConnectionCard coreConnectionStatus={coreConnectionMap[data.core_connection]} isLoading={loading} />
          </Grid>

          {/* Layer 2 – Usage Charts */}
          <Grid
            container
            spacing={3}
            sx={{ mt: 4 }}
            alignItems="stretch"
            justifyContent={'center'}  // center items horizontally
          >
            <CpuUsageChartCard data={data} smoothCpu={smoothCpu} isLoading={loading} />
            <RamUsageChartCard data={data} smoothRam={smoothRam} isLoading={loading} />
          </Grid>

          {/* Layer 3 – Frequencies & IP side-by-side */}
          <Grid
            container
            spacing={3}
            sx={{ mt: 4 }}
            justifyContent="center"
            alignItems="stretch"
          >
            <FrequencyOverviewCard data={data} isLoading={loading} />
            <IpAddressesCard data={data} isLoading={loading} />
            <DiskOverviewCard data={data} isLoading={loading} />
          </Grid>
        </Container>
      </Box>
    </>
  );
}