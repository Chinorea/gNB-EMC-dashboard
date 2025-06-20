import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Wifi, WifiOff, Refresh, PlayArrow, Stop } from '@mui/icons-material';

export default function NetworkScanning() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState([]);
  const [publisherStatus, setPublisherStatus] = useState('stopped');
  const [lastScanTime, setLastScanTime] = useState(null);
  const [websocketConnection, setWebsocketConnection] = useState('simulation');
  const [simulationMode, setSimulationMode] = useState(true);

  // Simulate mDNS Publisher (for standalone testing)
  const startSimulatedPublisher = useCallback(() => {
    setPublisherStatus('starting');
    console.log('Starting simulated mDNS publisher...');
    
    // Simulate startup delay
    setTimeout(() => {
      setIsPublishing(true);
      setPublisherStatus('running');
      setWebsocketConnection('connected');
      console.log('Simulated mDNS Publisher started successfully');
      console.log('Service: gNB-EMC-Dashboard-Scanner._gnb-scanner._tcp');
      console.log('Port: 3000');
      console.log('Waiting for gNB subscriber nodes to discover and register...');
    }, 1000);
  }, []);

  // Start Real mDNS Publisher (requires backend)
  const startRealPublisher = useCallback(async () => {
    try {
      setPublisherStatus('starting');
      
      const response = await fetch('http://localhost:3001/api/mdns/start-publisher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: 'gNB-EMC-Dashboard-Scanner',
          serviceType: '_gnb-scanner._tcp',
          port: 3000,
          txtRecord: {
            version: '1.0',
            capabilities: 'network-scanning,node-discovery',
            scan_mode: 'active'
          }
        })
      });

      if (response.ok) {
        setIsPublishing(true);
        setPublisherStatus('running');
        console.log('mDNS Publisher started successfully');
      } else {
        throw new Error('Failed to start publisher');
      }
    } catch (error) {
      console.error('Failed to start mDNS publisher:', error);
      setPublisherStatus('error');
      setSimulationMode(true); // Fall back to simulation mode
    }
  }, []);

  // Start Publisher (tries real first, falls back to simulation)
  const startPublisher = useCallback(async () => {
    if (simulationMode) {
      startSimulatedPublisher();
    } else {
      await startRealPublisher();
    }
  }, [simulationMode, startSimulatedPublisher, startRealPublisher]);

  // Stop Publisher
  const stopPublisher = useCallback(async () => {
    setPublisherStatus('stopping');
    
    if (simulationMode) {
      // Simulate stop
      setTimeout(() => {
        setIsPublishing(false);
        setPublisherStatus('stopped');
        setWebsocketConnection('disconnected');
        console.log('Simulated mDNS Publisher stopped');
      }, 500);
    } else {
      try {
        const response = await fetch('http://localhost:3001/api/mdns/stop-publisher', {
          method: 'POST'
        });

        if (response.ok) {
          setIsPublishing(false);
          setPublisherStatus('stopped');
          console.log('mDNS Publisher stopped');
        }
      } catch (error) {
        console.error('Failed to stop mDNS publisher:', error);
        // Force stop in simulation mode
        setIsPublishing(false);
        setPublisherStatus('stopped');
        setSimulationMode(true);
      }
    }
  }, [simulationMode]);

  // Manual scan trigger
  const triggerScan = useCallback(async () => {
    if (!isPublishing) {
      console.warn('Publisher must be running to trigger scan');
      return;
    }

    if (simulationMode) {
      setLastScanTime(new Date());
      console.log('Manual scan triggered (simulation mode)');
      console.log('Broadcasting mDNS query for gNB subscribers...');
    } else {
      try {
        const response = await fetch('http://localhost:3001/api/mdns/trigger-scan', {
          method: 'POST'
        });

        if (response.ok) {
          setLastScanTime(new Date());
          console.log('Manual scan triggered');
        }
      } catch (error) {
        console.error('Failed to trigger scan:', error);
      }
    }
  }, [isPublishing, simulationMode]);

  // Simulate incoming node registration for testing
  const simulateNodeRegistration = useCallback((nodeData) => {
    console.log('Simulated gNB node registration:', nodeData);
    
    setDiscoveredNodes(prev => {
      const existingIndex = prev.findIndex(node => node.ip === nodeData.ip);
      if (existingIndex >= 0) {
        // Update existing node
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...nodeData,
          lastSeen: new Date().toISOString()
        };
        return updated;
      } else {
        // Add new node
        return [...prev, {
          ...nodeData,
          discoveredAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }];
      }
    });
  }, []);

  // Add test gNB node button for simulation
  const addTestNode = useCallback(() => {
    const testNode = {
      ip: `192.168.1.${100 + discoveredNodes.length}`,
      nodeName: `gNB-Test-${discoveredNodes.length + 1}`,
      mac: `AA:BB:CC:DD:EE:${(10 + discoveredNodes.length).toString(16).toUpperCase()}`,
      nodeType: 'gNB',
      capabilities: ['status_reporting', 'network_monitoring', 'battery_reporting'],
      batteryLevel: (12.0 + Math.random() * 0.5).toFixed(2),
      batteryPercentage: Math.floor(75 + Math.random() * 20),
      flaskPort: 5000
    };
    
    simulateNodeRegistration(testNode);
  }, [discoveredNodes.length, simulateNodeRegistration]);

  // WebSocket connection for real-time node discovery
  useEffect(() => {
    if (simulationMode) return;

    const ws = new WebSocket('ws://localhost:3001/network-scanner');
    
    ws.onopen = () => {
      setWebsocketConnection('connected');
      console.log('Connected to network scanner WebSocket');
    };
    
    ws.onclose = () => {
      setWebsocketConnection('disconnected');
      console.log('Disconnected from network scanner WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received discovery data:', data);
        
        switch(data.type) {
          case 'connection-established':
            console.log('WebSocket connection established with mDNS service');
            break;
            
          case 'publisher-started':
            console.log('mDNS publisher started:', data);
            break;
            
          case 'publisher-stopped':
            console.log('mDNS publisher stopped');
            setDiscoveredNodes([]);
            break;
            
          case 'node-discovered':
            setDiscoveredNodes(prev => {
              const existingIndex = prev.findIndex(node => node.ip === data.payload.ip);
              if (existingIndex >= 0) {
                // Update existing node
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  ...data.payload,
                  lastSeen: new Date().toISOString()
                };
                return updated;
              } else {
                // Add new node
                return [...prev, {
                  ...data.payload,
                  discoveredAt: new Date().toISOString(),
                  lastSeen: new Date().toISOString()
                }];
              }
            });
            break;
            
          case 'node-heartbeat':
            setDiscoveredNodes(prev => 
              prev.map(node => 
                node.ip === data.payload.ip 
                  ? { ...node, lastSeen: new Date().toISOString(), ...data.payload }
                  : node
              )
            );
            break;
            
          case 'node-disconnected':
            setDiscoveredNodes(prev => 
              prev.filter(node => node.ip !== data.payload.ip)
            );
            break;
            
          case 'scan-triggered':
            console.log('Manual scan triggered at:', data.timestamp);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWebsocketConnection('error');
    };
    
    return () => ws.close();
  }, [simulationMode]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Network Scanning (mDNS Discovery)
      </Typography>
      
      {/* Mode Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing Mode
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant={simulationMode ? "contained" : "outlined"}
              onClick={() => setSimulationMode(true)}
              disabled={isPublishing}
            >
              Simulation Mode
            </Button>
            <Button
              variant={!simulationMode ? "contained" : "outlined"}
              onClick={() => setSimulationMode(false)}
              disabled={isPublishing}
            >
              Real Backend Mode
            </Button>
            <Typography variant="body2" color="textSecondary">
              {simulationMode 
                ? 'Testing without backend (localhost:3001 not required)'
                : 'Requires backend server on localhost:3001'
              }
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Publisher Control Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            mDNS Publisher Control
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant={isPublishing ? "outlined" : "contained"}
              color={isPublishing ? "secondary" : "primary"}
              startIcon={isPublishing ? <Stop /> : <PlayArrow />}
              onClick={isPublishing ? stopPublisher : startPublisher}
              disabled={publisherStatus === 'starting' || publisherStatus === 'stopping'}
            >
              {isPublishing ? 'Stop Publisher' : 'Start Publisher'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={triggerScan}
              disabled={!isPublishing}
            >
              Manual Scan
            </Button>
            
            {simulationMode && isPublishing && (
              <Button
                variant="outlined"
                color="success"
                onClick={addTestNode}
              >
                Add Test gNB Node
              </Button>
            )}
            
            <Chip 
              label={`Status: ${publisherStatus}`}
              color={
                publisherStatus === 'running' ? 'success' : 
                publisherStatus === 'error' ? 'error' : 'default'
              }
              icon={publisherStatus === 'starting' || publisherStatus === 'stopping' ? 
                <CircularProgress size={16} /> : undefined}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Connection: 
            </Typography>
            <Chip 
              size="small"
              label={websocketConnection}
              color={websocketConnection === 'connected' ? 'success' : 
                     websocketConnection === 'simulation' ? 'info' : 'error'}
              icon={websocketConnection === 'connected' ? <Wifi /> : <WifiOff />}
            />
            
            {lastScanTime && (
              <>
                <Typography variant="body2" color="textSecondary">
                  Last Manual Scan: {lastScanTime.toLocaleTimeString()}
                </Typography>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Connection Status Alert */}
      {publisherStatus === 'error' && !simulationMode && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to start mDNS publisher. Backend server not available on localhost:3001. 
          Switched to simulation mode for testing.
        </Alert>
      )}

      {simulationMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Running in simulation mode. Use "Add Test gNB Node" to simulate node discoveries.
          To test with real Python subscribers, switch to "Real Backend Mode" and ensure backend is running.
        </Alert>
      )}

      {/* Discovered Nodes Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Discovered gNB Nodes ({discoveredNodes.length})
          </Typography>
          
          {discoveredNodes.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography color="textSecondary">
                {isPublishing 
                  ? simulationMode 
                    ? 'No gNB nodes discovered yet. Click "Add Test gNB Node" to simulate discoveries.'
                    : 'No gNB nodes discovered yet. Start some subscriber nodes to see them appear here.'
                  : 'Start the publisher to begin discovering gNB nodes.'
                }
              </Typography>
            </Paper>
          ) : (
            <List>
              {discoveredNodes.map((node, index) => (
                <React.Fragment key={node.ip || index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {node.nodeName || node.ip}
                          </Typography>
                          <Chip 
                            size="small" 
                            label="Active" 
                            color="success" 
                            variant="outlined"
                          />
                          {simulationMode && (
                            <Chip 
                              size="small" 
                              label="Simulated" 
                              color="info" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>IP:</strong> {node.ip}
                          </Typography>
                          {node.mac && (
                            <Typography variant="body2">
                              <strong>MAC:</strong> {node.mac}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            <strong>Node Type:</strong> {node.nodeType || 'gNB'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Capabilities:</strong> {formatCapabilities(node.capabilities)}
                          </Typography>
                          {node.batteryLevel && (
                            <Typography variant="body2">
                              <strong>Battery:</strong> {node.batteryLevel}V
                              {node.batteryPercentage && ` (${node.batteryPercentage}%)`}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            <strong>Discovered:</strong> {formatTimestamp(node.discoveredAt)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Last Seen:</strong> {formatTimestamp(node.lastSeen)}
                          </Typography>
                          {node.flaskPort && (
                            <Typography variant="body2">
                              <strong>Flask Port:</strong> {node.flaskPort}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < discoveredNodes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
      
      {/* Debug Console Output */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Console Output & Instructions
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Check the browser console (F12) for detailed mDNS discovery logs and events.
          </Typography>
          {simulationMode ? (
            <Typography variant="body2" color="textSecondary">
              <strong>Simulation Mode:</strong> Use the "Add Test gNB Node" button to simulate node discoveries.
              This allows you to test the UI without requiring a backend server.
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">
              <strong>Real Backend Mode:</strong> Requires backend server on localhost:3001 with mDNS endpoints.
              Python gNB subscriber scripts can discover and register with your dashboard.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  // Format node capabilities
  function formatCapabilities(capabilities) {
    if (!capabilities || !Array.isArray(capabilities)) return 'None';
    return capabilities.join(', ');
  }

  // Format timestamp
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  }
}