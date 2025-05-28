import React from 'react';
import { useParams } from 'react-router-dom';
import {
  CssBaseline, AppBar, Toolbar, Typography,
  Container, Grid, Box
} from '@mui/material';
import NodeIdCard from './nodedashboardassets/NodeIdCard';
import PciCard from './nodedashboardassets/PciCard';
import TimeCard from './nodedashboardassets/TimeCard';
import DateCard from './nodedashboardassets/DateCard';
import CoreConnectionCard from './nodedashboardassets/CoreConnectionCard';
import ManetConnectionCard from './nodedashboardassets/ManetConnectionCard';
import CpuUsageChartCard from './nodedashboardassets/CpuUsageChartCard';
import RamUsageChartCard from './nodedashboardassets/RamUsageChartCard';
import FrequencyOverviewCard from './nodedashboardassets/FrequencyOverviewCard';
import IpAddressesCard from './nodedashboardassets/IpAddressesCard';

import DiskOverviewCard from './nodedashboardassets/DiskOverviewCard';
import TopBar from './nodedashboardassets/TopBar';

export default function NodeDashboard({
  statuses,
  attrs,
  loadingMap,
  secondaryIps = {},
  manetConnectionMap = {},
  handleToggle
}) {
  const { ip } = useParams();

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
      <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
        <CssBaseline />

        {/* Top bar with status */}
        <TopBar
          ip={ip}
          loading={loading}
          nodeStatus={nodeStatus}
          appBarColor={appBarColor}
          handleToggle={() => handleToggle(ip)} // Pass ip to handleToggle
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
            <ManetConnectionCard manetStatus={manetConnectionMap[ip]} isLoading={loading} />
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
              secondaryIp={secondaryIps[ip]}
            />
            <DiskOverviewCard data={data} isLoading={loading} />
          </Grid>
        </Container>
      </Box>
    </>
  );
}