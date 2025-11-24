import axios from 'axios';
import { FinnhubRestClient } from '../rest-client';
import { FinnhubCandleResponse } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const generateMockFinnhubResponse = (count: number): FinnhubCandleResponse => {
  const response: FinnhubCandleResponse = {
    c: [],
    h: [],
    l: [],
    o: [],
    s: 'ok',
    t: [],
    v: [],
  };

  const baseTime = Math.floor(Date.now() / 1000) - count * 3600;

  for (let i = 0; i < count; i++) {
    const basePrice = 1.1 + Math.random() * 0.01;
    response.o.push(basePrice);
    response.h.push(basePrice * 1.001);
    response.l.push(basePrice * 0.999);
    response.c.push(basePrice + (Math.random() - 0.5) * 0.002);
    response.t.push(baseTime + i * 3600);
    response.v.push(1000 + Math.random() * 500);
  }

  return response;
};

describe('FinnhubRestClient', () => {
  let client: FinnhubRestClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn(),
    });

    client = new FinnhubRestClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://finnhub.io/api/v1',
      cacheTTL: 60000,
      maxRetries: 3,
      retryDelay: 100,
      backoffMultiplier: 2,
      rateLimit: { maxRequests: 80, perMinutes: 1 },
    });
  });

  afterEach(() => {
    client.clearCache();
  });

  describe('getCandles', () => {
    it('should fetch candles successfully', async () => {
      const mockData = generateMockFinnhubResponse(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const endTime = Date.now();
      const result = await client.getCandles('EUR/USD', '1h', startTime, endTime);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('openTime');
      expect(result[0]).toHaveProperty('close');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forex/candle', expect.objectContaining({
        params: expect.objectContaining({
          symbol: 'OANDA:EUR_USD',
          resolution: '60',
          token: 'test-api-key',
        }),
      }));
    });

    it('should use cached data on subsequent requests', async () => {
      const mockData = generateMockFinnhubResponse(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      await client.getCandles('EUR/USD', '1h', startTime, endTime);
      await client.getCandles('EUR/USD', '1h', startTime, endTime);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty array for no_data response', async () => {
      const mockData: FinnhubCandleResponse = {
        c: [],
        h: [],
        l: [],
        o: [],
        s: 'no_data',
        t: [],
        v: [],
      };
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const endTime = Date.now();
      const result = await client.getCandles('EUR/USD', '1h', startTime, endTime);

      expect(result).toEqual([]);
    });

    it('should handle different forex pairs', async () => {
      const mockData = generateMockFinnhubResponse(50);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      await client.getCandles('USD/JPY', '1h', startTime, endTime);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forex/candle', expect.objectContaining({
        params: expect.objectContaining({
          symbol: 'OANDA:USD_JPY',
        }),
      }));

      await client.getCandles('GBP/USD', '1h', startTime, endTime);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forex/candle', expect.objectContaining({
        params: expect.objectContaining({
          symbol: 'OANDA:GBP_USD',
        }),
      }));
    });

    it('should handle different timeframes', async () => {
      const mockData = generateMockFinnhubResponse(50);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      await client.getCandles('EUR/USD', '5m', startTime, endTime);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forex/candle', expect.objectContaining({
        params: expect.objectContaining({ resolution: '5' }),
      }));

      jest.clearAllMocks();
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      await client.getCandles('EUR/USD', '15m', startTime, endTime);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forex/candle', expect.objectContaining({
        params: expect.objectContaining({ resolution: '15' }),
      }));

      jest.clearAllMocks();
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      await client.getCandles('EUR/USD', '4h', startTime, endTime);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forex/candle', expect.objectContaining({
        params: expect.objectContaining({ resolution: '240' }),
      }));
    });
  });

  describe('getLatestCandles', () => {
    it('should fetch latest candles with default limit', async () => {
      const mockData = generateMockFinnhubResponse(500);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const result = await client.getLatestCandles('EUR/USD', '1h');

      expect(result.length).toBeGreaterThan(0);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    it('should fetch latest candles with custom limit', async () => {
      const mockData = generateMockFinnhubResponse(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const result = await client.getLatestCandles('EUR/USD', '1h', 100);

      expect(result.length).toBeGreaterThan(0);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid API key', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockRejectedValue({
        response: { status: 401 },
        message: 'Unauthorized',
      });

      const startTime = Date.now() - 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      await expect(client.getCandles('EUR/USD', '1h', startTime, endTime)).rejects.toThrow(
        'Invalid API key or unauthorized access'
      );
    });

    it('should throw error for rate limit exceeded', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockRejectedValue({
        response: { status: 429 },
        message: 'Rate limit exceeded',
      });

      const startTime = Date.now() - 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      await expect(client.getCandles('EUR/USD', '1h', startTime, endTime)).rejects.toThrow();
    });

    it('should throw error for invalid response format', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: { invalid: 'format' },
      });

      const startTime = Date.now() - 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      await expect(client.getCandles('EUR/USD', '1h', startTime, endTime)).rejects.toThrow(
        'Invalid response format from Finnhub API'
      );
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      expect(() => client.clearCache()).not.toThrow();
    });

    it('should return cache instance', () => {
      const cache = client.getCache();
      expect(cache).toBeDefined();
      expect(cache.size()).toBe(0);
    });
  });
});
