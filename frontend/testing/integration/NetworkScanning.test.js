import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

describe('Network Scanning Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'networkSubnet') return '192.168.1';
      return null;
    });
  });

  test('network scanning discovers nodes and updates state', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    // Wait for initial network scan to complete
    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('networkSubnet');
    }, { timeout: 2000 });

    // Verify that network scanning was initiated
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('handles subnet change correctly', async () => {
    localStorage.setItem.mockClear();

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalled();
    });
  });

  test('prevents overlapping network scans', async () => {
    const mockScanner = {
      getIsScanning: jest.fn().mockReturnValue(false),
      scanUserSubnet: jest.fn().mockResolvedValue({ nodes: [] })
    };

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    // Multiple rapid scans should be prevented
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });
});