import { KlineData } from '../../types';
import { CacheEntry, CacheKey } from './types';

export class AlphaVantageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) {
    this.defaultTTL = defaultTTL;
  }

  get(key: CacheKey): KlineData[] | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  set(key: CacheKey, data: KlineData[], ttl?: number): void {
    const cacheKey = this.generateKey(key);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private generateKey(key: CacheKey): string {
    const parts = [key.symbol.replace('/', '_'), key.timeframe];

    if (key.startTime !== undefined) {
      parts.push(key.startTime.toString());
    }

    if (key.endTime !== undefined) {
      parts.push(key.endTime.toString());
    }

    return parts.join(':');
  }

  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
