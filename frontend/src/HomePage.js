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
  nodes,
  setNodes,
  statuses,
  attrs = {},  // <-- default to an empty object
  loadingMap,
  secondaryIps = {},
  nodeNames = {},
  setSecondaryIps,
  setNodeNames
}) {
  const [ip, setIp] = useState('');
  const navigate = useNavigate();

  // --- edit‐dialog state & handlers (same as Sidebar) ---
  const [editOpen, setEditOpen]           = useState(false);
  const [editTarget, setEditTarget]       = useState('');
  const [editName, setEditName]           = useState('');
  const [editPrimary, setEditPrimary]     = useState('');
  const [editSecondary, setEditSecondary] = useState('');

  const openEdit = node => {
    setEditTarget(node);
    setEditPrimary(node);
    setEditSecondary(secondaryIps[node] || '');
    setEditName(nodeNames[node] || '');
    setEditOpen(true);
  };

  const saveEdit = e => {
    e.preventDefault();
    // update primary (IP) key if changed
    if (editPrimary !== editTarget) {
      setNodes(prev => prev.map(x => x === editTarget ? editPrimary : x));
      setEditTarget(editPrimary);
    }
    // update Marnet IP
    setSecondaryIps(prev => ({ ...prev, [editPrimary]: editSecondary }));
    // update display name
    setNodeNames(prev => ({ ...prev, [editPrimary]: editName }));
    setEditOpen(false);
  };
  // --- end edit‐dialog logic ---

  const addNode = () => {
    if (!ip) return;
    if (!nodes.includes(ip)) setNodes(prev => [...prev, ip]);
    navigate(`/node/${encodeURIComponent(ip)}`);
    setIp('');
  };

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
        {nodes.map(node => {
          const status = loadingMap?.[node]
            ? 'INITIALISING'
            : statuses[node] || 'UNREACHABLE';

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
            <Grid item key={node} sx={{ flex: '0 0 45%', maxWidth: '45%' }}>
              <Card
                onClick={() => navigate(`/node/${encodeURIComponent(node)}`)}
                sx={{
                  position: 'relative',  // allow absolute children
                  cursor: 'pointer',
                  pt: 1,
                  pb: 0,
                  px: 1,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.1s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.01)',
                    boxShadow: 6
                  },
                  backgroundColor: bg, // Apply the background color here
                }}
              >
                <CardContent>
                  <Grid container justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Grid item sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body1"
                        align="left"
                        sx={{ fontWeight: 'bold', fontSize: '1.4rem', mb: 0 }}
                      >
                        {nodeNames[node] || node}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); openEdit(node); }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0, mb: 0, fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    {loadingMap[node]
                      ? 'Initialising'
                      : statuses[node] === 'RUNNING'
                      ? 'Broadcasting'
                      : statuses[node] === 'OFF'
                      ? 'Not Broadcasting'
                      : 'Disconnected'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 3, mb: 0, fontSize: '1.1rem' }}
                  >
                    IP: {node}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0, mb: 0, fontSize: '1.1rem' }}
                  >
                    Manet IP: {secondaryIps[node] && secondaryIps[node] !== '' ? secondaryIps[node] : 'Not Configured'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Node Settings Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={saveEdit}>
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
    </Container>
  );
}