// Mock Leaflet library for testing
const L = {
  Icon: {
    Default: {
      mergeOptions: jest.fn()
    }
  },
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    setLatLng: jest.fn(),
    remove: jest.fn()
  })),
  circle: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    setRadius: jest.fn(),
    setStyle: jest.fn()
  })),
  polyline: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    setStyle: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn()
  })),
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  latLngBounds: jest.fn(() => ({
    extend: jest.fn(),
    isValid: jest.fn(() => true)
  }))
};

export default L;