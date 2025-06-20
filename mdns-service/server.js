const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const bonjour = require('bonjour')();
const http = require('http');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server for WebSocket
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

// Store active services and registered nodes
let activeServices = new Map();
let registeredNodes = new Map();
let publisherActive = false;

// Broadcast to all WebSocket clients
function broadcastToClients(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send current state to new client
  ws.send(JSON.stringify({
    type: 'connection-established',
    publisherActive,
    nodeCount: registeredNodes.size
  }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// API Routes

// Start mDNS Publisher
app.post('/api/mdns/start-publisher', (req, res) => {
  try {
    const { serviceName, serviceType, port, txtRecord } = req.body;
    
    if (publisherActive) {
      return res.status(400).json({ error: 'Publisher already running' });
    }
    
    console.log('Starting mDNS publisher...');
    console.log('Service Name:', serviceName);
    console.log('Service Type:', serviceType);
    console.log('Port:', port);
    console.log('TXT Record:', txtRecord);
    
    // Publish the service using Bonjour
    const service = bonjour.publish({
      name: serviceName,
      type: serviceType,
      port: port,
      txt: txtRecord
    });
    
    service.on('up', () => {
      console.log(`✅ mDNS service "${serviceName}" published successfully`);
      console.log(`   Service Type: ${serviceType}`);
      console.log(`   Port: ${port}`);
      console.log(`   Broadcasting on network for gNB nodes to discover...`);
    });
    
    service.on('error', (err) => {
      console.error('❌ mDNS service error:', err);
    });
    
    activeServices.set('dashboard', service);
    publisherActive = true;
    
    // Broadcast status to WebSocket clients
    broadcastToClients({
      type: 'publisher-started',
      serviceName,
      serviceType,
      port
    });
    
    res.json({ 
      success: true, 
      message: 'mDNS publisher started successfully',
      serviceName,
      serviceType,
      port 
    });
    
  } catch (error) {
    console.error('Error starting mDNS publisher:', error);
    res.status(500).json({ error: 'Failed to start mDNS publisher' });
  }
});

// Stop mDNS Publisher
app.post('/api/mdns/stop-publisher', (req, res) => {
  try {
    if (!publisherActive) {
      return res.status(400).json({ error: 'Publisher not running' });
    }
    
    console.log('Stopping mDNS publisher...');
    
    // Unpublish all services
    activeServices.forEach((service, key) => {
      service.stop();
      console.log(`🛑 Stopped mDNS service: ${key}`);
    });
    
    activeServices.clear();
    registeredNodes.clear();
    publisherActive = false;
    
    // Broadcast status to WebSocket clients
    broadcastToClients({
      type: 'publisher-stopped'
    });
    
    console.log('✅ mDNS publisher stopped successfully');
    
    res.json({ 
      success: true, 
      message: 'mDNS publisher stopped successfully' 
    });
    
  } catch (error) {
    console.error('Error stopping mDNS publisher:', error);
    res.status(500).json({ error: 'Failed to stop mDNS publisher' });
  }
});

// Trigger manual scan
app.post('/api/mdns/trigger-scan', (req, res) => {
  try {
    if (!publisherActive) {
      return res.status(400).json({ error: 'Publisher not running' });
    }
    
    console.log('🔍 Manual scan triggered - broadcasting mDNS query...');
    
    // Broadcast scan trigger to WebSocket clients
    broadcastToClients({
      type: 'scan-triggered',
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Manual scan triggered' 
    });
    
  } catch (error) {
    console.error('Error triggering scan:', error);
    res.status(500).json({ error: 'Failed to trigger scan' });
  }
});

// gNB Node Registration endpoint
app.post('/api/gnb/register', (req, res) => {
  try {
    const nodeData = req.body;
    const { ip, nodeName } = nodeData;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }
    
    console.log(`📝 gNB node registration received:`);
    console.log(`   IP: ${ip}`);
    console.log(`   Name: ${nodeName || 'Unknown'}`);
    console.log(`   Data:`, nodeData);
    
    // Store registered node
    registeredNodes.set(ip, {
      ...nodeData,
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'node-discovered',
      payload: nodeData
    });
    
    res.json({ 
      success: true, 
      message: 'Node registered successfully' 
    });
    
  } catch (error) {
    console.error('Error registering gNB node:', error);
    res.status(500).json({ error: 'Failed to register node' });
  }
});

// gNB Node Heartbeat endpoint
app.post('/api/gnb/heartbeat', (req, res) => {
  try {
    const { ip, timestamp, batteryLevel, status } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }
    
    if (registeredNodes.has(ip)) {
      // Update existing node
      const existingNode = registeredNodes.get(ip);
      const updatedNode = {
        ...existingNode,
        lastSeen: new Date().toISOString(),
        batteryLevel: batteryLevel || existingNode.batteryLevel,
        status: status || existingNode.status
      };
      
      registeredNodes.set(ip, updatedNode);
      
      // Broadcast heartbeat to WebSocket clients
      broadcastToClients({
        type: 'node-heartbeat',
        payload: { ip, timestamp, batteryLevel, status }
      });
      
      console.log(`💓 Heartbeat from ${ip} - Battery: ${batteryLevel || 'unknown'}`);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

// Get current status
app.get('/api/mdns/status', (req, res) => {
  res.json({
    publisherActive,
    activeServices: Array.from(activeServices.keys()),
    registeredNodesCount: registeredNodes.size,
    registeredNodes: Array.from(registeredNodes.values())
  });
});

// Get all registered nodes
app.get('/api/gnb/nodes', (req, res) => {
  res.json({
    nodes: Array.from(registeredNodes.values()),
    count: registeredNodes.size
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'gNB mDNS Service',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mDNS service...');
  
  // Stop all mDNS services
  activeServices.forEach((service, key) => {
    service.stop();
    console.log(`   Stopped service: ${key}`);
  });
  
  // Close WebSocket server
  wss.close(() => {
    console.log('   WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('   HTTP server closed');
    console.log('✅ mDNS service shutdown complete');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log('🚀 gNB mDNS Service started');
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log('   Ready to publish mDNS services for gNB discovery');
  console.log('');
  console.log('Available endpoints:');
  console.log('   POST /api/mdns/start-publisher - Start mDNS publisher');
  console.log('   POST /api/mdns/stop-publisher  - Stop mDNS publisher');
  console.log('   POST /api/mdns/trigger-scan    - Trigger manual scan');
  console.log('   POST /api/gnb/register         - gNB node registration');
  console.log('   POST /api/gnb/heartbeat        - gNB node heartbeat');
  console.log('   GET  /api/mdns/status          - Get service status');
  console.log('   GET  /api/gnb/nodes            - Get registered nodes');
  console.log('   GET  /health                   - Health check');
});