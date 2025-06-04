import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

export const ThemeContextProvider = ({ children }) => {
  // Load theme preference from localStorage, default to 'light'
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode : 'light';
  });

  const theme = createAppTheme(mode);  // Save theme preference to localStorage and set data-theme attribute
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // Set data-theme attribute on document element for CSS selectors
    document.documentElement.setAttribute('data-theme', mode);
    
    // Also set CSS custom properties for tooltip styling - SWAPPED for contrast
    const root = document.documentElement;
    if (mode === 'dark') {
      // Light tooltips in dark mode for contrast
      root.style.setProperty('--tooltip-bg-color', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--tooltip-text-color', '#333');
      root.style.setProperty('--tooltip-border-color', '#ccc');
      root.style.setProperty('--tooltip-shadow', '0 2px 4px rgba(0,0,0,0.2)');
    } else {
      // Dark tooltips in light mode for contrast
      root.style.setProperty('--tooltip-bg-color', 'rgba(33, 33, 33, 0.95)');
      root.style.setProperty('--tooltip-text-color', '#e6e6e6');
      root.style.setProperty('--tooltip-border-color', '#555');
      root.style.setProperty('--tooltip-shadow', '0 2px 4px rgba(255,255,255,0.1)');
    }
    
    console.log('Theme mode set to:', mode, 'data-theme attribute:', document.documentElement.getAttribute('data-theme'));
  }, [mode]);  // Set initial data-theme attribute on mount
  useEffect(() => {
    // Set data-theme attribute on document element for CSS selectors
    document.documentElement.setAttribute('data-theme', mode);
    
    // Also set CSS custom properties for tooltip styling - SWAPPED for contrast
    const root = document.documentElement;
    if (mode === 'dark') {
      // Light tooltips in dark mode for contrast
      root.style.setProperty('--tooltip-bg-color', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--tooltip-text-color', '#333');
      root.style.setProperty('--tooltip-border-color', '#ccc');
      root.style.setProperty('--tooltip-shadow', '0 2px 4px rgba(0,0,0,0.2)');
    } else {
      // Dark tooltips in light mode for contrast
      root.style.setProperty('--tooltip-bg-color', 'rgba(33, 33, 33, 0.95)');
      root.style.setProperty('--tooltip-text-color', '#e6e6e6');
      root.style.setProperty('--tooltip-border-color', '#555');
      root.style.setProperty('--tooltip-shadow', '0 2px 4px rgba(255,255,255,0.1)');
    }
  }, []);

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = {
    mode,
    theme,
    toggleMode,
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
