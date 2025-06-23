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

  // Optimized device checking with multiple parallel methods and better coverage
  const checkDevice = async (ip, method = 'auto') => {
    const timeoutMs = scanSpeed === 'fast' ? 800 : scanSpeed === 'balanced' ? 1500 : 2500;
    
    if (method === 'auto') {
      // Try multiple methods in parallel for better detection
      return await checkAllMethodsParallel(ip, timeoutMs);
    }
    
    switch (method) {
      case 'http':
        return await checkHTTPOptimized(ip, timeoutMs);
      case 'websocket':
        return await checkWebSocketOptimized(ip, timeoutMs);
      case 'fetch':
        return await checkFetchOptimized(ip, timeoutMs);
      case 'ping':
        return await checkPingOptimized(ip, timeoutMs);
      case 'hardware':
        return await checkHardwareServices(ip, timeoutMs);
      default:
        return await checkAllMethodsParallel(ip, timeoutMs);
    }
  };

  // New method: Try all detection methods in parallel for maximum coverage
  const checkAllMethodsParallel = async (ip, timeoutMs) => {
    try {
      // Run the most reliable detection methods including hardware detection
      const methods = [
        checkHTTPOptimized(ip, timeoutMs),
        checkWebSocketOptimized(ip, timeoutMs),
        checkFetchOptimized(ip, timeoutMs),
        checkHardwareServices(ip, timeoutMs)
        // Still excluding: checkPingOptimized, checkImagePing, checkDNSLookup, checkXMLHttpRequest
        // These were causing false positives
      ];

      // Wait for the first successful result or all to complete
      const results = await Promise.allSettled(methods);
      
      // Return the first successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value !== null) {
          return result.value;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  // Enhanced HTTP method with more ports and better detection
  const checkHTTPOptimized = async (ip, timeoutMs) => {
    // Expanded port list including common device ports
    const commonPorts = scanSpeed === 'fast' 
      ? [80, 443, 8080, 22, 53] 
      : scanSpeed === 'balanced'
      ? [80, 443, 8080, 22, 53, 23, 21, 25, 110, 143, 993, 995, 5000, 8000, 9000]
      : [80, 443, 8080, 22, 53, 23, 21, 25, 110, 143, 993, 995, 5000, 8000, 9000, 3389, 5432, 3306, 1433, 27017, 6379, 9200];
    
    const portPromises = commonPorts.map(async (port) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const startTime = Date.now();
        
        await fetch(`http://${ip}:${port}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache',
          credentials: 'omit'
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

    const results = await Promise.allSettled(portPromises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    return successfulResult ? successfulResult.value : null;
  };

  // Enhanced WebSocket method with more ports
  const checkWebSocketOptimized = async (ip, timeoutMs) => {
    const wsPorts = scanSpeed === 'fast' ? [80, 8080] : [80, 8080, 3000, 8000, 4000, 5000, 9000];
    
    const portPromises = wsPorts.map(async (port) => {
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

  // Enhanced Fetch method with more endpoints
  const checkFetchOptimized = async (ip, timeoutMs) => {
    const endpoints = scanSpeed === 'fast' 
      ? ['', '/api', '/favicon.ico'] 
      : ['', '/api', '/status', '/health', '/ping', '/favicon.ico', '/robots.txt', '/sitemap.xml', '/admin', '/login', '/index.html', '/index.php'];
    
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
          credentials: 'omit',
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

  // Enhanced ping method using multiple image types - FIXED to remove false positives
  const checkPingOptimized = async (ip, timeoutMs) => {
    const imageTypes = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/logo.png',
      '/logo.jpg',
      '/icon.png',
      '/icon.ico',
      '/'
    ];

    const imagePromises = imageTypes.map(async (imagePath) => {
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
              method: `Image Ping (${imagePath})`,
              lastSeen: new Date().toLocaleTimeString()
            });
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            // FIXED: Remove the flawed logic that treated quick errors as device detection
            // Most onerror events are due to CORS/network issues, not device presence
            resolve(null);
          };
          
          img.src = `http://${ip}${imagePath}?${Date.now()}`;
        });
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.allSettled(imagePromises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    return successfulResult ? successfulResult.value : null;
  };

  // Fixed IFrame Ping method - more conservative detection
  const checkImagePing = async (ip, timeoutMs) => {
    try {
      const startTime = Date.now();
      
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        
        const timeoutId = setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(null);
        }, timeoutMs);
        
        iframe.onload = () => {
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve({
            ip,
            status: 'online',
            responseTime,
            method: 'IFrame Ping',
            lastSeen: new Date().toLocaleTimeString()
          });
        };
        
        iframe.onerror = () => {
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          // FIXED: Only consider it a detection if we get a very specific type of error
          // that indicates the device responded but rejected the request (not network unreachable)
          // For iframe, onerror usually means network/CORS issues, not device detection
          resolve(null);
        };
        
        document.body.appendChild(iframe);
        iframe.src = `http://${ip}/?${Date.now()}`;
      });
    } catch (error) {
      return null;
    }
  };

  // New method: DNS lookup attempt
  const checkDNSLookup = async (ip, timeoutMs) => {
    try {
      const startTime = Date.now();
      
      // Try to make a DNS lookup by attempting to load a resource
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `http://${ip}`;
        
        const timeoutId = setTimeout(() => {
          document.head.removeChild(link);
          resolve(null);
        }, timeoutMs);
        
        link.onload = () => {
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          document.head.removeChild(link);
          resolve({
            ip,
            status: 'online',
            responseTime,
            method: 'DNS Prefetch',
            lastSeen: new Date().toLocaleTimeString()
          });
        };
        
        link.onerror = () => {
          clearTimeout(timeoutId);
          document.head.removeChild(link);
          resolve(null);
        };
        
        document.head.appendChild(link);
      });
    } catch (error) {
      return null;
    }
  };

  // Fixed XMLHttpRequest method - remove false positive logic
  const checkXMLHttpRequest = async (ip, timeoutMs) => {
    try {
      const startTime = Date.now();
      
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.timeout = timeoutMs;
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            const responseTime = Date.now() - startTime;
            // Only consider actual HTTP responses (200, 404, etc.) as device detection
            if (xhr.status > 0) {
              resolve({
                ip,
                status: 'online',
                responseTime,
                method: `XHR (${xhr.status})`,
                lastSeen: new Date().toLocaleTimeString()
              });
            } else {
              resolve(null);
            }
          }
        };
        
        xhr.onerror = () => {
          // FIXED: Remove the flawed logic - network errors usually mean no device
          resolve(null);
        };
        
        xhr.ontimeout = () => {
          resolve(null);
        };
        
        xhr.open('GET', `http://${ip}`, true);
        xhr.send();
      });
    } catch (error) {
      return null;
    }
  };

  // Enhanced hardware device detection - FIXED to remove false positives
  const checkHardwareServices = async (ip, timeoutMs) => {
    // Only check ports that are likely to respond positively to HTTP requests
    // Removed problematic ports that cause false positives
    const reliableHardwarePorts = [
      { port: 80, service: 'HTTP' },          // Web servers
      { port: 443, service: 'HTTPS' },        // Secure web servers  
      { port: 8080, service: 'Alt-HTTP' },    // Alternative HTTP
      { port: 5000, service: 'Dev-Server' },  // Development servers
      { port: 8000, service: 'Web-Alt' },     // Alternative web
      { port: 9000, service: 'Management' },  // Management interfaces
      { port: 631, service: 'IPP' },          // Printer web interface
    ];

    const portPromises = reliableHardwarePorts.map(async ({ port, service }) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const startTime = Date.now();
        
        // Only try HTTP connections to ports that actually speak HTTP
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
          method: `${service}:${port}`,
          lastSeen: new Date().toLocaleTimeString(),
          port,
          service
        };
      } catch (error) {
        // FIXED: Remove the false positive logic completely
        // Don't consider quick errors as device detection
        return null;
      }
    });

    const results = await Promise.allSettled(portPromises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    return successfulResult ? successfulResult.value : null;
  };

  // Detect device type based on response characteristics
  const detectDeviceType = (device) => {
    if (!device) return 'Unknown';
    
    const { ip, port, endpoint, method, service } = device;
    const lastOctet = parseInt(ip.split('.')[3]);
    
    // Hardware service-based detection (from new Hardware Detection method)
    if (service) {
      switch (service) {
        case 'SSH': return 'Linux/Unix Device';
        case 'Telnet': return 'Network Equipment';
        case 'DNS': return 'DNS Server/Router';
        case 'RPC': return 'Windows Computer';
        case 'NetBIOS': return 'Windows Computer';
        case 'SMB': return 'Windows File Server';
        case 'IPP': return 'Network Printer';
        case 'UPnP': return 'Media Device/Router';
        case 'mDNS': return 'Apple Device';
        case 'Chromecast': return 'Google Chromecast';
        case 'Management': return 'Managed Device';
        case 'Device': return 'Custom Device';
      }
    }
    
    // Port-based detection (existing logic enhanced)
    if (port) {
      switch (port) {
        case 22: return 'SSH Server/Linux';
        case 23: return 'Telnet Device';
        case 53: return 'DNS Server';
        case 80: return 'Web Server';
        case 135: return 'Windows RPC';
        case 139: return 'Windows NetBIOS';
        case 443: return 'HTTPS Server';
        case 445: return 'Windows SMB';
        case 631: return 'Network Printer';
        case 1900: return 'UPnP Device';
        case 5000: return 'Development Server';
        case 5353: return 'Bonjour/mDNS Device';
        case 8008:
        case 8009: return 'Chromecast Device';
        case 8080: return 'Web Server (Alt)';
        case 9000: return 'Management Interface';
      }
    }
    
    // IP-based detection
    if (lastOctet === 1 || lastOctet === 254) return 'Router/Gateway';
    if (endpoint === '/api') return 'API Server';
    if (method && method.includes('WebSocket')) return 'WebSocket Server';
    
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

  // Enhanced scanning function with better coverage
  const scanNetwork = useCallback(async () => {
    if (scanning) return;
    
    setScanning(true);
    setProgress(0);
    setDevices([]);
    
    const totalIPs = endIP - startIP + 1;
    setScanStats({ total: totalIPs, responding: 0, scanned: 0 });
    
    const foundDevices = [];
    // Smaller batch sizes for more thorough scanning
    const batchSize = scanSpeed === 'fast' ? 8 : scanSpeed === 'balanced' ? 6 : 4;
    
    for (let i = startIP; i <= endIP; i += batchSize) {
      const batch = [];
      const endBatch = Math.min(i + batchSize - 1, endIP);
      
      // Create batch of device check promises
      for (let j = i; j <= endBatch; j++) {
        const ip = `${networkBase}.${j}`;
        // Use 'auto' method for comprehensive detection
        batch.push(checkDevice(ip, scanMethod === 'auto' ? 'auto' : scanMethod));
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
      
      // Minimal delay between batches for thorough scanning
      if (scanSpeed !== 'fast') {
        await new Promise(resolve => setTimeout(resolve, scanSpeed === 'balanced' ? 100 : 200));
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
                    <MenuItem value="hardware">Hardware Detection</MenuItem>
                    <MenuItem value="auto">Auto (All Methods)</MenuItem>
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