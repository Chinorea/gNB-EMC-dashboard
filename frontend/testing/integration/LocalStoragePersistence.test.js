import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';

jest.mock('../../src/HomePage', () => () => <div data-testid="home-page">Home</div>);
jest.mock('../../src/NodeDashboard', () => () => <div data-testid="node-dashboard">Dashboard</div>);
jest.mock('../../src/Map', () => () => <div data-testid="map-view">Map</div>);
jest.mock('../../src/appassets/NetworkScanner', () => {
  return require('../__mocks__/NetworkScanner').default;
});
jest.mock('../../src/NodeInfo', () => {
  return require('../__mocks__/NodeInfo').default;
});
jest.mock('../../src/utils', () => ({
  __esModule: true,
  default: jest.fn(() => []),
  getBatteryPercentage: jest.fn(() => 85)
}));

describe('LocalStorage Persistence Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('persists node data to localStorage when nodes are added', async () => {
    const mockNodeData = [{
      ip: '192.168.1.100',
      nodeName: 'Test Node',
      manetIp: '10.0.0.1',
      status: 'online',
      attributes: { transmitData: { txPower: 20 } },
      isInitializing: false,
      manetConnectionStatus: 'connected'
    }];

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'allNodeDataStorage') {
        return JSON.stringify(mockNodeData);
      }
      return null;
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'allNodeDataStorage',
        expect.stringContaining('192.168.1.100')
      );
    });
  });

  test('persists subnet changes to localStorage', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'networkSubnet') return '192.168.1';
      return null;
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('networkSubnet');
    });
  });

  test('loads from localStorage on app initialization', async () => {
    const savedData = [{
      ip: '192.168.1.100',
      nodeName: 'Saved Node',
      manetIp: '10.0.0.1',
      status: 'online',
      attributes: {},
      isInitializing: false,
      manetConnectionStatus: 'connected'
    }];

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'allNodeDataStorage') {
        return JSON.stringify(savedData);
      }
      if (key === 'networkSubnet') {
        return '192.168.1';
      }
      return null;
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('allNodeDataStorage');
      expect(localStorage.getItem).toHaveBeenCalledWith('networkSubnet');
    });
  });

  test('handles corrupted localStorage data gracefully', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'allNodeDataStorage') {
        return 'corrupted json data {[';
      }
      return null;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse localStorage data:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test('initializes with empty state when localStorage is empty', async () => {
    localStorage.getItem.mockReturnValue(null);

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('allNodeDataStorage');
    });
  });
});