import axios, { AxiosInstance, AxiosError } from 'axios';
import { KlineData } from '../../types';
import {
  BinanceSymbol,
  BinanceTimeframe,
  BinanceClientConfig,
  RetryConfig,
  CacheKey,
} from './types';
import { BinanceResponseValidator } from './validator';
import { BinanceCache } from './cache';

/**
 * Binance REST API client for public market data endpoints.
 *
 * This client only uses public endpoints that do not require API authentication.
 * All methods access market data (klines, ticker, etc.) that is freely available
 * without API keys. Default rate limit is 1200 requests per minute for public endpoints.
 */
export class BinanceRestClient {
  private axiosInstance: AxiosInstance;
  private cache: BinanceCache;
  private retryConfig: RetryConfig;
  private requestCount: number = 0;
  private requestWindowStart: number = Date.now();
  private rateLimit: { maxRequests: number; perMinutes: number };

  constructor(config?: BinanceClientConfig) {
    const baseURL = config?.baseUrl || 'https://api.binance.com';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.cache = new BinanceCache(config?.cacheTTL || 60000);

    this.retryConfig = {
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      backoffMultiplier: config?.backoffMultiplier || 2,
    };

    this.rateLimit = config?.rateLimit || {
      maxRequests: 1200,
      perMinutes: 1,
    };
  }

  async getKlines(
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    const cacheKey: CacheKey = { symbol, timeframe, limit };

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchWithRetry('/api/v3/klines', {
      symbol,
      interval: timeframe,
      limit,
    });

    const klines = this.transformKlineResponse(data);
    this.cache.set(cacheKey, klines);

    return klines;
  }

  async getHistoricalKlines(
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    startTime: number,
    endTime?: number,
    limit: number = 1000
  ): Promise<KlineData[]> {
    const cacheKey: CacheKey = { symbol, timeframe, startTime, endTime, limit };

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const params: any = { symbol, interval: timeframe, startTime, limit };
    if (endTime) {
      params.endTime = endTime;
    }

    const data = await this.fetchWithRetry('/api/v3/klines', params);
    const klines = this.transformKlineResponse(data);

    this.cache.set(cacheKey, klines, 300000);

    return klines;
  }

  async bulkHistoricalDownload(
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    startTime: number,
    endTime: number
  ): Promise<KlineData[]> {
    const allKlines: KlineData[] = [];
    const maxLimit = 1000;
    let currentStart = startTime;

    while (currentStart < endTime) {
      await this.checkRateLimit();

      const klines = await this.getHistoricalKlines(
        symbol,
        timeframe,
        currentStart,
        endTime,
        maxLimit
      );

      if (klines.length === 0) {
        break;
      }

      allKlines.push(...klines);

      const lastKline = klines[klines.length - 1];
      if (!lastKline) break;

      currentStart = lastKline.closeTime + 1;

      if (klines.length < maxLimit) {
        break;
      }
    }

    return allKlines;
  }

  getCache(): BinanceCache {
    return this.cache;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async fetchWithRetry(
    endpoint: string,
    params: Record<string, any>,
    attempt: number = 1
  ): Promise<any> {
    await this.checkRateLimit();

    try {
      const response = await this.axiosInstance.get(endpoint, { params });

      if (!BinanceResponseValidator.validateKlineResponse(response.data)) {
        throw new Error('Invalid response format from Binance API');
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (this.shouldRetry(axiosError, attempt)) {
        const delay = this.calculateBackoff(attempt);
        console.log(
          `Request failed (attempt ${attempt}/${this.retryConfig.maxRetries}). Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
        return this.fetchWithRetry(endpoint, params, attempt + 1);
      }

      if (axiosError.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (axiosError.response?.status === 451) {
        throw new Error('API access restricted in your region.');
      }

      throw new Error(`Failed to fetch data from Binance: ${axiosError.message}`);
    }
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  }

  private calculateBackoff(attempt: number): number {
    return this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = this.rateLimit.perMinutes * 60 * 1000;

    if (now - this.requestWindowStart > windowDuration) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    if (this.requestCount >= this.rateLimit.maxRequests) {
      const waitTime = windowDuration - (now - this.requestWindowStart);
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }

    this.requestCount++;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private transformKlineResponse(data: any[]): KlineData[] {
    return data.map((kline: any) => {
      const validated = BinanceResponseValidator.validateKlineArray(kline);
      if (!validated) {
        throw new Error('Invalid kline data in response');
      }
      return {
        openTime: validated.openTime,
        open: validated.open,
        high: validated.high,
        low: validated.low,
        close: validated.close,
        volume: validated.volume,
        closeTime: validated.closeTime,
        quoteVolume: validated.quoteVolume,
        trades: validated.trades,
        takerBuyBaseVolume: validated.takerBuyBaseVolume,
        takerBuyQuoteVolume: validated.takerBuyQuoteVolume,
      };
    });
  }
}
