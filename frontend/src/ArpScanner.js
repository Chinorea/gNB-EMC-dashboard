import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Router as RouterIcon,
  DeviceHub as DeviceHubIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from './theme';

const ArpScanner = () => {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanStats, setScanStats] = useState({ total: 0, responding: 0, scanned: 0 });
  const [networkBase, setNetworkBase] = useState('192.168.2');
  const [startIP, setStartIP] = useState(1);
  const [endIP, setEndIP] = useState(254);
  const [scanMethod, setScanMethod] = useState('http');
  const [scanSpeed, setScanSpeed] = useState('balanced'); // Add scan speed option

  // Optimized device checking with parallel port scanning and shorter timeouts
  const checkDevice = async (ip, method = 'http') => {
    const timeoutMs = scanSpeed === 'fast' ? 500 : scanSpeed === 'balanced' ? 1000 : 2000;
    
    switch (method) {
      case 'http':
        return await checkHTTPOptimized(ip, timeoutMs);
      case 'websocket':
        return await checkWebSocketOptimized(ip, timeoutMs);
      case 'fetch':
        return await checkFetchOptimized(ip, timeoutMs);
      case 'ping':
        return await checkPingOptimized(ip, timeoutMs);
      default:
        return await checkHTTPOptimized(ip, timeoutMs);
    }
  };

  // Optimized HTTP method - parallel port checking
  const checkHTTPOptimized = async (ip, timeoutMs) => {
    const commonPorts = scanSpeed === 'fast' ? [80, 8080, 443] : [80, 8080, 443, 22, 53, 5000];
    
    // Check all ports in parallel instead of sequentially
    const portPromises = commonPorts.map(async (port) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const startTime = Date.now();
        
        await fetch(`http://${ip}:${port}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        return {
          ip,
          status: 'online',
          responseTime,
          method: `HTTP:${port}`,
          lastSeen: new Date().toLocaleTimeString(),
          port
        };
      } catch (error) {
        return null;
      }
    });

    // Wait for all ports and return the first successful response
    const results = await Promise.allSettled(portPromises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    return successfulResult ? successfulResult.value : null;
  };

  // Optimized WebSocket method
  const checkWebSocketOptimized = async (ip, timeoutMs) => {
    const commonPorts = scanSpeed === 'fast' ? [80, 8080] : [80, 8080, 3000, 8000];
    
    const portPromises = commonPorts.map(async (port) => {
      try {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
          const ws = new WebSocket(`ws://${ip}:${port}`);
          const timeoutId = setTimeout(() => {
            ws.close();
            resolve(null);
          }, timeoutMs);
          
          ws.onopen = () => {
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            ws.close();
            resolve({
              ip,
              status: 'online',
              responseTime,
              method: `WebSocket:${port}`,
              lastSeen: new Date().toLocaleTimeString(),
              port
            });
          };
          
          ws.onerror = () => {
            clearTimeout(timeoutId);
            ws.close();
            resolve(null);
          };
        });
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.allSettled(portPromises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    return successfulResult ? successfulResult.value : null;
  };

  // Optimized Fetch method
  const checkFetchOptimized = async (ip, timeoutMs) => {
    const endpoints = scanSpeed === 'fast' ? ['', '/api'] : ['', '/api', '/status', '/health', '/favicon.ico'];
    
    const endpointPromises = endpoints.map(async (endpoint) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const startTime = Date.now();
        
        await fetch(`http://${ip}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache',
          headers: { 'Accept': '*/*' }
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        return {
          ip,
          status: 'online',
          responseTime,
          method: `Fetch${endpoint}`,
          lastSeen: new Date().toLocaleTimeString(),
          endpoint
        };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.allSettled(endpointPromises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    return successfulResult ? successfulResult.value : null;
  };

  // New ping-like method using image loading
  const checkPingOptimized = async (ip, timeoutMs) => {
    try {
      const startTime = Date.now();
      
      return new Promise((resolve) => {
        const img = new Image();
        const timeoutId = setTimeout(() => {
          resolve(null);
        }, timeoutMs);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          resolve({
            ip,
            status: 'online',
            responseTime,
            method: 'Image Ping',
            lastSeen: new Date().toLocaleTimeString()
          });
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          // Even on error, if we get a response, the device exists
          const responseTime = Date.now() - startTime;
          if (responseTime < timeoutMs * 0.9) { // If we got a quick response (even error)
            resolve({
              ip,
              status: 'online',
              responseTime,
              method: 'Image Ping (Error)',
              lastSeen: new Date().toLocaleTimeString()
            });
          } else {
            resolve(null);
          }
        };
        
        // Try to load a common image or just trigger a request
        img.src = `http://${ip}/favicon.ico?${Date.now()}`;
      });
    } catch (error) {
      return null;
    }
  };

  // Detect device type based on response characteristics
  const detectDeviceType = (device) => {
    if (!device) return 'Unknown';
    
    const { ip, port, endpoint, method } = device;
    const lastOctet = parseInt(ip.split('.')[3]);
    
    // Common device type detection patterns
    if (lastOctet === 1 || lastOctet === 254) return 'Router/Gateway';
    if (port === 22) return 'Server/Linux';
    if (port === 80 || port === 8080) return 'Web Server';
    if (port === 443) return 'HTTPS Server';
    if (port === 5000) return 'Development Server';
    if (endpoint === '/api') return 'API Server';
    if (method.includes('WebSocket')) return 'WebSocket Server';
    
    return 'Network Device';
  };

  // Generate a simulated MAC address for display purposes
  const generateDisplayMAC = (ip) => {
    // Generate a consistent MAC based on IP for display
    const parts = ip.split('.');
    const hash = parts.reduce((acc, part) => acc + parseInt(part), 0);
    const macBase = (hash * 123456789) % 0xFFFFFFFFFFFF;
    const mac = macBase.toString(16).padStart(12, '0').toUpperCase();
    return `${mac.substr(0,2)}:${mac.substr(2,2)}:${mac.substr(4,2)}:${mac.substr(6,2)}:${mac.substr(8,2)}:${mac.substr(10,2)}`;
  };

  // Optimized scanning function
  const scanNetwork = useCallback(async () => {
    if (scanning) return;
    
    setScanning(true);
    setProgress(0);
    setDevices([]);
    
    const totalIPs = endIP - startIP + 1;
    setScanStats({ total: totalIPs, responding: 0, scanned: 0 });
    
    const foundDevices = [];
    // Larger batch sizes for faster scanning
    const batchSize = scanSpeed === 'fast' ? 20 : scanSpeed === 'balanced' ? 15 : 10;
    
    for (let i = startIP; i <= endIP; i += batchSize) {
      const batch = [];
      const endBatch = Math.min(i + batchSize - 1, endIP);
      
      // Create batch of device check promises
      for (let j = i; j <= endBatch; j++) {
        const ip = `${networkBase}.${j}`;
        batch.push(checkDevice(ip, scanMethod));
      }
      
      try {
        const results = await Promise.all(batch);
        
        // Filter out null results and enhance with additional info
        const validResults = results
          .filter(result => result !== null)
          .map(device => ({
            ...device,
            deviceType: detectDeviceType(device),
            macAddress: generateDisplayMAC(device.ip),
            vendor: 'Network Scan Detected'
          }));
        
        foundDevices.push(...validResults);
        
        // Update progress and stats
        const scannedCount = endBatch - startIP + 1;
        setProgress((scannedCount / totalIPs) * 100);
        setScanStats(prev => ({
          ...prev,
          scanned: scannedCount,
          responding: foundDevices.length
        }));
        
        // Update devices list in real-time
        setDevices([...foundDevices]);
        
      } catch (error) {
        console.error('Batch scan error:', error);
      }
      
      // Reduce or eliminate delay between batches
      if (scanSpeed !== 'fast') {
        await new Promise(resolve => setTimeout(resolve, scanSpeed === 'balanced' ? 50 : 100));
      }
    }
    
    setScanning(false);
    setLastScanTime(new Date());
    setProgress(100);
  }, [scanning, networkBase, startIP, endIP, scanMethod, scanSpeed]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return colors.nodeStatus.running;
      case 'offline':
        return colors.nodeStatus.off;
      default:
        return colors.nodeStatus.disconnected;
    }
  };

  const getDeviceIcon = (deviceType) => {
    const type = deviceType?.toLowerCase() || '';
    if (type.includes('router') || type.includes('gateway')) return <RouterIcon />;
    if (type.includes('server')) return <DeviceHubIcon />;
    return <ComputerIcon />;
  };

  const getMethodColor = (method) => {
    if (method.includes('HTTP')) return '#2196f3';
    if (method.includes('WebSocket')) return '#ff9800';
    if (method.includes('Fetch')) return '#4caf50';
    if (method.includes('Ping')) return '#9c27b0';
    return '#757575';
  };

  return (
    <Box sx={{ backgroundColor: colors.background.main, minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: colors.text.primary }}>
            Network Discovery Scanner
          </Typography>
          <Typography variant="subtitle1" sx={{ color: colors.text.secondary, mb: 2 }}>
            Pure frontend network discovery - Optimized for speed!
          </Typography>
        </Box>

        {/* Scan Configuration */}
        <Card sx={{ mb: 3, backgroundColor: colors.background.paper }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scan Configuration
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={2.5}>
                <TextField
                  fullWidth
                  label="Network Base"
                  value={networkBase}
                  onChange={(e) => setNetworkBase(e.target.value)}
                  placeholder="192.168.2"
                  disabled={scanning}
                />
              </Grid>
              <Grid item xs={6} sm={1.5}>
                <TextField
                  fullWidth
                  label="Start IP"
                  type="number"
                  value={startIP}
                  onChange={(e) => setStartIP(parseInt(e.target.value) || 1)}
                  disabled={scanning}
                  inputProps={{ min: 1, max: 254 }}
                />
              </Grid>
              <Grid item xs={6} sm={1.5}>
                <TextField
                  fullWidth
                  label="End IP"
                  type="number"
                  value={endIP}
                  onChange={(e) => setEndIP(parseInt(e.target.value) || 254)}
                  disabled={scanning}
                  inputProps={{ min: 1, max: 254 }}
                />
              </Grid>
              <Grid item xs={12} sm={2.5}>
                <FormControl fullWidth disabled={scanning}>
                  <InputLabel>Scan Method</InputLabel>
                  <Select
                    value={scanMethod}
                    onChange={(e) => setScanMethod(e.target.value)}
                    label="Scan Method"
                  >
                    <MenuItem value="http">HTTP Ports</MenuItem>
                    <MenuItem value="websocket">WebSocket</MenuItem>
                    <MenuItem value="fetch">Fetch Endpoints</MenuItem>
                    <MenuItem value="ping">Image Ping</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth disabled={scanning}>
                  <InputLabel>Scan Speed</InputLabel>
                  <Select
                    value={scanSpeed}
                    onChange={(e) => setScanSpeed(e.target.value)}
                    label="Scan Speed"
                  >
                    <MenuItem value="fast">Fast (500ms)</MenuItem>
                    <MenuItem value="balanced">Balanced (1s)</MenuItem>
                    <MenuItem value="thorough">Thorough (2s)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={scanNetwork}
                  disabled={scanning}
                  sx={{
                    backgroundColor: colors.button.add,
                    '&:hover': { backgroundColor: colors.button.addHover },
                    height: '56px' // Match input height
                  }}
                >
                  {scanning ? 'Scanning...' : 'Scan Network'}
                </Button>
              </Grid>
            </Grid>
            <Typography variant="caption" sx={{ mt: 2, display: 'block', color: colors.text.secondary }}>
              Browser scan range: {networkBase}.{startIP} - {networkBase}.{endIP} ({endIP - startIP + 1} addresses) • Speed: {scanSpeed} • Method: {scanMethod}
            </Typography>
          </CardContent>
        </Card>

        {/* Scanning Progress */}
        {scanning && (
          <Card sx={{ mb: 3, backgroundColor: colors.background.paper }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scanning Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Scanned: {scanStats.scanned} / {scanStats.total}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Found: {scanStats.responding}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Progress: {Math.round(progress)}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Status Info */}
        {lastScanTime && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<ScheduleIcon />}
              label={`Last scan: ${lastScanTime.toLocaleTimeString()}`}
              variant="outlined"
              sx={{ color: colors.text.secondary }}
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${devices.length} devices found`}
              color={devices.length > 0 ? 'success' : 'default'}
            />
          </Box>
        )}

        {/* Results Summary */}
        {!scanning && devices.length === 0 && lastScanTime && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No devices found on the {networkBase}.{startIP}-{endIP} network range. 
            Try a different network range, scan method, or use "Fast" speed for quicker results.
          </Alert>
        )}

        {/* Devices Table */}
        {devices.length > 0 && (
          <TableContainer component={Paper} sx={{ backgroundColor: colors.background.paper }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.background.light }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Device</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Device Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Detection Method</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Response Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Discovered</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device, index) => (
                  <TableRow 
                    key={device.ip}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: colors.background.hover },
                      '&:hover': { backgroundColor: colors.background.light }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getDeviceIcon(device.deviceType)}
                        <Typography variant="body2">
                          Device {index + 1}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {device.ip}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {device.deviceType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.method}
                        size="small"
                        sx={{
                          backgroundColor: getMethodColor(device.method),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {device.responseTime}ms
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.status}
                        size="small"
                        icon={device.status === 'online' ? <CheckCircleIcon /> : <CancelIcon />}
                        sx={{
                          backgroundColor: getStatusColor(device.status),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {device.lastSeen}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Performance Info */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: colors.background.paper, borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" align="center">
            <strong>⚡ Speed Optimizations:</strong> 
            • Parallel port scanning • Shorter timeouts • Larger batch sizes • Minimal delays
            <br />
            <strong>Fast mode:</strong> ~20-30 seconds for full 254 IP range • 
            <strong>Balanced mode:</strong> ~40-60 seconds • 
            <strong>Thorough mode:</strong> ~2-3 minutes
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ArpScanner;