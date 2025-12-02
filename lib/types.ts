export interface Signal {
  id: string;
  asset: string;
  timeframe: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  status: 'active' | 'filled' | 'closed';
  signalType: 'BUY' | 'SELL';
  category?: 'daily' | 'scalping';
  confidence?: number;
  metadata: {
    assetType: 'crypto' | 'forex';
    rsi?: number;
    macd?: {
      macd: number;
      signal: number;
      histogram: number;
    };
    volumeRatio?: number;
    volatility?: number;
    exitPrice?: number;
    confidence?: number;
    backtestWinRate?: number;
    backtestTrades?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignalsResponse {
  signals: Signal[];
  total: number;
  metrics: {
    winRate: number;
    avgProfit: number;
    totalSignals: number;
    closedSignals: number;
    activeSignals: number;
  };
}

export interface FilterOptions {
  status?: string;
  asset?: string;
  assetType?: 'crypto' | 'forex';
  signalType?: 'BUY' | 'SELL';
}

export interface UserSettings {
  enabledAssets: string[];
  notificationChannels: {
    email: boolean;
    push: boolean;
    webhook: boolean;
  };
  preferredTimeframes: string[];
  riskLevel: number;
}

export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'forex';
  enabled: boolean;
}
