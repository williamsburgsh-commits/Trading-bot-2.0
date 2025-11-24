import axios, { AxiosInstance, AxiosError } from 'axios';
import { KlineData } from '../../types';
import {
  FinnhubForexPair,
  FinnhubTimeframe,
  FinnhubClientConfig,
  RetryConfig,
  CacheKey,
  FOREX_SYMBOL_MAP,
  TIMEFRAME_RESOLUTION_MAP,
  FinnhubCandleResponse,
} from './types';
import { FinnhubResponseValidator } from './validator';
import { FinnhubCache } from './cache';

export class FinnhubRestClient {
  private axiosInstance: AxiosInstance;
  private cache: FinnhubCache;
  private retryConfig: RetryConfig;
  private requestCount: number = 0;
  private requestWindowStart: number = Date.now();
  private rateLimit: { maxRequests: number; perMinutes: number };
  private apiKey: string;

  constructor(config: FinnhubClientConfig) {
    const baseURL = config.baseUrl || 'https://finnhub.io/api/v1';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.apiKey = config.apiKey;
    this.cache = new FinnhubCache(config.cacheTTL || 60000);

    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      backoffMultiplier: config.backoffMultiplier || 2,
    };

    this.rateLimit = config.rateLimit || {
      maxRequests: 80,
      perMinutes: 1,
    };
  }

  async getCandles(
    symbol: FinnhubForexPair,
    timeframe: FinnhubTimeframe,
    startTime: number,
    endTime: number
  ): Promise<KlineData[]> {
    const cacheKey: CacheKey = { symbol, timeframe, startTime, endTime };

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const finnhubSymbol = FOREX_SYMBOL_MAP[symbol];
    const resolution = TIMEFRAME_RESOLUTION_MAP[timeframe];

    const data = await this.fetchWithRetry('/forex/candle', {
      symbol: finnhubSymbol,
      resolution,
      from: Math.floor(startTime / 1000),
      to: Math.floor(endTime / 1000),
      token: this.apiKey,
    });

    if (data.s === 'no_data') {
      return [];
    }

    const klines = this.transformCandleResponse(data);
    this.cache.set(cacheKey, klines, 300000);

    return klines;
  }

  async getLatestCandles(
    symbol: FinnhubForexPair,
    timeframe: FinnhubTimeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    const endTime = Date.now();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const startTime = endTime - timeframeMs * limit;

    return this.getCandles(symbol, timeframe, startTime, endTime);
  }

  getCache(): FinnhubCache {
    return this.cache;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async fetchWithRetry(
    endpoint: string,
    params: Record<string, any>,
    attempt: number = 1
  ): Promise<FinnhubCandleResponse> {
    await this.checkRateLimit();

    try {
      const response = await this.axiosInstance.get(endpoint, { params });

      if (!FinnhubResponseValidator.validateCandleResponse(response.data)) {
        throw new Error('Invalid response format from Finnhub API');
      }

      if (response.data.s === 'ok' && !FinnhubResponseValidator.validateCandleData(response.data)) {
        throw new Error('Invalid candle data in Finnhub response');
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

      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        throw new Error('Invalid API key or unauthorized access.');
      }

      throw new Error(`Failed to fetch data from Finnhub: ${axiosError.message}`);
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

  private transformCandleResponse(data: FinnhubCandleResponse): KlineData[] {
    const klines: KlineData[] = [];

    for (let i = 0; i < data.t.length; i++) {
      const openTime = data.t[i] * 1000;
      const closeTime = openTime + this.getTimeframeMs(this.getCurrentTimeframe(data.t, i));

      klines.push({
        openTime,
        open: data.o[i].toString(),
        high: data.h[i].toString(),
        low: data.l[i].toString(),
        close: data.c[i].toString(),
        volume: data.v[i].toString(),
        closeTime,
        quoteVolume: '0',
        trades: 0,
        takerBuyBaseVolume: '0',
        takerBuyQuoteVolume: '0',
      });
    }

    return klines;
  }

  private getCurrentTimeframe(timestamps: number[], index: number): FinnhubTimeframe {
    if (index < timestamps.length - 1) {
      const diff = (timestamps[index + 1] - timestamps[index]) * 1000;
      if (diff <= 6 * 60 * 1000) return '5m';
      if (diff <= 20 * 60 * 1000) return '15m';
      if (diff <= 2 * 60 * 60 * 1000) return '1h';
      return '4h';
    }
    return '1h';
  }

  private getTimeframeMs(timeframe: FinnhubTimeframe): number {
    const map: Record<FinnhubTimeframe, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
    };
    return map[timeframe];
  }
}
