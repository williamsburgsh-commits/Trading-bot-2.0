import { TTLCache } from '../cache';

describe('TTLCache', () => {
  let cache: TTLCache<string>;

  beforeEach(() => {
    cache = new TTLCache<string>(1000); // 1 second default TTL
  });

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should invalidate specific keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', { ttlMs: 100 });

      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const shortCache = new TTLCache<string>(50);
      shortCache.set('key1', 'value1');

      expect(shortCache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(shortCache.get('key1')).toBeNull();
    });

    it('should handle custom TTL per entry', async () => {
      cache.set('short', 'value1', { ttlMs: 50 });
      cache.set('long', 'value2', { ttlMs: 200 });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get('short')).toBeNull();
      expect(cache.get('long')).toBe('value2');
    });
  });

  describe('midnight UTC expiration', () => {
    it('should set expiration to next midnight UTC', () => {
      cache.set('key1', 'value1', { expiresAtMidnightUTC: true });

      const entry = (cache as any).cache.get('key1');
      expect(entry).toBeDefined();

      const now = new Date();
      const midnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
      );

      expect(entry.expiresAt).toBe(midnight.getTime());
    });

    it('should not expire before midnight UTC', () => {
      cache.set('key1', 'value1', { expiresAtMidnightUTC: true });
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('pattern invalidation', () => {
    it('should invalidate keys matching pattern', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');
      cache.set('product:1', 'value3');

      cache.invalidatePattern(/^user:/);

      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('product:1')).toBe('value3');
    });

    it('should handle complex patterns', () => {
      cache.set('BTCUSDT:1h:100', 'value1');
      cache.set('BTCUSDT:1d:100', 'value2');
      cache.set('ETHUSDT:1h:100', 'value3');

      cache.invalidatePattern(/BTCUSDT:1h/);

      expect(cache.get('BTCUSDT:1h:100')).toBeNull();
      expect(cache.get('BTCUSDT:1d:100')).toBe('value2');
      expect(cache.get('ETHUSDT:1h:100')).toBe('value3');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      cache.set('key1', 'value1', { ttlMs: 50 });
      cache.set('key2', 'value2', { ttlMs: 200 });

      expect(cache.size()).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      cache.cleanup();

      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });

    it('should handle empty cache', () => {
      expect(() => cache.cleanup()).not.toThrow();
      expect(cache.size()).toBe(0);
    });
  });

  describe('key generation', () => {
    it('should generate keys from parts', () => {
      const key1 = TTLCache.generateKey(['BTCUSDT', '1h', 100]);
      const key2 = TTLCache.generateKey(['ETHUSDT', '1d', 200]);

      expect(key1).toBe('BTCUSDT:1h:100');
      expect(key2).toBe('ETHUSDT:1d:200');
    });

    it('should handle undefined parts', () => {
      const key = TTLCache.generateKey(['BTCUSDT', '1h', undefined, 100]);
      expect(key).toBe('BTCUSDT:1h:100');
    });

    it('should convert numbers to strings', () => {
      const key = TTLCache.generateKey(['symbol', 12345]);
      expect(key).toBe('symbol:12345');
    });
  });

  describe('size tracking', () => {
    it('should track cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.invalidate('key1');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });
});
