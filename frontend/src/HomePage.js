import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Grid, TextField, Typography, Card, CardContent } from '@mui/material';

export default function HomePage() {
  const [nodes, setNodes] = useState([]);
  const [ip, setIp] = useState('');
  const nav = useNavigate();

  const addNode = () => {
    if (ip && !nodes.includes(ip)) {
      setNodes([...nodes, ip]);
      setIp('');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <TextField
            fullWidth
            label="Node IP"
            value={ip}
            onChange={e => setIp(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              addNode();
              nav(`/node/${ip}`);
            }}
          >
            Go
          </Button>
        </Grid>
      </Grid>
      <Typography sx={{ mt: 4 }}>Saved nodes:</Typography>
      {nodes.map(n => (
        <Card key={n} sx={{ mt: 1 }}>
          <CardContent onClick={() => nav(`/node/${n}`)}>
            <Typography>{n}</Typography>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}