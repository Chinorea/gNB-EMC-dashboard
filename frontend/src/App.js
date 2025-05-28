import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
  Button,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsIcon from '@mui/icons-material/Settings';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
import MapView from './Map'
import 'leaflet/dist/leaflet.css'

const drawerWidth = 350;  // increased width to fit "Node: x.x.x.x"

function Sidebar({
  nodes,
  setNodes,
  statuses,
  loadingMap,
  secondaryIps,
  setSecondaryIps,
  nodeNames,
  setNodeNames
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
                    <SettingsIcon fontSize="small" />
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
                              Marnet: {secondaryIps[n] || 'Not configured'}
                            </Typography>
                          </>
                        )
                        : `Marnet: ${secondaryIps[n] || 'Not configured'}`
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
    const saved = localStorage.getItem("nodes");
    return saved ? JSON.parse(saved) : [];
  });
  const [nodeStatuses, setStatuses] = useState({});
  const [nodeAttrs, setNodeAttrs]   = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [secondaryIps, setSecondaryIps] = useState({});
  const [nodeNames, setNodeNames]       = useState({});
  const [linkQualityMatrix, setLQM]   = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);

  // whenever nodes changes, persist it
  useEffect(() => {
    localStorage.setItem("nodes", JSON.stringify(nodes));
  }, [nodes]);
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

    const API_URL = 'http://192.168.2.141/status';
    const loadMapData = () => {
      fetch(API_URL)
        .then(r => r.json())
        .then(data => {
          const infos = Array.isArray(data.nodeInfos)
            ? data.nodeInfos
            : Object.values(data.nodeInfos||{});
          const enriched = infos.map(info => ({
            ...info,
            batteryLevel:
              data.selfId === info.id
                ? (data.batteryLevel * 10).toFixed(2) + '%'
                : 'unknown'
          }));
          setMapMarkers(enriched);
          console.log("testing output")
          console.log(enriched);
          console.log(data.linkQuality)
          setLQM(Array.isArray(data.linkQuality)
            ? data.linkQuality
            : []
          );
        })
        .catch(console.error);
    };

    loadMapData();
    updateAttrs();
    updateNodeStatus();

    const id1      = setInterval(updateAttrs, 1000);          // fast loop
    const idStatus = setInterval(updateNodeStatus, 3000);    // slower loop
    const idMap = setInterval(loadMapData, 5000000);  // or whatever polling interval you like
    return () => {
      clearInterval(id1);
      clearInterval(idStatus);
      clearInterval(idMap);
    };
  }, [nodes]);

  console.log(mapMarkers);
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex' , height: '100vh'}}>
        <Sidebar
          nodes={nodes}
          setNodes={setNodes}
          statuses={nodeStatuses}
          loadingMap={loadingMap}
          secondaryIps={secondaryIps}
          setSecondaryIps={setSecondaryIps}
          nodeNames={nodeNames}
          setNodeNames={setNodeNames}
        />

        <Box component="main" sx={{ display: 'flex', flexGrow: 1, p: 0 , height: '100vh'}}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  nodes={nodes}
                  setNodes={setNodes}
                  statuses={nodeStatuses}
                  loadingMap={loadingMap}
                  nodeNames={nodeNames}
                />
              }
            />
            <Route
              path="/node/:ip"
              element={
                <NodeDashboard
                  nodes={nodes}
                  setNodes={setNodes}
                  statuses={nodeStatuses}
                  attrs={ nodeAttrs }
                  loadingMap={loadingMap}
                  setAppLoading={(ip, v) => setLoadingMap(prev => ({ ...prev, [ip]: v }))}
                />
              }
            />
            <Route
              path="/map"
              element={
                <MapView
                  initialCenter={[1.3362, 103.7442]}
                  initialZoom={18}
                  markers={mapMarkers}
                  //linkQualityMatrix ={linkQualityMatrix}
                />
              }
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}