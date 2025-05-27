import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import 'leaflet/dist/leaflet.css';

const theme = createTheme({
  typography: {
    fontFamily: "'DM Sans', Arial, sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiInputBase: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
