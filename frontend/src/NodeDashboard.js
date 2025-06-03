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
import LogCard from './nodedashboardassets/LogCard';
import TopBar from './nodedashboardassets/TopBar';

// Updated props to accept nodeInfoMap
export default function NodeDashboard({ 
  allNodeData,
  // handleToggle is no longer needed directly from App.js, 
  // as NodeInfo instances will have their own toggle methods.
  // However, if App.js needs to initiate a toggle, it can find the NodeInfo instance
  // from nodeInfoMap and call its method. For the TopBar, we'll pass the specific method.
}) {

  console.log(allNodeData)

  const { ip } = useParams();
    console.log(ip)
  const nodeInfo = allNodeData.find(node => node.ip === ip) || null;

   // Fallback for when nodeInfo is not yet available
   if (!nodeInfo || !nodeInfo.attributes) {
    return (
      <Box sx={{ backgroundColor: '#f2f2f2', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar position="static" elevation={2} sx={{ backgroundColor: '#2d2e2e' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {ip}
            </Typography>
            <Typography variant="subtitle1" sx={{ mr: 2, fontSize: '1.3rem' }}>
              Warning: Save the node before attempting to view its dashboard.
            </Typography>
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5">Save Not Found</Typography>
        </Container>
      </Box>
    );
  }

  // Destructure top-level properties from nodeInfo
  const { 
    status: nodeStatus,
    isInitializing,
    nodeName,
    attributes,
    rawAttributes 
  } = nodeInfo;
  // Alias for loading state
  const loading = isInitializing;
  // Extract individual attribute groups
  const { coreData, ramData, diskData, transmitData, ipData } = attributes;
  const { ip: manetIp, connectionStatus: manetConnectionStatus } = nodeInfo.manet;

  // override colors to yellow when loading/toggling
  const bgColor = isInitializing
    ? '#fcfbf2'    // light yellow
    : nodeStatus === 'RUNNING'     ? '#f3f7f2'
    : nodeStatus === 'OFF'         ? '#faf2f0'
                                   : '#f2f2f2'; // Default for UNREACHABLE, INITIALIZING etc.

  const appBarColor = isInitializing
    ? '#805c19'    // darker yellow
    : nodeStatus === 'RUNNING'     ? '#40613d'
    : nodeStatus === 'OFF'         ? '#612a1f'
                                   : '#2d2e2e'; // Default for UNREACHABLE, INITIALIZING etc.
  
  // if disconnected, show only TopBar and no cards
  if (nodeStatus === 'DISCONNECTED' && !isInitializing) {
    return (
      <Box sx={{ backgroundColor: bgColor, minHeight: '100vh' }}>
        <CssBaseline />
        <TopBar
          ip={ip}
          loading={isInitializing} // Will be false in this context
          nodeStatus={nodeStatus}   // Will be 'DISCONNECTED'
          appBarColor={appBarColor}
          // The toggle button within TopBar is typically hidden for 'DISCONNECTED' status,
          // but a valid handler should still be provided.
          handleToggle={() => nodeInfo.toggleScript(nodeStatus === 'RUNNING' ? 'stop' : 'setupv2')}
          nodeName={nodeName || ip}
        />
        {/* Container with detailed unreachable message removed to only show TopBar */}
      </Box>
    );
  }

  const coreConnectionMap = {
    UP:        'Connected',
    DOWN:      'Disconnected',
    UNSTABLE:  'Unstable',
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
          loading={isInitializing} // Loading state from NodeInfo
          nodeStatus={nodeStatus}
          appBarColor={appBarColor}
          // Pass the toggleScript method from the specific NodeInfo instance
          handleToggle={() => nodeInfo.toggleScript(nodeStatus === 'RUNNING' ? 'stop' : 'setupv2')}
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
            justifyContent="center"
          >
            <LogCard ip={ip} isLoading={loading} />
            <CpuUsageChartCard data={cardDataForAttrs} isLoading={loading} />
            <RamUsageChartCard data={cardDataForAttrs} isLoading={loading} />
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
              isLoading={isInitializing} 
              nodeStatus={nodeStatus}
              secondaryIp={manetIp} // from nested manet.ip
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