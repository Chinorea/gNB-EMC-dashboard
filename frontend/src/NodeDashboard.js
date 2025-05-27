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
import TopBar from './nodedashboardassets/TopBar';
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog'; 

export default function NodeDashboard({
  statuses,
  attrs,
  loadingMap,
  setAppLoading
}) {
  const { ip } = useParams();
  const [showRebootAlert, setShowRebootAlert] = useState(false);

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
  const data       = attrs[ip];
  const loading    = loadingMap[ip] || false;

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

  return (
    <>
      {/* move Dialog to top‐level so it’s never clipped */}
      <RebootAlertDialog
        open={showRebootAlert} // Pass the state variable
        onClose={() => setShowRebootAlert(false)}
      />

      <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
        <CssBaseline />

        {/* Top bar with status */}
        <TopBar
          ip={ip}
          loading={loading}
          nodeStatus={nodeStatus}
          appBarColor={appBarColor}
          handleToggle={handleToggle}
        />

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
            justifyContent="center"
            alignItems="center"
            /* Layer 1 – centered */
          >
            <NodeIdCard
              nodeId={data.gnb_id}
              isLoading={loading}
              nodeStatus={nodeStatus}
            />
            <PciCard pci={data.gnb_pci} isLoading={loading} nodeStatus={nodeStatus} />
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
            <CpuUsageChartCard data={data} isLoading={loading} />
            <RamUsageChartCard data={data} isLoading={loading} />
          </Grid>

          {/* Layer 3 – Frequencies & IP side-by-side */}
          <Grid
            container
            spacing={3}
            sx={{ mt: 4 }}
            justifyContent="center"
            alignItems="stretch"
          >
            <FrequencyOverviewCard
              data={data}
              isLoading={loading}
              nodeStatus={nodeStatus}
            />
            <IpAddressesCard
              data={data}
              isLoading={loading}
              nodeStatus={nodeStatus}
            />
            <DiskOverviewCard data={data} isLoading={loading} />
          </Grid>
        </Container>
      </Box>
    </>
  );
}