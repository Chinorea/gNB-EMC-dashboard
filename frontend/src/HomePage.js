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

export default function HomePage({
  nodes,
  setNodes,
  statuses,
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

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        Node Dashboard
      </Typography>

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 5 }}>
        {nodes.map(node => {
          const status = loadingMap?.[node]
            ? 'INITIALISING'
            : statuses[node] || 'UNREACHABLE';

          let bg, label;
          switch (status) {
            case 'RUNNING':
              bg = '#d4edda'; label = 'Broadcasting'; break;
            case 'INITIALISING':
              bg = '#fff3cd'; label = 'Initialising'; break;
            case 'OFF':
              bg = '#f8d7da'; label = 'Not Broadcasting'; break;
            default:
              bg = 'lightgrey'; label = 'No Connection';
          }

          const displayName = nodeNames[node] || node;
          const marnetIp    = secondaryIps[node] || 'Not configured';

          return (
            <Grid item xs={12} sm={6} md={6} key={node} sx={{ display: 'flex' }}>
              <Card
                onClick={() => navigate(`/node/${encodeURIComponent(node)}`)}
                sx={{
                  cursor: 'pointer',
                  flex: 1,
                  p: 2,
                  backgroundColor: bg,
                  minWidth: '350px',
                }}
              >
                <CardContent sx={{ textAlign: 'left', pt: 0.5, px: 1, pb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 'bold', mb: 0, fontSize: '1.4rem', lineHeight: 1.2 }}
                      >
                        {displayName}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', mt: 0, fontSize: '1.2rem', lineHeight: 1 }}
                      >
                        {label}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={e => { e.stopPropagation(); openEdit(node); }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ mt: 1, mb: 0.2, display: 'flex', flexDirection: 'column', gap: 0.01 }}>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      {`IP: ${node}`}
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      {`Marnet IP: ${marnetIp}`}
                    </Typography>
                  </Box>
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