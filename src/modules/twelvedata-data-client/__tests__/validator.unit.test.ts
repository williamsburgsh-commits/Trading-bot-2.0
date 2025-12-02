import { TwelveDataResponseValidator } from '../validator';

describe('TwelveDataResponseValidator', () => {
  describe('isErrorResponse', () => {
    it('should identify error responses', () => {
      const errorResponse = {
        status: 'error',
        code: 400,
        message: 'Invalid API key',
      };

      expect(TwelveDataResponseValidator.isErrorResponse(errorResponse)).toBe(true);
    });

    it('should reject valid responses', () => {
      const validResponse = {
        status: 'ok',
        meta: { symbol: 'EUR/USD' },
        values: [],
      };

      expect(TwelveDataResponseValidator.isErrorResponse(validResponse)).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(TwelveDataResponseValidator.isErrorResponse(null)).toBe(false);
      expect(TwelveDataResponseValidator.isErrorResponse(undefined)).toBe(false);
      expect(TwelveDataResponseValidator.isErrorResponse('error')).toBe(false);
      expect(TwelveDataResponseValidator.isErrorResponse(123)).toBe(false);
    });
  });

  describe('validateTimeSeriesResponse', () => {
    it('should validate correct response', () => {
      const response = {
        status: 'ok',
        meta: {
          symbol: 'EUR/USD',
          interval: '1h',
          type: 'forex',
        },
        values: [
          {
            datetime: '2024-01-01 10:00:00',
            open: '1.0800',
            high: '1.0820',
            low: '1.0790',
            close: '1.0810',
            volume: '1000',
          },
        ],
      };

      expect(() => TwelveDataResponseValidator.validateTimeSeriesResponse(response)).not.toThrow();
    });

    it('should throw on error response', () => {
      const errorResponse = {
        status: 'error',
        code: 401,
        message: 'Invalid API key',
      };

      expect(() =>
        TwelveDataResponseValidator.validateTimeSeriesResponse(errorResponse)
      ).toThrow('Twelve Data API error');
    });

    it('should throw on non-object', () => {
      expect(() => TwelveDataResponseValidator.validateTimeSeriesResponse(null)).toThrow(
        'expected object'
      );
      expect(() => TwelveDataResponseValidator.validateTimeSeriesResponse('invalid')).toThrow(
        'expected object'
      );
    });

    it('should throw on missing meta', () => {
      const response = {
        status: 'ok',
        values: [],
      };

      expect(() => TwelveDataResponseValidator.validateTimeSeriesResponse(response)).toThrow(
        'missing meta object'
      );
    });

    it('should throw on non-array values', () => {
      const response = {
        status: 'ok',
        meta: { symbol: 'EUR/USD' },
        values: 'not-an-array',
      };

      expect(() => TwelveDataResponseValidator.validateTimeSeriesResponse(response)).toThrow(
        'values must be an array'
      );
    });

    it('should throw on invalid status', () => {
      const response = {
        status: 'pending',
        meta: { symbol: 'EUR/USD' },
        values: [],
      };

      expect(() => TwelveDataResponseValidator.validateTimeSeriesResponse(response)).toThrow(
        'Invalid response status'
      );
    });
  });

  describe('validateCandle', () => {
    it('should validate correct candle', () => {
      const candle = {
        datetime: '2024-01-01 10:00:00',
        open: '1.0800',
        high: '1.0820',
        low: '1.0790',
        close: '1.0810',
        volume: '1000',
      };

      expect(TwelveDataResponseValidator.validateCandle(candle)).toBe(true);
    });

    it('should validate candle without volume', () => {
      const candle = {
        datetime: '2024-01-01 10:00:00',
        open: '1.0800',
        high: '1.0820',
        low: '1.0790',
        close: '1.0810',
      };

      expect(TwelveDataResponseValidator.validateCandle(candle)).toBe(true);
    });

    it('should reject incomplete candle', () => {
      const candle = {
        datetime: '2024-01-01 10:00:00',
        open: '1.0800',
        // missing high, low, close
      };

      expect(TwelveDataResponseValidator.validateCandle(candle)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(TwelveDataResponseValidator.validateCandle(null)).toBe(false);
      expect(TwelveDataResponseValidator.validateCandle(undefined)).toBe(false);
      expect(TwelveDataResponseValidator.validateCandle('invalid')).toBe(false);
    });

    it('should reject candle with wrong types', () => {
      const candle = {
        datetime: 123456789, // should be string
        open: '1.0800',
        high: '1.0820',
        low: '1.0790',
        close: '1.0810',
      };

      expect(TwelveDataResponseValidator.validateCandle(candle)).toBe(false);
    });
  });
});
