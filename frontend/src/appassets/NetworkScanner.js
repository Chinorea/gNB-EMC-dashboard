// Network Scanner Utility
// Scans user-specified subnets for active nodes

class NetworkScanner {
  constructor() {
    this.batchSize = 90; // Increased to 90 IPs per batch
    this.timeout = 2000; // 2 second timeout for health API calls
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

  // Scan a single IP address
  async scanIP(ip) {
    try {
      const response = await this.fetchWithTimeout(`http://${ip}:${this.port}/api/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          return {
            ip,
            online: true,            data: {
              ip,
              status: 'online',
              discoveredAt: new Date().toISOString(),
              responseTime: Date.now()
            }
          };
        }
      }
    } catch (error) {
      // IP is offline or unreachable
    }
    return { ip, online: false };
  }

  // Scan a batch of IPs
  async scanBatch(ips) {
    const promises = ips.map(ip => this.scanIP(ip));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { ip: ips[index], online: false, error: result.reason };
      }
    });
  }
  // Scan a specific subnet - optimized for speed
  async scanSubnet(subnet, onProgress = null, onNodeFound = null) {
    console.log(`� Fast scanning subnet: ${subnet}.x`);
    const allIPs = [];
    
    // Generate all IPs in subnet (1-254)
    for (let i = 1; i <= 254; i++) {
      allIPs.push(`${subnet}.${i}`);
    }    // Scan all IPs with limited concurrency for speed
    const concurrencyLimit = 90; // Scan up to 90 IPs simultaneously
    const results = [];
    
    for (let i = 0; i < allIPs.length; i += concurrencyLimit) {
      const batch = allIPs.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(ip => this.scanIP(ip));
      
      console.log(`📡 Fast scanning batch: ${batch[0]} - ${batch[batch.length - 1]} (${batch.length} IPs)`);
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const ip = batch[index];
        if (result.status === 'fulfilled' && result.value.online) {
          const node = result.value;
          this.discoveredNodes.set(node.ip, node.data);
          results.push(node);
          if (onNodeFound) {
            onNodeFound(node);
          }
        }
      });
      
      // Report progress
      if (onProgress) {
        onProgress({
          subnet,
          scannedIPs: Math.min(i + concurrencyLimit, allIPs.length),
          totalIPs: allIPs.length,
          nodesFound: this.discoveredNodes.size
        });
      }
    }
    
    return results;
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
      console.log(`🔍 Starting scan of subnet: ${subnet}.x`);
      
      const results = await this.scanSubnet(subnet, onProgress, onNodeFound);
      
      console.log(`✅ Subnet scan complete! Found ${this.discoveredNodes.size} nodes`);
      
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
