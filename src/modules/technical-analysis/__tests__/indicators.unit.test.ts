import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateSMA,
  calculateEMA,
  calculateATR,
  calculateVolume,
  calculateMultiPeriodSMA,
  calculateMultiPeriodEMA,
} from '../indicators';
import { normalizeKlineData } from '../normalizer';
import {
  generateMockKlines,
  generateBullishTrend,
  generateBearishTrend,
  generateKnownValuesKlines,
  generateInsufficientKlines,
  mockNormalizedCandles,
} from './fixtures';

describe('Indicators', () => {
  describe('calculateRSI', () => {
    it('should calculate RSI for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const rsi = calculateRSI(candles, 14);

      expect(rsi).not.toBeNull();
      expect(rsi!.value).toBeGreaterThanOrEqual(0);
      expect(rsi!.value).toBeLessThanOrEqual(100);
      expect(rsi!.period).toBe(14);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const rsi = calculateRSI(candles, 14);

      expect(rsi).toBeNull();
    });

    it('should detect overbought condition', () => {
      const klines = generateBullishTrend(50);
      const candles = normalizeKlineData(klines);
      const rsi = calculateRSI(candles, 14, 70, 30);

      expect(rsi).not.toBeNull();
      if (rsi && rsi.value > 70) {
        expect(rsi.overbought).toBe(true);
      }
    });

    it('should detect oversold condition', () => {
      const klines = generateBearishTrend(50);
      const candles = normalizeKlineData(klines);
      const rsi = calculateRSI(candles, 14, 70, 30);

      expect(rsi).not.toBeNull();
      if (rsi && rsi.value < 30) {
        expect(rsi.oversold).toBe(true);
      }
    });

    it('should calculate RSI close to known values', () => {
      const klines = generateKnownValuesKlines();
      const candles = normalizeKlineData(klines);
      const rsi = calculateRSI(candles, 14);

      expect(rsi).not.toBeNull();
      expect(rsi!.value).toBeGreaterThan(50);
      expect(rsi!.value).toBeLessThan(80);
    });

    it('should handle different periods', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);

      const rsi7 = calculateRSI(candles, 7);
      const rsi14 = calculateRSI(candles, 14);
      const rsi21 = calculateRSI(candles, 21);

      expect(rsi7).not.toBeNull();
      expect(rsi14).not.toBeNull();
      expect(rsi21).not.toBeNull();
      expect(rsi7!.period).toBe(7);
      expect(rsi14!.period).toBe(14);
      expect(rsi21!.period).toBe(21);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const macd = calculateMACD(candles);

      expect(macd).not.toBeNull();
      expect(macd!.macd).toBeDefined();
      expect(macd!.signal).toBeDefined();
      expect(macd!.histogram).toBeDefined();
      expect(macd!.fastPeriod).toBe(12);
      expect(macd!.slowPeriod).toBe(26);
      expect(macd!.signalPeriod).toBe(9);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const macd = calculateMACD(candles);

      expect(macd).toBeNull();
    });

    it('should detect bullish condition', () => {
      const klines = generateBullishTrend(50);
      const candles = normalizeKlineData(klines);
      const macd = calculateMACD(candles);

      expect(macd).not.toBeNull();
      if (macd && macd.histogram > 0) {
        expect(macd.bullish).toBe(true);
      }
    });

    it('should detect bearish condition', () => {
      const klines = generateBearishTrend(50);
      const candles = normalizeKlineData(klines);
      const macd = calculateMACD(candles);

      expect(macd).not.toBeNull();
      if (macd && macd.histogram < 0) {
        expect(macd.bearish).toBe(true);
      }
    });

    it('should calculate histogram correctly', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const macd = calculateMACD(candles);

      expect(macd).not.toBeNull();
      expect(macd!.histogram).toBeCloseTo(macd!.macd - macd!.signal, 5);
    });

    it('should handle custom periods', () => {
      const klines = generateMockKlines(100);
      const candles = normalizeKlineData(klines);
      const macd = calculateMACD(candles, 5, 10, 5);

      expect(macd).not.toBeNull();
      expect(macd!.fastPeriod).toBe(5);
      expect(macd!.slowPeriod).toBe(10);
      expect(macd!.signalPeriod).toBe(5);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const bb = calculateBollingerBands(candles);

      expect(bb).not.toBeNull();
      expect(bb!.upper).toBeGreaterThan(bb!.middle);
      expect(bb!.middle).toBeGreaterThan(bb!.lower);
      expect(bb!.period).toBe(20);
      expect(bb!.stdDev).toBe(2);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const bb = calculateBollingerBands(candles);

      expect(bb).toBeNull();
    });

    it('should calculate bandwidth', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const bb = calculateBollingerBands(candles);

      expect(bb).not.toBeNull();
      expect(bb!.bandwidth).toBeGreaterThan(0);
      expect(bb!.bandwidth).toBeCloseTo((bb!.upper - bb!.lower) / bb!.middle, 5);
    });

    it('should calculate %B', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const bb = calculateBollingerBands(candles);

      expect(bb).not.toBeNull();
      expect(bb!.percentB).toBeDefined();
    });

    it('should handle custom periods and std dev', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const bb = calculateBollingerBands(candles, 10, 1.5);

      expect(bb).not.toBeNull();
      expect(bb!.period).toBe(10);
      expect(bb!.stdDev).toBe(1.5);
    });
  });

  describe('calculateSMA', () => {
    it('should calculate SMA for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const sma = calculateSMA(candles, 20);

      expect(sma).not.toBeNull();
      expect(sma!.value).toBeGreaterThan(0);
      expect(sma!.period).toBe(20);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const sma = calculateSMA(candles, 20);

      expect(sma).toBeNull();
    });

    it('should calculate correct average', () => {
      const candles = mockNormalizedCandles;
      const sma = calculateSMA(candles, 5);

      expect(sma).not.toBeNull();
      const expectedAvg = (102 + 106 + 108 + 110 + 113) / 5;
      expect(sma!.value).toBeCloseTo(expectedAvg, 2);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate EMA for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const ema = calculateEMA(candles, 20);

      expect(ema).not.toBeNull();
      expect(ema!.value).toBeGreaterThan(0);
      expect(ema!.period).toBe(20);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const ema = calculateEMA(candles, 20);

      expect(ema).toBeNull();
    });

    it('should be more responsive than SMA', () => {
      const klines = generateBullishTrend(50);
      const candles = normalizeKlineData(klines);
      const sma = calculateSMA(candles, 20);
      const ema = calculateEMA(candles, 20);

      expect(sma).not.toBeNull();
      expect(ema).not.toBeNull();
    });
  });

  describe('calculateATR', () => {
    it('should calculate ATR for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const atr = calculateATR(candles);

      expect(atr).not.toBeNull();
      expect(atr!.value).toBeGreaterThan(0);
      expect(atr!.period).toBe(14);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const atr = calculateATR(candles);

      expect(atr).toBeNull();
    });

    it('should be higher in volatile markets', () => {
      const normalKlines = generateMockKlines(50, 50000);
      const volatileKlines = generateMockKlines(50, 50000);

      const normalCandles = normalizeKlineData(normalKlines);
      const volatileCandles = normalizeKlineData(volatileKlines);

      const atrNormal = calculateATR(normalCandles);
      const atrVolatile = calculateATR(volatileCandles);

      expect(atrNormal).not.toBeNull();
      expect(atrVolatile).not.toBeNull();
      expect(atrNormal!.value).toBeGreaterThan(0);
      expect(atrVolatile!.value).toBeGreaterThan(0);
    });
  });

  describe('calculateVolume', () => {
    it('should calculate volume snapshot for valid data', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const volume = calculateVolume(candles);

      expect(volume).not.toBeNull();
      expect(volume!.current).toBeGreaterThan(0);
      expect(volume!.average).toBeGreaterThan(0);
      expect(volume!.ratio).toBeGreaterThan(0);
      expect(volume!.period).toBe(20);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const candles = normalizeKlineData(klines);
      const volume = calculateVolume(candles);

      expect(volume).toBeNull();
    });

    it('should calculate ratio correctly', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const volume = calculateVolume(candles);

      expect(volume).not.toBeNull();
      expect(volume!.ratio).toBeCloseTo(volume!.current / volume!.average, 5);
    });
  });

  describe('calculateMultiPeriodSMA', () => {
    it('should calculate multiple SMA periods', () => {
      const klines = generateMockKlines(250);
      const candles = normalizeKlineData(klines);
      const periods = [20, 50, 100, 200];
      const smas = calculateMultiPeriodSMA(candles, periods);

      expect(Object.keys(smas)).toHaveLength(4);
      expect(smas[20]).toBeDefined();
      expect(smas[50]).toBeDefined();
      expect(smas[100]).toBeDefined();
      expect(smas[200]).toBeDefined();
    });

    it('should skip periods with insufficient data', () => {
      const klines = generateMockKlines(30);
      const candles = normalizeKlineData(klines);
      const periods = [10, 20, 50, 100];
      const smas = calculateMultiPeriodSMA(candles, periods);

      expect(smas[10]).toBeDefined();
      expect(smas[20]).toBeDefined();
      expect(smas[50]).toBeUndefined();
      expect(smas[100]).toBeUndefined();
    });

    it('should handle empty periods array', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const smas = calculateMultiPeriodSMA(candles, []);

      expect(Object.keys(smas)).toHaveLength(0);
    });
  });

  describe('calculateMultiPeriodEMA', () => {
    it('should calculate multiple EMA periods', () => {
      const klines = generateMockKlines(250);
      const candles = normalizeKlineData(klines);
      const periods = [20, 50, 100, 200];
      const emas = calculateMultiPeriodEMA(candles, periods);

      expect(Object.keys(emas)).toHaveLength(4);
      expect(emas[20]).toBeDefined();
      expect(emas[50]).toBeDefined();
      expect(emas[100]).toBeDefined();
      expect(emas[200]).toBeDefined();
    });

    it('should skip periods with insufficient data', () => {
      const klines = generateMockKlines(30);
      const candles = normalizeKlineData(klines);
      const periods = [10, 20, 50, 100];
      const emas = calculateMultiPeriodEMA(candles, periods);

      expect(emas[10]).toBeDefined();
      expect(emas[20]).toBeDefined();
      expect(emas[50]).toBeUndefined();
      expect(emas[100]).toBeUndefined();
    });

    it('should handle empty periods array', () => {
      const klines = generateMockKlines(50);
      const candles = normalizeKlineData(klines);
      const emas = calculateMultiPeriodEMA(candles, []);

      expect(Object.keys(emas)).toHaveLength(0);
    });
  });
});
