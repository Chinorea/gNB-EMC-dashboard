import React from 'react';
import { useParams } from 'react-router-dom';
import {
  CssBaseline, AppBar, Toolbar, Typography,
  Container, Grid, Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from './theme';
import NodeIdCard from './nodedashboardassets/NodeIdCard';
import TimeCard from './nodedashboardassets/TimeCard';
import DateCard from './nodedashboardassets/DateCard';
import CoreConnectionCard from './nodedashboardassets/CoreConnectionCard';
import ManetConnectionCard from './nodedashboardassets/ManetConnectionCard';
import CpuUsageChartCard from './nodedashboardassets/CpuUsageChartCard';
import RamUsageChartCard from './nodedashboardassets/RamUsageChartCard';
import FrequencyOverviewCard from './nodedashboardassets/FrequencyOverviewCard';
import IpAddressesCard from './nodedashboardassets/IpAddressesCard';
import CellIdentityCard from './nodedashboardassets/CellIdentityCard';
import NetworkSliceCard from './nodedashboardassets/NetworkSliceCard';
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
  const theme = useTheme();
  const colors = getThemeColors(theme);
  
  // Custom scrollbar styles based on theme
  const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '10px',
    },
    '&::-webkit-scrollbar-track': {
      background: colors.background.light,
    },
    '&::-webkit-scrollbar-thumb': {
      background: colors.border.main,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: colors.border.dark,
    },
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.border.main} ${colors.background.light}`,
  };

  console.log(allNodeData)

  const { ip } = useParams();
    console.log(ip)
  const nodeInfo = allNodeData.find(node => node.ip === ip) || null;   // Fallback for when nodeInfo is not yet available
   if (!nodeInfo || !nodeInfo.attributes) {
    return (
      <Box sx={{ 
        backgroundColor: colors.background.main, 
        minHeight: '100vh',
        ...scrollbarStyles
      }}>
        <CssBaseline />
        <AppBar position="static" elevation={2} sx={{ backgroundColor: colors.dashboard.appBarUnreachable }}>
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
    ? colors.dashboard.initializing
    : nodeStatus === 'RUNNING'     ? colors.dashboard.running
    : nodeStatus === 'OFF'         ? colors.dashboard.off
                                   : colors.dashboard.unreachable;
  const appBarColor = isInitializing
    ? colors.dashboard.appBarInitializing
    : nodeStatus === 'RUNNING'     ? colors.dashboard.appBarRunning
    : nodeStatus === 'OFF'         ? colors.dashboard.appBarOff
    : nodeStatus === 'DISCONNECTED' ? colors.dashboard.appBarUnreachable
                                   : colors.dashboard.appBarUnreachable;
  
  // if disconnected, show only TopBar and no cards
  if (nodeStatus === 'DISCONNECTED' && !isInitializing) {
    return (
      <Box sx={{ 
        backgroundColor: bgColor, 
        minHeight: '100vh',
        ...scrollbarStyles // Apply scrollbar styles to the main container
      }}>
        <CssBaseline />
        <TopBar
          ip={ip}
          loading={isInitializing} // Will be false in this context
          nodeStatus={nodeStatus}   // Will be 'DISCONNECTED'
          appBarColor={appBarColor}
          // The toggle button within TopBar is typically hidden for 'DISCONNECTED' status,
          // but a valid handler should still be provided.
          handleToggle={() => nodeInfo.toggleScript(nodeStatus === 'RUNNING' ? 'stop' : 'start')}
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
  };  // Prepare data for child components, using properties from nodeInfo.attributes categories
  const cardDataForAttrs = { 
      // From coreData
      gnb_id: coreData?.gnbId,
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
        // New fields from rawAttributes for the new cards
      gnb_id_length: rawAttributes?.gnb_id_length,
      nr_band: rawAttributes?.nr_band,
      scs: rawAttributes?.scs,
      MCC: rawAttributes?.MCC,
      MNC: rawAttributes?.MNC,
      cell_id: rawAttributes?.cell_id,
      NRTAC: rawAttributes?.nr_tac,  // Map lowercase backend to uppercase frontend
      SST: rawAttributes?.sst,       // Map lowercase backend to uppercase frontend
      SD: rawAttributes?.sd,         // Map lowercase backend to uppercase frontend
      profile: rawAttributes?.profile,
      
      ...rawAttributes // Spread rawAttributes for any missing direct mappings or if it contains everything
  };


  return (
    <Box sx={{ 
      backgroundColor: bgColor, 
      minHeight: '100vh',
      ...scrollbarStyles // Apply scrollbar styles to the main container for connected nodes
    }}>
      <CssBaseline />
      <TopBar
        ip={ip}
        loading={isInitializing} // Loading state from NodeInfo
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
      >        {/* Layer 1 - Simple Status Cards */}
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="center"
        >
          <TimeCard boardTime={coreData?.boardTime} isLoading={loading} />
          <DateCard boardDate={coreData?.boardDate} isLoading={loading} />
          <CoreConnectionCard coreConnectionStatus={coreConnectionMap[coreData?.coreConnection] || 'N/A'} isLoading={loading} />
          <ManetConnectionCard manetStatus={manetConnectionStatus} isLoading={loading} />
        </Grid>        {/* Layer 2 - Two Main Content Boxes */}
        <Grid
          container
          spacing={3}
          sx={{ mt: 4 }}
          justifyContent="center"
          alignItems="stretch"
        >          {/* Left Box - Node Info & Frequency */}
          <Grid item xs={12} md={6} lg={6}>            <Box
              sx={{
                border: `1px solid ${colors.border.main}`,
                borderRadius: 2,
                p: 3,
                backgroundColor: colors.background.paper,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                boxShadow: 3,
              }}
            ><Typography
                color="textSecondary"
                variant="subtitle2"
                sx={{ fontSize: '1.2rem', mb: 0, textAlign: 'center' }}
              >
                Node Configuration
              </Typography>              {/* Profile Display */}              {cardDataForAttrs.profile && (
                <Box sx={{ 
                  mb: 0, 
                  p: 0.5, 
                  backgroundColor: colors.background.light,
                  borderRadius: 1,
                  border: `1px solid ${colors.border.light}`,
                  textAlign: 'center'
                }}>
                  <Typography
                    color="textSecondary"
                    variant="subtitle2"
                    sx={{ fontSize: '1.0rem', mb: 0 }}
                  >
                    Active Profile
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                  >
                    {cardDataForAttrs.profile}
                  </Typography>
                </Box>              )}

              {/* Node ID and Frequency Overview Cards Side by Side */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <NodeIdCard
                    nodeId={coreData?.gnbId}
                    isLoading={loading}
                    nodeStatus={nodeStatus}
                    data={cardDataForAttrs}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FrequencyOverviewCard
                    data={cardDataForAttrs}
                    isLoading={loading}
                    nodeStatus={nodeStatus}
                  />
                </Grid>
              </Grid>              <IpAddressesCard
                data={cardDataForAttrs}
                isLoading={loading}
                nodeStatus={nodeStatus}
                secondaryIp={manetIp}
              />              {/* Cell Identity and Network Slice Cards Side by Side */}
              <Grid container spacing={2} sx={{ width: '100%', display: 'flex', flexDirection: 'row' }}>
                <Grid item xs={6} sx={{ display: 'flex', flex: 1 }}>
                  <CellIdentityCard
                    data={cardDataForAttrs}
                    isLoading={loading}
                    nodeStatus={nodeStatus}
                  />
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', flex: 1 }}>
                  <NetworkSliceCard
                    data={cardDataForAttrs}
                    isLoading={loading}
                    nodeStatus={nodeStatus}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>          {/* Right Box - Usage Charts */}
          <Grid item xs={12} md={6} lg={6}>
            <Box
              sx={{
                border: `1px solid ${colors.border.main}`,
                borderRadius: 2,
                p: 3,
                backgroundColor: colors.background.paper,
                height: '100%',
                minWidth: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                boxShadow: 3,
              }}
            >              <Typography
                color="textSecondary"
                variant="subtitle2"
                sx={{ fontSize: '1.2rem', mb: 1, textAlign: 'center' }}
              >
                System Usage
              </Typography>

              {/* CPU and RAM Charts Side by Side */}
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid item xs={12} sm={6} sx={{ display: 'flex' }}>
                  <Box sx={{ width: '100%', flexGrow: 1 }}>
                    <CpuUsageChartCard data={cardDataForAttrs} isLoading={loading} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex' }}>
                  <Box sx={{ width: '100%', flexGrow: 1 }}>
                    <RamUsageChartCard data={cardDataForAttrs} isLoading={loading} />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ width: '100%', flexGrow: 1 }}>
                <DiskOverviewCard data={cardDataForAttrs} isLoading={loading} />
              </Box>
            </Box>
          </Grid>
        </Grid>{/* Layer 3 - Logs */}
        <Grid
          container
          spacing={3}
          sx={{ mt: 4 }}
          justifyContent="center"
          alignItems="center"
        >
          <LogCard ip={ip} isLoading={loading} />
        </Grid>
      </Container>
    </Box>
  );
}