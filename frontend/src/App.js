import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink} from 'react-router-dom';
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
import L from 'leaflet';

const drawerWidth = 240;

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


function Sidebar({ nodes, setNodes, statuses, loadingMap }) {
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
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
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
              <ListItem
                key={n}
                disablePadding
                sx={{ backgroundColor: bg}}
              >
                <ListItemButton component={RouterLink} to={`/node/${n}`}>
                  <ListItemText
                    primary={n}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
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
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem("nodes");
    return saved ? JSON.parse(saved) : [];
  });

  // whenever nodes changes, persist it
  useEffect(() => {
    localStorage.setItem("nodes", JSON.stringify(nodes));
  }, [nodes]);

  const [nodeStatuses, setStatuses]   = useState({});
  const [nodeAttrs, setNodeAttrs]       = useState({});
  const [loadingMap, setLoadingMap]   = useState({});

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

    // fetch Raptor status separately
    const updateRaptor = () => {
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
    updateRaptor();

    const id1 = setInterval(updateAttrs, 1000);    // fast loop
    const id2 = setInterval(updateRaptor, 3000);   // slower loop
    return () => {
      clearInterval(id1);
      clearInterval(id2);
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
        />

        <Box component="main" sx={{ flexGrow: 1, p: 0 , height: '100vh'}}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  nodes={nodes}
                  setNodes={setNodes}
                  statuses={nodeStatuses}
                  loadingMap={loadingMap}           // ← add this
                />
              }
            />
            <Route
              path="/node/:ip"
              element={
                <NodeDashboard
                  nodes={nodes}
                  setNodes={setNodes}
                  statuses={nodeStatuses}            // ← pass this in
                  attrs={ nodeAttrs }              // <-- pass the map
                  loadingMap={loadingMap}
                  setAppLoading={(ip, v) => setLoadingMap(prev => ({ ...prev, [ip]: v }))}
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
  );
}