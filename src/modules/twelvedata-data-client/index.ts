import { TwelveDataRestClient } from './rest-client';
import { TTLCache } from '../../lib/cache';
import {
  TwelveDataClientConfig,
  TwelveDataSymbol,
  TwelveDataTimeframe,
  SYMBOL_MAP,
  TIMEFRAME_INTERVAL_MAP,
} from './types';
import { KlineData } from '../../types';

export class TwelveDataClient {
  private restClient: TwelveDataRestClient;

  constructor(config: TwelveDataClientConfig) {
    this.restClient = new TwelveDataRestClient(config);
  }

  async getKlines(
    symbol: TwelveDataSymbol,
    timeframe: TwelveDataTimeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    return this.restClient.getKlines(symbol, timeframe, limit);
  }

  async getHistoricalKlines(
    symbol: TwelveDataSymbol,
    timeframe: TwelveDataTimeframe,
    startDate: string,
    endDate: string
  ): Promise<KlineData[]> {
    return this.restClient.getHistoricalKlines(symbol, timeframe, startDate, endDate);
  }

  getCache(): TTLCache<KlineData[]> {
    return this.restClient.getCache();
  }

  clearCache(): void {
    this.restClient.clearCache();
  }
}

export type { TwelveDataSymbol, TwelveDataTimeframe, TwelveDataClientConfig };
export { SYMBOL_MAP, TIMEFRAME_INTERVAL_MAP };
export { TwelveDataRestClient } from './rest-client';
export { TwelveDataResponseValidator } from './validator';
