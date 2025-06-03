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
  Typography,
  ListItemSecondaryAction
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import { Link as RouterLink } from 'react-router-dom';
import NodeInfo from './NodeInfo';

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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img
              src="/ST_Engineering_logo_Singapore_Technologies_Engineering-700x118.png"
              alt="ST Engineering Logo"
              style={{ width: '70%', height: 'auto' }}
            />
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
        <Box sx={{ textAlign: 'center', p: 1 }}>
          <Typography variant="caption" color="textSecondary">
            © {new Date().getFullYear()} ST Engineering
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar;