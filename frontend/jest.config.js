module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/testing/setupTests.js'],
  testMatch: [
    '<rootDir>/testing/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/testing/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
    '!src/**/*.stories.{js,jsx}',
    '!src/reportWebVitals.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/testing/coverage',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testTimeout: 10000,
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    'leaflet': '<rootDir>/testing/__mocks__/leaflet.js',
    'react-router-dom': '<rootDir>/testing/__mocks__/react-router-dom.js'
  },
  // Override react-scripts default test patterns
  roots: ['<rootDir>/testing', '<rootDir>/src']
};