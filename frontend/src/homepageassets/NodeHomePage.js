import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import { getThemeColors } from '../theme/theme';

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
      {/* This EditIcon is part of NodeIdBox, which seems separate. Leaving as is. */}
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

export default function NodeHomePage({ allNodeData, setAllNodeData }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(''); // Stores the original IP of the node being edited
  const [editPrimary, setEditPrimary] = useState(''); // Stores the potentially new primary IP
  const [editSecondary, setEditSecondary] = useState('');
  const [editName, setEditName] = useState('');

  const openEditDialog = (nodeIp) => {
    const nodeInstance = allNodeData.find(inst => inst.ip === nodeIp);
    if (nodeInstance) {
      setEditTarget(nodeInstance.ip); // Original IP
      setEditPrimary(nodeInstance.ip); // Current IP for editing field
      setEditSecondary(nodeInstance.manet.ip || '');
      setEditName(nodeInstance.nodeName || '');
      setEditOpen(true);
    }
  };

  const saveEditDialog = () => {
    setAllNodeData(prev => {
      const inst = prev.find(node => node.ip === editTarget);
      if (inst) {
        inst.ip = editPrimary;
        inst.nodeName = editName;
        inst.manet.ip = editSecondary;
        // Assuming 'Not Configured' is a suitable default if manet.ip is cleared
        inst.manet.connectionStatus = editSecondary ? 'Not Configured' : 'Not Configured'; 
      }
      return [...prev]; // Create a new array to trigger re-render
    });
    setEditOpen(false);
  };

  const coreConnectionMap = {
    UP:        'Connected',
    DOWN:      'Disconnected',
    UNSTABLE:  'Unstable'
  };
  return (
    <Box sx={{ backgroundColor: colors.background.main, minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          Node Overview
        </Typography>

        <Grid container spacing={2} justifyContent="center" sx={{ mt: 5 }}>
          {/* Iterate directly over allNodeData */}
          {Array.isArray(allNodeData) && allNodeData.map(nodeInfo => {
            // nodeIp is now nodeInfo.ip
            const nodeIp = nodeInfo.ip;

            if (!nodeInfo) {
              // This case should ideally not happen if nodeInfoList is well-formed
              // and contains objects. If nodeIp was derived from a separate list,
              // this check was more critical. Now, we map directly over objects.
              return (                <Grid item key={`loading-${Math.random()}`} sx={{ flex: '0 0 45%', maxWidth: '45%' }}>
                  <Card sx={{ backgroundColor: colors.nodeStatus.unreachable, p: 2}}>
                    <Typography>Loading data for an unknown node...</Typography>
                  </Card>
                </Grid>
              );
            }

            const status = nodeInfo.isInitializing // Changed from isToggleLoading
              ? 'INITIALIZING'
              : nodeInfo.status || 'UNREACHABLE';

            let bg;
            switch (status) {
              case 'RUNNING':
                bg = colors.nodeStatus.running;
                break;
              case 'INITIALIZING': // Corrected from INITIALISING
                bg = colors.nodeStatus.initializing;
                break;
              case 'OFF':
                bg = colors.nodeStatus.off;
                break;
              default: // UNREACHABLE
                bg = colors.nodeStatus.unreachable;
            }

            return (
              <Grid item key={nodeIp} sx={{ flex: '0 0 45%', maxWidth: '45%' }}>
                <Card
                  onClick={() => navigate(`/node/${encodeURIComponent(nodeIp)}`)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    pt: 2.5,
                    pb: 0,
                    px: 1,
                    transition: 'transform 0.1s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.01)',
                      boxShadow: 6
                    },
                    backgroundColor: bg,
                  }}
                >
                  <IconButton 
                    onClick={(e) => { 
                      e.stopPropagation(); // Prevent card click navigation
                      openEditDialog(nodeIp); 
                    }}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 20, // Adjust as needed
                      right: 15, // Adjust as needed
                      zIndex: 1 // Ensure it's above other card content
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {/* EditIcon IconButton removed from here. Editing is via Sidebar. */}
                  <CardContent sx={{ pt: 0 }}>
                    <Typography
                      variant="body1"
                      align="left"
                      sx={{ fontWeight: 'bold', fontSize: '1.4rem', mb: 0 }}
                    >
                      {nodeInfo.nodeName || `${nodeIp}`} {/* Ensure consistent default naming */}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0, mb: 0, fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      {nodeInfo.isInitializing // Changed from isToggleLoading
                        ? 'Initializing...' // Changed from Initialising
                        : nodeInfo.status === 'RUNNING'
                        ? 'Broadcasting'
                        : nodeInfo.status === 'OFF'
                        ? 'Not Broadcasting'
                        : 'Disconnected'}
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
                      Manet IP: {nodeInfo.manet.ip && nodeInfo.manet.ip !== '' ? nodeInfo.manet.ip : 'Not Configured'}
                    </Typography>
                    {(() => {
                      const underlyingNodeStatus = nodeInfo.status;

                      if (nodeInfo.isInitializing || underlyingNodeStatus === 'RUNNING' || underlyingNodeStatus === 'OFF') { // Changed from isToggleLoading
                        return (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              // Directly call the toggleScript method on the nodeInfo instance
                              nodeInfo.toggleScript(underlyingNodeStatus === 'RUNNING' ? 'stop' : 'setupv2');                            }}
                            disabled={nodeInfo.isInitializing} // Changed from isToggleLoading
                            sx={{
                              position: 'absolute',
                              top: 20,
                              right: 60, // Adjusted right to account for removed edit icon
                              backgroundColor:
                                // Color based on the underlying node status, persists during load
                                underlyingNodeStatus === 'RUNNING' ? colors.button.turnOff : colors.button.turnOn,
                              color: 'white',
                              // Hover effect only when not disabled (i.e., not loading)
                              '&:hover': !nodeInfo.isInitializing ? { // Changed from isToggleLoading
                                backgroundColor:
                                  underlyingNodeStatus === 'RUNNING'
                                    ? colors.button.turnOffHover
                                    : colors.button.turnOnHover,
                              } : {},
                            }}
                          >
                            {nodeInfo.isInitializing // Changed from isToggleLoading
                              ? 'Working…'
                              : underlyingNodeStatus === 'RUNNING'
                                ? 'Turn Off'
                                : 'Turn On'}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <Box
            component="form"
            onSubmit={e => { e.preventDefault(); saveEditDialog(); }}
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
      </Container>
    </Box>
  );
}
