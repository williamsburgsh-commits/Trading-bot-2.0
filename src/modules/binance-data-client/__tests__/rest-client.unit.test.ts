import axios from 'axios';
import { BinanceRestClient } from '../rest-client';
import { 
  generateMockBinanceKlines, 
  mockApiResponses,
  generateInvalidBinanceKline,
} from './fixtures';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BinanceRestClient', () => {
  let client: BinanceRestClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn(),
    });
    
    client = new BinanceRestClient({
      baseUrl: 'https://api.binance.com',
      cacheTTL: 60000,
      maxRetries: 3,
      retryDelay: 100,
      backoffMultiplier: 2,
      rateLimit: { maxRequests: 100, perMinutes: 1 },
    });
  });

  afterEach(() => {
    client.clearCache();
  });

  describe('getKlines', () => {
    it('should fetch klines successfully', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const result = await client.getKlines('BTCUSDT', '1h', 100);

      expect(result).toHaveLength(100);
      expect(result[0]).toHaveProperty('openTime');
      expect(result[0]).toHaveProperty('close');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/klines', {
        params: { symbol: 'BTCUSDT', interval: '1h', limit: 100 },
      });
    });

    it('should use cached data on subsequent requests', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      await client.getKlines('BTCUSDT', '1h', 100);
      await client.getKlines('BTCUSDT', '1h', 100);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should fetch fresh data for different symbols', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      await client.getKlines('BTCUSDT', '1h', 100);
      await client.getKlines('ETHUSDT', '1h', 100);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid response format', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ 
        data: [generateInvalidBinanceKline()],
      });

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow();
    });
  });

  describe('getHistoricalKlines', () => {
    it('should fetch historical klines with time range', async () => {
      const mockData = generateMockBinanceKlines(1000);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 1000 * 60 * 60 * 24;
      const endTime = Date.now();

      const result = await client.getHistoricalKlines(
        'BTCUSDT',
        '1h',
        startTime,
        endTime,
        1000
      );

      expect(result).toHaveLength(1000);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/klines', {
        params: {
          symbol: 'BTCUSDT',
          interval: '1h',
          startTime,
          endTime,
          limit: 1000,
        },
      });
    });

    it('should cache historical data with longer TTL', async () => {
      const mockData = generateMockBinanceKlines(1000);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 1000 * 60 * 60 * 24;

      await client.getHistoricalKlines('BTCUSDT', '1h', startTime);
      await client.getHistoricalKlines('BTCUSDT', '1h', startTime);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('bulkHistoricalDownload', () => {
    it('should fetch data in multiple chunks', async () => {
      const mockData = generateMockBinanceKlines(1000);
      const mockAxiosInstance = (client as any).axiosInstance;
      
      (client as any).rateLimit = { maxRequests: 1000, perMinutes: 1 };
      
      mockAxiosInstance.get = jest.fn()
        .mockResolvedValueOnce({ data: mockData })
        .mockResolvedValueOnce({ data: mockData })
        .mockResolvedValueOnce({ data: mockData.slice(0, 500) });

      const startTime = Date.now() - 1000 * 60 * 60 * 24;
      const endTime = startTime + 1000 * 60 * 60 * 2;

      const result = await client.bulkHistoricalDownload(
        'BTCUSDT',
        '1h',
        startTime,
        endTime
      );

      expect(result.length).toBeGreaterThanOrEqual(1000);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    it('should stop fetching when no more data', async () => {
      const mockData = generateMockBinanceKlines(500);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      const startTime = Date.now() - 1000 * 60 * 60 * 24;
      const endTime = Date.now();

      const result = await client.bulkHistoricalDownload(
        'BTCUSDT',
        '1h',
        startTime,
        endTime
      );

      expect(result).toHaveLength(500);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry mechanism', () => {
    it('should retry on server error', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValueOnce({ data: mockData });

      const result = await client.getKlines('BTCUSDT', '1h', 100);

      expect(result).toHaveLength(100);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should retry on rate limit error', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({ data: mockData });

      const result = await client.getKlines('BTCUSDT', '1h', 100);

      expect(result).toHaveLength(100);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn().mockRejectedValue({ 
        response: { status: 500 },
        message: 'Internal Server Error',
      });

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client error', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn().mockRejectedValue({ 
        response: { status: 400 },
        message: 'Bad Request',
      });

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValueOnce({ data: mockData });

      const startTime = Date.now();
      await client.getKlines('BTCUSDT', '1h', 100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    });
  });

  describe('error handling', () => {
    it('should throw specific error for rate limit', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn().mockRejectedValue({ 
        response: { status: 429 },
        message: 'Too Many Requests',
      });

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow('Rate limit exceeded');
    });

    it('should throw specific error for geo-restriction', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn().mockRejectedValue({ 
        response: { status: 451 },
        message: 'Unavailable For Legal Reasons',
      });

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow('API access restricted');
    });

    it('should throw generic error for network issues', async () => {
      const mockAxiosInstance = (client as any).axiosInstance;
      
      mockAxiosInstance.get = jest.fn().mockRejectedValue({ 
        message: 'Network Error',
      });

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow();
    });
  });

  describe('cache management', () => {
    it('should clear all cache', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = (client as any).axiosInstance;
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockData });

      await client.getKlines('BTCUSDT', '1h', 100);
      client.clearCache();
      await client.getKlines('BTCUSDT', '1h', 100);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should provide access to cache instance', () => {
      const cache = client.getCache();
      expect(cache).toBeDefined();
      expect(cache.size()).toBe(0);
    });
  });
});
