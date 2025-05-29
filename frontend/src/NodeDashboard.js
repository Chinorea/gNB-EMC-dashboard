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

// Updated props to accept nodeInfoMap
export default function NodeDashboard({
  nodeInfoMap,
  // handleToggle is no longer needed directly from App.js, 
  // as NodeInfo instances will have their own toggle methods.
  // However, if App.js needs to initiate a toggle, it can find the NodeInfo instance
  // from nodeInfoMap and call its method. For the TopBar, we'll pass the specific method.
}) {
  const { ip } = useParams();
  const nodeInfo = nodeInfoMap[ip];

  // Fallback for when nodeInfo is not yet available
  if (!nodeInfo || !nodeInfo.attributes) { // Also check if attributes object exists
    return (
      <Box sx={{ backgroundColor: '#f2f2f2', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar position="static" elevation={2} sx={{ backgroundColor: '#2d2e2e' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {ip}
            </Typography>
            <Typography variant="subtitle1" sx={{ mr: 2, fontSize: '1.3rem' }}>
              Status: Loading Node Data...
            </Typography>
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5">Loading node information...</Typography>
        </Container>
      </Box>
    );
  }

  // Destructure top-level properties from nodeInfo
  const { 
    status: nodeStatus, 
    isLoading: loading, 
    isToggleLoading,
    nodeName,
    manetIp, 
    manetConnectionStatus,
    attributes, // The main nested attributes object
    rawAttributes 
  } = nodeInfo;

  // Destructure from the nested attributes categories
  const { coreData, ramData, diskData, transmitData, ipData } = attributes;

  // override colors to yellow when loading or toggling
  const bgColor = loading || isToggleLoading
    ? '#fcfbf2'    // light yellow
    : nodeStatus === 'RUNNING'     ? '#f3f7f2'
    : nodeStatus === 'OFF'         ? '#faf2f0'
                                   : '#f2f2f2'; // Default for UNREACHABLE, INITIALIZING etc.

  const appBarColor = loading || isToggleLoading
    ? '#805c19'    // darker yellow
    : nodeStatus === 'RUNNING'     ? '#40613d'
    : nodeStatus === 'OFF'         ? '#612a1f'
                                   : '#2d2e2e'; // Default for UNREACHABLE, INITIALIZING etc.
  
  // if unreachable, show only AppBar (or a more informative "unreachable" page)
  // This condition might be refined based on how `nodeInfo.status` represents unreachability
  if (nodeStatus === 'UNREACHABLE' && !loading && !isToggleLoading) { // Ensure it's not just a temporary loading state
    return (
      <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar position="static" elevation={2}
          sx={{ backgroundColor: appBarColor }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {nodeName || ip} 
            </Typography>
            <Typography variant="subtitle1" sx={{ mr: 2, fontSize: '1.3rem' }}>
              Status: Unreachable
            </Typography>
          </Toolbar>
        </AppBar>
         <Container sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5">Cannot connect to node {nodeName || ip}.</Typography>
          <Typography variant="body1">Please check the node's power and network connection.</Typography>
        </Container>
      </Box>
    );
  }

  const coreConnectionMap = {
    UP:        'Connected',
    DOWN:      'Disconnected',
    UNSTABLE:  'Unstable',
    null:      'N/A', // Handle null case
    undefined: 'N/A' // Handle undefined case if attributes haven't loaded
  };

  // Prepare data for child components, using properties from nodeInfo.attributes categories
  const cardDataForAttrs = { 
      // From coreData
      gnb_id: coreData?.gnbId,
      gnb_pci: coreData?.pci,
      board_time: coreData?.boardTime,
      board_date: coreData?.boardDate,
      core_connection: coreData?.coreConnection,
      cpu_usage: coreData?.cpuUsagePercent,
      cpu_temp: coreData?.cpuTemp,
      
      // From ramData
      ram_total: ramData?.totalMB,
      ram_usage: ramData?.usagePercent, 
      // ram_used: ramData?.usedMB, // if needed by any card
      // ram_free: ramData?.freeMB, // if needed by any card

      // From diskData
      drive_total: diskData?.totalGB,
      drive_used: diskData?.usedGB,
      drive_free: diskData?.freeGB,
      // disk_usage_percent: diskData?.usagePercent, // if needed by any card

      // From transmitData
      tx_power: transmitData?.txPower,
      frequency_down_link: transmitData?.frequencyDownlink,
      bandwidth_down_link: transmitData?.bandwidthDownlink,
      frequency_up_link: transmitData?.frequencyUplink,
      bandwidth_up_link: transmitData?.bandwidthUplink,

      // From ipData
      ip_address_gnb: ipData?.ipAddressGnb,
      ip_address_ngc: ipData?.ipAddressNgc,
      ip_address_ngu: ipData?.ipAddressNgu,
      
      ...rawAttributes // Spread rawAttributes for any missing direct mappings or if it contains everything
  };


  return (
    <>
      <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
        <CssBaseline />

        {/* Top bar with status */}
        <TopBar
          ip={ip}
          loading={loading || isToggleLoading} // Combine loading states for TopBar
          nodeStatus={nodeStatus}
          appBarColor={appBarColor}
          // Pass the toggleScript method from the specific NodeInfo instance
          handleToggle={() => nodeInfo.toggleScript(nodeStatus === 'RUNNING' ? 'stop' : 'start')}
          nodeName={nodeName || ip} // Use nodeName from NodeInfo, fallback to IP
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
              nodeId={coreData?.gnbId} // Directly from coreData
              isLoading={loading}
              nodeStatus={nodeStatus}
            />
            <PciCard pci={coreData?.pci} isLoading={loading} nodeStatus={nodeStatus} />
            <TimeCard boardTime={coreData?.boardTime} isLoading={loading} />
            <DateCard boardDate={coreData?.boardDate} isLoading={loading} />
            <CoreConnectionCard coreConnectionStatus={coreConnectionMap[coreData?.coreConnection] || 'N/A'} isLoading={loading} />
            <ManetConnectionCard manetStatus={manetConnectionStatus} isLoading={loading} />
          </Grid>

          {/* Layer 2 – Usage Charts */}
          <Grid
            container
            spacing={3}
            sx={{ mt: 4 }}
            alignItems="stretch"
            justifyContent={'center'}  // center items horizontally
          >
            <CpuUsageChartCard 
              data={cardDataForAttrs} // Continues to use cardDataForAttrs for now
              isLoading={loading} 
            />
            <RamUsageChartCard 
              data={cardDataForAttrs} // Continues to use cardDataForAttrs for now
              isLoading={loading} 
            />
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
              data={cardDataForAttrs} // Continues to use cardDataForAttrs
              isLoading={loading}
              nodeStatus={nodeStatus}
            />
            <IpAddressesCard
              data={cardDataForAttrs} // Continues to use cardDataForAttrs
              isLoading={loading}
              nodeStatus={nodeStatus}
              secondaryIp={manetIp} // from nodeInfo (top-level)
            />
            <DiskOverviewCard 
              data={cardDataForAttrs} // Continues to use cardDataForAttrs
              isLoading={loading} 
            />
          </Grid>
        </Container>
      </Box>
    </>
  );
}