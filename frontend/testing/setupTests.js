import '@testing-library/jest-dom';

// ========================================
// GLOBAL TEST ENVIRONMENT SETUP
// ========================================

// Mock fetch globally for all tests
global.fetch = jest.fn();

// ========================================
// LOCALSTORAGE & SESSIONSTORAGE MOCKS
// ========================================

// Create proper Jest mock functions for localStorage
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockClear = jest.fn();

// Mock localStorage with proper Jest mock functions
const localStorageMock = {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem,
  clear: mockClear,
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Create sessionStorage mock with same pattern
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// ========================================
// BROWSER API MOCKS
// ========================================

// Mock IntersectionObserver for MUI components
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for responsive components
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock getComputedStyle for layout calculations
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance'],
  }),
});

// Mock HTMLElement.offsetParent for layout tests
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    return this.parentNode;
  },
});

// Mock scrollTo function
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// ========================================
// CONSOLE MOCKING
// ========================================

// Mock console.error to reduce test noise while preserving original
const originalError = console.error;
console.error = jest.fn();

// ========================================
// TEST CLEANUP HOOKS
// ========================================

// Clear all mocks before each test
beforeEach(() => {
  // Clear fetch and storage mocks
  fetch.mockClear();
  mockGetItem.mockClear();
  mockSetItem.mockClear();
  mockRemoveItem.mockClear();
  mockClear.mockClear();
  
  // Clear sessionStorage mocks
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Clear console mocks
  console.error.mockClear();
});

// Restore original console after all tests
afterAll(() => {
  console.error = originalError;
});