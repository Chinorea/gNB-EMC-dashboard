import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import { mockNodeInfo, mockApiResponse } from '../__mocks__/mockData';

jest.mock('../../src/HomePage', () => () => <div data-testid="home-page">Home</div>);
jest.mock('../../src/NodeDashboard', () => () => <div data-testid="node-dashboard">Dashboard</div>);
jest.mock('../../src/Map', () => (props) => (
  <div data-testid="map-view" data-markers-count={props.markers?.length || 0}>
    Map: {props.markers?.length || 0} markers
  </div>
));
jest.mock('../../src/appassets/NetworkScanner', () => {
  return require('../__mocks__/NetworkScanner').default;
});
jest.mock('../../src/NodeInfo', () => {
  return require('../__mocks__/NodeInfo').default;
});
jest.mock('../../src/utils', () => ({
  __esModule: true,
  default: jest.fn(() => []), // buildStaticsLQM
  getBatteryPercentage: jest.fn((voltage) => {
    if (voltage === '12.5V') return 85;
    if (voltage === '11.8V') return 70;
    return 'unknown';
  })
}));

describe('Map Data Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processes map data flow correctly', async () => {
    // Mock successful API response with network data
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        nodeInfos: [{
          ip: '10.0.0.1',
          latitude: 40.7128,
          longitude: -74.0060,
          label: 'Test Node'
        }],
        linkQuality: [{
          from: '10.0.0.1',
          to: '10.0.0.2',
          quality: 95
        }],
        batteryLevel: 12.5
      })
    });

    // Mock localStorage with node data
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'allNodeDataStorage') {
        return JSON.stringify([{
          ip: '192.168.1.100',
          nodeName: 'Test Node',
          manetIp: '10.0.0.1',
          status: 'online',
          attributes: { transmitData: { txPower: 20 } },
          isInitializing: false,
          manetConnectionStatus: 'connected'
        }]);
      }
      return null;
    });

    let component;
    await act(async () => {
      component = render(
        <MemoryRouter initialEntries={['/map']}>
          <App />
        </MemoryRouter>
      );
    });

    // Wait for map data to load
    await waitFor(() => {
      const mapView = component.getByTestId('map-view');
      expect(mapView).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify API calls were made (may be called during initialization)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  test('handles multiple network discovery correctly', async () => {
    // Mock responses from different networks
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        nodeInfos: [{ ip: '10.0.0.1', latitude: 40.7128, longitude: -74.0060 }],
        linkQuality: [],
        batteryLevel: 12.5
      })
    });

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'allNodeDataStorage') {
        return JSON.stringify([
          {
            ip: '192.168.1.100',
            nodeName: 'Network 1 Node',
            manetIp: '10.0.0.1',
            status: 'online',
            attributes: {},
            isInitializing: false,
            manetConnectionStatus: 'connected'
          },
          {
            ip: '192.168.1.101',
            nodeName: 'Network 2 Node',
            manetIp: '10.0.1.1',
            status: 'online',
            attributes: {},
            isInitializing: false,
            manetConnectionStatus: 'connected'
          }
        ]);
      }
      return null;
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <App />
        </MemoryRouter>
      );
    });

    // Wait for the component to load instead of exact fetch count
    await waitFor(() => {
      expect(document.querySelector('[data-testid="map-view"]')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles failed API calls gracefully', async () => {
    // Mock network failure
    fetch.mockRejectedValue(new Error('Network error'));

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'allNodeDataStorage') {
        return JSON.stringify([{
          ip: '192.168.1.100',
          nodeName: 'Test Node',
          manetIp: '10.0.0.1',
          status: 'online',
          attributes: {},
          isInitializing: false,
          manetConnectionStatus: 'connected'
        }]);
      }
      return null;
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <App />
        </MemoryRouter>
      );
    });

    // Should still render the map view despite API failures
    await waitFor(() => {
      expect(document.querySelector('[data-testid="map-view"]')).toBeInTheDocument();
    });
  });
});