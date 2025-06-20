const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const mdns = require('multicast-dns')();
const http = require('http');
const os = require('os');

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
let mdnsService = null;

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

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

// Start mDNS Publisher
app.post('/api/mdns/start-publisher', (req, res) => {
  try {
    const { serviceName, serviceType, port, txtRecord } = req.body;
    
    if (publisherActive) {
      console.log('⚠️  Publisher start request ignored - already running');
      return res.status(400).json({ error: 'Publisher already running' });
    }
    
    console.log('=== mDNS Publisher Debug Info (Windows Compatible) ===');
    console.log('📥 Received publisher start request');
    console.log('Service Name:', serviceName);
    console.log('Service Type:', serviceType);
    console.log('Port:', port);
    console.log('TXT Record:', txtRecord);
    console.log('Full service identifier:', `${serviceName}.${serviceType}.local.`);
    console.log('Network interfaces available:');
    
    // Get network interfaces for debugging
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`  - ${name}: ${iface.address}`);
        }
      });
    });
    console.log('Local IP for mDNS:', getLocalIP());
    console.log('==================================================');
    
    console.log('🚀 Starting multicast-dns service publication...');
    
    // Create mDNS service record
    const serviceRecord = {
      name: `${serviceName}.${serviceType}.local`,
      type: 'SRV',
      class: 'IN',
      ttl: 120,
      data: {
        port: port,
        target: `${os.hostname()}.local`
      }
    };
    
    const txtRecordData = {
      name: `${serviceName}.${serviceType}.local`,
      type: 'TXT',
      class: 'IN',
      ttl: 120,
      data: Object.entries(txtRecord || {}).map(([key, value]) => `${key}=${value}`)
    };
    
    const aRecord = {
      name: `${os.hostname()}.local`,
      type: 'A',
      class: 'IN',
      ttl: 120,
      data: getLocalIP()
    };
    
    // Store service info
    const serviceInfo = {
      serviceName,
      serviceType,
      port,
      txtRecord,
      records: [serviceRecord, txtRecordData, aRecord]
    };
    
    // Handle mDNS queries
    mdns.on('query', (query) => {
      const responses = [];
      
      // Check if query is for our service
      query.questions.forEach(question => {
        if (question.name === `${serviceName}.${serviceType}.local` || 
            question.name === serviceType + '.local' ||
            question.type === 'PTR' && question.name === serviceType + '.local') {
          
          console.log(`📡 mDNS Query received for: ${question.name} (type: ${question.type})`);
          
          if (question.type === 'PTR') {
            // PTR query - respond with service name
            responses.push({
              name: serviceType + '.local',
              type: 'PTR',
              class: 'IN',
              ttl: 120,
              data: `${serviceName}.${serviceType}.local`
            });
          }
          
          // Always include SRV, TXT, and A records
          responses.push(...serviceInfo.records);
        }
      });
      
      if (responses.length > 0) {
        console.log(`📤 Sending mDNS response with ${responses.length} records`);
        mdns.respond(responses);
      }
    });
    
    // Announce the service
    const announceRecords = [
      // PTR record for service type
      {
        name: serviceType + '.local',
        type: 'PTR',
        class: 'IN',
        ttl: 120,
        data: `${serviceName}.${serviceType}.local`
      },
      ...serviceInfo.records
    ];
    
    console.log('📢 Announcing mDNS service...');
    mdns.response(announceRecords);
    
    // Re-announce periodically
    const announceInterval = setInterval(() => {
      if (publisherActive) {
        console.log('🔄 Re-announcing mDNS service...');
        mdns.response(announceRecords);
      } else {
        clearInterval(announceInterval);
      }
    }, 60000); // Every 60 seconds
    
    activeServices.set('dashboard', { 
      ...serviceInfo, 
      announceInterval,
      announceRecords 
    });
    publisherActive = true;
    
    // Broadcast status to WebSocket clients
    broadcastToClients({
      type: 'publisher-started',
      serviceName,
      serviceType,
      port
    });
    
    console.log('✅ mDNS SERVICE PUBLISHED SUCCESSFULLY (Windows Compatible)!');
    console.log(`📡 Service: "${serviceName}"`);
    console.log(`🔗 Type: ${serviceType}`);
    console.log(`🚪 Port: ${port}`);
    console.log(`📍 Full name: ${serviceName}.${serviceType}.local.`);
    console.log(`🖥️  Hostname: ${os.hostname()}.local`);
    console.log(`🌐 IP Address: ${getLocalIP()}`);
    console.log('🧪 Test with: python enhanced_mdns_test.py');
    console.log('==========================================');
    
    console.log('📤 Sending success response to frontend');
    res.json({ 
      success: true, 
      message: 'mDNS publisher started successfully (Windows Compatible)',
      serviceName,
      serviceType,
      port,
      hostname: os.hostname(),
      ipAddress: getLocalIP(),
      expectedDiscoveryName: `${serviceName}.${serviceType}.local.`
    });
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR starting mDNS publisher:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=======================================');
    res.status(500).json({ error: 'Failed to start mDNS publisher' });
  }
});

// Stop mDNS Publisher
app.post('/api/mdns/stop-publisher', (req, res) => {
  try {
    if (!publisherActive) {
      return res.status(400).json({ error: 'Publisher not running' });
    }
    
    console.log('🛑 Stopping mDNS publisher...');
    
    // Stop announcements
    activeServices.forEach((service, key) => {
      if (service.announceInterval) {
        clearInterval(service.announceInterval);
      }
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

// Trigger manual scan
app.post('/api/mdns/trigger-scan', (req, res) => {
  try {
    if (!publisherActive) {
      return res.status(400).json({ error: 'Publisher not running' });
    }
    
    console.log('🔍 Manual scan triggered - re-announcing service...');
    
    // Re-announce our service
    const service = activeServices.get('dashboard');
    if (service && service.announceRecords) {
      mdns.response(service.announceRecords);
      console.log('📢 Service re-announced via mDNS');
    }
    
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
    registeredNodes: Array.from(registeredNodes.values()),
    hostname: os.hostname(),
    ipAddress: getLocalIP()
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
    service: 'gNB mDNS Service (Windows Compatible)',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    ipAddress: getLocalIP()
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
    if (service.announceInterval) {
      clearInterval(service.announceInterval);
    }
    console.log(`   Stopped service: ${key}`);
  });
  
  // Close mDNS
  if (mdns) {
    mdns.destroy();
    console.log('   mDNS service closed');
  }
  
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
  console.log('🚀 gNB mDNS Service started (Windows Compatible)');
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Hostname: ${os.hostname()}.local`);
  console.log(`   IP Address: ${getLocalIP()}`);
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