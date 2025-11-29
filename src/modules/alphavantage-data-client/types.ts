import { KlineData } from '../../types';

export type AlphaVantageForexPair = 'USD/JPY' | 'EUR/USD' | 'GBP/USD';
export type AlphaVantageTimeframe = '5m' | '15m' | '1h' | '4h';

// Alpha Vantage uses separate from_symbol and to_symbol
export const FOREX_PAIR_MAP: Record<AlphaVantageForexPair, { from: string; to: string }> = {
  'USD/JPY': { from: 'USD', to: 'JPY' },
  'EUR/USD': { from: 'EUR', to: 'USD' },
  'GBP/USD': { from: 'GBP', to: 'USD' },
};

// Alpha Vantage interval mapping
export const TIMEFRAME_INTERVAL_MAP: Record<AlphaVantageTimeframe, string> = {
  '5m': '5min',
  '15m': '15min',
  '1h': '60min',
  '4h': '60min', // Will aggregate 1h candles for 4h
};

export interface AlphaVantageTimeSeriesEntry {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
}

export interface AlphaVantageMetaData {
  '1. Information': string;
  '2. From Symbol': string;
  '3. To Symbol': string;
  '4. Last Refreshed': string;
  '5. Interval': string;
  '6. Output Size': string;
  '7. Time Zone': string;
}

export interface AlphaVantageResponse {
  'Meta Data': AlphaVantageMetaData;
  'Time Series FX (Intraday)': Record<string, AlphaVantageTimeSeriesEntry>;
  Note?: string;
  Information?: string;
  'Error Message'?: string;
}

export interface CacheEntry {
  data: KlineData[];
  timestamp: number;
  expiresAt: number;
}

export interface CacheKey {
  symbol: AlphaVantageForexPair;
  timeframe: AlphaVantageTimeframe;
  startTime?: number;
  endTime?: number;
}

export interface AlphaVantageClientConfig {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  cacheTTL?: number;
  rateLimit?: {
    maxRequests: number;
    perMinutes: number;
  };
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}
