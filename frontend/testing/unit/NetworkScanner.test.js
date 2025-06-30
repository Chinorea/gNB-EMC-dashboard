import NetworkScanner from '../__mocks__/NetworkScanner';

describe('NetworkScanner Mock', () => {
  let scanner;

  beforeEach(() => {
    scanner = new NetworkScanner();
  });

  test('initializes with correct default state', () => {
    expect(scanner.getIsScanning()).toBe(false);
  });

  test('scanUserSubnet returns mock results', async () => {
    const mockProgressCallback = jest.fn();
    const mockNodeFoundCallback = jest.fn();
    const mockCompleteCallback = jest.fn();

    const result = await scanner.scanUserSubnet(
      '192.168.1',
      mockProgressCallback,
      mockNodeFoundCallback,
      mockCompleteCallback
    );

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].ip).toBe('192.168.1.101');
    expect(result.nodes[1].ip).toBe('192.168.1.102');
    expect(mockNodeFoundCallback).toHaveBeenCalledTimes(2);
    expect(mockCompleteCallback).toHaveBeenCalledWith(result);
  });

  test('scanUserSubnet sets scanning state correctly', async () => {
    const promise = scanner.scanUserSubnet('192.168.1');
    
    // Should be scanning during the process
    expect(scanner.getIsScanning()).toBe(true);
    
    await promise;
    
    // Should not be scanning after completion
    expect(scanner.getIsScanning()).toBe(false);
  });
});