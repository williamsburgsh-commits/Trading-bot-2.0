import { KlineData } from '../../types';

export type BinanceSymbol = 'BTCUSDT' | 'ETHUSDT' | 'XRPUSDT' | 'SOLUSDT';
export type BinanceTimeframe = '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface BinanceKlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

export interface BinanceWebSocketKline {
  t: number;
  T: number;
  s: string;
  i: string;
  f: number;
  L: number;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
  x: boolean;
  q: string;
  V: string;
  Q: string;
  B: string;
}

export interface BinanceWebSocketMessage {
  e: string;
  E: number;
  s: string;
  k: BinanceWebSocketKline;
}

export interface CacheEntry {
  data: KlineData[];
  timestamp: number;
  expiresAt: number;
}

export interface CacheKey {
  symbol: BinanceSymbol;
  timeframe: BinanceTimeframe;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface BinanceClientConfig {
  baseUrl?: string;
  wsBaseUrl?: string;
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

export interface KlineUpdateEvent {
  symbol: BinanceSymbol;
  timeframe: BinanceTimeframe;
  kline: KlineData;
  isFinal: boolean;
}

export interface ConnectionStatusEvent {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  timestamp: number;
  message?: string;
}

export type BinanceEventType = 'klineUpdate' | 'connectionStatus' | 'error';

export interface BinanceEventMap {
  klineUpdate: KlineUpdateEvent;
  connectionStatus: ConnectionStatusEvent;
  error: Error;
}
