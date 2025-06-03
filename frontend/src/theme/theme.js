import { createTheme } from '@mui/material/styles';

// Define your custom color palette
const lightColors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
  },
  // Custom colors for your app
  nodeStatus: {
    running: '#d4edda',    // green
    initializing: '#fff3cd', // yellow
    off: '#f8d7da',        // red
    unreachable: '#e9ecef', // light grey
    disconnected: '#f8f9fa',
  },
  button: {
    turnOff: '#612a1f',
    turnOffHover: '#4d1914',
    turnOn: '#40613d',
    turnOnHover: '#335e2e',
  },
  background: {
    main: '#f5f5f5',
    paper: '#ffffff',
    sidebar: '#ffffff',
    hover: '#fafafa',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
  },
  border: {
    main: '#e0e0e0',
    dark: '#000000',
  },
  dashboard: {
    running: '#f3f7f2',
    initializing: '#fcfbf2',
    off: '#faf2f0',
    unreachable: '#f5f5f5',
    appBarRunning: '#40613d',
    appBarInitializing: '#805c19',
    appBarOff: '#612a1f',
    appBarUnreachable: '#2d2e2e',
  },
  coreConnection: {
    connected: '#e9f2eb',
    connectedHover: '#e1ede4',
    connectedText: '#324a38',
    disconnected: '#fae1e3',
    disconnectedHover: '#f8d7da',
    disconnectedText: '#dc3545',
    unstable: '#fff7db',
    unstableHover: '#fff3cd',
    unstableText: '#856404',
  },
  charts: {
    cpu: '#8884d8',
    cpuGradient: '#8884d8',
    ram: '#82ca9d',
    ramGradient: '#82ca9d',
  },
  map: {
    color: '#007bff',
    fillColor: '#30a9de',
  },
  manetConnection: {
    connected: '#e1ede4',
    connectedHover: '#e9f2eb',
    connectedText: '#324a38',
    disconnected: '#f8d7da',
    disconnectedHover: '#fae1e3',
    disconnectedText: '#dc3545',
    pinging: '#fff3cd',
    pingingHover: '#fff7db',
    pingingText: '#856404',
  }
};

const darkColors = {
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
  },
  secondary: {
    main: '#f48fb1',
    light: '#fce4ec',
    dark: '#ad1457',
  },
  // Custom dark mode colors
  nodeStatus: {
    running: '#2e7d32',    // darker green
    initializing: '#f57c00', // darker orange
    off: '#d32f2f',        // darker red
    unreachable: '#424242', // dark grey
    disconnected: '#616161',
  },
  button: {
    turnOff: '#ef5350',
    turnOffHover: '#d32f2f',
    turnOn: '#66bb6a',
    turnOnHover: '#4caf50',
  },
  background: {
    main: '#121212',
    paper: '#1e1e1e',
    sidebar: '#1e1e1e',
    hover: '#2d2d2d',
  },
  text: {
    primary: '#ffffff',
    secondary: '#b0b0b0',
  },
  border: {
    main: '#333333',
    dark: '#555555',
  },
  dashboard: {
    running: '#1b5e20',
    initializing: '#e65100',
    off: '#b71c1c',
    unreachable: '#2d2d2d',
    appBarRunning: '#2e7d32',
    appBarInitializing: '#f57c00',
    appBarOff: '#d32f2f',
    appBarUnreachable: '#424242',
  },
  coreConnection: {
    connected: '#1b5e20',
    connectedHover: '#2e7d32',
    connectedText: '#81c784',
    disconnected: '#b71c1c',
    disconnectedHover: '#d32f2f',
    disconnectedText: '#f48fb1',
    unstable: '#e65100',
    unstableHover: '#f57c00',
    unstableText: '#ffb74d',
  },
  charts: {
    cpu: '#90caf9',
    cpuGradient: '#90caf9',
    ram: '#a5d6a7',
    ramGradient: '#a5d6a7',
  },
  map: {
    color: '#42a5f5',
    fillColor: '#64b5f6',
  },
  manetConnection: {
    connected: '#1b5e20',
    connectedHover: '#2e7d32',
    connectedText: '#81c784',
    disconnected: '#b71c1c',
    disconnectedHover: '#d32f2f',
    disconnectedText: '#f48fb1',
    pinging: '#e65100',
    pingingHover: '#f57c00',
    pingingText: '#ffb74d',
  }
};

export const createAppTheme = (mode) => {
  const colors = mode === 'dark' ? darkColors : lightColors;
  
  return createTheme({
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      background: {
        default: colors.background.main,
        paper: colors.background.paper,
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
      },
      // Add custom colors to the theme
      custom: colors,
    },
    components: {
      // Global component overrides
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.background.main,
            color: colors.text.primary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.background.sidebar,
            borderRight: `1px solid ${colors.border.main}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: colors.background.paper,
            border: `1px solid ${colors.border.main}`,
            borderRadius: 8, // Custom border radius
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.background.paper,
            borderRadius: 8, // Custom border radius
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Custom border radius
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Custom border radius
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Custom border radius
          },
        },
      },
    },
    shape: {
      borderRadius: 8, // Custom border radius
    },
    typography: {
      fontFamily: "'DM Sans', Arial, sans-serif", // Restored DM Sans font
    },
  });
};

// Helper function to get theme colors in components
export const getThemeColors = (theme) => theme.palette.custom;
