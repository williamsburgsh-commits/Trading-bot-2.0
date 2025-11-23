import { BinanceResponseValidator } from '../validator';
import {
  generateMockBinanceKline,
  generateMockBinanceKlines,
  generateInvalidBinanceKline,
  generateInvalidStructureKline,
  generateMockWebSocketMessage,
  generateInvalidWebSocketMessage,
} from './fixtures';

describe('BinanceResponseValidator', () => {
  describe('validateKlineResponse', () => {
    it('should validate a valid kline response array', () => {
      const mockKlines = generateMockBinanceKlines(10);
      const result = BinanceResponseValidator.validateKlineResponse(mockKlines);
      expect(result).toBe(true);
    });

    it('should reject non-array input', () => {
      const result = BinanceResponseValidator.validateKlineResponse({});
      expect(result).toBe(false);
    });

    it('should reject array with invalid kline data', () => {
      const invalidKlines = [
        generateMockBinanceKline(),
        generateInvalidBinanceKline(),
      ];
      const result = BinanceResponseValidator.validateKlineResponse(invalidKlines);
      expect(result).toBe(false);
    });

    it('should accept empty array', () => {
      const result = BinanceResponseValidator.validateKlineResponse([]);
      expect(result).toBe(true);
    });
  });

  describe('validateKlineArray', () => {
    it('should validate a valid kline array', () => {
      const mockKline = generateMockBinanceKline();
      const result = BinanceResponseValidator.validateKlineArray(mockKline);
      
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('openTime');
      expect(result).toHaveProperty('open');
      expect(result).toHaveProperty('high');
      expect(result).toHaveProperty('low');
      expect(result).toHaveProperty('close');
      expect(result).toHaveProperty('volume');
    });

    it('should reject invalid kline with NaN values', () => {
      const invalidKline = generateInvalidBinanceKline();
      const result = BinanceResponseValidator.validateKlineArray(invalidKline);
      expect(result).toBeNull();
    });

    it('should reject kline with insufficient data', () => {
      const shortKline = [Date.now(), '50000', '50100'];
      const result = BinanceResponseValidator.validateKlineArray(shortKline);
      expect(result).toBeNull();
    });

    it('should reject kline with invalid structure', () => {
      const invalidKline = generateInvalidStructureKline();
      const result = BinanceResponseValidator.validateKlineArray(invalidKline);
      expect(result).toBeNull();
    });

    it('should reject kline where high < low', () => {
      const invalidKline = [
        Date.now(),
        '50000',
        '49000',
        '50000',
        '49500',
        '100',
        Date.now() + 60000,
        '4950000',
        100,
        '50',
        '2475000',
        '0',
      ];
      const result = BinanceResponseValidator.validateKlineArray(invalidKline);
      expect(result).toBeNull();
    });

    it('should reject kline with wrong data types', () => {
      const invalidKline = [
        'not-a-number',
        '50000',
        '50100',
        '49900',
        '50000',
        '100',
        Date.now() + 60000,
        '5000000',
        100,
        '50',
        '2500000',
        '0',
      ];
      const result = BinanceResponseValidator.validateKlineArray(invalidKline);
      expect(result).toBeNull();
    });
  });

  describe('validateWebSocketMessage', () => {
    it('should validate a valid WebSocket message', () => {
      const mockMessage = generateMockWebSocketMessage();
      const result = BinanceResponseValidator.validateWebSocketMessage(mockMessage);
      expect(result).toBe(true);
    });

    it('should reject message with wrong event type', () => {
      const invalidMessage = generateInvalidWebSocketMessage();
      const result = BinanceResponseValidator.validateWebSocketMessage(invalidMessage);
      expect(result).toBe(false);
    });

    it('should reject message without kline data', () => {
      const invalidMessage = {
        e: 'kline',
        E: Date.now(),
        s: 'BTCUSDT',
      };
      const result = BinanceResponseValidator.validateWebSocketMessage(invalidMessage);
      expect(result).toBe(false);
    });

    it('should reject message with incomplete kline data', () => {
      const invalidMessage = {
        e: 'kline',
        E: Date.now(),
        s: 'BTCUSDT',
        k: {
          t: Date.now(),
          o: '50000',
        },
      };
      const result = BinanceResponseValidator.validateWebSocketMessage(invalidMessage);
      expect(result).toBe(false);
    });

    it('should reject null or undefined input', () => {
      expect(BinanceResponseValidator.validateWebSocketMessage(null)).toBe(false);
      expect(BinanceResponseValidator.validateWebSocketMessage(undefined)).toBe(false);
    });

    it('should validate message with final kline', () => {
      const mockMessage = generateMockWebSocketMessage('BTCUSDT', '1h', true);
      const result = BinanceResponseValidator.validateWebSocketMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockMessage.k.x).toBe(true);
    });
  });
});
