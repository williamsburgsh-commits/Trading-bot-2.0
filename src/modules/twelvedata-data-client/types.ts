import { KlineData } from '../../types';

export type TwelveDataSymbol = 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'XAU/USD';
export type TwelveDataTimeframe = '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

export interface TwelveDataTimeSeriesResponse {
  meta: {
    symbol: string;
    interval: string;
    currency_base?: string;
    currency_quote?: string;
    type: string;
  };
  values: TwelveDataCandle[];
  status: string;
}

export interface TwelveDataErrorResponse {
  code: number;
  message: string;
  status: string;
}

export interface TwelveDataClientConfig {
  apiKey: string;
  baseUrl?: string;
  cacheTTL?: number;
  rateLimit?: {
    maxRequests: number;
    perMinutes: number;
  };
}

export interface CacheKey {
  symbol: TwelveDataSymbol;
  timeframe: TwelveDataTimeframe;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const TIMEFRAME_INTERVAL_MAP: Record<TwelveDataTimeframe, string> = {
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
};

export const SYMBOL_MAP: Record<TwelveDataSymbol, string> = {
  'EUR/USD': 'EUR/USD',
  'GBP/USD': 'GBP/USD',
  'USD/JPY': 'USD/JPY',
  'XAU/USD': 'XAU/USD',
};
