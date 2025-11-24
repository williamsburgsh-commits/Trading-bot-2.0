import WebSocket from 'ws';
import { BinanceWebSocketClient } from '../websocket-client';
import { generateMockWebSocketMessage } from './fixtures';

jest.mock('ws');

describe('BinanceWebSocketClient', () => {
  let client: BinanceWebSocketClient;
  let mockWebSocket: any;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    eventHandlers = new Map();

    mockWebSocket = {
      on: jest.fn((event: string, handler: Function) => {
        eventHandlers.set(event, handler);
        return mockWebSocket;
      }),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    };

    Object.defineProperty(mockWebSocket, 'readyState', {
      writable: true,
      value: WebSocket.OPEN,
    });

    (WebSocket as jest.MockedClass<typeof WebSocket>).mockImplementation(() => mockWebSocket);

    client = new BinanceWebSocketClient({
      wsBaseUrl: 'wss://stream.binance.com:9443',
      maxRetries: 3,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    client.close();
    jest.clearAllMocks();
    eventHandlers.clear();
  });

  describe('subscribe', () => {
    it('should create WebSocket connection', () => {
      client.subscribe('BTCUSDT', '1h');

      expect(WebSocket).toHaveBeenCalledWith('wss://stream.binance.com:9443/ws/btcusdt@kline_1h');
    });

    it('should not create duplicate connections', () => {
      client.subscribe('BTCUSDT', '1h');
      client.subscribe('BTCUSDT', '1h');

      expect(WebSocket).toHaveBeenCalledTimes(1);
    });

    it('should create separate connections for different symbols', () => {
      client.subscribe('BTCUSDT', '1h');
      client.subscribe('ETHUSDT', '1h');

      expect(WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should create separate connections for different timeframes', () => {
      client.subscribe('BTCUSDT', '1h');
      client.subscribe('BTCUSDT', '4h');

      expect(WebSocket).toHaveBeenCalledTimes(2);
    });
  });

  describe('unsubscribe', () => {
    it('should close WebSocket connection', () => {
      client.subscribe('BTCUSDT', '1h');
      client.unsubscribe('BTCUSDT', '1h');

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should do nothing for non-existent subscription', () => {
      client.unsubscribe('BTCUSDT', '1h');

      expect(mockWebSocket.close).not.toHaveBeenCalled();
    });
  });

  describe('subscribeMultiple', () => {
    it('should subscribe to multiple symbols and timeframes', () => {
      client.subscribeMultiple(['BTCUSDT', 'ETHUSDT'], ['1h', '4h']);

      expect(WebSocket).toHaveBeenCalledTimes(4);
    });
  });

  describe('message handling', () => {
    it('should emit klineUpdate event on valid message', (done) => {
      const mockMessage = generateMockWebSocketMessage('BTCUSDT', '1h', false);

      client.on('klineUpdate', (event) => {
        expect(event.symbol).toBe('BTCUSDT');
        expect(event.timeframe).toBe('1h');
        expect(event.isFinal).toBe(false);
        expect(event.kline).toHaveProperty('openTime');
        expect(event.kline).toHaveProperty('close');
        done();
      });

      client.subscribe('BTCUSDT', '1h');

      const messageHandler = eventHandlers.get('message');
      if (messageHandler) {
        messageHandler(JSON.stringify(mockMessage));
      }
    });

    it('should update latest kline on message', () => {
      const mockMessage = generateMockWebSocketMessage('BTCUSDT', '1h', false);

      client.subscribe('BTCUSDT', '1h');

      const messageHandler = eventHandlers.get('message');
      if (messageHandler) {
        messageHandler(JSON.stringify(mockMessage));
      }

      const latestKline = client.getLatestKline('BTCUSDT', '1h');
      expect(latestKline).toBeDefined();
      expect(latestKline?.openTime).toBe(mockMessage.k.t);
    });

    it('should handle final kline correctly', (done) => {
      const mockMessage = generateMockWebSocketMessage('BTCUSDT', '1h', true);

      client.on('klineUpdate', (event) => {
        expect(event.isFinal).toBe(true);
        done();
      });

      client.subscribe('BTCUSDT', '1h');

      const messageHandler = eventHandlers.get('message');
      if (messageHandler) {
        messageHandler(JSON.stringify(mockMessage));
      }
    });

    it('should handle invalid message format gracefully', () => {
      const invalidMessage = { invalid: 'data' };

      client.subscribe('BTCUSDT', '1h');

      const messageHandler = eventHandlers.get('message');
      if (messageHandler) {
        expect(() => {
          messageHandler(JSON.stringify(invalidMessage));
        }).not.toThrow();
      }
    });

    it('should handle malformed JSON gracefully', (done) => {
      client.on('error', (error) => {
        expect(error.message).toContain('Failed to parse');
        done();
      });

      client.subscribe('BTCUSDT', '1h');

      const messageHandler = eventHandlers.get('message');
      if (messageHandler) {
        messageHandler('invalid json{');
      }
    });
  });

  describe('connection status', () => {
    it('should emit connected status on open', (done) => {
      client.on('connectionStatus', (event) => {
        if (event.status === 'connected') {
          expect(event.message).toContain('BTCUSDT');
          expect(event.message).toContain('1h');
          done();
        }
      });

      client.subscribe('BTCUSDT', '1h');

      const openHandler = eventHandlers.get('open');
      if (openHandler) {
        openHandler();
      }
    });

    it('should emit disconnected status on close', (done) => {
      client.on('connectionStatus', (event) => {
        if (event.status === 'disconnected') {
          expect(event.message).toContain('BTCUSDT');
          done();
        }
      });

      client.subscribe('BTCUSDT', '1h');

      const closeHandler = eventHandlers.get('close');
      if (closeHandler) {
        closeHandler();
      }
    });

    it('should emit error on WebSocket error', (done) => {
      const testError = new Error('Connection failed');

      client.on('error', (error) => {
        expect(error).toBe(testError);
        done();
      });

      client.subscribe('BTCUSDT', '1h');

      const errorHandler = eventHandlers.get('error');
      if (errorHandler) {
        errorHandler(testError);
      }
    });
  });

  describe('isConnected', () => {
    it('should return true for connected socket', () => {
      client.subscribe('BTCUSDT', '1h');
      mockWebSocket.readyState = WebSocket.OPEN;

      expect(client.isConnected('BTCUSDT', '1h')).toBe(true);
    });

    it('should return false for disconnected socket', () => {
      client.subscribe('BTCUSDT', '1h');
      mockWebSocket.readyState = WebSocket.CLOSED;

      expect(client.isConnected('BTCUSDT', '1h')).toBe(false);
    });

    it('should return false for non-existent subscription', () => {
      expect(client.isConnected('BTCUSDT', '1h')).toBe(false);
    });
  });

  describe('getLatestKline', () => {
    it('should return latest kline for subscribed stream', () => {
      const mockMessage = generateMockWebSocketMessage('BTCUSDT', '1h', false);

      client.subscribe('BTCUSDT', '1h');

      const messageHandler = eventHandlers.get('message');
      if (messageHandler) {
        messageHandler(JSON.stringify(mockMessage));
      }

      const kline = client.getLatestKline('BTCUSDT', '1h');
      expect(kline).toBeDefined();
    });

    it('should return null for unsubscribed stream', () => {
      const kline = client.getLatestKline('BTCUSDT', '1h');
      expect(kline).toBeNull();
    });
  });

  describe('getAllLatestKlines', () => {
    it('should return all latest klines', () => {
      const mockMessage1 = generateMockWebSocketMessage('BTCUSDT', '1h', false);
      const mockMessage2 = generateMockWebSocketMessage('ETHUSDT', '1h', false);

      client.subscribe('BTCUSDT', '1h');

      const handler1 = eventHandlers.get('message');
      if (handler1) {
        handler1(JSON.stringify(mockMessage1));
      }

      eventHandlers.clear();
      client.subscribe('ETHUSDT', '1h');

      const handler2 = eventHandlers.get('message');
      if (handler2) {
        handler2(JSON.stringify(mockMessage2));
      }

      const allKlines = client.getAllLatestKlines();
      expect(allKlines.size).toBeGreaterThan(0);
    });
  });

  describe('close', () => {
    it('should close all connections', () => {
      client.subscribe('BTCUSDT', '1h');

      eventHandlers.clear();
      const closeSpy1 = mockWebSocket.close;

      client.subscribe('ETHUSDT', '1h');
      const closeSpy2 = mockWebSocket.close;

      client.close();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should prevent reconnection attempts after close', () => {
      client.subscribe('BTCUSDT', '1h');
      client.close();

      const closeHandler = eventHandlers.get('close');
      if (closeHandler) {
        closeHandler();
      }

      expect(WebSocket).toHaveBeenCalledTimes(1);
    });
  });
});
