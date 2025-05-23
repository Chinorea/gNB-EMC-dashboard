import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';

export default function HomePage({ nodes, setNodes, statuses, loadingMap }) {
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
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'bold' }}
      >
        Node Dashboard
      </Typography>

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 5 }}>
        {nodes.map((node) => {
          // if toggle is in-flight for this node, override to INITIALISING
          const status =
            loadingMap?.[node] ? 'INITIALISING'
          : statuses[node]    ? statuses[node]
          :                   'UNREACHABLE';
          let bg;
          let label;
          switch (status) {
            case 'RUNNING':
              bg = '#d4edda'; label = 'Broadcasting'; break;
            case 'INITIALISING':
              bg = '#fff3cd'; label = 'Initialising'; break;
            case 'OFF':
              bg = '#f8d7da'; label = 'Not Broadcasting'; break;
            default: // UNREACHABLE
              bg = 'lightgrey'; label = 'No Connection';
          }

          return (
            <Grid item xs={12} sm={6} md={4} key={node}>
              <Card
                onClick={() => navigate(`/node/${encodeURIComponent(node)}`)}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  backgroundColor: bg
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {node}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}