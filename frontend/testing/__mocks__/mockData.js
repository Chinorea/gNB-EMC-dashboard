export const mockNodeInfo = {
  ip: '192.168.1.100',
  nodeName: 'Test Node',
  status: 'online',
  manet: {
    ip: '10.0.0.1',
    connectionStatus: 'connected',
    selfManetInfo: {
      latitude: 40.7128,
      longitude: -74.0060,
      batteryLevel: '12.5V',
      batteryPercentage: 85,
      label: 'Test Node'
    }
  },
  attributes: {
    transmitData: {
      txPower: 20
    }
  }
};

export const mockMapMarkers = [
  {
    latitude: 40.7128,
    longitude: -74.0060,
    label: 'Test Node 1',
    nodeStatus: 'online',
    txPower: 20,
    batteryLevel: '12.5V',
    batteryPercentage: 85
  },
  {
    latitude: 40.7589,
    longitude: -73.9851,
    label: 'Test Node 2', 
    nodeStatus: 'offline',
    txPower: 15,
    batteryLevel: '11.8V',
    batteryPercentage: 70
  }
];

export const mockLQMData = [
  {
    from: '10.0.0.1',
    to: '10.0.0.2',
    quality: 95,
    linkType: 'direct'
  },
  {
    from: '10.0.0.2',
    to: '10.0.0.3',
    quality: 78,
    linkType: 'mesh'
  }
];

export const mockNetworkScanResults = [
  {
    ip: '192.168.1.101',
    hostname: 'node-101',
    responseTime: 50,
    status: 'online'
  },
  {
    ip: '192.168.1.102',
    hostname: 'node-102',
    responseTime: 75,
    status: 'online'
  }
];

export const mockApiResponse = {
  nodeInfos: [
    {
      ip: '10.0.0.1',
      latitude: 40.7128,
      longitude: -74.0060,
      label: 'Test Node'
    }
  ],
  linkQuality: mockLQMData,
  batteryLevel: 12.5
};