export interface Signal {
  id?: string;
  asset: string;
  timeframe: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  status: string;
  signalType: 'BUY' | 'SELL';
  metadata?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MarketData {
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface KlineData {
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

export interface StrategyConfig {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  volumeThreshold: number;
}

export interface AlertConfig {
  enabled: boolean;
  console: boolean;
  webhook?: {
    url: string;
    enabled: boolean;
  };
  email?: {
    from: string;
    to: string;
    enabled: boolean;
  };
}

export interface MonitorConfig {
  interval: string;
  assets: string[];
  timeframes: string[];
  rateLimit: {
    maxRequests: number;
    perMinutes: number;
  };
}
