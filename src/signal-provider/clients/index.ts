export interface IMarketDataClient {
  fetchKlines(symbol: string, interval: string, limit: number): Promise<unknown[]>;
  subscribeToUpdates(symbol: string, interval: string): void;
  disconnect(): void;
}

export interface IStorageClient {
  save(data: unknown): Promise<void>;
  find(query: unknown): Promise<unknown[]>;
}
