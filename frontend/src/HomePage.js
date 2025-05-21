import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';

export default function HomePage({ nodes, setNodes }) {
  const [ip, setIp] = useState('');
  const navigate = useNavigate();

  const addNode = () => {
    if (!ip) return;
    if (!nodes.includes(ip)) {
      setNodes(prev => [...prev, ip]);
    }
    navigate(`/node/${encodeURIComponent(ip)}`);
    setIp('');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Node Manager
      </Typography>

      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          label="Node IP"
          value={ip}
          onChange={e => setIp(e.target.value)}
          fullWidth
          size="small"
        />
        <Button
          variant="contained"
          sx={{ ml: 2 }}
          onClick={addNode}
        >
          Add
        </Button>
      </Box>

      <Grid container spacing={2}>
        {nodes.map(node => (
          <Grid item xs={12} sm={6} key={node}>
            <Card
              sx={{ cursor: 'pointer', height: '100%' }}
              onClick={() => navigate(`/node/${encodeURIComponent(node)}`)}
            >
              <CardContent>
                <Typography variant="body1" align="center">
                  {node}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}