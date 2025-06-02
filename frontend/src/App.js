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
}) {
  const [ip, setIp] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(''); // Stores the original IP of the node being edited
  const [editPrimary, setEditPrimary] = useState(''); // Stores the potentially new primary IP
  const [editSecondary, setEditSecondary] = useState('');
  const [editName, setEditName] = useState('');

  const addNode = () => {
    if (ip && !allNodeData.some(node => node.ip === ip)) {
      // Pass setAllNodeData and setRebootAlertNodeIp to the NodeInfo constructor
      const newNodeInstance = new NodeInfo(ip, setAllNodeData, setRebootAlertNodeIp);
      newNodeInstance.nodeName = ''; // Initialize nodeName as empty
      newNodeInstance.manet.ip = '';
      newNodeInstance.manet.connectionStatus = 'Not Configured';
      setAllNodeData(prev => [...prev, newNodeInstance]);
      setIp('');
    }
  };

  const removeNode = (ipToRemove) => {
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
        inst.ip = editPrimary;
        inst.nodeName = editName;
        inst.manet.ip = editSecondary;
        inst.manet.connectionStatus = editSecondary ? 'Not Configured' : 'Not Configured';
      }
      return [...prev];
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
            const currentStatus = nodeInstance.status || 'DISCONNECTED';
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
  const [hasLoaded, setHasLoaded] = useState(false); // Ensure this is declared
  const allNodeDataRef = useRef(allNodeData);
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null);

  // Add state for map markers and LQM
  const [mapMarkers, setMapMarkers] = useState([]);
  const [lqm, setLQM] = useState([]);

  // NEW: State to trigger map data refresh
  const [mapDataRefreshTrigger, setMapDataRefreshTrigger] = useState(0);

  // Function to load map data from API
  const loadMapData = useCallback(() => {
    // Find the first node with a valid manet.ip
    const targetNode = allNodeData.find(node => node.manet && node.manet.ip);
    if (!targetNode) {
      console.warn("No node with a valid manet.ip found.");
      return;
    }
    const API_URL = `http://${targetNode.manet.ip}/status`;

    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        const infos = Array.isArray(data.nodeInfos)
          ? data.nodeInfos
          : Object.values(data.nodeInfos || {});
        const enriched = infos.map(info => ({
          ...info,
          batteryLevel:
            data.selfId === info.id
              ? (data.batteryLevel * 10).toFixed(2) + '%'
              : 'unknown'
        }));
        // if (JSON.stringify(enriched) !== JSON.stringify(mapMarkers)) {
        //   setMapMarkers(enriched);
        // }
        const rawLQM = Array.isArray(data.linkQuality)
          ? data.linkQuality
          : [];
        const fullLQM = buildStaticsLQM(infos, rawLQM, lqm, 100, null);
        setLQM(fullLQM);

        setAllNodeData(prevAllNodeData => {
          return prevAllNodeData.map(node => {
            // Find enriched info by manet IP
            const match = enriched.find(info => info.ip === node.manet.ip);
            if (match) {
              node.manet.nodeInfo = enriched;
              node.manet.selfManetInfo = match;
            }
            return node;
          });
        });

        // Use selfManetInfo for map markers
        const selfManetMarkers = allNodeData
          .map(node => node.manet.selfManetInfo)
          .filter(info => info && info.latitude && info.longitude);
        setMapMarkers(selfManetMarkers);


      })
      .catch(console.error);
  }, [allNodeData, lqm, mapMarkers]); // Removed setAllNodeData from here as it's implicitly covered by allNodeData

  // NEW: Hard refresh rate for map data
  useEffect(() => {
    if (!hasLoaded) return; // Wait for initial load
    loadMapData(); // Initial load for map
    const intervalId = setInterval(() => {
      setMapDataRefreshTrigger(t => t + 1);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadMapData, hasLoaded]); // Add hasLoaded

  // Only update map data when mapDataRefreshTrigger changes
  useEffect(() => {
    if (!hasLoaded) return; // Wait for initial load
    loadMapData();
  }, [mapDataRefreshTrigger, loadMapData, hasLoaded]); // Add hasLoaded

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
          const instance = new NodeInfo(data.ip, setAllNodeData, setRebootAlertNodeIp);
          instance.nodeName = data.nodeName;
          instance.manet.ip = data.manetIp;
          instance.manet.connectionStatus = data.manetConnectionStatus;
          instance._currentStatus = data.status;
          instance.attributes = data.attributes;
          instance.isInitializing = data.isInitializing || false;
          return instance;
        });
        setAllNodeData(instances);
      } catch (e) { // Catch specific error
        console.error("Failed to parse localStorage data:", e);
        setAllNodeData([]);
      }
    }
    setHasLoaded(true); // Set hasLoaded to true AFTER attempting to load and set state
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect 2: Persist allNodeData to localStorage
  useEffect(() => {
    if (!hasLoaded) { // Guard: Only run if initial load is complete
      return;
    }
    const plainObjects = allNodeData.map(instance => ({
      ip: instance.ip,
      nodeName: instance.nodeName,
      manetIp: instance.manet.ip,
      status: instance.status, // Relies on NodeInfo's getter
      attributes: instance.attributes, // Consider if all attributes need to be persisted
      isInitializing: instance.isToggleInProgress, // Persist based on isToggleInProgress
      manetConnectionStatus: instance.manet.connectionStatus,
    }));
    localStorage.setItem('allNodeDataStorage', JSON.stringify(plainObjects));
  }, [allNodeData, hasLoaded]); // Depend on allNodeData and hasLoaded

  // Effect 3: Poll attributes every 2 seconds with re-entrancy guard
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    let running = false;
    const attrInterval = setInterval(async () => {
      const currentNodes = allNodeDataRef.current;
      if (running || currentNodes.length === 0) return;
      running = true;
      try {
        await Promise.all(currentNodes.map(node => node.refreshAttributesFromServer()));
        setAllNodeData(prevNodes => [...prevNodes]); // Use functional update or ensure currentNodes is fresh
      } catch (error) {
        console.error("Error polling attributes:", error);
      } finally {
        running = false;
      }
    }, 2000);
    return () => clearInterval(attrInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array

  // Effect 4: Poll status every 8 seconds
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    let running = false;
    const statusInterval = setInterval(async () => {
      const currentNodes = allNodeDataRef.current;
      if (running || currentNodes.length === 0) return;
      running = true;
      try {
        await Promise.all(currentNodes.map(node => node.refreshStatusFromServer()));
        setAllNodeData(prevNodes => [...prevNodes]);
      } catch (error) {
        console.error("Error polling status:", error);
      } finally {
        running = false;
      }
    }, 5000);
    return () => clearInterval(statusInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array

  // Effect 5: Poll MANET connection every 2 seconds (as per user's current code)
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    let running = false;
    const manetInterval = setInterval(async () => {
      const currentNodes = allNodeDataRef.current;
      if (running || currentNodes.length === 0) return;
      running = true;
      try {
        await Promise.all(currentNodes.map(node => node.checkManetConnection()));
        setAllNodeData(prevNodes => [...prevNodes]);
      } catch (error) {
        console.error("Error polling MANET connection:", error);
      } finally {
        running = false;
      }
    }, 2000); // Interval was 2000 in user's code
    return () => clearInterval(manetInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array

  //console.log(allNodeData); // This will now log an array of NodeInfo instances

  return (
    <>
      <CssBaseline />
      <RebootAlertDialog // Added RebootAlertDialog
        open={!!rebootAlertNodeIp}
        nodeIp={rebootAlertNodeIp}
        onClose={() => setRebootAlertNodeIp(null)}
      />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar
            allNodeData={allNodeData}
            setAllNodeData={setAllNodeData}
            setRebootAlertNodeIp={setRebootAlertNodeIp} // Pass setter to Sidebar
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