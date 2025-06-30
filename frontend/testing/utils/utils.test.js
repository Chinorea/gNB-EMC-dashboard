import { getBatteryPercentage } from '../../src/utils';

// Mock the default export (buildStaticsLQM function)
jest.mock('../../src/utils', () => ({
  __esModule: true,
  default: jest.fn(() => []), // buildStaticsLQM mock
  getBatteryPercentage: jest.requireActual('../../src/utils').getBatteryPercentage
}));

describe('Utils Functions', () => {
  describe('getBatteryPercentage', () => {
    test('calculates correct percentage for valid voltage', () => {
      expect(getBatteryPercentage('8.6V')).toBe(100); // Max voltage
      expect(getBatteryPercentage('8.0V')).toBe(63);  // Mid-range
      expect(getBatteryPercentage('7.5V')).toBe(32);  // Lower range
      expect(getBatteryPercentage('7.0V')).toBe(1);   // Min voltage
    });

    test('returns unknown for invalid voltage formats', () => {
      expect(getBatteryPercentage('invalid')).toBe('unknown');
      expect(getBatteryPercentage('')).toBe('unknown');
      expect(getBatteryPercentage(null)).toBe('unknown');
      expect(getBatteryPercentage(undefined)).toBe('unknown');
    });

    test('handles edge cases correctly', () => {
      expect(getBatteryPercentage('9.0V')).toBe(100); // Above max voltage
      expect(getBatteryPercentage('6.5V')).toBe(1);   // Below min voltage
    });

    test('handles different voltage formats', () => {
      expect(getBatteryPercentage('8.5')).toBe(94);   // No V suffix - still works with your function
      expect(getBatteryPercentage('8.5v')).toBe(94);  // Lowercase v - still works with your function
      expect(getBatteryPercentage('invalid')).toBe('unknown'); // Non-numeric string
    });
  });

  describe('buildStaticsLQM (mocked)', () => {
    const buildStaticsLQM = require('../../src/utils').default;

    test('is properly mocked', () => {
      const result = buildStaticsLQM([], [], [], 100, null);
      expect(result).toEqual([]);
      expect(buildStaticsLQM).toHaveBeenCalledWith([], [], [], 100, null);
    });
  });
});