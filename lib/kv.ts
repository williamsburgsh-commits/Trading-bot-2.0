import { kv as vercelKv } from '@vercel/kv';

export interface KVAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, expiresIn?: number): Promise<void>;
  delete(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
}

class VercelKVAdapter implements KVAdapter {
  async get<T = unknown>(key: string): Promise<T | null> {
    return vercelKv.get<T>(key);
  }

  async set(key: string, value: unknown, expiresIn?: number): Promise<void> {
    if (expiresIn) {
      await vercelKv.set(key, value, { ex: expiresIn });
    } else {
      await vercelKv.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await vercelKv.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return vercelKv.keys(pattern);
  }

  async exists(key: string): Promise<boolean> {
    const result = await vercelKv.exists(key);
    return result === 1;
  }
}

export const kv: KVAdapter = new VercelKVAdapter();
export default kv;
