import {
  normalizeKlineData,
  extractCloses,
  extractHighs,
  extractLows,
  extractVolumes,
  extractOpens,
  validateCandles,
} from '../normalizer';
import { generateMockKlines, mockNormalizedCandles } from './fixtures';

describe('Normalizer', () => {
  describe('normalizeKlineData', () => {
    it('should normalize kline data correctly', () => {
      const klines = generateMockKlines(10);
      const normalized = normalizeKlineData(klines);

      expect(normalized).toHaveLength(10);
      expect(normalized[0]).toHaveProperty('timestamp');
      expect(normalized[0]).toHaveProperty('open');
      expect(normalized[0]).toHaveProperty('high');
      expect(normalized[0]).toHaveProperty('low');
      expect(normalized[0]).toHaveProperty('close');
      expect(normalized[0]).toHaveProperty('volume');

      expect(typeof normalized[0]!.timestamp).toBe('number');
      expect(typeof normalized[0]!.open).toBe('number');
      expect(typeof normalized[0]!.high).toBe('number');
      expect(typeof normalized[0]!.low).toBe('number');
      expect(typeof normalized[0]!.close).toBe('number');
      expect(typeof normalized[0]!.volume).toBe('number');
    });

    it('should handle empty array', () => {
      const normalized = normalizeKlineData([]);
      expect(normalized).toHaveLength(0);
    });

    it('should parse string numbers correctly', () => {
      const klines = [{
        openTime: 1000,
        open: '100.50',
        high: '105.75',
        low: '99.25',
        close: '103.00',
        volume: '1500.50',
        closeTime: 2000,
        quoteVolume: '150000',
        trades: 100,
        takerBuyBaseVolume: '750',
        takerBuyQuoteVolume: '75000',
      }];

      const normalized = normalizeKlineData(klines);
      expect(normalized[0]!.open).toBe(100.50);
      expect(normalized[0]!.high).toBe(105.75);
      expect(normalized[0]!.low).toBe(99.25);
      expect(normalized[0]!.close).toBe(103.00);
      expect(normalized[0]!.volume).toBe(1500.50);
    });
  });

  describe('extractCloses', () => {
    it('should extract close prices', () => {
      const closes = extractCloses(mockNormalizedCandles);
      expect(closes).toEqual([102, 106, 108, 110, 113]);
    });

    it('should handle empty array', () => {
      const closes = extractCloses([]);
      expect(closes).toEqual([]);
    });
  });

  describe('extractHighs', () => {
    it('should extract high prices', () => {
      const highs = extractHighs(mockNormalizedCandles);
      expect(highs).toEqual([105, 108, 110, 112, 115]);
    });
  });

  describe('extractLows', () => {
    it('should extract low prices', () => {
      const lows = extractLows(mockNormalizedCandles);
      expect(lows).toEqual([95, 100, 104, 106, 108]);
    });
  });

  describe('extractVolumes', () => {
    it('should extract volumes', () => {
      const volumes = extractVolumes(mockNormalizedCandles);
      expect(volumes).toEqual([1000, 1200, 1100, 1300, 1400]);
    });
  });

  describe('extractOpens', () => {
    it('should extract open prices', () => {
      const opens = extractOpens(mockNormalizedCandles);
      expect(opens).toEqual([100, 102, 106, 108, 110]);
    });
  });

  describe('validateCandles', () => {
    it('should validate correct candles', () => {
      expect(validateCandles(mockNormalizedCandles)).toBe(true);
    });

    it('should reject empty array', () => {
      expect(validateCandles([])).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateCandles(null as any)).toBe(false);
      expect(validateCandles(undefined as any)).toBe(false);
    });

    it('should reject candles with NaN values', () => {
      const invalid = [
        { timestamp: 1000, open: NaN, high: 105, low: 95, close: 102, volume: 1000 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });

    it('should reject candles with negative prices', () => {
      const invalid = [
        { timestamp: 1000, open: -100, high: 105, low: 95, close: 102, volume: 1000 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });

    it('should reject candles with zero prices', () => {
      const invalid = [
        { timestamp: 1000, open: 0, high: 105, low: 95, close: 102, volume: 1000 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });

    it('should reject candles where high < low', () => {
      const invalid = [
        { timestamp: 1000, open: 100, high: 95, low: 105, close: 102, volume: 1000 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });

    it('should reject candles where high < close', () => {
      const invalid = [
        { timestamp: 1000, open: 100, high: 95, low: 90, close: 102, volume: 1000 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });

    it('should reject candles where low > close', () => {
      const invalid = [
        { timestamp: 1000, open: 100, high: 110, low: 105, close: 102, volume: 1000 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });

    it('should accept candles with zero volume', () => {
      const valid = [
        { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 0 },
      ];
      expect(validateCandles(valid)).toBe(true);
    });

    it('should reject candles with negative volume', () => {
      const invalid = [
        { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: -100 },
      ];
      expect(validateCandles(invalid)).toBe(false);
    });
  });
});
