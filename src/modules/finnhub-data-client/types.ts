import { KlineData } from '../../types';

export type FinnhubForexPair = 'USD/JPY' | 'EUR/USD' | 'GBP/USD';
export type FinnhubTimeframe = '5m' | '15m' | '1h' | '4h';

// Finnhub uses different symbol format: OANDA:EUR_USD
export const FOREX_SYMBOL_MAP: Record<FinnhubForexPair, string> = {
  'USD/JPY': 'OANDA:USD_JPY',
  'EUR/USD': 'OANDA:EUR_USD',
  'GBP/USD': 'OANDA:GBP_USD',
};

// Finnhub resolution mapping
export const TIMEFRAME_RESOLUTION_MAP: Record<FinnhubTimeframe, string> = {
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
};

export interface FinnhubCandleResponse {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status (ok, no_data)
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

export interface CacheEntry {
  data: KlineData[];
  timestamp: number;
  expiresAt: number;
}

export interface CacheKey {
  symbol: FinnhubForexPair;
  timeframe: FinnhubTimeframe;
  startTime?: number;
  endTime?: number;
}

export interface FinnhubClientConfig {
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
