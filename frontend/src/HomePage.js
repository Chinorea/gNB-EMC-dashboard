import React from 'react'; // Removed useState as edit dialog is removed
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton, // Keep for other potential uses, though EditIcon is removed from cards
  Button,
  // Dialog, DialogTitle, DialogContent, DialogActions removed as dialog is removed
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // Re-added EditIcon import

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

export default function HomePage({ allNodeData, handleToggle }) {
  const navigate = useNavigate();

  // Edit dialog state and functions (openEditDialog, saveEditDialog) removed.
  // Editing is now handled by the Sidebar.

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
        {/* Iterate directly over allNodeData */}
        {Array.isArray(allNodeData) && allNodeData.map(nodeInfo => {
          // nodeIp is now nodeInfo.ip
          const nodeIp = nodeInfo.ip;

          if (!nodeInfo) {
            // This case should ideally not happen if nodeInfoList is well-formed
            // and contains objects. If nodeIp was derived from a separate list,
            // this check was more critical. Now, we map directly over objects.
            return (
              <Grid item key={`loading-${Math.random()}`} sx={{ flex: '0 0 45%', maxWidth: '45%' }}>
                <Card sx={{ backgroundColor: 'lightgrey', p: 2}}>
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
              bg = '#d4edda'; // green
              break;
            case 'INITIALIZING': // Corrected from INITIALISING
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
                          onClick={(e) => { e.stopPropagation(); handleToggle(nodeIp, underlyingNodeStatus === 'RUNNING' ? 'stop' : 'start'); }} // Pass action to handleToggle
                          disabled={nodeInfo.isInitializing} // Changed from isToggleLoading
                          sx={{
                            position: 'absolute',
                            top: 20,
                            right: 15, // Adjusted right to account for removed edit icon
                            backgroundColor:
                              // Color based on the underlying node status, persists during load
                              underlyingNodeStatus === 'RUNNING' ? '#612a1f' : '#40613d',
                            color: 'white',
                            // Hover effect only when not disabled (i.e., not loading)
                            '&:hover': !nodeInfo.isInitializing ? { // Changed from isToggleLoading
                              backgroundColor:
                                underlyingNodeStatus === 'RUNNING'
                                  ? '#4d1914'
                                  : '#335e2e',
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

      {/* Edit Node Settings Dialog and its related Box component removed */}
    </Container>
  );
}