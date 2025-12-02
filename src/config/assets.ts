/**
 * Centralized asset definitions and metadata
 */

export type AssetType = 'crypto' | 'forex' | 'commodity';

export type CryptoSymbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT' | 'XRPUSDT';
export type ForexSymbol = 'EUR/USD' | 'GBP/USD' | 'USD/JPY';
export type CommoditySymbol = 'XAU/USD';

export type AllSymbols = CryptoSymbol | ForexSymbol | CommoditySymbol;

export type Timeframe = '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface AssetMetadata {
  symbol: string;
  type: AssetType;
  displayName: string;
  provider: 'binance' | 'twelvedata';
  supportedTimeframes: Timeframe[];
  cacheTTL: {
    scalping: number; // For 5m, 15m, 30m
    intraday: number; // For 1h, 4h
    daily: boolean; // true = expires at midnight UTC
  };
}

export const CRYPTO_SYMBOLS: CryptoSymbol[] = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
];

export const FOREX_SYMBOLS: ForexSymbol[] = ['EUR/USD', 'GBP/USD', 'USD/JPY'];

export const COMMODITY_SYMBOLS: CommoditySymbol[] = ['XAU/USD'];

export const ALL_SYMBOLS: AllSymbols[] = [
  ...CRYPTO_SYMBOLS,
  ...FOREX_SYMBOLS,
  ...COMMODITY_SYMBOLS,
];

export const ASSET_METADATA: Record<AllSymbols, AssetMetadata> = {
  BTCUSDT: {
    symbol: 'BTCUSDT',
    type: 'crypto',
    displayName: 'Bitcoin/USDT',
    provider: 'binance',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000, // 1 minute
      intraday: 300000, // 5 minutes
      daily: true,
    },
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    type: 'crypto',
    displayName: 'Ethereum/USDT',
    provider: 'binance',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    type: 'crypto',
    displayName: 'Solana/USDT',
    provider: 'binance',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  BNBUSDT: {
    symbol: 'BNBUSDT',
    type: 'crypto',
    displayName: 'Binance Coin/USDT',
    provider: 'binance',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  XRPUSDT: {
    symbol: 'XRPUSDT',
    type: 'crypto',
    displayName: 'Ripple/USDT',
    provider: 'binance',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  'EUR/USD': {
    symbol: 'EUR/USD',
    type: 'forex',
    displayName: 'Euro/US Dollar',
    provider: 'twelvedata',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  'GBP/USD': {
    symbol: 'GBP/USD',
    type: 'forex',
    displayName: 'British Pound/US Dollar',
    provider: 'twelvedata',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  'USD/JPY': {
    symbol: 'USD/JPY',
    type: 'forex',
    displayName: 'US Dollar/Japanese Yen',
    provider: 'twelvedata',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
  'XAU/USD': {
    symbol: 'XAU/USD',
    type: 'commodity',
    displayName: 'Gold/US Dollar',
    provider: 'twelvedata',
    supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
    cacheTTL: {
      scalping: 60000,
      intraday: 300000,
      daily: true,
    },
  },
};

export function getAssetType(symbol: string): AssetType {
  const metadata = ASSET_METADATA[symbol as AllSymbols];
  if (!metadata) {
    throw new Error(`Unknown asset symbol: ${symbol}`);
  }
  return metadata.type;
}

export function getAssetProvider(symbol: string): 'binance' | 'twelvedata' {
  const metadata = ASSET_METADATA[symbol as AllSymbols];
  if (!metadata) {
    throw new Error(`Unknown asset symbol: ${symbol}`);
  }
  return metadata.provider;
}

export function getAssetsByType(type: AssetType): AllSymbols[] {
  return ALL_SYMBOLS.filter((symbol) => ASSET_METADATA[symbol].type === type);
}

export function getAssetsByProvider(provider: 'binance' | 'twelvedata'): AllSymbols[] {
  return ALL_SYMBOLS.filter((symbol) => ASSET_METADATA[symbol].provider === provider);
}

export function getCacheTTL(symbol: string, timeframe: Timeframe): number | 'midnight' {
  const metadata = ASSET_METADATA[symbol as AllSymbols];
  if (!metadata) {
    return 60000; // Default 1 minute
  }

  if (timeframe === '1d' && metadata.cacheTTL.daily) {
    return 'midnight';
  }

  if (['5m', '15m', '30m'].includes(timeframe)) {
    return metadata.cacheTTL.scalping;
  }

  return metadata.cacheTTL.intraday;
}
