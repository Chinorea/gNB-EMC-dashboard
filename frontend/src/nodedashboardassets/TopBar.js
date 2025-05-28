// frontend/src/nodedashboardassets/TopBar.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

export default function TopBar({ ip, loading, nodeStatus, appBarColor, handleToggle, nodeName }) {
  return (
    <AppBar
      position="static"
      elevation={2}
      sx={{ backgroundColor: appBarColor }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {nodeName || ip} {/* Display nodeName if available, otherwise fall back to ip */}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="subtitle1"
            sx={{
              mr: 2,
              fontSize: '1.3rem',
            }}
          >
            Status:{' '}
            {loading
              ? 'Initialising'
              : nodeStatus === 'RUNNING'
              ? 'Broadcasting'
              : nodeStatus === 'OFF'
              ? 'Not Broadcasting'
              : 'Disconnected' /* Should not happen if data is present, but good fallback */ }
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {(nodeStatus === 'RUNNING' || nodeStatus === 'OFF') && (
              <Button
                variant="contained"
                onClick={handleToggle}
                disabled={loading}
                sx={{
                  backgroundColor:
                    nodeStatus === 'RUNNING' ? '#612a1f' : '#40613d',
                  color: 'white',
                  '&:hover': {
                    backgroundColor:
                      nodeStatus === 'RUNNING'
                        ? '#4d1914'
                        : '#335e2e',
                  },
                }}
              >
                {loading
                  ? 'Working…'
                  : nodeStatus === 'RUNNING'
                  ? 'Turn Off'
                  : 'Turn On'}
              </Button>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}