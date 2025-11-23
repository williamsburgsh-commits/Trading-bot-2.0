import { BinanceCache } from '../cache';
import { CacheKey } from '../types';
import { generateMockKlineData } from './fixtures';

describe('BinanceCache', () => {
  let cache: BinanceCache;

  beforeEach(() => {
    cache = new BinanceCache(1000);
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve cached data', () => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data);
      const result = cache.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const result = cache.get(key);

      expect(result).toBeNull();
    });

    it('should return null for expired cache', (done) => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data, 100);

      setTimeout(() => {
        const result = cache.get(key);
        expect(result).toBeNull();
        done();
      }, 150);
    });

    it('should use default TTL when not specified', () => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data);
      const result = cache.get(key);

      expect(result).toEqual(data);
    });

    it('should handle custom TTL', (done) => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data, 50);

      setTimeout(() => {
        const result = cache.get(key);
        expect(result).toBeNull();
        done();
      }, 100);
    });
  });

  describe('has', () => {
    it('should return true for cached key', () => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data);
      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      expect(cache.has(key)).toBe(false);
    });

    it('should return false for expired cache', (done) => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data, 50);

      setTimeout(() => {
        expect(cache.has(key)).toBe(false);
        done();
      }, 100);
    });
  });

  describe('invalidate', () => {
    it('should remove specific cache entry', () => {
      const key: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key, data);
      expect(cache.has(key)).toBe(true);

      cache.invalidate(key);
      expect(cache.has(key)).toBe(false);
    });

    it('should not affect other cache entries', () => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'ETHUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);

      cache.invalidate(key1);

      expect(cache.has(key1)).toBe(false);
      expect(cache.has(key2)).toBe(true);
    });
  });

  describe('invalidateSymbol', () => {
    it('should remove all cache entries for a symbol', () => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'BTCUSDT', timeframe: '4h', limit: 200 };
      const key3: CacheKey = { symbol: 'ETHUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);
      cache.set(key3, data);

      cache.invalidateSymbol('BTCUSDT');

      expect(cache.has(key1)).toBe(false);
      expect(cache.has(key2)).toBe(false);
      expect(cache.has(key3)).toBe(true);
    });
  });

  describe('invalidateTimeframe', () => {
    it('should remove all cache entries for a timeframe', () => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'ETHUSDT', timeframe: '1h', limit: 100 };
      const key3: CacheKey = { symbol: 'BTCUSDT', timeframe: '4h', limit: 200 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);
      cache.set(key3, data);

      cache.invalidateTimeframe('1h');

      expect(cache.has(key1)).toBe(false);
      expect(cache.has(key2)).toBe(false);
      expect(cache.has(key3)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', () => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'ETHUSDT', timeframe: '4h', limit: 200 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);

      expect(cache.size()).toBe(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has(key1)).toBe(false);
      expect(cache.has(key2)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'ETHUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key1, data, 50);
      cache.set(key2, data, 2000);

      expect(cache.size()).toBe(2);

      setTimeout(() => {
        cache.cleanup();
        expect(cache.size()).toBe(1);
        expect(cache.has(key1)).toBe(false);
        expect(cache.has(key2)).toBe(true);
        done();
      }, 100);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'ETHUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      expect(cache.size()).toBe(1);

      cache.set(key2, data);
      expect(cache.size()).toBe(2);
    });
  });

  describe('cache key generation', () => {
    it('should differentiate between different symbols', () => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'ETHUSDT', timeframe: '1h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);

      expect(cache.size()).toBe(2);
    });

    it('should differentiate between different timeframes', () => {
      const key1: CacheKey = { symbol: 'BTCUSDT', timeframe: '1h', limit: 100 };
      const key2: CacheKey = { symbol: 'BTCUSDT', timeframe: '4h', limit: 100 };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);

      expect(cache.size()).toBe(2);
    });

    it('should include optional parameters in key', () => {
      const key1: CacheKey = { 
        symbol: 'BTCUSDT', 
        timeframe: '1h', 
        startTime: 1000000,
        endTime: 2000000,
      };
      const key2: CacheKey = { 
        symbol: 'BTCUSDT', 
        timeframe: '1h', 
        startTime: 3000000,
        endTime: 4000000,
      };
      const data = [generateMockKlineData()];

      cache.set(key1, data);
      cache.set(key2, data);

      expect(cache.size()).toBe(2);
    });
  });
});
