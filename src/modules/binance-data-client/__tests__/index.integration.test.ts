import axios from 'axios';
import { BinanceDataClient } from '../index';
import { generateMockBinanceKlines, generateMockWebSocketMessage } from './fixtures';

jest.mock('axios');
jest.mock('ws');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BinanceDataClient Integration', () => {
  let client: BinanceDataClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn(),
    });

    client = new BinanceDataClient({
      baseUrl: 'https://api.binance.com',
      wsBaseUrl: 'wss://stream.binance.com:9443',
      cacheTTL: 60000,
      maxRetries: 3,
      retryDelay: 100,
      rateLimit: { maxRequests: 100, perMinutes: 1 },
    });
  });

  afterEach(() => {
    client.close();
  });

  describe('REST API Integration', () => {
    it('should fetch klines for all supported symbols', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      const symbols: Array<'BTCUSDT' | 'ETHUSDT' | 'XRPUSDT' | 'SOLUSDT'> = [
        'BTCUSDT',
        'ETHUSDT',
        'XRPUSDT',
        'SOLUSDT',
      ];

      for (const symbol of symbols) {
        const result = await client.getKlines(symbol, '1h', 100);
        expect(result).toHaveLength(100);
      }

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);
    });

    it('should fetch klines for all supported timeframes', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      const timeframes: Array<'5m' | '15m' | '1h' | '4h'> = ['5m', '15m', '1h', '4h'];

      for (const timeframe of timeframes) {
        const result = await client.getKlines('BTCUSDT', timeframe, 100);
        expect(result).toHaveLength(100);
      }

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);
    });

    it('should handle bulk historical download', async () => {
      const mockData = generateMockBinanceKlines(1000);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;
      (client as any).restClient.rateLimit = { maxRequests: 1000, perMinutes: 1 };

      const startTime = Date.now() - 1000 * 60 * 60 * 24;
      const endTime = startTime + 1000 * 60 * 60 * 2;

      const result = await client.bulkHistoricalDownload(
        'BTCUSDT',
        '1h',
        startTime,
        endTime
      );

      expect(result.length).toBeGreaterThan(0);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });
  });

  describe('Cache Integration', () => {
    it('should cache REST API responses', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      await client.getKlines('BTCUSDT', '1h', 100);
      await client.getKlines('BTCUSDT', '1h', 100);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should clear cache on demand', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      await client.getKlines('BTCUSDT', '1h', 100);
      client.clearCache();
      await client.getKlines('BTCUSDT', '1h', 100);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should provide access to cache for inspection', () => {
      const cache = client.getCache();
      expect(cache).toBeDefined();
      expect(cache.size()).toBe(0);
    });
  });

  describe('WebSocket Integration', () => {
    it('should subscribe to real-time updates for multiple symbols', () => {
      const symbols: Array<'BTCUSDT' | 'ETHUSDT' | 'XRPUSDT' | 'SOLUSDT'> = [
        'BTCUSDT',
        'ETHUSDT',
      ];
      const timeframes: Array<'5m' | '15m' | '1h' | '4h'> = ['1h', '4h'];

      expect(() => {
        client.subscribeMultiple(symbols, timeframes);
      }).not.toThrow();
    });

    it('should receive kline updates via event callback', (done) => {
      const mockMessage = generateMockWebSocketMessage('BTCUSDT', '1h', false);

      client.onKlineUpdate((event) => {
        expect(event.symbol).toBe('BTCUSDT');
        expect(event.timeframe).toBe('1h');
        expect(event.kline).toBeDefined();
        done();
      });

      client.subscribeRealtime('BTCUSDT', '1h');

      const wsClient = (client as any).wsClient;
      wsClient.emit('klineUpdate', {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        kline: mockMessage.k,
        isFinal: false,
      });
    });

    it('should receive connection status updates', (done) => {
      client.onConnectionStatus((event) => {
        expect(event.status).toBeDefined();
        expect(event.timestamp).toBeDefined();
        done();
      });

      client.subscribeRealtime('BTCUSDT', '1h');

      const wsClient = (client as any).wsClient;
      wsClient.emit('connectionStatus', {
        status: 'connected',
        timestamp: Date.now(),
      });
    });

    it('should handle errors gracefully', (done) => {
      const testError = new Error('Test error');

      client.onError((error) => {
        expect(error).toBe(testError);
        done();
      });

      const wsClient = (client as any).wsClient;
      wsClient.emit('error', testError);
    });

    it('should retrieve latest kline for subscribed stream', () => {
      client.subscribeRealtime('BTCUSDT', '1h');
      
      const kline = client.getLatestKline('BTCUSDT', '1h');
      expect(kline).toBeNull();
    });

    it('should unsubscribe from real-time updates', () => {
      expect(() => {
        client.subscribeRealtime('BTCUSDT', '1h');
        client.unsubscribeRealtime('BTCUSDT', '1h');
      }).not.toThrow();
    });
  });

  describe('Combined REST and WebSocket', () => {
    it('should fetch historical data and subscribe to real-time updates', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      const historical = await client.getKlines('BTCUSDT', '1h', 100);
      expect(historical).toHaveLength(100);

      expect(() => {
        client.subscribeRealtime('BTCUSDT', '1h');
      }).not.toThrow();
    });

    it('should handle multiple symbols with both REST and WebSocket', async () => {
      const mockData = generateMockBinanceKlines(100);
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      const symbols: Array<'BTCUSDT' | 'ETHUSDT'> = ['BTCUSDT', 'ETHUSDT'];

      for (const symbol of symbols) {
        await client.getKlines(symbol, '1h', 100);
        client.subscribeRealtime(symbol, '1h');
      }

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle REST API failures gracefully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        response: { status: 429 },
        message: 'Too Many Requests',
      });

      (client as any).restClient.axiosInstance = mockAxiosInstance;

      await expect(client.getKlines('BTCUSDT', '1h', 100)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });
});
