import { FinnhubCache } from '../cache';
import { CacheKey } from '../types';
import { KlineData } from '../../../types';

describe('FinnhubCache', () => {
  let cache: FinnhubCache;
  const mockKline: KlineData = {
    openTime: 1000,
    open: '1.0',
    high: '1.5',
    low: '0.5',
    close: '1.2',
    volume: '100',
    closeTime: 2000,
    quoteVolume: '0',
    trades: 0,
    takerBuyBaseVolume: '0',
    takerBuyQuoteVolume: '0',
  };

  beforeEach(() => {
    cache = new FinnhubCache(1000);
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const data = [mockKline];

      cache.set(key, data);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      expect(cache.get(key)).toBeNull();
    });

    it('should return null for expired data', (done) => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const data = [mockKline];

      cache.set(key, data, 50);

      setTimeout(() => {
        expect(cache.get(key)).toBeNull();
        done();
      }, 100);
    });

    it('should respect custom TTL', () => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const data = [mockKline];

      cache.set(key, data, 5000);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(data);
    });
  });

  describe('has', () => {
    it('should return true for existing valid key', () => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      cache.set(key, [mockKline]);

      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      expect(cache.has(key)).toBe(false);
    });

    it('should return false for expired key', (done) => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      cache.set(key, [mockKline], 50);

      setTimeout(() => {
        expect(cache.has(key)).toBe(false);
        done();
      }, 100);
    });
  });

  describe('invalidate', () => {
    it('should remove specific key', () => {
      const key: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      cache.set(key, [mockKline]);

      cache.invalidate(key);
      expect(cache.get(key)).toBeNull();
    });
  });

  describe('invalidateSymbol', () => {
    it('should remove all entries for a symbol', () => {
      const key1: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const key2: CacheKey = { symbol: 'EUR/USD', timeframe: '4h' };
      const key3: CacheKey = { symbol: 'USD/JPY', timeframe: '1h' };

      cache.set(key1, [mockKline]);
      cache.set(key2, [mockKline]);
      cache.set(key3, [mockKline]);

      cache.invalidateSymbol('EUR/USD');

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeNull();
      expect(cache.get(key3)).toEqual([mockKline]);
    });
  });

  describe('invalidateTimeframe', () => {
    it('should remove all entries for a timeframe', () => {
      const key1: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const key2: CacheKey = { symbol: 'USD/JPY', timeframe: '1h' };
      const key3: CacheKey = { symbol: 'EUR/USD', timeframe: '4h' };

      cache.set(key1, [mockKline]);
      cache.set(key2, [mockKline]);
      cache.set(key3, [mockKline]);

      cache.invalidateTimeframe('1h');

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeNull();
      expect(cache.get(key3)).toEqual([mockKline]);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const key1: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const key2: CacheKey = { symbol: 'USD/JPY', timeframe: '4h' };

      cache.set(key1, [mockKline]);
      cache.set(key2, [mockKline]);

      cache.clear();

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries only', (done) => {
      const key1: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      const key2: CacheKey = { symbol: 'USD/JPY', timeframe: '4h' };

      cache.set(key1, [mockKline], 50);
      cache.set(key2, [mockKline], 5000);

      setTimeout(() => {
        cache.cleanup();
        expect(cache.get(key1)).toBeNull();
        expect(cache.get(key2)).toEqual([mockKline]);
        done();
      }, 100);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      const key1: CacheKey = { symbol: 'EUR/USD', timeframe: '1h' };
      cache.set(key1, [mockKline]);
      expect(cache.size()).toBe(1);

      const key2: CacheKey = { symbol: 'USD/JPY', timeframe: '4h' };
      cache.set(key2, [mockKline]);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });
});
