import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../../src/App';
import { mockNodeInfo, mockMapMarkers, mockApiResponse } from '../__mocks__/mockData';

// Mock MUI theme system
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      mode: 'light',
      action: {
        active: 'rgba(0, 0, 0, 0.54)',
        hover: 'rgba(0, 0, 0, 0.04)',
        selected: 'rgba(0, 0, 0, 0.08)',
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: 'rgba(0, 0, 0, 0.12)',
      }
    },
    breakpoints: {
      up: () => '@media (min-width:0px)',
      down: () => '@media (max-width:0px)',
    }
  })
}));

// Mock theme utilities
jest.mock('../../src/theme', () => ({
  getThemeColors: () => ({
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e',
      light: '#f06292',
      dark: '#c2185b'
    },
    background: {
      paper: '#ffffff',
      default: '#fafafa'
    },
    text: {
      primary: '#000000',
      secondary: '#666666'
    },
    border: {
      main: '#e0e0e0',
      light: '#f5f5f5',
      dark: '#bdbdbd'
    },
    button: {
      add: '#4caf50',
      addHover: '#45a049',
      delete: '#f44336',
      deleteHover: '#d32f2f'
    }
  }),
  lightColors: { 
    primary: { main: '#1976d2' },
    button: { add: '#4caf50', addHover: '#45a049' }
  },
  darkColors: { 
    primary: { main: '#90caf9' },
    button: { add: '#66bb6a', addHover: '#57a05a' }
  }
}));

// Mock the heavy components to focus on App logic
jest.mock('../../src/HomePage', () => {
  return function MockHomePage(props) {
    return (
      <div data-testid="home-page">
        Home Page - Nodes: {props.allNodeData?.length || 0}
      </div>
    );
  };
});

jest.mock('../../src/NodeDashboard', () => {
  return function MockNodeDashboard(props) {
    return (
      <div data-testid="node-dashboard">
        Node Dashboard - Nodes: {props.allNodeData?.length || 0}
      </div>
    );
  };
});

jest.mock('../../src/Map', () => {
  return function MockMapView(props) {
    return (
      <div data-testid="map-view" data-markers-count={props.markers?.length || 0}>
        Map View - Markers: {props.markers?.length || 0}
      </div>
    );
  };
});

// Mock the classes
jest.mock('../../src/appassets/NetworkScanner', () => {
  return require('../__mocks__/NetworkScanner').default;
});

jest.mock('../../src/NodeInfo', () => {
  return require('../__mocks__/NodeInfo').default;
});

// Mock utils
jest.mock('../../src/utils', () => ({
  __esModule: true,
  default: jest.fn(() => []), // buildStaticsLQM
  getBatteryPercentage: jest.fn((voltage) => {
    if (voltage === '12.5V') return 85;
    if (voltage === '11.8V') return 70;
    return 'unknown';
  })
}));

// Mock the Sidebar component to avoid complex theme dependencies
jest.mock('../../src/appassets/SideBar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock localStorage with some initial data
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
      if (key === 'networkSubnet') {
        return '192.168.2';
      }
      return null;
    });

    // Mock successful API responses
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });
  });

  test('renders without crashing', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('loads saved node data from localStorage on mount', async () => {
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

    // Should show one node loaded from localStorage
    expect(screen.getByText(/Home Page - Nodes: 1/)).toBeInTheDocument();
  });

  test('renders map view when navigating to /map', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <App />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  test('renders node dashboard when navigating to /node/:ip', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/node/192.168.1.100']}>
          <App />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('node-dashboard')).toBeInTheDocument();
  });

  test('handles API failures gracefully', async () => {
    fetch.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  test('persists data to localStorage when node data changes', async () => {
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

  test('handles empty localStorage gracefully', async () => {
    localStorage.getItem.mockReturnValue(null);

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Home Page - Nodes: 0/)).toBeInTheDocument();
  });

  test('handles corrupted localStorage data', async () => {
    localStorage.getItem.mockReturnValue('invalid json');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse localStorage data:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});