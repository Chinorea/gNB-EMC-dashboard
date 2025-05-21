import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link as RouterLink } from 'react-router-dom';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
import {
  Box,
  Drawer,
  Toolbar,
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
  const navigate = useNavigate();

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
        />
        <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={addNode}>
          Add
        </Button>

        <Divider sx={{ my: 2 }} />

        <List subheader={<ListSubheader>Navigation</ListSubheader>}>
          <ListItemButton component={RouterLink} to="/">
            <ListItemText primary="Home" />
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
                sx={{ backgroundColor: bg }}
              >
                <ListItemButton component={RouterLink} to={`/node/${n}`}>
                  <ListItemText primary={n} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}

export default function App() {
  const [nodes, setNodes]       = useState([]);
  const [nodeStatuses, setStatuses] = useState({});

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
                />
              }
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}