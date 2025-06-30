// ========================================
// CENTRALIZED MOCK CONFIGURATIONS
// ========================================

// ========================================
// THEME MOCKS
// ========================================

export const mockMuiTheme = () => {
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
};

export const mockThemeUtils = () => {
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
};

// ========================================
// COMPONENT MOCKS
// ========================================

export const mockReactRouterDom = () => {
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props} data-testid="link">
        {children}
      </a>
    ),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
  }));
};

export const mockHomePage = () => {
  jest.mock('../../src/HomePage', () => {
    return function MockHomePage(props) {
      return (
        <div data-testid="home-page">
          Home Page - Nodes: {props.allNodeData?.length || 0}
        </div>
      );
    };
  });
};

export const mockNodeDashboard = () => {
  jest.mock('../../src/NodeDashboard', () => {
    return function MockNodeDashboard(props) {
      return (
        <div data-testid="node-dashboard">
          Node Dashboard - Nodes: {props.allNodeData?.length || 0}
        </div>
      );
    };
  });
};

export const mockMapView = () => {
  jest.mock('../../src/Map', () => {
    return function MockMapView(props) {
      return (
        <div data-testid="map-view" data-markers-count={props.markers?.length || 0}>
          Map View - Markers: {props.markers?.length || 0}
        </div>
      );
    };
  });
};

export const mockSidebar = () => {
  jest.mock('../../src/appassets/SideBar', () => {
    return function MockSidebar() {
      return <div data-testid="sidebar">Sidebar</div>;
    };
  });
};

// ========================================
// CLASS MOCKS
// ========================================

export const mockNetworkScanner = () => {
  jest.mock('../../src/appassets/NetworkScanner', () => {
    return require('../__mocks__/NetworkScanner').default;
  });
};

export const mockNodeInfo = () => {
  jest.mock('../../src/NodeInfo', () => {
    return require('../__mocks__/NodeInfo').default;
  });
};

// ========================================
// UTILITY MOCKS
// ========================================

export const mockUtils = () => {
  jest.mock('../../src/utils', () => ({
    __esModule: true,
    default: jest.fn(() => []), // buildStaticsLQM
    getBatteryPercentage: jest.fn((voltage) => {
      // Your calibrated voltage ranges (7.0V - 8.6V)
      const voltageNum = parseFloat(voltage.replace('V', ''));
      if (voltageNum < 7.0 || voltageNum > 8.6) return 'unknown';
      if (voltageNum <= 7.0) return 0;
      if (voltageNum <= 7.5) return 20;
      if (voltageNum <= 8.0) return 50;
      if (voltageNum <= 8.3) return 80;
      return 100;
    })
  }));
};

// ========================================
// LEAFLET MOCKS
// ========================================

export const mockLeaflet = () => {
  jest.mock('leaflet', () => ({
    map: jest.fn(() => ({
      setView: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      remove: jest.fn(),
    })),
    tileLayer: jest.fn(() => ({
      addTo: jest.fn(),
    })),
    marker: jest.fn(() => ({
      addTo: jest.fn(),
      bindPopup: jest.fn(),
    })),
    icon: jest.fn(() => ({})),
  }));
};

// ========================================
// PRESET MOCK COMBINATIONS
// ========================================

/**
 * Sets up all common mocks for unit tests
 */
export const setupUnitTestMocks = () => {
  mockMuiTheme();
  mockThemeUtils();
  mockReactRouterDom();
  mockUtils();
};

/**
 * Sets up all mocks for App component testing
 */
export const setupAppTestMocks = () => {
  mockMuiTheme();
  mockThemeUtils();
  mockHomePage();
  mockNodeDashboard();
  mockMapView();
  mockSidebar();
  mockNetworkScanner();
  mockNodeInfo();
  mockUtils();
};

/**
 * Sets up all mocks for integration tests
 */
export const setupIntegrationTestMocks = () => {
  mockHomePage();
  mockNodeDashboard();
  mockMapView();
  mockNetworkScanner();
  mockNodeInfo();
  mockUtils();
};