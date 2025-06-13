// filepath: c:\Users\intern\OneDrive\Documents\Internships\STEngineering\webdashboard\frontend\src\nodedashboardassets\LogCard.js
import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, Button, ButtonGroup, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

export default function LogCard({ ip }) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const [logLines, setLogLines] = useState([]);
  const [error, setError] = useState(null);
  const [logType, setLogType] = useState('du'); // 'du' or 'cu' or 'setup'

  useEffect(() => {
    if (!ip) return;
    fetchLogs();
  }, [ip, logType]);

  // Fetch logs from backend
  const fetchLogs = () => {
    setError(null);
    fetch(`http://${ip}:5000/api/download/${logType}_log`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('File not found');
          }
          throw new Error(`Could not load ${logType.toUpperCase()} log (status ${res.status})`);
        }
        return res.text();
      })
      .then(text => {
        setLogLines(text.split('\n'));
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  };
  return (
    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>      <Card
        elevation={3}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          height: '100%', 
          maxWidth: '1200px',
          minWidth: '600px',
          transition: 'transform 0.1s ease-in-out',
          backgroundColor: colors.background.paper,
          '&:hover': { 
            transform: 'scale(1.01)', 
            boxShadow: 6, 
            backgroundColor: colors.background.hover 
          }, 
          width: '100%' 
        }}
      >
        <CardContent
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', p: 2, width: '100%' }}
        >          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Typography color="textSecondary" variant="subtitle2" sx={{ fontSize: '1.1rem' }}>
                Logs
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={logType === 'du' ? 'contained' : 'outlined'}
                  onClick={() => setLogType('du')}
                  sx={{ minWidth: '50px' }}
                >DU</Button>
                <Button
                  variant={logType === 'cu' ? 'contained' : 'outlined'}
                  onClick={() => setLogType('cu')}
                  sx={{ minWidth: '50px' }}
                >CU</Button>
                <Button
                  variant={logType === 'setup' ? 'contained' : 'outlined'}
                  onClick={() => setLogType('setup')}
                  sx={{ minWidth: '60px' }}
                >Setup</Button>
              </ButtonGroup>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button 
                size="small" 
                onClick={() => window.open(`http://${ip}:5000/api/download/${logType}_log`, '_blank')}
                sx={{ minWidth: '120px' }}
              >
                Download {logType.toUpperCase()}
              </Button>
              <IconButton size="small" onClick={fetchLogs}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {error ? (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          ) : (
            <Box sx={{ mt: 2, maxHeight:300, overflow: 'auto', backgroundColor: colors.background.hover, p: 1, borderRadius: 1, width: '100%' }}>
              {logLines.length > 0 ? (
                logLines.map((line, idx) => (
                  <Typography key={idx} component="pre" variant="caption" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                    {line}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No logs available.
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
}
