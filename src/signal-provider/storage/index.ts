import { Signal } from '../signals';

export interface ISignalRepository {
  save(signal: Signal): Promise<void>;
  findById(id: string): Promise<Signal | null>;
  findBySymbol(symbol: string, limit?: number): Promise<Signal[]>;
  findRecent(limit: number): Promise<Signal[]>;
}

export interface IStorageService {
  signals: ISignalRepository;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export type {
  StoredSignal,
  StoredUserSettings,
  SignalFilters,
} from './adapter';
export { StorageAdapter } from './adapter';
