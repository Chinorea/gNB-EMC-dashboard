import NodeInfo from '../__mocks__/NodeInfo';

describe('NodeInfo Mock', () => {
  let nodeInfo;
  const mockSetAllNodeData = jest.fn();
  const mockSetRebootAlertNodeIp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    nodeInfo = new NodeInfo('192.168.1.100', mockSetAllNodeData, mockSetRebootAlertNodeIp);
  });

  test('initializes with correct default values', () => {
    expect(nodeInfo.ip).toBe('192.168.1.100');
    expect(nodeInfo.nodeName).toBe('Node-192.168.1.100');
    expect(nodeInfo.status).toBe('offline');
    expect(nodeInfo.manet.ip).toBeNull();
    expect(nodeInfo.manet.connectionStatus).toBe('disconnected');
    expect(nodeInfo.isToggleInProgress).toBe(false);
    expect(nodeInfo.attributes).toEqual({});
  });

  test('refreshAttributesFromServer updates attributes', async () => {
    await nodeInfo.refreshAttributesFromServer();

    expect(nodeInfo.attributes).toEqual({
      transmitData: { txPower: 20 },
      batteryLevel: '12.5V'
    });
  });

  test('refreshStatusFromServer updates status', async () => {
    expect(nodeInfo.status).toBe('offline');
    
    await nodeInfo.refreshStatusFromServer();
    
    expect(nodeInfo.status).toBe('online');
  });

  test('checkManetConnection updates connection status', async () => {
    expect(nodeInfo.manet.connectionStatus).toBe('disconnected');
    
    await nodeInfo.checkManetConnection();
    
    expect(nodeInfo.manet.connectionStatus).toBe('connected');
  });

  test('status getter returns current status', () => {
    nodeInfo._currentStatus = 'online';
    expect(nodeInfo.status).toBe('online');
    
    nodeInfo._currentStatus = 'offline';
    expect(nodeInfo.status).toBe('offline');
  });

  test('isToggleInProgress getter returns isInitializing', () => {
    nodeInfo.isInitializing = true;
    expect(nodeInfo.isToggleInProgress).toBe(true);
    
    nodeInfo.isInitializing = false;
    expect(nodeInfo.isToggleInProgress).toBe(false);
  });

  test('stores callback functions correctly', () => {
    expect(nodeInfo.setAllNodeData).toBe(mockSetAllNodeData);
    expect(nodeInfo.setRebootAlertNodeIp).toBe(mockSetRebootAlertNodeIp);
  });
});