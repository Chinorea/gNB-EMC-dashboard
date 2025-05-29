import React, { useState, useEffect, useCallback } from 'react';
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
import NodeInfo from './NodeInfo';
import buildStaticsLQM from './utils';
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog';

const drawerWidth = 350;

function Sidebar({
  nodes,
  setNodes,
  nodeInfoMap,
  setNodeNames,
  setSecondaryIps,
}) {
  const [ip, setIp] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState('');
  const [editPrimary, setEditPrimary] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [editName, setEditName] = useState('');

  const addNode = () => {
    if (ip && !nodes.includes(ip)) {
      setNodes(prev => [...prev, ip]);
      setNodeNames(prev => ({ ...prev, [ip]: '' }));
      setSecondaryIps(prev => ({ ...prev, [ip]: '' }));
      setIp('');
    }
  };

  const removeNode = (ipToRemove) => {
    setNodes(prev => prev.filter(item => item !== ipToRemove));
    setNodeNames(prev => {
      const { [ipToRemove]: _, ...rest } = prev;
      return rest;
    });
    setSecondaryIps(prev => {
      const { [ipToRemove]: _, ...rest } = prev;
      return rest;
    });
  };

  const openEdit = (n) => {
    const nodeInfo = nodeInfoMap[n];
    setEditTarget(n);
    setEditPrimary(n);
    setEditSecondary(nodeInfo?.manet.ip || ''); // Corrected to nodeInfo.manet.ip
    setEditName(nodeInfo?.nodeName || '');
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (editPrimary !== editTarget) {
      setNodes(prev => prev.map(x => x === editTarget ? editPrimary : x));
      setNodeNames(prev => {
        const { [editTarget]: oldName, ...rest } = prev;
        return { ...rest, [editPrimary]: editName || oldName || '' };
      });
      setSecondaryIps(prev => {
        const { [editTarget]: oldManetIp, ...rest } = prev;
        return { ...rest, [editPrimary]: editSecondary || oldManetIp || '' };
      });
    } else {
      setNodeNames(prev => ({ ...prev, [editTarget]: editName }));
      setSecondaryIps(prev => ({ ...prev, [editTarget]: editSecondary }));
    }
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
          {nodes.map(n => {
            const nodeInfo = nodeInfoMap[n];
            const currentStatus = nodeInfo?.status || 'DISCONNECTED'; // Use the new status getter
            let bg;
            switch (currentStatus) {
              case 'RUNNING':
                bg = '#d4edda'; // green
                break;
              case 'INITIALIZING':
                bg = '#fff3cd'; // yellow
                break;
              case 'OFF':
                bg = '#f8d7da'; // red
                break;
              case 'DISCONNECTED': // Explicitly handle DISCONNECTED
              default:
                bg = 'lightgrey';
            }

            return (
              <ListItem
                key={n}
                disablePadding
                sx={{
                  width: '100%',
                  backgroundColor: bg,
                }}
              >
                <ListItemIcon sx={{ pl: 1 }}>
                  <IconButton onClick={() => openEdit(n)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItemIcon>
                <ListItemButton
                  component={RouterLink}
                  to={`/node/${n}`}
                  sx={{ flex: 1 }}
                >
                  <ListItemText
                    primary={nodeInfo?.nodeName || `Node: ${n}`}
                    primaryTypographyProps={{
                      fontWeight: 'bold',
                      variant: 'body1',
                      fontSize: '1.0rem'
                    }}
                    secondary={
                      nodeInfo?.nodeName
                        ? (
                          <>
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              Node: {n}
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              MANET: {nodeInfo?.manet.ip || 'Not configured'} {/* Corrected to nodeInfo.manet.ip */}
                            </Typography>
                          </>
                        )
                        : `MANET: ${nodeInfo?.manet.ip || 'Not configured'}` /* Corrected */
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                      sx: { mt: nodeInfo?.nodeName ? 0 : 0.5, fontSize: '0.9rem' }
                    }}
                  />
                </ListItemButton>
                <ListItemSecondaryAction>
                  <IconButton onClick={() => removeNode(n)} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        {/* Edit Node Dialog */}
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
                value={editPrimary}
                onChange={e => setEditPrimary(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Marnet IP" // Typo: Marnet -> MANET
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
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem('nodes');
    return saved ? JSON.parse(saved) : [];
  });
  const [nodeNames, setNodeNames] = useState(() => {
    const saved = localStorage.getItem('nodeNames');
    return saved ? JSON.parse(saved) : {};
  });
  const [secondaryIps, setSecondaryIps] = useState(() => {
    const saved = localStorage.getItem('secondaryIps');
    return saved ? JSON.parse(saved) : {};
  });

  const [nodeInfoMap, setNodeInfoMap] = useState({});
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null);

  const { linkQualityMatrix, mapMarkers } = buildStaticsLQM(nodes, nodeInfoMap);
const DUMMY_MARKERS = [
  {
    "nodeInfos": [
    {
      "id": 20,
      "ip": "192.168.1.4",
      "latitude": "1.33631",
      "longitude": "103.744179",
      "altitude": 15.2,
      "resourceRatio": 0.73
    },
    {
      "id": 25,
      "ip": "192.168.1.5",
      "latitude": "1.32631",
      "longitude": "103.745179",
      "altitude": 22.7,
      "resourceRatio": 0.45
    },
    {
      "id": 32,
      "ip": "192.168.1.6",
      "latitude": "1.33531",
      "longitude": "103.746179",
      "altitude":  8.9,
      "resourceRatio": 0.88
    },
    {
      "id": 36,
      "ip": "192.168.1.7",
      "latitude": "1.33731",
      "longitude": "103.743179",
      "altitude": 31.4,
      "resourceRatio": 0.52
    },
    {
      "id": 38,
      "ip": "192.168.1.8",
      "latitude": "1.33831",
      "longitude": "103.740179",
      "altitude": 19.6,
      "resourceRatio": 0.29
    }
    ]}
];

const DUMMY_LQM = [
  [-10,  12,   5,  30,  -3],
  [ 12, -10,  25,   0,  15],
  [  5,  25, -10,  10,  20],
  [ 30,   0,  10, -10,   8],
  [ -3,  15,  20,   8, -10],
];

  useEffect(() => {
    localStorage.setItem('nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('secondaryIps', JSON.stringify(secondaryIps));
  }, [secondaryIps]);

  useEffect(() => {
    localStorage.setItem('nodeNames', JSON.stringify(nodeNames));
  }, [nodeNames]);

  // Effect to initialize/update nodeInfoMap
  useEffect(() => {
    setNodeInfoMap(prevNodeInfoMap => {
      const newNodeInfoMap = { ...prevNodeInfoMap };
      const currentIpsInMap = Object.keys(newNodeInfoMap);
      const activeIps = new Set(nodes);

      currentIpsInMap.forEach(ip => {
        if (!activeIps.has(ip)) {
          delete newNodeInfoMap[ip];
        }
      });

      nodes.forEach(ip => {
        const nodeName = nodeNames[ip] || '';
        const manetIp = secondaryIps[ip] || '';

        if (newNodeInfoMap[ip]) {
          const ni = newNodeInfoMap[ip];
          if (ni.nodeName !== nodeName) {
            ni.setNodeName(nodeName);
          }
          if (ni.manet.ip !== manetIp) {
            ni.setManetIp(manetIp);
            if (manetIp) ni.checkManetConnection(); else ni.setManetConnectionStatus('Not Configured');
          }
        } else {
          const ni = new NodeInfo(ip);
          ni.setNodeName(nodeName);
          ni.setManetIp(manetIp);
          // Initial status poll for new nodes. Attributes fetched after status is RUNNING.
          // isInitializing will be false by default here.
          ni.refreshStatusFromServer().then(() => {
            if (ni.status === 'RUNNING') { // status getter will reflect _currentStatus
              ni.refreshAttributesFromServer();
            }
            setNodeInfoMap(prevMap => ({ ...prevMap, [ip]: { ...ni } })); // Trigger update
          });
          if (manetIp) ni.checkManetConnection(); else ni.setManetConnectionStatus('Not Configured');
          newNodeInfoMap[ip] = ni;
        }
      });
      return newNodeInfoMap;
    });
  }, [nodes, nodeNames, secondaryIps]);

  // Polling effect for node statuses and attributes
  useEffect(() => {
    const intervalId = setInterval(() => {
      Object.values(nodeInfoMap).forEach(async nodeInfo => {
        // Only poll if not currently initializing (i.e., a toggle operation is not active)
        if (!nodeInfo.isInitializing) {
          await nodeInfo.refreshStatusFromServer();
          if (nodeInfo.status === 'RUNNING') { // status getter reflects the new _currentStatus
            await nodeInfo.refreshAttributesFromServer();
          }
          if (nodeInfo.manet.ip) {
            await nodeInfo.checkManetConnection();
          }
          // Trigger re-render for this specific node if its status/attributes might have changed
          setNodeInfoMap(prevMap => ({ ...prevMap, [nodeInfo.ip]: { ...nodeInfo } }));
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [nodeInfoMap]);

  const handleToggleNodeScript = useCallback(async (ip, action) => {
    const nodeInfo = nodeInfoMap[ip];
    if (nodeInfo) {
      // isInitializing is set to true at the start of nodeInfo.toggleScript
      // and false at the end.
      const result = await nodeInfo.toggleScript(action);

      if (result.showRebootAlert) {
        setRebootAlertNodeIp(ip);
        // isInitializing remains true from toggleScript, status getter will return INITIALIZING.
        // Polling will eventually update _currentStatus and isInitializing will be set to false.
      }

      // After toggleScript completes (isInitializing is now false):
      // Refresh status to get the latest state from the server.
      await nodeInfo.refreshStatusFromServer();
      if (nodeInfo.status === 'RUNNING') { // status getter reflects the new _currentStatus
        await nodeInfo.refreshAttributesFromServer();
      }

      // Update the map to ensure UI reflects the new state post-toggle and refresh.
      setNodeInfoMap(prevMap => ({ ...prevMap, [ip]: { ...nodeInfo } }));
    }
  }, [nodeInfoMap, setRebootAlertNodeIp]); // Added setRebootAlertNodeIp to dependencies

  const nodeInfoList = Object.values(nodeInfoMap || {});

  return (
    <>
      <CssBaseline />
      <RebootAlertDialog open={!!rebootAlertNodeIp} onClose={() => setRebootAlertNodeIp(null)} />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar
            nodes={nodes}
            setNodes={setNodes}
            nodeInfoMap={nodeInfoMap}
            setNodeNames={setNodeNames}
            setSecondaryIps={setSecondaryIps}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              overflowY: 'auto' // Ensure main content area is scrollable if needed
            }}
          >
            <Routes>
              <Route
                path="/"
                element={(
                  <HomePage
                    nodeInfoList={nodeInfoList}
                    handleToggle={handleToggleNodeScript} // Correct prop name
                    linkQualityMatrix={linkQualityMatrix} // Pass LQM
                  />
                )}
              />
              <Route
                path="/node/:ip"
                element={(
                  <NodeDashboard
                    nodeInfoMap={nodeInfoMap}
                    handleToggle={handleToggleNodeScript} // Correct prop name
                  />
                )}
              />
              <Route
                path="/map"
                element={<MapView markers={mapMarkers} lqm={linkQualityMatrix} />} // Pass LQM
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </>
  );
}