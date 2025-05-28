import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  Drawer,
  Box,
  TextField,
  Button,
  Divider,
  List,
  ListItem, // Added ListItem
  ListItemButton,
  ListItemIcon, // Added ListItemIcon
  ListItemText,
  ListSubheader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  ListItemSecondaryAction // Added ListItemSecondaryAction
} from '@mui/material';
import EditIcon  from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
import MapView from './Map'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog'; // Import RebootAlertDialog

const drawerWidth = 350;  // increased width to fit "Node: x.x.x.x"

// define your data
const myMarkers = [
  {
    coords: [1.3362, 103.7432],
    popup:  "This is marker #1",
    label:  "M1"
  },
  {
    coords: [1.3372, 103.7452],
    popup:  "Second location",
    label:  "M2"
  },
  // … more …
];
function Sidebar({
  nodes,
  setNodes,
  statuses,
  loadingMap,
  secondaryIps,
  setSecondaryIps,
  nodeNames,
  setNodeNames,
  onToggleDark,
  darkMode
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
      setIp('');
    }
  };

  const removeNode = (ipToRemove) => {
    setNodes(prev => prev.filter(item => item !== ipToRemove));
  };

  const openEdit = (n) => {
    setEditTarget(n);
    setEditPrimary(n);
    setEditSecondary(secondaryIps[n] || '');
    setEditName(nodeNames[n] || '');
    setEditOpen(true);
  };
  const saveEdit = () => {
    // update primary key if renamed
    if (editPrimary !== editTarget) {
      setNodes(prev => prev.map(x => x === editTarget ? editPrimary : x));
      setSecondaryIps(prev => {
        const { [editTarget]: _, ...rest } = prev;
        return { ...rest, [editPrimary]: editSecondary };
      });
      setNodeNames(prev => {
        const { [editTarget]: _, ...rest } = prev;
        return { ...rest, [editPrimary]: editName };
      });
    } else {
      setSecondaryIps(prev => ({ ...prev, [editTarget]: editSecondary }));
      setNodeNames(prev => ({ ...prev, [editTarget]: editName }));
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
            const status = loadingMap[n]
              ? 'INITIALISING'
              : statuses[n] || 'UNREACHABLE';
            let bg;
            switch (status) {
              case 'RUNNING':
                bg = '#d4edda';       // green
                break;
              case 'INITIALISING':
                bg = '#fff3cd';       // yellow
                break;
              case 'OFF':
                bg = '#f8d7da';       // red
                break;
              default:                // UNREACHABLE
                bg = 'lightgrey';
            }

            return (
              <ListItem
                key={n}
                disablePadding
                sx={{
                  width: '100%',           // full width
                  backgroundColor: bg,     // highlight whole row
                }}
              >
                {/* left‐aligned cog */}
                <ListItemIcon sx={{ pl: 1 }}>
                  <IconButton onClick={() => openEdit(n)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItemIcon>

                {/* main link */}
                <ListItemButton
                  component={RouterLink}
                  to={`/node/${n}`}
                  sx={{ flex: 1 }}         // fill available space
                >
                  <ListItemText
                    primary={ nodeNames[n] || `Node: ${n}` }
                    primaryTypographyProps={{
                      fontWeight: nodeNames[n] ? 'bold' : 'bold',
                      variant: nodeNames[n] ? 'body1' : 'body1',
                      fontSize: '1.0rem'
                    }}
                    secondary={
                      nodeNames[n]
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
                            <br/>
                            <Typography
                              component="span"
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              MANET: {secondaryIps[n] || 'Not configured'}
                            </Typography>
                          </>
                        )
                        : `MANET: ${secondaryIps[n] || 'Not configured'}`
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                      sx: { mt: nodeNames[n] ? 0 : 0.5, fontSize: '0.9rem' }
                    }}
                  />
                </ListItemButton>

                {/* right‐aligned remove */}
                <ListItemSecondaryAction>
                  <IconButton onClick={() => removeNode(n)} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        {/* Edit Node / Marnet IP / Name Dialog */}
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
                label="Marnet IP"
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
  // load saved nodes from localStorage (or start empty)
  const [nodes, setNodes]         = useState(() => {
    const saved = localStorage.getItem('nodes');
    return saved ? JSON.parse(saved) : [];
  });
  const [nodeStatuses, setStatuses] = useState({});
  const [nodeAttrs, setNodeAttrs]   = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [secondaryIps, setSecondaryIps] = useState(() => {
    const saved = localStorage.getItem('secondaryIps');
    return saved ? JSON.parse(saved) : {};
  });
  const [nodeNames, setNodeNames]       = useState(() => {
    const saved = localStorage.getItem('nodeNames');
    return saved ? JSON.parse(saved) : {};
  });
  const [manetConnectionMap, setManetConnectionMap] = useState({});
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null); // For global reboot alert

  // whenever nodes changes, persist it
  useEffect(() => {
    localStorage.setItem('nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('secondaryIps', JSON.stringify(secondaryIps));
  }, [secondaryIps]);

  useEffect(() => {
    localStorage.setItem('nodeNames', JSON.stringify(nodeNames));
  }, [nodeNames]);


  // --- ping MANET connections centrally ---
  useEffect(() => {
    const updateManet = () => {
      Object.entries(secondaryIps).forEach(([ip, manetIp]) => {
        if (!manetIp) {
          // no secondary IP configured
          setManetConnectionMap(prev => ({ ...prev, [ip]: 'Not Configured' }));
        } else {
          // check connectivity
          fetch(`http://${manetIp}`, { method: 'HEAD', mode: 'no-cors' })
            .then(() => setManetConnectionMap(prev => ({ ...prev, [ip]: 'Connected' })))
            .catch(() => setManetConnectionMap(prev => ({ ...prev, [ip]: 'Disconnected' })));
        }
      });
    };
    updateManet();
    const id = setInterval(updateManet, 3000);
    return () => clearInterval(id);
  }, [secondaryIps]);
  
  useEffect(() => {
    if (!nodes.length) return;
    
    // fetch all the "fast" attrs (no Raptor)
    const updateAttrs = () => {
      nodes.forEach(ip => {
        fetch(`http://${ip}:5000/api/attributes`)
          .then(res => res.json())
          .then(data => {
            setNodeAttrs(prev => ({ ...prev, [ip]: data }));
          })
          .catch(() => {
            /* handle unreachable basic attrs if you like */
          });
      });
    };

    // fetch node (raptor) status separately
    const updateNodeStatus = () => {
      nodes.forEach(ip => {
        // if this node is being toggled, show INITIALISING
        if (loadingMap[ip]) {
          setStatuses(prev => ({ ...prev, [ip]: "INITIALISING" }));
          return;
        }
        fetch(`http://${ip}:5000/api/node_status`)
          .then(res => res.json())
          .then(({ node_status }) => {
            setStatuses(prev => ({ ...prev, [ip]: node_status }));
          })
          .catch(() => {
            setStatuses(prev => ({ ...prev, [ip]: "UNREACHABLE" }));
          });
      });
    };

    updateAttrs();
    updateNodeStatus();

    const id1      = setInterval(updateAttrs, 1000);          // fast loop
    const idStatus = setInterval(updateNodeStatus, 3000);    // slower loop
    return () => {
      clearInterval(id1);
      clearInterval(idStatus);
    };
  }, [nodes]);

  const handleToggle = async (ip) => {
    setLoadingMap(prev => ({ ...prev, [ip]: true }));
    const nodeStatus = nodeStatuses[ip] || 'UNREACHABLE';

    try {
      const res = await fetch(`http://${ip}:5000/api/setup_script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nodeStatus === 'OFF' ? 'setupv2' : 'stop'
        })
      });

      if (res.status === 504) {
        setLoadingMap(prev => ({ ...prev, [ip]: false }));
        setRebootAlertNodeIp(ip); // Set the IP for the reboot alert
        return;
      }
      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch (e) {
          // If response is not JSON, use the original error
        }
        throw new Error(errorMsg);
      }
      const json = await res.json();
      console.log(`setup_script success for ${ip}`, json);
      // After a successful toggle, you might want to immediately re-fetch status for this node
      // or wait for the regular polling interval. For quicker feedback:
      // fetchNodeData(ip); // Assuming fetchNodeData is the function that gets status/attrs
    } catch (e) {
      console.error(`setup_script error for ${ip}`, e);
      // Potentially show an error message to the user via another state
    } finally {
      setLoadingMap(prev => ({ ...prev, [ip]: false }));
    }
  };

  return (
    <>
      <CssBaseline />
      <RebootAlertDialog open={!!rebootAlertNodeIp} onClose={() => setRebootAlertNodeIp(null)} />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar
            nodes={nodes}
            setNodes={setNodes}
            statuses={nodeStatuses}
            loadingMap={loadingMap}
            secondaryIps={secondaryIps}
            setSecondaryIps={setSecondaryIps}
            nodeNames={nodeNames}
            setNodeNames={setNodeNames}
            // Pass handleToggle to Sidebar if needed, e.g. for a global toggle button there
            // handleToggle={handleToggle} 
          />

          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 0, 
              height: '100vh', 
              overflowY: 'auto',
              // tell the browser to always leave space for the scrollbar
              scrollbarGutter: 'stable' 
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    nodes={nodes}
                    setNodes={setNodes}
                    statuses={nodeStatuses}
                    attrs={nodeAttrs}
                    loadingMap={loadingMap}
                    secondaryIps={secondaryIps}
                    nodeNames={nodeNames}
                    setSecondaryIps={setSecondaryIps} // Keep if HomePage edits these
                    setNodeNames={setNodeNames}     // Keep if HomePage edits these
                    handleToggle={handleToggle}
                  />
                }
              />
              <Route
                path="/node/:ip"
                element={
                  <NodeDashboard
                    statuses={nodeStatuses}
                    attrs={nodeAttrs}
                    loadingMap={loadingMap}
                    secondaryIps={secondaryIps}
                    manetConnectionMap={manetConnectionMap}
                    handleToggle={handleToggle}
                    nodeNames={nodeNames} // Pass nodeNames to NodeDashboard
                  />
                }
              />
              <Route
                path="/map"
                element={
                  <MapView
                    initialCenter={[1.3362, 103.7442]}  // e.g. New York City
                    initialZoom={18}
                    markers={myMarkers}
                  />
                }
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </>
  );
}