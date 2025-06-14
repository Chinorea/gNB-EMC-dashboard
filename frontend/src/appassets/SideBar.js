import React, { useState } from 'react';
import {
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
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import NodeInfo from '../NodeInfo';
import DarkModeToggle from '../theme/DarkModeToggle';
import { getThemeColors } from '../theme/theme';

const drawerWidth = 350;

function Sidebar({
  allNodeData, // This will be an array of NodeInfo instances
  setAllNodeData,
  setRebootAlertNodeIp, // Added prop
  onMapDataRefresh, // New prop to trigger map data refresh
}) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const [ip, setIp] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(''); // Stores the original IP of the node being edited
  const [editPrimary, setEditPrimary] = useState(''); // Stores the potentially new primary IP
  const [editSecondary, setEditSecondary] = useState('');
  const [editName, setEditName] = useState('');

  // Custom scrollbar styling
  const scrollbarStyle = {
    '&::-webkit-scrollbar': {
      width: '8px',
      backgroundColor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: '4px',
    },
    // Firefox scrollbar
    scrollbarWidth: 'thin',
    scrollbarColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05)',
  };

  const addNode = () => {
    if (ip && !allNodeData.some(node => node.ip === ip)) {
      // Pass setAllNodeData and setRebootAlertNodeIp to the NodeInfo constructor
      const newNodeInstance = new NodeInfo(ip, setAllNodeData, setRebootAlertNodeIp);
      newNodeInstance.nodeName = ''; // Initialize nodeName as empty
      newNodeInstance.manet.ip = '';
      newNodeInstance.manet.connectionStatus = 'Not Configured';
      setAllNodeData(prev => [...prev, newNodeInstance]);
      setIp('');
      
      // Trigger map data refresh when a node is added
      if (onMapDataRefresh) {
        onMapDataRefresh();
      }
    }
  };

  const removeNode = (ipToRemove) => {
    setAllNodeData(prevInstances => {
      const filteredInstances = prevInstances.filter(instance => instance.ip !== ipToRemove);
      
      // Immediately trigger map refresh with the filtered node list to avoid ref timing issues
      if (onMapDataRefresh) {
        // Pass the filtered instances directly to avoid ref timing issues
        setTimeout(() => {
          onMapDataRefresh({ nodeRemoved: true, updatedNodeList: filteredInstances });
        }, 0);
      }
      
      return filteredInstances;
    });
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
    const oldManetIp = allNodeData.find(node => node.ip === editTarget)?.manet?.ip;
    const newManetIp = editSecondary;
    const oldNodeName = allNodeData.find(node => node.ip === editTarget)?.nodeName;
    const newNodeName = editName;
    
    setAllNodeData(prev => {
      const inst = prev.find(node => node.ip === editTarget);
      if (inst) {
        inst.ip = editPrimary;
        inst.nodeName = editName;
        inst.manet.ip = editSecondary;
        inst.manet.connectionStatus = editSecondary ? 'Not Configured' : 'Not Configured';
        
        // Immediately clear selfManetInfo if changing to invalid/empty MANET IP
        if (!editSecondary || editSecondary.trim() === '') {
          inst.manet.selfManetInfo = null;
        } else if (inst.manet.selfManetInfo) {
          // Update the selfManetInfo label immediately if it exists and IP is valid
          inst.manet.selfManetInfo.label = editName != '' ? editName : inst.ip;
        }
      }
      return [...prev];
    });
    setEditOpen(false);
    
    // Always trigger map data refresh for any MANET IP or node name change
    if (onMapDataRefresh && (oldManetIp !== newManetIp || oldNodeName !== newNodeName)) {
      // Use a small delay to ensure the state update has been processed
      setTimeout(() => {
        onMapDataRefresh();
      }, 10);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflow: 'hidden', // Prevent main drawer scrolling
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflow: 'hidden', // Prevent scrolling on the main container
      }}>
        {/* Fixed Header Section */}
        <Box sx={{ p: 2, overflow: 'visible' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <img
              src="/ST_Engineering_logo_Singapore_Technologies_Engineering-700x118.png"
              alt="ST Engineering Logo"
              style={{ 
                width: '70%', 
                height: 'auto',
                filter: theme.palette.mode === 'dark' ? 'invert(1) hue-rotate(180deg) saturate(3.0)' : 'none'
              }}
            />
            <DarkModeToggle />
          </Box>
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
          <Button 
            fullWidth 
            variant="contained" 
            sx={{ 
              mt: 1,
              backgroundColor: colors.button.add,
              '&:hover': {
                backgroundColor: colors.button.addHover,
              }
            }} 
            onClick={addNode}
          >
            Add
          </Button>          <Divider sx={{ my: 2 }} />          <List subheader={
            <ListSubheader sx={{ 
              backgroundColor: 'transparent',
              fontSize: '1.0rem',
              fontWeight: 'bold'
            }}>
              Navigation
            </ListSubheader>
          }>            <ListItemButton component={RouterLink} to="/">
              <ListItemIcon sx={{ minWidth: '32px', margin: 0, padding: 0 }}>
                <HomeIcon sx={{ fontSize: '1.2rem', margin: 0 }} />
              </ListItemIcon>
              <ListItemText
                primary="Home"
                primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.3rem' }}
              />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/map">
              <ListItemIcon sx={{ minWidth: '32px', margin: 0, padding: 0 }}>
                <MapIcon sx={{ fontSize: '1.2rem', margin: 0 }} />
              </ListItemIcon>
              <ListItemText
                primary="Map"
                primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.3rem' }}
              />
            </ListItemButton>
          </List>
        </Box>        {/* Dynamically sized Nodes section with isolated scrolling */}
        <Box 
          sx={{ 
            flex: 1, // Take remaining vertical space
            overflow: 'auto', // Only this section scrolls
            p: 2, // Same padding as the fixed header section
            ...scrollbarStyle // Apply custom scrollbar only to this section
          }}          ><List 
            subheader={
              <ListSubheader 
                sx={{ 
                  backgroundColor: 'transparent',
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 1,
                  fontSize: '1.0rem',
                  fontWeight: 'bold'
                }}
              >
                Nodes
              </ListSubheader>
            }
          >
            {allNodeData.map(nodeInstance => { // Iterate over NodeInfo instances
              const currentStatus = nodeInstance.status || 'DISCONNECTED';
              let bg;              switch (currentStatus) {
                case 'RUNNING':
                  bg = colors.nodeStatus.running;
                  break;
                case 'INITIALIZING': // This status is now mainly for script toggling
                  bg = colors.nodeStatus.initializing;
                  break;
                case 'OFF':
                  bg = colors.nodeStatus.off;
                  break;
                case 'DISCONNECTED':
                  bg = colors.nodeStatus.disconnected;
                  break;
                case 'UNREACHABLE':
                  bg = colors.nodeStatus.unreachable;
                  break;
                default:
                  bg = colors.nodeStatus.disconnected;
              }              return (
                <ListItem
                  key={nodeInstance.ip} // Use instance.ip as key
                  disablePadding
                  sx={{
                    width: '100%',
                    backgroundColor: bg,
                    display: 'flex',
                  }}
                >                  <ListItemButton
                    onClick={() => openEdit(nodeInstance.ip)}
                    sx={{ 
                      minWidth: '40px', 
                      maxWidth: '40px',
                      minHeight: '40px',
                      maxHeight: '40px',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      padding: '4px'
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </ListItemButton>
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
                  <ListItemButton
                    onClick={() => removeNode(nodeInstance.ip)}
                    sx={{ 
                      minWidth: '40px', 
                      maxWidth: '40px',
                      minHeight: '40px',
                      maxHeight: '40px',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      padding: '4px'
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Fixed Footer Section */}
        <Box sx={{ textAlign: 'center', p: 1 }}>
          <Typography variant="caption" color="textSecondary">
            © {new Date().getFullYear()} ST Engineering
          </Typography>
        </Box>
      </Box>

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
    </Drawer>
  );
}

export default Sidebar;