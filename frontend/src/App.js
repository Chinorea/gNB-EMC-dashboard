import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink} from 'react-router-dom';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
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

const drawerWidth = 240;

function Sidebar({ nodes, setNodes, statuses }) {
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
        </List>

        <List subheader={<ListSubheader>Nodes</ListSubheader>}>
          {nodes.map(n => {
            const status = statuses[n] || 'UNREACHABLE';
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
  const [nodeAttrs, setNodeAttrs]     = useState({});

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
      <Box sx={{ display: 'flex' }}>
        <Sidebar
          nodes={nodes}
          setNodes={setNodes}
          statuses={nodeStatuses}
        />

        <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  nodes={nodes}
                  setNodes={setNodes}
                  statuses={nodeStatuses}
                  setStatuses={setStatuses}
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
                />
              }
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}