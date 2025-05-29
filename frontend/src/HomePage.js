import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

// NodeIdBox seems to be a remnant or a specific component not directly using the main node loop data.
// If it were to be used with NodeInfo, it would need similar adjustments.
// For now, leaving it as is, assuming it might be used elsewhere or deprecated.
function NodeIdBox({ nodeId, nodeStatus, isLoading, handleEditClick }) {
  if (nodeId === undefined || nodeId === null) return null;

  return (
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography color="textSecondary" variant="subtitle2">
          Node ID
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {String(nodeId)}
        </Typography>
      </Box>
      {nodeStatus === 'OFF' && !isLoading && (
        <IconButton
          onClick={e => { e.stopPropagation(); handleEditClick('gnbId', nodeId, 'Node ID'); }}
          size="small"
        >
          <EditIcon />
        </IconButton>
      )}
    </Box>
  );
}

export default function HomePage({
  nodes, // Array of IP strings, can be used for iteration order
  nodeInfoList, // Array of NodeInfo objects - THIS IS THE NEW PRIMARY DATA SOURCE
  // setNodes, // Keep if HomePage still needs to modify the raw nodes list (e.g. via its own add/remove)
  // setNodeNames, // Keep if HomePage directly edits names (passed up to App.js)
  // setSecondaryIps, // Keep if HomePage directly edits MANET IPs (passed up to App.js)
  handleToggle,

  // Props for the edit dialog, if HomePage still manages its own edit dialog
  // These would typically be passed from App.js if the dialog logic is shared or lifted up
  // For now, assuming HomePage might have its own instance of this dialog logic
  // If Sidebar is the sole editor, these might not be needed here.
  setNodes: appSetNodes, // Renaming to avoid conflict if HomePage has its own 'setNodes'
  setNodeNames: appSetNodeNames,
  setSecondaryIps: appSetSecondaryIps,
}) {
  const navigate = useNavigate();

  // Edit dialog state - if HomePage has its own edit functionality
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetIp, setEditTargetIp] = useState(''); // IP of the node being edited
  const [editName, setEditName] = useState('');
  const [editPrimaryIp, setEditPrimaryIp] = useState(''); // Current primary IP in dialog
  const [editManetIp, setEditManetIp] = useState('');   // Current MANET IP in dialog

  const openEditDialog = (nodeIp) => {
    const nodeInfo = nodeInfoList.find(ni => ni.ip === nodeIp);
    if (nodeInfo) {
      setEditTargetIp(nodeIp);
      setEditPrimaryIp(nodeIp); // Initialize with current IP
      setEditName(nodeInfo.nodeName || '');
      setEditManetIp(nodeInfo.manetIp || '');
      setEditOpen(true);
    }
  };

  const saveEditDialog = (e) => {
    e.preventDefault();
    // Call the setters passed from App.js to update the central state
    if (editPrimaryIp !== editTargetIp) {
      // IP has changed - this is a more complex operation.
      // App.js needs to handle removing the old IP and adding the new one,
      // along with transferring settings.
      // For now, we assume App.js handles this when `nodes` array changes.
      appSetNodes(prevNodes => prevNodes.map(n => n === editTargetIp ? editPrimaryIp : n));
      // Update names and MANET IPs for the new IP, removing the old.
      appSetNodeNames(prev => {
        const { [editTargetIp]: _, ...rest } = prev;
        return { ...rest, [editPrimaryIp]: editName };
      });
      appSetSecondaryIps(prev => {
        const { [editTargetIp]: _, ...rest } = prev;
        return { ...rest, [editPrimaryIp]: editManetIp };
      });
    } else {
      // IP is the same, just update name and MANET IP
      appSetNodeNames(prev => ({ ...prev, [editTargetIp]: editName }));
      appSetSecondaryIps(prev => ({ ...prev, [editTargetIp]: editManetIp }));
    }
    setEditOpen(false);
  };

  // addNode function seems to be missing from original HomePage, but if needed, it would use appSetNodes.
  // const addNode = () => { ... };

  const coreConnectionMap = {
    UP:        'Connected',
    DOWN:      'Disconnected',
    UNSTABLE:  'Unstable'
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        Node Overview
      </Typography>

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 5 }}>
        {/* Iterate using the `nodes` array to maintain order, but get data from `nodeInfoList` */}
        {nodes.map(nodeIp => {
          const nodeInfo = nodeInfoList.find(ni => ni.ip === nodeIp);

          // If nodeInfo is not found for a given IP (e.g., during a state update delay),
          // provide a fallback or skip rendering to prevent errors.
          if (!nodeInfo) {
            // Optionally, render a placeholder or return null
            // console.warn(`NodeInfo not found for IP: ${nodeIp}`);
            return (
              <Grid item key={nodeIp} sx={{ flex: '0 0 45%', maxWidth: '45%' }}>
                <Card sx={{ backgroundColor: 'lightgrey', p: 2}}>
                  <Typography>Loading data for {nodeIp}...</Typography>
                </Card>
              </Grid>
            );
          }

          const status = nodeInfo.isToggleLoading
            ? 'INITIALISING'
            : nodeInfo.status || 'UNREACHABLE';

          let bg;
          switch (status) {
            case 'RUNNING':
              bg = '#d4edda'; // green
              break;
            case 'INITIALISING':
              bg = '#fff3cd'; // yellow
              break;
            case 'OFF':
              bg = '#f8d7da'; // red
              break;
            default: // UNREACHABLE
              bg = 'lightgrey';
          }

          return (
            <Grid item key={nodeIp} sx={{ flex: '0 0 45%', maxWidth: '45%' }}>
              <Card
                onClick={() => navigate(`/node/${encodeURIComponent(nodeIp)}`)}
                sx={{
                  position: 'relative',  // allow absolute children
                  cursor: 'pointer',
                  pt: 2.5,
                  pb: 0,
                  px: 1,
                  transition: 'transform 0.1s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.01)',
                    boxShadow: 6
                  },
                  backgroundColor: bg, // Apply the background color here
                }}
              >
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); openEditDialog(nodeIp); }} // Use openEditDialog
                  sx={{
                    position: 'absolute',
                    top: 20, // theme.spacing(1)
                    right: 15, // theme.spacing(1)
                    zIndex: 1
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <CardContent sx={{ pt: 0 }}> {/* Added sx={{ pt: 0 }} */}
                  {/* Grid system removed, IconButton moved out, Typography for title is now direct child */}
                  <Typography
                    variant="body1"
                    align="left"
                    sx={{ fontWeight: 'bold', fontSize: '1.4rem', mb: 0 }}
                  >
                    {nodeInfo.nodeName || nodeIp} {/* Use nodeInfo.nodeName */}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0, mb: 0, fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    {nodeInfo.isToggleLoading
                      ? 'Initialising'
                      : nodeInfo.status === 'RUNNING'
                      ? 'Broadcasting'
                      : nodeInfo.status === 'OFF'
                      ? 'Not Broadcasting'
                      : 'Disconnected'} {/* Use nodeInfo.status and nodeInfo.isToggleLoading */}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 3, mb: 0, fontSize: '1.1rem' }}
                  >
                    IP: {nodeIp}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0, mb: 0, fontSize: '1.1rem' }}
                  >
                    Manet IP: {nodeInfo.manetIp && nodeInfo.manetIp !== '' ? nodeInfo.manetIp : 'Not Configured'} {/* Use nodeInfo.manetIp */}
                  </Typography>
                  {(() => {
                    const underlyingNodeStatus = nodeInfo.status; // Use nodeInfo.status

                    if (nodeInfo.isToggleLoading || underlyingNodeStatus === 'RUNNING' || underlyingNodeStatus === 'OFF') {
                      return (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleToggle(nodeIp); }}
                          disabled={nodeInfo.isToggleLoading} // Use nodeInfo.isToggleLoading
                          sx={{
                            position: 'absolute',
                            top: 20,
                            right: 50,
                            backgroundColor:
                              // Color based on the underlying node status, persists during load
                              underlyingNodeStatus === 'RUNNING' ? '#612a1f' : '#40613d',
                            color: 'white',
                            // Hover effect only when not disabled (i.e., not loading)
                            '&:hover': !nodeInfo.isToggleLoading ? {
                              backgroundColor:
                                underlyingNodeStatus === 'RUNNING'
                                  ? '#4d1914'
                                  : '#335e2e',
                            } : {},
                        }}
                        >
                          {nodeInfo.isToggleLoading // Use nodeInfo.isToggleLoading
                            ? 'Working…'
                            : underlyingNodeStatus === 'RUNNING'
                              ? 'Turn Off'
                              : 'Turn On'}
                        </Button>
                      );
                    }
                    return null; // Return null if button should not be shown
                  })()}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Node Settings Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={saveEditDialog}> {/* Use saveEditDialog */}
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
              value={editPrimaryIp} // Use editPrimaryIp
              onChange={e => setEditPrimaryIp(e.target.value)} // Use setEditPrimaryIp
            />
            <TextField
              margin="dense"
              label="Marnet IP"
              fullWidth
              value={editManetIp} // Use editManetIp
              onChange={e => setEditManetIp(e.target.value)} // Use setEditManetIp
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}