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
import NodeInfo from './NodeInfo'; // Ensure NodeInfo is imported

const drawerWidth = 350;

function Sidebar({
  allNodeData, // This will be an array of NodeInfo instances
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
      const newNodeInstance = new NodeInfo(ip);
      newNodeInstance.nodeName = `Node ${ip}`;
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
      setEditName(nodeInstance.nodeName || `Node ${nodeInstance.ip}`);
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
                    primary={nodeInstance.nodeName || `Node ${nodeInstance.ip}`}
                    primaryTypographyProps={{
                      fontWeight: 'bold',
                      variant: 'body1',
                      fontSize: '1.0rem'
                    }}
                    secondary={
                      nodeInstance.nodeName && nodeInstance.nodeName !== `Node ${nodeInstance.ip}` // Show IP if name is not default
                        ? (
                          <>
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              Node IP: {nodeInstance.ip}
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              MANET: {nodeInstance.manet.ip || 'Not configured'}
                            </Typography>
                          </>
                        )
                        : `MANET: ${nodeInstance.manet.ip || 'Not configured'}`
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                      sx: { mt: (nodeInstance.nodeName && nodeInstance.nodeName !== `Node ${nodeInstance.ip}`) ? 0 : 0.5, fontSize: '0.9rem' }
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
  const [allNodeData, setAllNodeData] = useState([]); // Will hold NodeInfo instances
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null);
  // Add state for map markers and LQM
  const [mapMarkers, setMapMarkers] = useState([]);
  const [lqm, setLQM] = useState([]);

  // Function to load map data from API
  const loadMapData = useCallback(() => {
    const API_URL = 'http://192.168.2.141/status';
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
        const selfNodeInfo = enriched.find(info => info.id === data.selfId) || null;
        setMapMarkers(enriched);
        const rawLQM = Array.isArray(data.linkQuality)
          ? data.linkQuality
          : [];
        const fullLQM = buildStaticsLQM(infos, rawLQM, lqm, 100, null);
        setLQM(fullLQM);

      })
      .catch(console.error);
  }, [lqm, setAllNodeData]);

  // Load map data on mount
  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Effect 1: Initial load of allNodeData from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('allNodeDataStorage');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const instances = parsed.map(data => {
          const instance = new NodeInfo(data.ip);
          instance.nodeName = data.nodeName;
          instance.manet.ip = data.manetIp;
          instance.manet.connectionStatus = data.manetConnectionStatus;
          instance._currentStatus = data.status;
          instance.attributes = data.attributes;
          instance.isInitializing = data.isInitializing || false;
          return instance;
        });
        setAllNodeData(instances);
      } catch {
        setAllNodeData([]);
      }
    }
  }, []);

  // Effect 2: Persist allNodeData to localStorage
  useEffect(() => {
    const plainObjects = allNodeData.map(instance => ({
      ip: instance.ip,
      nodeName: instance.nodeName,
      manetIp: instance.manet.ip,
      status: instance.status,
      attributes: instance.attributes,
      isInitializing: instance.isInitializing,
      manetConnectionStatus: instance.manet.connectionStatus,
    }));
    localStorage.setItem('allNodeDataStorage', JSON.stringify(plainObjects));
  }, [allNodeData]);

  // Effect 3: Polling using NodeInfo methods
  useEffect(() => {
    let isMounted = true;
    const intervalId = setInterval(async () => {
      if (!isMounted || allNodeData.length === 0) return;
      await Promise.all(allNodeData.map(async node => {
        await node.refreshStatusFromServer();
        await node.refreshAttributesFromServer();
        await node.checkManetConnection();
      }));
      if (isMounted) setAllNodeData(prev => [...prev]);
    }, 5000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, [allNodeData]);

  const handleToggleNodeScript = useCallback(async (ip, action) => {
    const node = allNodeData.find(n => n.ip === ip);
    if (!node) return;
    node.isInitializing = true;
    setAllNodeData(prev => [...prev]);

    const result = await node.toggleScript(action);

    await node.refreshStatusFromServer();
    if (node.status === 'RUNNING') await node.refreshAttributesFromServer();
    await node.checkManetConnection();
    node.isInitializing = false;
    setAllNodeData(prev => [...prev]);

    if (result.showRebootAlert) setRebootAlertNodeIp(ip);
  }, [allNodeData, setRebootAlertNodeIp]);

  const ipListForLQM = allNodeData.map(node => node.ip);
  const { linkQualityMatrix } = [];

  console.log(allNodeData); // This will now log an array of NodeInfo instances

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
                element={(<HomePage
                  nodeInfoList={allNodeData} 
                  handleToggle={handleToggleNodeScript}
                  linkQualityMatrix={linkQualityMatrix}
                />)}
              />
              <Route
                path="/node/:ip"
                element={(
                  <NodeDashboard
                    allNodeData={allNodeData} // Pass array of NodeInfo instances
                    handleToggle={handleToggleNodeScript}
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