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
    disconnected: '#e9ecef',
  },  button: {
    turnOff: '#612a1f',
    turnOffHover: '#4d1914',
    turnOn: '#40613d',
    turnOnHover: '#335e2e',
    add: '#1976d2',        // Blue for add button
    addHover: '#1565c0',   // Darker blue for hover
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
    running: '#2e4d35',    // darker green
    initializing: '#4d4326', // darker orange
    off: '#4d2629',        // darker red
    unreachable: '#262626', // dark grey
    disconnected: '#262626',
  },  button: {
    turnOff: '#bf4f4d',
    turnOffHover: '#d32f2f',
    turnOn: '#63a667',
    turnOnHover: '#4caf50',
    add: '#85bae6',        // Light blue for add button in dark mode
    addHover: '#4d8cbf',   // Darker light blue for hover
  },
  background: {
    main: '#141414',
    paper: '#141414',
    sidebar: '#0d0d0d',
    hover: '#212121',
  },
  text: {
    primary: '#e6e6e6',
    secondary: '#b0b0b0',
  },
  border: {
    main: '#333333',
    dark: '#555555',
  },
  dashboard: {
    running: '#141a15',
    initializing: '#1a1705',
    off: '#1a0803',
    unreachable: '#2d2d2d',
    appBarRunning: '#234020',
    appBarInitializing: '#594012',
    appBarOff: '#40150d',
    appBarUnreachable: '#2d2e2e',
  },
  coreConnection: {
    connected: '#234020',
    connectedHover: '#3a5936',
    connectedText: '#dbe6da',
    disconnected: '#40150d',
    disconnectedHover: '#592c24',
    disconnectedText: '#e6d2cf',
    unstable: '#594012',
    unstableHover: '#735b2e',
    unstableText: '#e6ddcf',
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
    connected: '#234020',
    connectedHover: '#3a5936',
    connectedText: '#dbe6da',
    disconnected: '#40150d',
    disconnectedHover: '#592c24',
    disconnectedText: '#e6d2cf',
    pinging: '#594012',
    pingingHover: '#735b2e',
    pingingText: '#e6ddcf',
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
