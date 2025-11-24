import { computeIndicators, computeMultiTimeframeIndicators } from '../index';
import {
  generateMockKlines,
  generateBullishTrend,
  generateBearishTrend,
  generateInsufficientKlines,
  generateInvalidKlines,
} from './fixtures';

describe('Technical Analysis Module - Integration', () => {
  describe('computeIndicators', () => {
    it('should compute all indicators for valid data', () => {
      const klines = generateMockKlines(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.asset).toBe('BTCUSDT');
      expect(snapshot!.timeframe).toBe('1h');
      expect(snapshot!.timestamp).toBeGreaterThan(0);
      expect(snapshot!.price).toBeGreaterThan(0);

      expect(snapshot!.rsi).toBeDefined();
      expect(snapshot!.rsi.value).toBeGreaterThanOrEqual(0);
      expect(snapshot!.rsi.value).toBeLessThanOrEqual(100);

      expect(snapshot!.macd).toBeDefined();
      expect(snapshot!.macd.macd).toBeDefined();
      expect(snapshot!.macd.signal).toBeDefined();
      expect(snapshot!.macd.histogram).toBeDefined();

      expect(snapshot!.bollingerBands).toBeDefined();
      expect(snapshot!.bollingerBands.upper).toBeGreaterThan(snapshot!.bollingerBands.middle);
      expect(snapshot!.bollingerBands.middle).toBeGreaterThan(snapshot!.bollingerBands.lower);

      expect(snapshot!.sma).toBeDefined();
      expect(Object.keys(snapshot!.sma).length).toBeGreaterThan(0);

      expect(snapshot!.ema).toBeDefined();
      expect(Object.keys(snapshot!.ema).length).toBeGreaterThan(0);

      expect(snapshot!.atr).toBeDefined();
      expect(snapshot!.atr.value).toBeGreaterThan(0);

      expect(snapshot!.volume).toBeDefined();
      expect(snapshot!.volume.current).toBeGreaterThan(0);
    });

    it('should return null for insufficient data', () => {
      const klines = generateInsufficientKlines();
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).toBeNull();
    });

    it('should return null for invalid data', () => {
      const klines = generateInvalidKlines();
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).toBeNull();
    });

    it('should detect bullish conditions', () => {
      const klines = generateBullishTrend(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.rsi.value).toBeGreaterThan(50);
    });

    it('should detect bearish conditions', () => {
      const klines = generateBearishTrend(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.rsi.value).toBeLessThan(50);
    });

    it('should use custom config', () => {
      const klines = generateMockKlines(250);
      const config = {
        rsi: { period: 21, overbought: 80, oversold: 20 },
        macd: { fast: 8, slow: 21, signal: 5 },
        bollingerBands: { period: 30, stdDev: 2.5 },
        sma: { periods: [50, 100] },
        ema: { periods: [50, 100] },
        atr: { period: 20 },
        volume: { period: 30 },
      };

      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h', config);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.rsi.period).toBe(21);
      expect(snapshot!.macd.fastPeriod).toBe(8);
      expect(snapshot!.macd.slowPeriod).toBe(21);
      expect(snapshot!.macd.signalPeriod).toBe(5);
      expect(snapshot!.bollingerBands.period).toBe(30);
      expect(snapshot!.bollingerBands.stdDev).toBe(2.5);
      expect(snapshot!.atr.period).toBe(20);
      expect(snapshot!.volume.period).toBe(30);
    });

    it('should compute all SMA periods', () => {
      const klines = generateMockKlines(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.sma[10]).toBeDefined();
      expect(snapshot!.sma[20]).toBeDefined();
      expect(snapshot!.sma[50]).toBeDefined();
      expect(snapshot!.sma[100]).toBeDefined();
      expect(snapshot!.sma[200]).toBeDefined();
    });

    it('should compute all EMA periods', () => {
      const klines = generateMockKlines(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.ema[10]).toBeDefined();
      expect(snapshot!.ema[20]).toBeDefined();
      expect(snapshot!.ema[50]).toBeDefined();
      expect(snapshot!.ema[100]).toBeDefined();
      expect(snapshot!.ema[200]).toBeDefined();
    });

    it('should handle partial custom config', () => {
      const klines = generateMockKlines(250);
      const config = {
        rsi: { period: 21 },
      };

      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h', config);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.rsi.period).toBe(21);
      expect(snapshot!.macd.fastPeriod).toBe(12);
    });

    it('should not have NaN values in output', () => {
      const klines = generateMockKlines(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();

      expect(isNaN(snapshot!.rsi.value)).toBe(false);
      expect(isNaN(snapshot!.macd.macd)).toBe(false);
      expect(isNaN(snapshot!.macd.signal)).toBe(false);
      expect(isNaN(snapshot!.macd.histogram)).toBe(false);
      expect(isNaN(snapshot!.bollingerBands.upper)).toBe(false);
      expect(isNaN(snapshot!.bollingerBands.middle)).toBe(false);
      expect(isNaN(snapshot!.bollingerBands.lower)).toBe(false);
      expect(isNaN(snapshot!.atr.value)).toBe(false);
      expect(isNaN(snapshot!.volume.current)).toBe(false);
      expect(isNaN(snapshot!.volume.average)).toBe(false);

      for (const period in snapshot!.sma) {
        expect(isNaN(snapshot!.sma[period]!.value)).toBe(false);
      }

      for (const period in snapshot!.ema) {
        expect(isNaN(snapshot!.ema[period]!.value)).toBe(false);
      }
    });
  });

  describe('computeMultiTimeframeIndicators', () => {
    it('should compute indicators for multiple timeframes', () => {
      const klinesByTimeframe = new Map([
        ['1h', generateMockKlines(250)],
        ['4h', generateMockKlines(250)],
        ['1d', generateMockKlines(250)],
      ]);

      const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, 'BTCUSDT');

      expect(Object.keys(multiTF)).toHaveLength(3);
      expect(multiTF['BTCUSDT_1h']).toBeDefined();
      expect(multiTF['BTCUSDT_4h']).toBeDefined();
      expect(multiTF['BTCUSDT_1d']).toBeDefined();

      expect(multiTF['BTCUSDT_1h']!.timeframe).toBe('1h');
      expect(multiTF['BTCUSDT_4h']!.timeframe).toBe('4h');
      expect(multiTF['BTCUSDT_1d']!.timeframe).toBe('1d');
    });

    it('should skip timeframes with insufficient data', () => {
      const klinesByTimeframe = new Map([
        ['1h', generateMockKlines(250)],
        ['4h', generateInsufficientKlines()],
        ['1d', generateMockKlines(250)],
      ]);

      const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, 'BTCUSDT');

      expect(Object.keys(multiTF)).toHaveLength(2);
      expect(multiTF['BTCUSDT_1h']).toBeDefined();
      expect(multiTF['BTCUSDT_4h']).toBeUndefined();
      expect(multiTF['BTCUSDT_1d']).toBeDefined();
    });

    it('should use correct asset in keys', () => {
      const klinesByTimeframe = new Map([
        ['1h', generateMockKlines(250)],
        ['4h', generateMockKlines(250)],
      ]);

      const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, 'ETHUSDT');

      expect(multiTF['ETHUSDT_1h']).toBeDefined();
      expect(multiTF['ETHUSDT_4h']).toBeDefined();
      expect(multiTF['BTCUSDT_1h']).toBeUndefined();
    });

    it('should apply custom config to all timeframes', () => {
      const klinesByTimeframe = new Map([
        ['1h', generateMockKlines(250)],
        ['4h', generateMockKlines(250)],
      ]);

      const config = {
        rsi: { period: 21 },
      };

      const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, 'BTCUSDT', config);

      expect(multiTF['BTCUSDT_1h']!.rsi.period).toBe(21);
      expect(multiTF['BTCUSDT_4h']!.rsi.period).toBe(21);
    });

    it('should handle empty map', () => {
      const klinesByTimeframe = new Map();
      const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, 'BTCUSDT');

      expect(Object.keys(multiTF)).toHaveLength(0);
    });

    it('should handle multiple assets separately', () => {
      const btcKlines = new Map([['1h', generateMockKlines(250)]]);

      const ethKlines = new Map([['1h', generateMockKlines(250)]]);

      const btcMultiTF = computeMultiTimeframeIndicators(btcKlines, 'BTCUSDT');
      const ethMultiTF = computeMultiTimeframeIndicators(ethKlines, 'ETHUSDT');

      expect(btcMultiTF['BTCUSDT_1h']).toBeDefined();
      expect(ethMultiTF['ETHUSDT_1h']).toBeDefined();
      expect(btcMultiTF['ETHUSDT_1h']).toBeUndefined();
      expect(ethMultiTF['BTCUSDT_1h']).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly minimum required candles', () => {
      const klines = generateMockKlines(250);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
    });

    it('should handle large number of candles', () => {
      const klines = generateMockKlines(1000);
      const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.rsi).toBeDefined();
      expect(snapshot!.macd).toBeDefined();
    });

    it('should handle varying timeframe names', () => {
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

      for (const tf of timeframes) {
        const klines = generateMockKlines(250);
        const snapshot = computeIndicators(klines, 'BTCUSDT', tf);

        expect(snapshot).not.toBeNull();
        expect(snapshot!.timeframe).toBe(tf);
      }
    });

    it('should handle varying asset symbols', () => {
      const assets = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT'];

      for (const asset of assets) {
        const klines = generateMockKlines(250);
        const snapshot = computeIndicators(klines, asset, '1h');

        expect(snapshot).not.toBeNull();
        expect(snapshot!.asset).toBe(asset);
      }
    });
  });
});
