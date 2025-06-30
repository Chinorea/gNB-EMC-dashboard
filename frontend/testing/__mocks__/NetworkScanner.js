export default class NetworkScanner {
  constructor() {
    this.isScanning = false;
  }

  getIsScanning() {
    return this.isScanning;
  }

  async scanUserSubnet(subnet, progressCallback, nodeFoundCallback, completeCallback) {
    this.isScanning = true;
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockResults = {
      nodes: [
        { ip: `${subnet}.101`, hostname: 'test-node-1', status: 'online' },
        { ip: `${subnet}.102`, hostname: 'test-node-2', status: 'online' }
      ]
    };

    // Simulate finding nodes
    mockResults.nodes.forEach(node => {
      if (nodeFoundCallback) nodeFoundCallback({ data: node });
    });

    // Simulate completion
    if (completeCallback) completeCallback(mockResults);
    
    this.isScanning = false;
    return mockResults;
  }
}