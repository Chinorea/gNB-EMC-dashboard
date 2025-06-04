import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NodeInfo from '../NodeInfo';
import { getThemeColors } from '../theme/theme';

export default function EmptyHomePage({ setAllNodeData, setRebootAlertNodeIp, onMapDataRefresh }) {
  const [ip, setIp] = useState('');
  const theme = useTheme();
  const colors = getThemeColors(theme);

  const addNode = () => {
    if (ip) {
      // Create a new NodeInfo instance similar to SideBar.js
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
  return (
    <Box sx={{ backgroundColor: colors.background.main, minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ pt: 8, pb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom            sx={{ 
              fontWeight: 'bold',
              color: colors.text.primary,
              mb: 4
            }}
          >
            Hey, let's add our first Node
          </Typography>
            <Paper 
            elevation={3}            sx={{ 
              p: 4, 
              maxWidth: 500, 
              width: '100%',
              backgroundColor: colors.background.paper,
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Node IP Address"
                value={ip}
                onChange={e => setIp(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNode();
                  }
                }}
                placeholder="e.g. 192.168.1.100"
                sx={{ flex: 1 }}
              />
              
              <Button 
                variant="contained" 
                onClick={addNode}
                disabled={!ip.trim()}
                sx={{ 
                  py: 1.5,
                  px: 3,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  minWidth: '120px'
                }}
              >
                Add Node
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
