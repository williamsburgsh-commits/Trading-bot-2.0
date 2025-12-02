import { KlineData } from '../types';
import { BinanceDataClient, BinanceSymbol, BinanceTimeframe } from '../modules/binance-data-client';
import {
  TwelveDataClient,
  TwelveDataSymbol,
  TwelveDataTimeframe,
} from '../modules/twelvedata-data-client';
import {
  AssetType,
  AllSymbols,
  Timeframe,
  getAssetType,
  getAssetProvider,
  getCacheTTL,
  ASSET_METADATA,
} from '../config/assets';
import { logger } from '../utils/logger';

export interface MarketDataServiceConfig {
  binance?: {
    baseUrl?: string;
    cacheTTL?: number;
    rateLimit?: { maxRequests: number; perMinutes: number };
  };
  twelvedata?: {
    apiKey: string;
    baseUrl?: string;
    cacheTTL?: number;
    rateLimit?: { maxRequests: number; perMinutes: number };
  };
  enableMockFallback?: boolean;
}

export class MarketDataService {
  private binanceClient: BinanceDataClient;
  private twelvedataClient?: TwelveDataClient;
  private enableMockFallback: boolean;

  constructor(config: MarketDataServiceConfig) {
    this.binanceClient = new BinanceDataClient(config.binance);
    this.enableMockFallback = config.enableMockFallback ?? true;

    if (config.twelvedata?.apiKey) {
      this.twelvedataClient = new TwelveDataClient({
        apiKey: config.twelvedata.apiKey,
        baseUrl: config.twelvedata.baseUrl,
        cacheTTL: config.twelvedata.cacheTTL,
        rateLimit: config.twelvedata.rateLimit,
      });
    }
  }

  async getKlines(
    symbol: AllSymbols,
    timeframe: Timeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    try {
      const provider = getAssetProvider(symbol);
      const assetType = getAssetType(symbol);

      logger.info('Fetching klines', {
        symbol,
        timeframe,
        limit,
        provider,
        assetType,
      });

      if (provider === 'binance') {
        return await this.binanceClient.getKlines(
          symbol as BinanceSymbol,
          timeframe as BinanceTimeframe,
          limit
        );
      } else if (provider === 'twelvedata') {
        if (!this.twelvedataClient) {
          throw new Error(
            'Twelve Data client not configured. Please provide TWELVEDATA_API_KEY.'
          );
        }
        return await this.twelvedataClient.getKlines(
          symbol as TwelveDataSymbol,
          timeframe as TwelveDataTimeframe,
          limit
        );
      }

      throw new Error(`Unknown provider: ${provider}`);
    } catch (error) {
      logger.error('Error fetching klines', {
        symbol,
        timeframe,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (this.enableMockFallback) {
        logger.warn('Falling back to mock data', { symbol, timeframe });
        return this.generateMockData(symbol, timeframe, limit);
      }

      throw error;
    }
  }

  async getHistoricalKlines(
    symbol: AllSymbols,
    timeframe: Timeframe,
    startTime: number | string,
    endTime?: number | string,
    limit: number = 1000
  ): Promise<KlineData[]> {
    try {
      const provider = getAssetProvider(symbol);

      if (provider === 'binance') {
        const start = typeof startTime === 'string' ? Date.parse(startTime) : startTime;
        const end = endTime ? (typeof endTime === 'string' ? Date.parse(endTime) : endTime) : undefined;

        return await this.binanceClient.getHistoricalKlines(
          symbol as BinanceSymbol,
          timeframe as BinanceTimeframe,
          start,
          end,
          limit
        );
      } else if (provider === 'twelvedata') {
        if (!this.twelvedataClient) {
          throw new Error(
            'Twelve Data client not configured. Please provide TWELVEDATA_API_KEY.'
          );
        }

        const startDate = typeof startTime === 'number' ? this.formatDate(startTime) : startTime;
        const endDate = endTime
          ? typeof endTime === 'number'
            ? this.formatDate(endTime)
            : endTime
          : this.formatDate(Date.now());

        return await this.twelvedataClient.getHistoricalKlines(
          symbol as TwelveDataSymbol,
          timeframe as TwelveDataTimeframe,
          startDate,
          endDate
        );
      }

      throw new Error(`Unknown provider: ${provider}`);
    } catch (error) {
      logger.error('Error fetching historical klines', {
        symbol,
        timeframe,
        startTime,
        endTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (this.enableMockFallback) {
        logger.warn('Falling back to mock data', { symbol, timeframe });
        return this.generateMockData(symbol, timeframe, limit);
      }

      throw error;
    }
  }

  getAssetType(symbol: string): AssetType {
    return getAssetType(symbol);
  }

  getAllSymbols(): AllSymbols[] {
    const symbols: AllSymbols[] = [];

    // Add crypto symbols (always available)
    symbols.push(...Object.keys(ASSET_METADATA).filter(
      (s) => ASSET_METADATA[s as AllSymbols].type === 'crypto'
    ) as AllSymbols[]);

    // Add forex/commodity symbols if Twelve Data is configured
    if (this.twelvedataClient) {
      symbols.push(...Object.keys(ASSET_METADATA).filter(
        (s) => ['forex', 'commodity'].includes(ASSET_METADATA[s as AllSymbols].type)
      ) as AllSymbols[]);
    }

    return symbols;
  }

  getSymbolsByType(type: AssetType): AllSymbols[] {
    const allSymbols = this.getAllSymbols();
    return allSymbols.filter((s) => getAssetType(s) === type);
  }

  isTwelveDataEnabled(): boolean {
    return this.twelvedataClient !== undefined;
  }

  close(): void {
    this.binanceClient.close();
  }

  private generateMockData(symbol: AllSymbols, timeframe: Timeframe, limit: number): KlineData[] {
    logger.debug('Generating mock data', { symbol, timeframe, limit });

    const now = Date.now();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const basePrice = this.getBasePrice(symbol);

    const mockData: KlineData[] = [];

    for (let i = limit - 1; i >= 0; i--) {
      const openTime = now - i * timeframeMs;
      const closeTime = openTime + timeframeMs;

      const volatility = 0.01;
      const change = (Math.random() - 0.5) * volatility;

      const open = (basePrice * (1 + change)).toFixed(8);
      const close = (parseFloat(open) * (1 + (Math.random() - 0.5) * volatility)).toFixed(8);
      const high = (Math.max(parseFloat(open), parseFloat(close)) * 1.002).toFixed(8);
      const low = (Math.min(parseFloat(open), parseFloat(close)) * 0.998).toFixed(8);

      mockData.push({
        openTime,
        open,
        high,
        low,
        close,
        volume: (Math.random() * 1000000).toFixed(2),
        closeTime,
        quoteVolume: (Math.random() * 50000000).toFixed(2),
        trades: Math.floor(Math.random() * 10000),
        takerBuyBaseVolume: (Math.random() * 500000).toFixed(2),
        takerBuyQuoteVolume: (Math.random() * 25000000).toFixed(2),
      });
    }

    return mockData;
  }

  private getTimeframeMs(timeframe: Timeframe): number {
    const map: Record<Timeframe, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return map[timeframe];
  }

  private getBasePrice(symbol: AllSymbols): number {
    const priceMap: Record<AllSymbols, number> = {
      BTCUSDT: 45000,
      ETHUSDT: 2500,
      SOLUSDT: 100,
      BNBUSDT: 300,
      XRPUSDT: 0.6,
      'EUR/USD': 1.08,
      'GBP/USD': 1.27,
      'USD/JPY': 150,
      'XAU/USD': 2000,
    };
    return priceMap[symbol] || 1;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }
}
