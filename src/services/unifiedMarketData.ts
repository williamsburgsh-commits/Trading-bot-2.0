import { KlineData } from '../types';
import { BinanceDataClient, BinanceSymbol, BinanceTimeframe } from '../modules/binance-data-client';
import { AlphaVantageDataClient, AlphaVantageForexPair, AlphaVantageTimeframe } from '../modules/alphavantage-data-client';

export type AssetType = 'crypto' | 'forex';
export type CryptoSymbol = BinanceSymbol;
export type ForexSymbol = AlphaVantageForexPair;
export type AllSymbols = CryptoSymbol | ForexSymbol;
export type Timeframe = BinanceTimeframe;

export interface UnifiedMarketDataConfig {
  binance?: {
    baseUrl?: string;
    cacheTTL?: number;
    rateLimit?: { maxRequests: number; perMinutes: number };
  };
  alphaVantage?: {
    apiKey: string;
    baseUrl?: string;
    cacheTTL?: number;
    rateLimit?: { maxRequests: number; perMinutes: number };
  };
}

export class UnifiedMarketDataService {
  private binanceClient: BinanceDataClient;
  private alphaVantageClient?: AlphaVantageDataClient;
  private cryptoSymbols: Set<string> = new Set(['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT']);
  private forexSymbols: Set<string> = new Set(['USD/JPY', 'EUR/USD', 'GBP/USD']);

  constructor(config: UnifiedMarketDataConfig) {
    this.binanceClient = new BinanceDataClient(config.binance);

    if (config.alphaVantage?.apiKey) {
      this.alphaVantageClient = new AlphaVantageDataClient({
        apiKey: config.alphaVantage.apiKey,
        baseUrl: config.alphaVantage.baseUrl,
        cacheTTL: config.alphaVantage.cacheTTL,
        rateLimit: config.alphaVantage.rateLimit,
      });
    }
  }

  async getKlines(symbol: AllSymbols, timeframe: Timeframe, limit: number = 500): Promise<KlineData[]> {
    const assetType = this.getAssetType(symbol);

    if (assetType === 'crypto') {
      return this.binanceClient.getKlines(symbol as CryptoSymbol, timeframe, limit);
    } else {
      if (!this.alphaVantageClient) {
        throw new Error('Alpha Vantage client not configured. Please provide ALPHA_VANTAGE_API_KEY.');
      }
      return this.alphaVantageClient.getLatestCandles(symbol as ForexSymbol, timeframe as AlphaVantageTimeframe, limit);
    }
  }

  getAssetType(symbol: string): AssetType {
    if (this.cryptoSymbols.has(symbol)) {
      return 'crypto';
    } else if (this.forexSymbols.has(symbol)) {
      return 'forex';
    }
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  getAllSymbols(): AllSymbols[] {
    const symbols: AllSymbols[] = [
      ...Array.from(this.cryptoSymbols) as CryptoSymbol[],
    ];

    if (this.alphaVantageClient) {
      symbols.push(...Array.from(this.forexSymbols) as ForexSymbol[]);
    }

    return symbols;
  }

  getCryptoSymbols(): CryptoSymbol[] {
    return Array.from(this.cryptoSymbols) as CryptoSymbol[];
  }

  getForexSymbols(): ForexSymbol[] {
    return Array.from(this.forexSymbols) as ForexSymbol[];
  }

  isAlphaVantageEnabled(): boolean {
    return this.alphaVantageClient !== undefined;
  }

  close(): void {
    this.binanceClient.close();
  }

  private getTimeframeMs(timeframe: Timeframe): number {
    const map: Record<Timeframe, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
    };
    return map[timeframe];
  }
}
