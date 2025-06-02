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
import NodeInfo from './NodeInfo'; // Ensure NodeInfo is imported
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog'; // Added import

const drawerWidth = 350;

function Sidebar({
  allNodeData, // This will be an array of NodeInfo instances
  setAllNodeData,
  setRebootAlertNodeIp, // Added prop
  rebootAlertNodeIp, // Added prop to know which node is currently "initializing"
}) {
  const [ip, setIp] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(''); // Stores the original IP of the node being edited
  const [editPrimary, setEditPrimary] = useState(''); // Stores the potentially new primary IP
  const [editSecondary, setEditSecondary] = useState('');
  const [editName, setEditName] = useState('');

  const addNode = () => {
    if (ip && !allNodeData.some(node => node.ip === ip)) {
      // Use the new NodeInfo constructor
      const newNodeInstance = new NodeInfo(ip, setRebootAlertNodeIp);
      newNodeInstance.nodeName = ''; // Initialize nodeName as empty
      newNodeInstance.manet.ip = '';
      // newNodeInstance.manet.connectionStatus = 'Not Configured'; // NodeInfo constructor handles initial state
      setAllNodeData(prev => [...prev, newNodeInstance]);
      setIp('');
    }
  };

  const removeNode = (ipToRemove) => {
    const nodeInstance = allNodeData.find(instance => instance.ip === ipToRemove);
    if (nodeInstance) {
      nodeInstance.stopInternalPolling(); // Stop polling before removing
    }
    setAllNodeData(prevInstances => prevInstances.filter(instance => instance.ip !== ipToRemove));
  };

  const openEdit = (nodeIp) => {
    const nodeInstance = allNodeData.find(inst => inst.ip === nodeIp);
    if (nodeInstance) {
      setEditTarget(nodeInstance.ip); // Original IP
      setEditPrimary(nodeInstance.ip); // Current IP for editing field
      setEditSecondary(nodeInstance.manet.ip || '');
      setEditName(nodeInstance.nodeName || ''); // Directly use nodeName, or empty if it's null/undefined
      setEditOpen(true);
    }
  };

  const saveEdit = () => {
    setAllNodeData(prev => {
      const inst = prev.find(node => node.ip === editTarget);
      if (inst) {
        // If primary IP changes, we might need to remove the old and add a new one
        // to ensure polling is correctly managed for the new IP.
        // For simplicity here, we assume IP change means we update properties.
        // A more robust solution for IP change would involve removeNode(editTarget) and addNode(newPrimaryIP)
        // while preserving other settings.
        if (inst.ip !== editPrimary) {
            // If IP changes, stop polling for the old IP.
            // The new IP instance will start its own polling if this were a full re-add.
            // However, NodeInfo's internal polling is tied to its 'this.ip'.
            // Changing 'inst.ip' directly without re-instantiating NodeInfo
            // means internal fetch calls will use the new IP, which is intended.
            inst.ip = editPrimary;
        }
        inst.nodeName = editName;
        
        // Use the setManetIp method if available, otherwise set directly
        if (typeof inst.setManetIp === 'function') {
            inst.setManetIp(editSecondary || null);
        } else {
            inst.manet.ip = editSecondary || null;
            inst.manet.connectionStatus = editSecondary ? null : 'Not Configured'; // Let internal polling determine status
        }
      }
      return [...prev]; // Trigger re-render
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
          {allNodeData.map(nodeInstance => { // Iterate over NodeInfo instances
            // Determine status: if nodeInstance.ip matches rebootAlertNodeIp, it's "INITIALIZING"
            // Otherwise, use nodeInstance.status.
            const displayStatus = rebootAlertNodeIp === nodeInstance.ip ? 'INITIALIZING' : nodeInstance.status;
            let bg;
            switch (displayStatus) {
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
                key={nodeInstance.ip} // Use instance.ip as key
                disablePadding
                sx={{
                  width: '100%',
                  backgroundColor: bg,
                }}
              >
                <ListItemIcon sx={{ pl: 1 }}>
                  <IconButton onClick={() => openEdit(nodeInstance.ip)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItemIcon>
                <ListItemButton
                  component={RouterLink}
                  to={`/node/${nodeInstance.ip}`} // Link uses instance.ip
                  sx={{ flex: 1 }}
                >
                  <ListItemText
                    primary={nodeInstance.nodeName || nodeInstance.ip} // Show name or IP
                    primaryTypographyProps={{
                      fontWeight: 'bold',
                      variant: 'body1',
                      fontSize: '1.0rem'
                    }}
                    secondary={
                      <>
                        {nodeInstance.nodeName && ( // Only show Node IP if a custom name is displayed
                          <Typography
                            component="span"
                            variant="body1"
                            color="textSecondary"
                            sx={{ fontSize: '0.9rem', display: 'block' }}
                          >
                            Node IP: {nodeInstance.ip}
                          </Typography>
                        )}
                        <Typography
                          component="span"
                          variant="body1"
                          color="textSecondary"
                          sx={{ fontSize: '0.9rem', display: 'block' }}
                        >
                          MANET: {nodeInstance.manet.ip || 'Not configured'}
                        </Typography>
                      </>
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                      sx: { mt: 0.5, fontSize: '0.9rem' }
                    }}
                  />
                </ListItemButton>
                <ListItemSecondaryAction>
                  <IconButton onClick={() => removeNode(nodeInstance.ip)} size="small">
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

export default function App() {
  const [allNodeData, setAllNodeData] = useState([]);
  const allNodeDataRef = useRef(allNodeData);
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false); // New state for loading status

  // Add state for map markers and LQM
  const [mapMarkers, setMapMarkers] = useState([]);
  const [lqm, setLQM] = useState([]);

  // NEW: State to trigger map data refresh
  const [mapDataRefreshTrigger, setMapDataRefreshTrigger] = useState(0);

  // Function to load map data from API
  const loadMapData = useCallback(() => {
    // Find the first node with a valid manet.ip
    const currentNodes = allNodeDataRef.current; // Use ref for reading
    const targetNode = currentNodes.find(node => node.manet && node.manet.ip && node.manet.connectionStatus === 'Connected'); // Ensure connected
    if (!targetNode) {
      // console.warn("No node with a connected manet.ip found for map data.");
      // setMapMarkers([]); // Clear markers if no suitable node
      // setLQM([]); // Clear LQM
      return;
    }
    const API_URL = `http://${targetNode.manet.ip}/status`; // Assuming /status provides map-related data

    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        const infos = Array.isArray(data.nodeInfos)
          ? data.nodeInfos
          : Object.values(data.nodeInfos || {});
        
        const enriched = infos.map(info => ({
          ...info,
          batteryLevel:
            data.selfId === info.id && data.batteryLevel !== undefined
              ? (data.batteryLevel * 10).toFixed(2) + '%' // Assuming batteryLevel is a fraction, convert to percentage
              : 'unknown'
        }));
        
        // Update map markers based on all nodes that have selfManetInfo
        // NodeInfo instances now update their own manet.nodeInfo and manet.selfManetInfo
        // So, we can derive markers directly from allNodeData
        const currentMapMarkers = currentNodes
            .map(node => node.manet.selfManetInfo)
            .filter(info => info && info.latitude && info.longitude);

        // Only update if there's a change to avoid unnecessary re-renders of the map
        if (JSON.stringify(currentMapMarkers) !== JSON.stringify(mapMarkers)) {
            setMapMarkers(currentMapMarkers);
        }

        const rawLQM = Array.isArray(data.linkQuality)
          ? data.linkQuality
          : [];
        
        // We need all manetInfos from all nodes for buildStaticsLQM
        const allManetNodeInfos = currentNodes.reduce((acc, node) => {
            if (node.manet && node.manet.nodeInfo) { // node.manet.nodeInfo should be an array
                node.manet.nodeInfo.forEach(info => {
                    // Add to acc if not already present (based on id)
                    if (!acc.find(existingInfo => existingInfo.id === info.id)) {
                        acc.push(info);
                    }
                });
            }
            return acc;
        }, []);

        if (allManetNodeInfos.length > 0) {
            const fullLQM = buildStaticsLQM(allManetNodeInfos, rawLQM, lqm, 100, null);
            // Only update if there's a change
            if (JSON.stringify(fullLQM) !== JSON.stringify(lqm)) {
                setLQM(fullLQM);
            }
        } else {
            // setLQM([]); // Clear LQM if no nodeInfos
        }
        // No direct setAllNodeData here for map data to avoid conflicts with NodeInfo's internal state.
        // NodeInfo instances are responsible for their own manet data.
      })
      .catch(error => {
        // console.error(`Error loading map data from ${API_URL}:`, error);
        // setMapMarkers([]); // Clear markers on error
        // setLQM([]); // Clear LQM on error
      });
  }, [lqm, mapMarkers]); // Removed allNodeData, setAllNodeData as direct deps

  // NEW: Hard refresh rate for map data (e.g., every 30 seconds)
  useEffect(() => {
    loadMapData(); // Initial load
    const intervalId = setInterval(() => {
      setMapDataRefreshTrigger(t => t + 1);
    }, 30000); // 30000 ms = 30 seconds
    return () => clearInterval(intervalId);
  }, [loadMapData]);

  // Only update map data when mapDataRefreshTrigger changes
  useEffect(() => {
    loadMapData();
  }, [mapDataRefreshTrigger, loadMapData]);

  // Effect to keep ref in sync with state
  useEffect(() => {
    allNodeDataRef.current = allNodeData;
  }, [allNodeData]);

  // Effect 1: Initial load of allNodeData from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('allNodeDataStorage');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const instances = parsed.map(data => {
          const instance = new NodeInfo(data.ip, setRebootAlertNodeIp);
          instance.nodeName = data.nodeName;
          if (data.manetIp) {
            instance.setManetIp(data.manetIp);
          }
          return instance;
        });
        setAllNodeData(instances);
      } catch (e) {
        console.error("Failed to parse or rehydrate from localStorage:", e);
        setAllNodeData([]); // Initialize to empty array on error
      }
    }
    setIsLoadedFromStorage(true); // Signal that loading is complete
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setRebootAlertNodeIp is stable

  // Effect 2: Persist essential NodeInfo data to localStorage
  useEffect(() => {
    if (!isLoadedFromStorage) {
      return; // Don't save until initial load is done
    }
    // Use the toPlainObject method from NodeInfo instances for cleaner persistence
    const plainObjects = allNodeData.map(instance => instance.toPlainObject ? instance.toPlainObject() : { ip: instance.ip, nodeName: instance.nodeName, manetIp: instance.manet ? instance.manet.ip : null });
    localStorage.setItem('allNodeDataStorage', JSON.stringify(plainObjects));
  }, [allNodeData, isLoadedFromStorage]); // Add isLoadedFromStorage to dependency array

  // Effect 3: UI Update Tick (replaces old polling effects)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setAllNodeData(prevData => [...prevData]); // Trigger re-render by creating a new array reference
    }, 1000); // Update UI every 1 second

    return () => clearInterval(tickInterval);
  }, []); // Runs once on mount

  // Effect 4: Cleanup polling on unmount
  useEffect(() => {
    return () => {
      allNodeDataRef.current.forEach(node => {
        if (node && typeof node.stopInternalPolling === 'function') {
          node.stopInternalPolling();
        }
      });
    };
  }, []); // Runs once on mount and cleans up on unmount
  
  // Effect 5: Clear rebootAlertNodeIp after a delay if it's set
  useEffect(() => {
    let timer;
    if (rebootAlertNodeIp) {
      timer = setTimeout(() => {
        setRebootAlertNodeIp(null);
      }, 5000); // Clear after 5 seconds, assuming NodeInfo's internal polling has updated status
    }
    return () => clearTimeout(timer);
  }, [rebootAlertNodeIp]);

  // console.log(allNodeData); 

  return (
    <>
      <CssBaseline />
      <RebootAlertDialog 
        open={!!rebootAlertNodeIp}
        nodeIp={rebootAlertNodeIp}
        onClose={() => setRebootAlertNodeIp(null)}
      />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar
            allNodeData={allNodeData}
            setAllNodeData={setAllNodeData}
            setRebootAlertNodeIp={setRebootAlertNodeIp}
            rebootAlertNodeIp={rebootAlertNodeIp} // Pass rebootAlertNodeIp to Sidebar
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              overflowY: 'auto'
            }}
          >
            <Routes>
              <Route
                path="/"
                element={( 
                  <HomePage
                    allNodeData={allNodeData}
                    // handleToggle={handleToggleNodeScript} // Remove this prop
                    setAllNodeData={setAllNodeData}
                  />
                )}
              />
              <Route
                path="/node/:ip"
                element={(
                  <NodeDashboard
                    allNodeData={allNodeData}
                    // handleToggle={handleToggleNodeScript} // Remove this prop
                  />
                )}
              />
              <Route
                path="/map"
                element={<MapView 
                  markers={mapMarkers} 
                  linkQualityMatrix={lqm} />}
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </>
  );
}