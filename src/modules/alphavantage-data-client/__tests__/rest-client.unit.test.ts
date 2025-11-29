import axios from 'axios';
import { AlphaVantageRestClient } from '../rest-client';
import { AlphaVantageForexPair, AlphaVantageTimeframe } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AlphaVantageRestClient', () => {
  let client: AlphaVantageRestClient;

  const mockResponse = {
    data: {
      'Meta Data': {
        '1. Information': 'Forex Intraday (5min) Time Series',
        '2. From Symbol': 'EUR',
        '3. To Symbol': 'USD',
        '4. Last Refreshed': '2024-01-01 10:00:00',
        '5. Interval': '5min',
        '6. Output Size': 'Full size',
        '7. Time Zone': 'UTC',
      },
      'Time Series FX (Intraday)': {
        '2024-01-01 10:00:00': {
          '1. open': '1.1000',
          '2. high': '1.1010',
          '3. low': '1.0990',
          '4. close': '1.1005',
        },
        '2024-01-01 09:55:00': {
          '1. open': '1.0995',
          '2. high': '1.1000',
          '3. low': '1.0985',
          '4. close': '1.0998',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    client = new AlphaVantageRestClient({
      apiKey: 'test-api-key',
      rateLimit: { maxRequests: 100, perMinutes: 1 },
    });
  });

  describe('getLatestCandles', () => {
    it('should fetch latest candles successfully', async () => {
      const symbol: AlphaVantageForexPair = 'EUR/USD';
      const timeframe: AlphaVantageTimeframe = '5m';
      const limit = 500;

      const candles = await client.getLatestCandles(symbol, timeframe, limit);

      expect(candles).toBeDefined();
      expect(Array.isArray(candles)).toBe(true);
      expect(candles.length).toBeGreaterThan(0);
    });

    it('should return candles in ascending time order', async () => {
      const symbol: AlphaVantageForexPair = 'EUR/USD';
      const timeframe: AlphaVantageTimeframe = '5m';

      const candles = await client.getLatestCandles(symbol, timeframe, 100);

      for (let i = 1; i < candles.length; i++) {
        expect(candles[i].openTime).toBeGreaterThanOrEqual(candles[i - 1].openTime);
      }
    });

    it('should transform response to KlineData format', async () => {
      const symbol: AlphaVantageForexPair = 'USD/JPY';
      const timeframe: AlphaVantageTimeframe = '1h';

      const candles = await client.getLatestCandles(symbol, timeframe, 10);

      candles.forEach((candle) => {
        expect(candle).toHaveProperty('openTime');
        expect(candle).toHaveProperty('open');
        expect(candle).toHaveProperty('high');
        expect(candle).toHaveProperty('low');
        expect(candle).toHaveProperty('close');
        expect(candle).toHaveProperty('volume');
        expect(candle).toHaveProperty('closeTime');
      });
    });
  });

  describe('getCandles', () => {
    it('should fetch candles for specific time range', async () => {
      const symbol: AlphaVantageForexPair = 'GBP/USD';
      const timeframe: AlphaVantageTimeframe = '15m';
      const endTime = Date.now();
      const startTime = endTime - 24 * 60 * 60 * 1000; // 24 hours ago

      const candles = await client.getCandles(symbol, timeframe, startTime, endTime);

      expect(candles).toBeDefined();
      expect(Array.isArray(candles)).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache responses', async () => {
      const symbol: AlphaVantageForexPair = 'EUR/USD';
      const timeframe: AlphaVantageTimeframe = '5m';

      const firstCall = await client.getLatestCandles(symbol, timeframe, 10);
      const secondCall = await client.getLatestCandles(symbol, timeframe, 10);

      expect(firstCall).toEqual(secondCall);
    });

    it('should allow cache clearing', () => {
      const cache = client.getCache();
      expect(cache).toBeDefined();

      client.clearCache();
      expect(cache.size()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const errorResponse = {
        data: {
          Note: 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.',
        },
      };

      mockedAxios.create = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      const clientWithError = new AlphaVantageRestClient({
        apiKey: 'test-api-key',
        rateLimit: { maxRequests: 100, perMinutes: 1 },
      });

      await expect(clientWithError.getLatestCandles('EUR/USD', '5m', 10)).rejects.toThrow();
    });

    it('should handle API error messages', async () => {
      const errorResponse = {
        data: {
          'Error Message': 'Invalid API key',
        },
      };

      mockedAxios.create = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      const clientWithError = new AlphaVantageRestClient({
        apiKey: 'invalid-key',
        rateLimit: { maxRequests: 100, perMinutes: 1 },
      });

      await expect(clientWithError.getLatestCandles('EUR/USD', '5m', 10)).rejects.toThrow();
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      const clientWithLowLimit = new AlphaVantageRestClient({
        apiKey: 'test-api-key',
        rateLimit: { maxRequests: 2, perMinutes: 1 },
      });

      const symbol: AlphaVantageForexPair = 'EUR/USD';
      const timeframe: AlphaVantageTimeframe = '5m';

      // These should succeed
      await clientWithLowLimit.getLatestCandles(symbol, timeframe, 10);

      // Clear cache to force new request
      clientWithLowLimit.clearCache();

      await clientWithLowLimit.getLatestCandles(symbol, timeframe, 10);
    });
  });
});
