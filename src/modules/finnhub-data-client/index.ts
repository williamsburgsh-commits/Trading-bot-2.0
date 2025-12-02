import { FinnhubRestClient } from './rest-client';
import { FinnhubCache } from './cache';
import { FinnhubForexPair, FinnhubTimeframe, FinnhubClientConfig } from './types';

export class FinnhubDataClient {
  private restClient: FinnhubRestClient;

  constructor(config: FinnhubClientConfig) {
    this.restClient = new FinnhubRestClient(config);
  }

  async getCandles(
    symbol: FinnhubForexPair,
    timeframe: FinnhubTimeframe,
    startTime: number,
    endTime: number
  ) {
    return this.restClient.getCandles(symbol, timeframe, startTime, endTime);
  }

  async getLatestCandles(
    symbol: FinnhubForexPair,
    timeframe: FinnhubTimeframe,
    limit: number = 500
  ) {
    return this.restClient.getLatestCandles(symbol, timeframe, limit);
  }

  getCache(): FinnhubCache {
    return this.restClient.getCache();
  }

  clearCache(): void {
    this.restClient.clearCache();
  }
}

export * from './types';
export { FinnhubRestClient } from './rest-client';
export { FinnhubCache } from './cache';
export { FinnhubResponseValidator } from './validator';
