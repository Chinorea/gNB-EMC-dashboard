import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CssBaseline,
  Drawer,
  Box,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  ListItemSecondaryAction
} from '@mui/material';
import EditIcon  from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
import MapView from './Map';
import 'leaflet/dist/leaflet.css';
import buildStaticsLQM from './utils';
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog';

const drawerWidth = 350;

function Sidebar({
  allNodeData,
  setAllNodeData,
}) {
  const [ip, setIp] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(''); // Stores the original IP of the node being edited
  const [editPrimary, setEditPrimary] = useState(''); // Stores the potentially new primary IP
  const [editSecondary, setEditSecondary] = useState('');
  const [editName, setEditName] = useState('');

  const addNode = () => {
    if (ip && !allNodeData.some(node => node.ip === ip)) {
      const newNode = {
        ip,
        nodeName: `Node ${ip}`, // Default name, can be edited
        manetIp: '',
        status: 'DISCONNECTED', // Initial status, polling will update
        attributes: {},
        isInitializing: false, // Polling will handle initial fetch
        manetConnectionStatus: 'Not Configured',
      };
      setAllNodeData(prev => [...prev, newNode]);
      setIp('');
    }
  };

  const removeNode = (ipToRemove) => {
    setAllNodeData(prev => prev.filter(node => node.ip !== ipToRemove));
  };

  const openEdit = (nodeIp) => {
    const nodeData = allNodeData.find(d => d.ip === nodeIp);
    setEditTarget(nodeIp); // Original IP
    setEditPrimary(nodeIp); // Current IP for editing field
    setEditSecondary(nodeData?.manetIp || '');
    setEditName(nodeData?.nodeName || `Node ${nodeIp}`);
    setEditOpen(true);
  };

  const saveEdit = () => {
    setAllNodeData(prevAllNodeData => {
      return prevAllNodeData.map(node => {
        if (node.ip === editTarget) { // Find the node by its original IP
          const manetIpChanged = node.manetIp !== editSecondary;
          return {
            ...node,
            ip: editPrimary, // Update IP to the new primary IP if changed
            nodeName: editName,
            manetIp: editSecondary,
            // If MANET IP is cleared, status becomes 'Not Configured'
            // If MANET IP is added or changed, it will be 'Not Configured' until next poll updates it
            manetConnectionStatus: manetIpChanged ? (editSecondary ? 'Not Configured' : 'Not Configured') : node.manetConnectionStatus,
          };
        }
        return node;
      });
    });
    setEditOpen(false);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box'
        },
      }}
    >
      <Box sx={{ p: 2, overflow: 'auto' }}>
        <TextField
          fullWidth
          label="Add Node IP"
          value={ip}
          size="small"
          onChange={e => setIp(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNode();
            }
          }}
        />
        <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={addNode}>
          Add
        </Button>

        <Divider sx={{ my: 2 }} />

        <List subheader={<ListSubheader>Navigation</ListSubheader>}>
          <ListItemButton component={RouterLink} to="/">
            <ListItemText
              primary="Home"
              primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/map">
            <ListItemText
              primary="Map"
              primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </ListItemButton>
        </List>

        <List subheader={<ListSubheader>Nodes</ListSubheader>}>
          {allNodeData.map(node => { // Iterate over allNodeData
            const currentStatus = node.status || 'DISCONNECTED';
            let bg;
            switch (currentStatus) {
              case 'RUNNING':
                bg = '#d4edda'; // green
                break;
              case 'INITIALIZING': // This status is now mainly for script toggling
                bg = '#fff3cd'; // yellow
                break;
              case 'OFF':
                bg = '#f8d7da'; // red
                break;
              case 'DISCONNECTED':
              default:
                bg = 'lightgrey';
            }

            return (
              <ListItem
                key={node.ip} // Use node.ip as key
                disablePadding
                sx={{
                  width: '100%',
                  backgroundColor: bg,
                }}
              >
                <ListItemIcon sx={{ pl: 1 }}>
                  <IconButton onClick={() => openEdit(node.ip)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItemIcon>
                <ListItemButton
                  component={RouterLink}
                  to={`/node/${node.ip}`} // Link uses node.ip
                  sx={{ flex: 1 }}
                >
                  <ListItemText
                    primary={node.nodeName || `Node ${node.ip}`}
                    primaryTypographyProps={{
                      fontWeight: 'bold',
                      variant: 'body1',
                      fontSize: '1.0rem'
                    }}
                    secondary={
                      node.nodeName && node.nodeName !== `Node ${node.ip}` // Show IP if name is not default
                        ? (
                          <>
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              Node IP: {node.ip}
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              MANET: {node.manetIp || 'Not configured'}
                            </Typography>
                          </>
                        )
                        : `MANET: ${node.manetIp || 'Not configured'}`
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                      sx: { mt: (node.nodeName && node.nodeName !== `Node ${node.ip}`) ? 0 : 0.5, fontSize: '0.9rem' }
                    }}
                  />
                </ListItemButton>
                <ListItemSecondaryAction>
                  <IconButton onClick={() => removeNode(node.ip)} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <Box
            component="form"
            onSubmit={e => { e.preventDefault(); saveEdit(); }}
          >
            <DialogTitle>Edit Node Settings</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Node Name"
                fullWidth
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Node IP"
                fullWidth
                value={editPrimary} // This is the IP being edited
                onChange={e => setEditPrimary(e.target.value)}
              />
              <TextField
                margin="dense"
                label="MANET IP"
                fullWidth
                value={editSecondary}
                onChange={e => setEditSecondary(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Save</Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Box>
    </Drawer>
  );
}

// Placeholder API functions - implement these based on your backend and NodeInfo.js logic
async function fetchNodeStatusAPI(ip) {
  console.log(`API_CALL: fetchNodeStatusAPI for ${ip}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return Math.random() > 0.5 ? 'RUNNING' : 'OFF'; // Dummy implementation
}
async function fetchNodeAttributesAPI(ip) {
  console.log(`API_CALL: fetchNodeAttributesAPI for ${ip}`);
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return { gnbId: 'dummyGnbId', cpuUsagePercent: Math.floor(Math.random() * 100) }; // Dummy
}
async function checkManetConnectionAPI(manetIp) {
  console.log(`API_CALL: checkManetConnectionAPI for ${manetIp}`);
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return Math.random() > 0.5 ? 'Connected' : 'Disconnected'; // Dummy
}
async function toggleScriptAPI(ip, action) {
  console.log(`API_CALL: toggleScriptAPI for ${ip}, action: ${action}`);
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  return { success: true, showRebootAlert: action === 'stop' && Math.random() > 0.8 }; // Dummy
}

export default function App() {
  const [allNodeData, setAllNodeData] = useState([]);
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null);

  // Effect 1: Initial load of allNodeData from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('allNodeDataStorage');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAllNodeData(parsedData);
        // Initial fetch for loaded nodes that might be stale
        parsedData.forEach(node => {
          if (node.ip) { // Basic check
            // Set to initializing to allow polling to pick them up for fresh data
            // Or directly call fetch logic here if preferred for faster UI update on load
            // For simplicity, let polling handle it, but ensure they are not marked 'isInitializing' from a toggle
            // The polling logic will fetch if status is DISCONNECTED or if data is stale.
          }
        });
      } catch (error) {
        console.error("Failed to parse allNodeData from localStorage", error);
        setAllNodeData([]); // Reset if localStorage data is corrupt
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  // Effect 2: Persist allNodeData to localStorage
  useEffect(() => {
    localStorage.setItem('allNodeDataStorage', JSON.stringify(allNodeData));
  }, [allNodeData]);

  const allNodeDataRef = useRef(allNodeData);
  useEffect(() => {
    allNodeDataRef.current = allNodeData;
  }, [allNodeData]);

  // Effect 3: Polling for node status and attributes
  useEffect(() => {
    let isMounted = true;
    const intervalId = setInterval(async () => {
      if (!isMounted || allNodeDataRef.current.length === 0) return;
      
      const currentNodesToPoll = [...allNodeDataRef.current];

      const updatedNodesPromises = currentNodesToPoll.map(async (node) => {
        // Skip polling for nodes that are currently being initialized by a toggle action
        if (node.isInitializing) return node; 

        let newStatus = node.status;
        let newAttributes = node.attributes;
        let newManetStatus = node.manetConnectionStatus;
        let changed = false;

        try {
          const fetchedStatus = await fetchNodeStatusAPI(node.ip);
          if (node.status !== fetchedStatus) {
            newStatus = fetchedStatus;
            changed = true;
          }

          if (newStatus === 'RUNNING') {
            const fetchedAttributes = await fetchNodeAttributesAPI(node.ip);
            if (JSON.stringify(node.attributes) !== JSON.stringify(fetchedAttributes)) {
              newAttributes = fetchedAttributes;
              changed = true;
            }
          } else {
            // If not RUNNING, clear attributes or set to default if that's desired
            if (Object.keys(node.attributes).length > 0) { 
              newAttributes = {};
              changed = true;
            }
          }

          if (node.manetIp) {
            const fetchedManetStatus = await checkManetConnectionAPI(node.manetIp);
            if (node.manetConnectionStatus !== fetchedManetStatus) {
              newManetStatus = fetchedManetStatus;
              changed = true;
            }
          } else {
            if (node.manetConnectionStatus !== 'Not Configured') {
              newManetStatus = 'Not Configured';
              changed = true;
            }
          }
        } catch (error) {
          console.error(`Error polling node ${node.ip}:`, error);
          // Optionally handle error by setting status to 'DISCONNECTED' or similar
          if (node.status !== 'DISCONNECTED') { // Avoid rapid changes if already disconnected
            newStatus = 'DISCONNECTED';
            newAttributes = {};
            changed = true;
          }
        }
        
        if (changed) {
          return { ...node, status: newStatus, attributes: newAttributes, manetConnectionStatus: newManetStatus };
        }
        return node;
      });

      const newAllNodeDataFromPolling = await Promise.all(updatedNodesPromises);
      
      if (isMounted) {
        if (JSON.stringify(allNodeDataRef.current) !== JSON.stringify(newAllNodeDataFromPolling)) {
            setAllNodeData(newAllNodeDataFromPolling);
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array: polling starts on mount and runs independently

  const handleToggleNodeScript = useCallback(async (ip, action) => {
    // Mark node as initializing to prevent polling during toggle
    setAllNodeData(prev => prev.map(n => n.ip === ip ? { ...n, isInitializing: true, status: 'INITIALIZING' } : n));

    const result = await toggleScriptAPI(ip, action);
    let statusAfterToggle = 'DISCONNECTED'; // Default status after action
    let attributesAfterToggle = {};

    try {
      statusAfterToggle = await fetchNodeStatusAPI(ip);
      if (statusAfterToggle === 'RUNNING') {
        attributesAfterToggle = await fetchNodeAttributesAPI(ip);
      }
    } catch (error) {
      console.error(`Error fetching status for ${ip} after toggle:`, error);
      // Status remains 'DISCONNECTED' or as per error handling preference
    }

    setAllNodeData(prev => prev.map(n => n.ip === ip ? {
      ...n,
      status: statusAfterToggle,
      attributes: attributesAfterToggle,
      isInitializing: false, // Reset initializing flag
    } : n));

    if (result.showRebootAlert) {
      setRebootAlertNodeIp(ip);
    }
  }, [setRebootAlertNodeIp]);

  const ipListForLQM = allNodeData.map(node => node.ip);
  const { linkQualityMatrix, mapMarkers } = buildStaticsLQM(ipListForLQM, allNodeData);

  return (
    <>
      <CssBaseline />
      <RebootAlertDialog open={!!rebootAlertNodeIp} onClose={() => setRebootAlertNodeIp(null)} />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar
            allNodeData={allNodeData}
            setAllNodeData={setAllNodeData}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              overflowY: 'auto'
            }}
          >
            <Routes>
              <Route
                path="/"
                element={(
                  <HomePage
                    // Pass allNodeData as nodeInfoList, HomePage can derive IPs if needed
                    nodeInfoList={allNodeData} 
                    handleToggle={handleToggleNodeScript}
                    linkQualityMatrix={linkQualityMatrix}
                  />
                )}
              />
              <Route
                path="/node/:ip"
                element={(
                  <NodeDashboard
                    allNodeData={allNodeData}
                    handleToggle={handleToggleNodeScript}
                  />
                )}
              />
              <Route
                path="/map"
                element={<MapView markers={mapMarkers} lqm={linkQualityMatrix} />}
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </>
  );
}