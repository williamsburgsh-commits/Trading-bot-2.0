import { KlineData } from '../../types';
import { CacheEntry, CacheKey, BinanceSymbol, BinanceTimeframe } from './types';

export class BinanceCache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;

  constructor(ttlMs: number = 60000) {
    this.cache = new Map();
    this.defaultTTL = ttlMs;
  }

  set(key: CacheKey, data: KlineData[], ttlMs?: number): void {
    const cacheKey = this.generateKey(key);
    const ttl = ttlMs ?? this.defaultTTL;
    const now = Date.now();

    const entry: CacheEntry = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(cacheKey, entry);
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

  has(key: CacheKey): boolean {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  invalidate(key: CacheKey): void {
    const cacheKey = this.generateKey(key);
    this.cache.delete(cacheKey);
  }

  invalidateSymbol(symbol: BinanceSymbol): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${symbol}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  invalidateTimeframe(timeframe: BinanceTimeframe): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(`:${timeframe}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  size(): number {
    return this.cache.size;
  }

  private generateKey(key: CacheKey): string {
    const parts: string[] = [key.symbol, key.timeframe];
    
    if (key.limit !== undefined) {
      parts.push(`limit:${key.limit}`);
    }
    
    if (key.startTime !== undefined) {
      parts.push(`start:${key.startTime}`);
    }
    
    if (key.endTime !== undefined) {
      parts.push(`end:${key.endTime}`);
    }

    return parts.join(':');
  }
}
