import { promises as fs } from 'fs';
import * as path from 'path';
import type { KVAdapter } from '../../../lib/kv';

export interface StoredSignal {
  id: string;
  asset: string;
  timeframe: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  status: 'active' | 'filled' | 'closed';
  signalType: 'BUY' | 'SELL';
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredUserSettings {
  userId: string;
  enabledAssets: string[];
  notificationChannels: {
    email: boolean;
    push: boolean;
    webhook: boolean;
  };
  preferredTimeframes: string[];
  riskLevel: number;
  updatedAt: string;
}

export interface SignalFilters {
  asset?: string;
  timeframe?: string;
  status?: string;
  signalType?: 'BUY' | 'SELL';
  category?: 'daily' | 'scalping';
  limit?: number;
  offset?: number;
}

export class StorageAdapter {
  private kvAdapter: KVAdapter | null = null;
  private useKV: boolean = false;
  private dataDir: string = path.join(process.cwd(), 'data');
  private signalsFile: string = path.join(this.dataDir, 'signals.json');
  private settingsFile: string = path.join(this.dataDir, 'settings.json');

  constructor(kvAdapter?: KVAdapter) {
    if (kvAdapter) {
      this.kvAdapter = kvAdapter;
      this.useKV = true;
    }
  }

  async initialize(): Promise<void> {
    if (this.useKV && this.kvAdapter) {
      try {
        await this.kvAdapter.exists('health-check');
        console.log('✓ Vercel KV connected successfully');
      } catch (error) {
        console.warn('⚠ Vercel KV unavailable, falling back to JSON file storage');
        this.useKV = false;
      }
    }

    if (!this.useKV) {
      await this.ensureDataDirectory();
    }
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  async saveSignal(signal: StoredSignal): Promise<void> {
    if (this.useKV && this.kvAdapter) {
      const key = `signal:${signal.id}`;
      await this.kvAdapter.set(key, signal);

      const indexKey = `signals:index`;
      const existingIds = (await this.kvAdapter.get<string[]>(indexKey)) || [];
      if (!existingIds.includes(signal.id)) {
        existingIds.push(signal.id);
        await this.kvAdapter.set(indexKey, existingIds);
      }
    } else {
      const signals = await this.loadSignalsFromFile();
      const existingIndex = signals.findIndex((s) => s.id === signal.id);

      if (existingIndex >= 0) {
        signals[existingIndex] = signal;
      } else {
        signals.push(signal);
      }

      await this.saveSignalsToFile(signals);
    }
  }

  async getSignals(filters?: SignalFilters): Promise<StoredSignal[]> {
    let signals: StoredSignal[];

    if (this.useKV && this.kvAdapter) {
      signals = await this.loadSignalsFromKV();
    } else {
      signals = await this.loadSignalsFromFile();
    }

    signals = this.filterSignals(signals, filters);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    return signals.slice(offset, offset + limit);
  }

  async countSignals(filters?: SignalFilters): Promise<number> {
    let signals: StoredSignal[];

    if (this.useKV && this.kvAdapter) {
      signals = await this.loadSignalsFromKV();
    } else {
      signals = await this.loadSignalsFromFile();
    }

    return this.filterSignals(signals, filters).length;
  }

  async getSignalById(id: string): Promise<StoredSignal | null> {
    if (this.useKV && this.kvAdapter) {
      const key = `signal:${id}`;
      return this.kvAdapter.get<StoredSignal>(key);
    } else {
      const signals = await this.loadSignalsFromFile();
      return signals.find((s) => s.id === id) || null;
    }
  }

  async updateSignalStatus(id: string, status: StoredSignal['status']): Promise<void> {
    const signal = await this.getSignalById(id);
    if (!signal) {
      throw new Error(`Signal ${id} not found`);
    }

    signal.status = status;
    signal.updatedAt = new Date().toISOString();
    await this.saveSignal(signal);
  }

  async getUserSettings(userId: string): Promise<StoredUserSettings | null> {
    if (this.useKV && this.kvAdapter) {
      const key = `settings:${userId}`;
      return this.kvAdapter.get<StoredUserSettings>(key);
    } else {
      const allSettings = await this.loadSettingsFromFile();
      return allSettings[userId] || null;
    }
  }

  async saveUserSettings(settings: StoredUserSettings): Promise<void> {
    settings.updatedAt = new Date().toISOString();

    if (this.useKV && this.kvAdapter) {
      const key = `settings:${settings.userId}`;
      await this.kvAdapter.set(key, settings);
    } else {
      const allSettings = await this.loadSettingsFromFile();
      allSettings[settings.userId] = settings;
      await this.saveSettingsToFile(allSettings);
    }
  }

  private async loadSignalsFromKV(): Promise<StoredSignal[]> {
    if (!this.kvAdapter) return [];

    try {
      const indexKey = 'signals:index';
      const signalIds = (await this.kvAdapter.get<string[]>(indexKey)) || [];

      const signals: StoredSignal[] = [];
      for (const id of signalIds) {
        const signal = await this.kvAdapter.get<StoredSignal>(`signal:${id}`);
        if (signal) {
          signals.push(signal);
        }
      }

      return signals.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error loading signals from KV:', error);
      return [];
    }
  }

  private async loadSignalsFromFile(): Promise<StoredSignal[]> {
    try {
      const data = await fs.readFile(this.signalsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveSignalsToFile(signals: StoredSignal[]): Promise<void> {
    await fs.writeFile(this.signalsFile, JSON.stringify(signals, null, 2), 'utf-8');
  }

  private async loadSettingsFromFile(): Promise<Record<string, StoredUserSettings>> {
    try {
      const data = await fs.readFile(this.settingsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  private async saveSettingsToFile(settings: Record<string, StoredUserSettings>): Promise<void> {
    await fs.writeFile(this.settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
  }

  private filterSignals(signals: StoredSignal[], filters?: SignalFilters): StoredSignal[] {
    if (!filters) return signals;

    return signals.filter((signal) => {
      if (filters.asset && signal.asset !== filters.asset) {
        return false;
      }

      if (filters.timeframe && signal.timeframe !== filters.timeframe) {
        return false;
      }

      if (filters.status && signal.status !== filters.status) {
        return false;
      }

      if (filters.signalType && signal.signalType !== filters.signalType) {
        return false;
      }

      if (filters.category) {
        const isDaily = ['1d', '4h'].includes(signal.timeframe);
        const isScalping = ['5m', '15m', '30m', '1h'].includes(signal.timeframe);

        if (filters.category === 'daily' && !isDaily) {
          return false;
        }

        if (filters.category === 'scalping' && !isScalping) {
          return false;
        }
      }

      return true;
    });
  }
}
