/**
 * Generic TTL-based cache with support for smart expiration strategies
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttlMs?: number;
  expiresAtMidnightUTC?: boolean;
}

export class TTLCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLMs;
  }

  set(key: string, data: T, options?: CacheOptions): void {
    const now = Date.now();
    let expiresAt: number;

    if (options?.expiresAtMidnightUTC) {
      expiresAt = this.getNextMidnightUTC();
    } else {
      const ttl = options?.ttlMs ?? this.defaultTTL;
      expiresAt = now + ttl;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
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

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  size(): number {
    return this.cache.size;
  }

  private getNextMidnightUTC(): number {
    const now = new Date();
    const midnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
    );
    return midnight.getTime();
  }

  static generateKey(parts: (string | number | undefined)[]): string {
    return parts
      .filter((part) => part !== undefined)
      .map(String)
      .join(':');
  }
}
