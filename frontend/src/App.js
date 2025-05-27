import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
import MapView from './Map'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
  Button,
  Divider,
  ListItem,
  IconButton
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import 'leaflet/dist/leaflet.css'

const drawerWidth = 320;  // increased width to fit "Node: x.x.x.x"

function Sidebar({
  nodes,
  setNodes,
  statuses,
  loadingMap,
  secondaryIps,
  setSecondaryIps
}) {
  const [ip, setIp] = useState('');

  const addNode = () => {
    if (ip && !nodes.includes(ip)) {
      setNodes(prev => [...prev, ip]);
      setIp('');
    }
  };

  const removeNode = (ipToRemove) => {
    setNodes(prev => prev.filter(item => item !== ipToRemove));
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
            // if the toggle button is in-flight for this node, treat as INITIALISING
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
              <ListItem key={n} disablePadding sx={{ backgroundColor: bg }}>
                <ListItemButton component={RouterLink} to={`/node/${n}`}>
                  <ListItemText
                    primary={`Node: ${n}`}
                    secondary={`Marnet: ${secondaryIps[n] || 'Not configured'}`}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{
                      fontSize: '0.8rem',
                      color: 'textSecondary'
                    }}
                  />
                </ListItemButton>
                <IconButton edge="end" onClick={() => removeNode(n)} sx={{ mr: 1 }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </ListItem>
            );
          })}
        </List>
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

  const [mapMarkers, setMapMarkers] = useState([]);
  const API_URL = 'http://192.168.2.142/status';


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

    const loadMapData = () => {
      fetch(API_URL)
        .then(r => r.json())
        .then(data => {
          const infos = Array.isArray(data.nodeInfos)
            ? data.nodeInfos
            : Object.values(data.nodeInfos||{});
          setMapMarkers(infos);
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
                  initialZoom={19}
                  markers={mapMarkers}
                />
              }
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}