import { AlphaVantageRestClient } from './rest-client';
import { AlphaVantageCache } from './cache';
import {
  AlphaVantageClientConfig,
  AlphaVantageForexPair,
  AlphaVantageTimeframe,
  FOREX_PAIR_MAP,
  TIMEFRAME_INTERVAL_MAP,
} from './types';
import { KlineData } from '../../types';

export class AlphaVantageDataClient {
  private restClient: AlphaVantageRestClient;

  constructor(config: AlphaVantageClientConfig) {
    this.restClient = new AlphaVantageRestClient(config);
  }

  async getCandles(
    symbol: AlphaVantageForexPair,
    timeframe: AlphaVantageTimeframe,
    startTime: number,
    endTime: number
  ): Promise<KlineData[]> {
    return this.restClient.getCandles(symbol, timeframe, startTime, endTime);
  }

  async getLatestCandles(
    symbol: AlphaVantageForexPair,
    timeframe: AlphaVantageTimeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    return this.restClient.getLatestCandles(symbol, timeframe, limit);
  }

  getCache(): AlphaVantageCache {
    return this.restClient.getCache();
  }

  clearCache(): void {
    this.restClient.clearCache();
  }
}

export type { AlphaVantageForexPair, AlphaVantageTimeframe, AlphaVantageClientConfig };
export { FOREX_PAIR_MAP, TIMEFRAME_INTERVAL_MAP };
export { AlphaVantageRestClient } from './rest-client';
export { AlphaVantageCache } from './cache';
export { AlphaVantageResponseValidator } from './validator';
