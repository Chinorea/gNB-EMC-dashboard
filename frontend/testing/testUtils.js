// ========================================
// TESTING UTILITIES AND HELPERS
// ========================================

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// ========================================
// COMMON TEST THEME
// ========================================

export const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { paper: '#ffffff', default: '#fafafa' },
    text: { primary: '#000000', secondary: '#666666' }
  }
});

// ========================================
// RENDER HELPERS
// ========================================

/**
 * Renders component with Router and Theme providers
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @param {Array} options.initialEntries - Router initial entries
 * @param {Object} options.theme - Custom theme (optional)
 * @returns {Object} - Testing library render result
 */
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], theme = testTheme, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Renders component with Router only (no theme)
 * @param {React.Component} ui - Component to render
 * @param {Array} initialEntries - Router initial entries
 * @returns {Object} - Testing library render result
 */
export const renderWithRouter = (ui, initialEntries = ['/']) => {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper });
};

// ========================================
// MOCK DATA GENERATORS
// ========================================

/**
 * Creates mock node data for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock node data
 */
export const createMockNode = (overrides = {}) => ({
  ip: '192.168.1.100',
  nodeName: 'Test Node',
  manetIp: '10.0.0.1',
  status: 'online',
  attributes: {
    transmitData: { txPower: 20 },
    receiveData: { rxPower: -50 },
    platformData: { temperature: 25 }
  },
  isInitializing: false,
  manetConnectionStatus: 'connected',
  latitude: 40.7128,
  longitude: -74.0060,
  ...overrides
});

/**
 * Creates mock API response for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock API response
 */
export const createMockApiResponse = (overrides = {}) => ({
  nodeInfos: [
    {
      ip: '10.0.0.1',
      latitude: 40.7128,
      longitude: -74.0060,
      label: 'Test Node'
    }
  ],
  linkQuality: [
    {
      from: '10.0.0.1',
      to: '10.0.0.2',
      quality: 95
    }
  ],
  batteryLevel: 12.5,
  ...overrides
});

// ========================================
// MOCK SETUP HELPERS
// ========================================

/**
 * Sets up localStorage mock with test data
 * @param {Object} data - Data to store in localStorage
 */
export const setupLocalStorageMock = (data = {}) => {
  const defaultData = {
    allNodeDataStorage: JSON.stringify([createMockNode()]),
    networkSubnet: '192.168.1',
    ...data
  };

  localStorage.getItem.mockImplementation((key) => {
    return defaultData[key] || null;
  });
};

/**
 * Sets up fetch mock with successful response
 * @param {Object} responseData - Data to return from fetch
 */
export const setupFetchMock = (responseData = null) => {
  const mockResponse = responseData || createMockApiResponse();
  
  fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockResponse)
  });
};

/**
 * Sets up fetch mock with error response
 * @param {string} errorMessage - Error message
 */
export const setupFetchErrorMock = (errorMessage = 'Network error') => {
  fetch.mockRejectedValue(new Error(errorMessage));
};

// ========================================
// ASSERTION HELPERS
// ========================================

/**
 * Waits for component to be in the document
 * @param {Function} getByTestId - Testing library getByTestId function
 * @param {string} testId - Test ID to wait for
 * @param {number} timeout - Timeout in milliseconds
 */
export const waitForComponent = async (getByTestId, testId, timeout = 3000) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    expect(getByTestId(testId)).toBeInTheDocument();
  }, { timeout });
};

/**
 * Asserts that localStorage was called with expected data
 * @param {string} key - localStorage key
 * @param {any} expectedValue - Expected value (will be stringified if object)
 */
export const expectLocalStorageCall = (key, expectedValue) => {
  const expectedStringValue = typeof expectedValue === 'object' 
    ? JSON.stringify(expectedValue)
    : expectedValue;
    
  expect(localStorage.setItem).toHaveBeenCalledWith(key, expectedStringValue);
};

// ========================================
// VOLTAGE TESTING HELPERS
// ========================================

/**
 * Voltage test cases based on your calibrated ranges
 */
export const voltageTestCases = [
  { voltage: '7.0V', expectedPercentage: 0, description: 'Empty battery' },
  { voltage: '7.5V', expectedPercentage: 20, description: 'Low battery' },
  { voltage: '8.0V', expectedPercentage: 50, description: 'Medium battery' },
  { voltage: '8.3V', expectedPercentage: 80, description: 'High battery' },
  { voltage: '8.6V', expectedPercentage: 100, description: 'Full battery' },
  { voltage: '6.5V', expectedPercentage: 'unknown', description: 'Below range' },
  { voltage: '9.0V', expectedPercentage: 'unknown', description: 'Above range' }
];

/**
 * Tests voltage conversion function with calibrated ranges
 * @param {Function} voltageFunction - Function to test
 */
export const testVoltageRanges = (voltageFunction) => {
  voltageTestCases.forEach(({ voltage, expectedPercentage, description }) => {
    test(`correctly converts ${voltage} (${description})`, () => {
      expect(voltageFunction(voltage)).toBe(expectedPercentage);
    });
  });
};