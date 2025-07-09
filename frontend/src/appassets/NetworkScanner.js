// Network Scanner Utility
// Scans user-specified subnets for active nodes with dual-sweep approach

class NetworkScanner {
  constructor() {
    this.batchSize = 65; // Scan 65 IPs per batch
    this.timeout = 2000; // 2 second timeout for individual API calls
    this.port = 5000;
    this.discoveredNodes = new Map();
    this.isScanning = false;
  }

  // Create a fetch request with timeout
  async fetchWithTimeout(url, timeout = this.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Scan a single IP address for a specific API type
  async scanIP(ip, apiType = 'health') {
    if (apiType === 'health') {
      return await this.checkHealthAPI(ip);
    } else if (apiType === 'manet') {
      return await this.checkManetAPI(ip);
    }
    return { ip, online: false };
  }

  // Check health API endpoint
  async checkHealthAPI(ip) {
    try {
      const response = await this.fetchWithTimeout(`http://${ip}:${this.port}/api/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          return {
            ip,
            online: true,
            data: {
              ip,
              status: 'online',
              type: 'health',
              discoveredAt: new Date().toISOString(),
              responseTime: Date.now()
            }
          };
        }
      }
    } catch (error) {
      // Health API is offline or unreachable
    }
    return { ip, online: false };
  }

  // Check MANET API endpoint
  async checkManetAPI(ip) {
    try {
      const response = await this.fetchWithTimeout(`http://${ip}/status?content=temp`);
      if (response.ok) {
        // Any response (even empty) means MANET is active
        return {
          ip,
          online: true,
          data: {
            ip,
            status: 'manet',
            type: 'manet',
            discoveredAt: new Date().toISOString(),
            responseTime: Date.now()
          }
        };
      }
    } catch (error) {
      // MANET API is offline or unreachable
    }
    return { ip, online: false };
  }

  // Scan a batch of IPs for a specific API type
  async scanBatch(ips, apiType = 'health') {
    const promises = ips.map(ip => this.scanIP(ip, apiType));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { ip: ips[index], online: false, error: result.reason };
      }
    });
  }

  // Scan a specific subnet with two separate sweeps
  async scanSubnet(subnet, onProgress = null, onNodeFound = null) {
    const allIPs = [];
    
    // Generate all IPs in subnet (1-254)
    for (let i = 1; i <= 254; i++) {
      allIPs.push(`${subnet}.${i}`);
    }

    // SWEEP 1: Health API scan
    await this.performSweep(allIPs, 'health', onProgress, onNodeFound, subnet);

    // SWEEP 2: MANET API scan
    await this.performSweep(allIPs, 'manet', onProgress, onNodeFound, subnet);

    const results = Array.from(this.discoveredNodes.values()).map(nodeData => ({
      ip: nodeData.ip,
      online: true,
      data: nodeData
    }));

    return results;
  }

  // Perform a single sweep for a specific API type
  async performSweep(allIPs, apiType, onProgress, onNodeFound, subnet) {
    const concurrencyLimit = 65;
    
    for (let i = 0; i < allIPs.length; i += concurrencyLimit) {
      const batch = allIPs.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(ip => this.scanIP(ip, apiType));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const ip = batch[index];
        if (result.status === 'fulfilled' && result.value.online) {
          const node = result.value;
          // Only add if not already discovered (health API has priority)
          if (!this.discoveredNodes.has(node.ip)) {
            this.discoveredNodes.set(node.ip, node.data);
            if (onNodeFound) {
              onNodeFound(node);
            }
          }
        }
      });
      
      // Report progress
      if (onProgress) {
        onProgress({
          subnet,
          scannedIPs: Math.min(i + concurrencyLimit, allIPs.length),
          totalIPs: allIPs.length,
          nodesFound: this.discoveredNodes.size,
          currentSweep: apiType
        });
      }
    }
  }

  // Scan user-specified subnet
  async scanUserSubnet(subnet, onProgress = null, onNodeFound = null, onComplete = null) {
    if (this.isScanning) {
      // Silently return if scanner is already running - this is expected behavior
      return;
    }
    
    this.isScanning = true;
    this.discoveredNodes.clear();
    
    try {
      const results = await this.scanSubnet(subnet, onProgress, onNodeFound);
      
      if (onComplete) {
        onComplete({
          totalNodesFound: this.discoveredNodes.size,
          subnetsScanned: 1,
          nodes: Array.from(this.discoveredNodes.values())
        });
      }
      
      return Array.from(this.discoveredNodes.values());
      
    } catch (error) {
      console.error('❌ Subnet scan error:', error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  // Get all discovered nodes
  getDiscoveredNodes() {
    return Array.from(this.discoveredNodes.values());
  }

  // Clear discovered nodes
  clearNodes() {
    this.discoveredNodes.clear();
  }

  // Check if currently scanning
  getIsScanning() {
    return this.isScanning;
  }
}

export default NetworkScanner;
