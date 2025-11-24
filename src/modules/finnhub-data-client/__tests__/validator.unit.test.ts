import { FinnhubResponseValidator } from '../validator';
import { FinnhubCandleResponse } from '../types';

describe('FinnhubResponseValidator', () => {
  describe('validateCandleResponse', () => {
    it('should validate a valid response', () => {
      const response = {
        c: [1.0, 2.0],
        h: [1.5, 2.5],
        l: [0.5, 1.5],
        o: [1.0, 2.0],
        s: 'ok',
        t: [1000, 2000],
        v: [100, 200],
      };

      expect(FinnhubResponseValidator.validateCandleResponse(response)).toBe(true);
    });

    it('should validate no_data response', () => {
      const response = {
        c: [],
        h: [],
        l: [],
        o: [],
        s: 'no_data',
        t: [],
        v: [],
      };

      expect(FinnhubResponseValidator.validateCandleResponse(response)).toBe(true);
    });

    it('should reject invalid status', () => {
      const response = {
        c: [1.0],
        h: [1.5],
        l: [0.5],
        o: [1.0],
        s: 'error',
        t: [1000],
        v: [100],
      };

      expect(FinnhubResponseValidator.validateCandleResponse(response)).toBe(false);
    });

    it('should reject missing arrays', () => {
      const response = {
        c: [1.0],
        h: [1.5],
        s: 'ok',
      };

      expect(FinnhubResponseValidator.validateCandleResponse(response)).toBe(false);
    });

    it('should reject mismatched array lengths', () => {
      const response = {
        c: [1.0, 2.0],
        h: [1.5],
        l: [0.5],
        o: [1.0],
        s: 'ok',
        t: [1000],
        v: [100],
      };

      expect(FinnhubResponseValidator.validateCandleResponse(response)).toBe(false);
    });

    it('should reject non-object input', () => {
      expect(FinnhubResponseValidator.validateCandleResponse(null)).toBe(false);
      expect(FinnhubResponseValidator.validateCandleResponse(undefined)).toBe(false);
      expect(FinnhubResponseValidator.validateCandleResponse('string')).toBe(false);
    });
  });

  describe('validateCandleData', () => {
    it('should validate correct candle data', () => {
      const response: FinnhubCandleResponse = {
        c: [1.2, 1.3],
        h: [1.5, 1.6],
        l: [1.0, 1.1],
        o: [1.1, 1.2],
        s: 'ok',
        t: [1000, 2000],
        v: [100, 200],
      };

      expect(FinnhubResponseValidator.validateCandleData(response)).toBe(true);
    });

    it('should validate no_data response', () => {
      const response: FinnhubCandleResponse = {
        c: [],
        h: [],
        l: [],
        o: [],
        s: 'no_data',
        t: [],
        v: [],
      };

      expect(FinnhubResponseValidator.validateCandleData(response)).toBe(true);
    });

    it('should reject invalid high/low relationship', () => {
      const response: FinnhubCandleResponse = {
        c: [1.2],
        h: [1.0],
        l: [1.5],
        o: [1.1],
        s: 'ok',
        t: [1000],
        v: [100],
      };

      expect(FinnhubResponseValidator.validateCandleData(response)).toBe(false);
    });

    it('should reject negative prices', () => {
      const response: FinnhubCandleResponse = {
        c: [-1.2],
        h: [1.5],
        l: [1.0],
        o: [1.1],
        s: 'ok',
        t: [1000],
        v: [100],
      };

      expect(FinnhubResponseValidator.validateCandleData(response)).toBe(false);
    });

    it('should reject invalid timestamps', () => {
      const response: FinnhubCandleResponse = {
        c: [1.2],
        h: [1.5],
        l: [1.0],
        o: [1.1],
        s: 'ok',
        t: [0],
        v: [100],
      };

      expect(FinnhubResponseValidator.validateCandleData(response)).toBe(false);
    });

    it('should reject negative volume', () => {
      const response: FinnhubCandleResponse = {
        c: [1.2],
        h: [1.5],
        l: [1.0],
        o: [1.1],
        s: 'ok',
        t: [1000],
        v: [-100],
      };

      expect(FinnhubResponseValidator.validateCandleData(response)).toBe(false);
    });
  });
});
