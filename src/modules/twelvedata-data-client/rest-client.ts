import axios, { AxiosInstance } from 'axios';
import { KlineData } from '../../types';
import { TTLCache } from '../../lib/cache';
import {
  TwelveDataClientConfig,
  TwelveDataSymbol,
  TwelveDataTimeframe,
  TwelveDataCandle,
  TIMEFRAME_INTERVAL_MAP,
  SYMBOL_MAP,
  CacheKey,
} from './types';
import { TwelveDataResponseValidator } from './validator';

export class TwelveDataRestClient {
  private axios: AxiosInstance;
  private cache: TTLCache<KlineData[]>;
  private apiKey: string;
  private rateLimit: { maxRequests: number; perMinutes: number };
  private requestTimestamps: number[] = [];

  constructor(config: TwelveDataClientConfig) {
    this.apiKey = config.apiKey;
    this.cache = new TTLCache<KlineData[]>(config.cacheTTL || 300000);
    this.rateLimit = config.rateLimit || { maxRequests: 8, perMinutes: 1 };

    this.axios = axios.create({
      baseURL: config.baseUrl || 'https://api.twelvedata.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          throw new Error('Twelve Data API rate limit exceeded. Please try again later.');
        }
        throw error;
      }
    );
  }

  async getKlines(
    symbol: TwelveDataSymbol,
    timeframe: TwelveDataTimeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    const cacheKey = this.generateCacheKey({ symbol, timeframe, limit });
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    await this.enforceRateLimit();

    const interval = TIMEFRAME_INTERVAL_MAP[timeframe];
    const symbolStr = SYMBOL_MAP[symbol];

    try {
      const response = await this.axios.get('/time_series', {
        params: {
          symbol: symbolStr,
          interval,
          apikey: this.apiKey,
          outputsize: Math.min(limit, 5000),
          format: 'JSON',
        },
      });

      const validated = TwelveDataResponseValidator.validateTimeSeriesResponse(response.data);
      const klines = this.normalizeResponse(validated.values);

      const cacheTTL = this.getCacheTTL(timeframe);
      if (cacheTTL === 'midnight') {
        this.cache.set(cacheKey, klines, { expiresAtMidnightUTC: true });
      } else {
        this.cache.set(cacheKey, klines, { ttlMs: cacheTTL });
      }

      return klines.slice(0, limit);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Twelve Data API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getHistoricalKlines(
    symbol: TwelveDataSymbol,
    timeframe: TwelveDataTimeframe,
    startDate: string,
    endDate: string
  ): Promise<KlineData[]> {
    const cacheKey = this.generateCacheKey({ symbol, timeframe, startDate, endDate });
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    await this.enforceRateLimit();

    const interval = TIMEFRAME_INTERVAL_MAP[timeframe];
    const symbolStr = SYMBOL_MAP[symbol];

    try {
      const response = await this.axios.get('/time_series', {
        params: {
          symbol: symbolStr,
          interval,
          apikey: this.apiKey,
          start_date: startDate,
          end_date: endDate,
          format: 'JSON',
        },
      });

      const validated = TwelveDataResponseValidator.validateTimeSeriesResponse(response.data);
      const klines = this.normalizeResponse(validated.values);

      this.cache.set(cacheKey, klines, { ttlMs: 3600000 }); // Cache historical data for 1 hour

      return klines;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Twelve Data API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  getCache(): TTLCache<KlineData[]> {
    return this.cache;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private normalizeResponse(candles: TwelveDataCandle[]): KlineData[] {
    return candles
      .map((candle) => {
        const datetime = new Date(candle.datetime);
        const timestamp = datetime.getTime();

        if (isNaN(timestamp)) {
          console.warn(`Invalid datetime in candle: ${candle.datetime}`);
          return null;
        }

        return {
          openTime: timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || '0',
          closeTime: timestamp,
          quoteVolume: '0',
          trades: 0,
          takerBuyBaseVolume: '0',
          takerBuyQuoteVolume: '0',
        } as KlineData;
      })
      .filter((k): k is KlineData => k !== null)
      .sort((a, b) => a.openTime - b.openTime);
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = this.rateLimit.perMinutes * 60 * 1000;

    this.requestTimestamps = this.requestTimestamps.filter((ts) => now - ts < windowMs);

    if (this.requestTimestamps.length >= this.rateLimit.maxRequests) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = windowMs - (now - oldestRequest) + 100;

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.enforceRateLimit();
      }
    }

    this.requestTimestamps.push(now);
  }

  private getCacheTTL(timeframe: TwelveDataTimeframe): number | 'midnight' {
    if (timeframe === '1d') {
      return 'midnight';
    }

    if (['5m', '15m', '30m'].includes(timeframe)) {
      return 60000; // 1 minute for scalping
    }

    return 300000; // 5 minutes for intraday
  }

  private generateCacheKey(key: CacheKey): string {
    return TTLCache.generateKey([
      key.symbol,
      key.timeframe,
      key.limit,
      key.startDate,
      key.endDate,
    ]);
  }
}
