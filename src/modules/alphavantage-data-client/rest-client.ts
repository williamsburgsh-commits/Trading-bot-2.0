import axios, { AxiosInstance, AxiosError } from 'axios';
import { KlineData } from '../../types';
import {
  AlphaVantageForexPair,
  AlphaVantageTimeframe,
  AlphaVantageClientConfig,
  RetryConfig,
  CacheKey,
  FOREX_PAIR_MAP,
  TIMEFRAME_INTERVAL_MAP,
  AlphaVantageResponse,
} from './types';
import { AlphaVantageResponseValidator } from './validator';
import { AlphaVantageCache } from './cache';

export class AlphaVantageRestClient {
  private axiosInstance: AxiosInstance;
  private cache: AlphaVantageCache;
  private retryConfig: RetryConfig;
  private requestCount: number = 0;
  private requestWindowStart: number = Date.now();
  private rateLimit: { maxRequests: number; perMinutes: number };
  private apiKey: string;

  constructor(config: AlphaVantageClientConfig) {
    const baseURL = config.baseUrl || 'https://www.alphavantage.co';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.apiKey = config.apiKey;
    this.cache = new AlphaVantageCache(config.cacheTTL || 60000);

    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 2000,
      backoffMultiplier: config.backoffMultiplier || 2,
    };

    this.rateLimit = config.rateLimit || {
      maxRequests: 5,
      perMinutes: 1,
    };
  }

  async getCandles(
    symbol: AlphaVantageForexPair,
    timeframe: AlphaVantageTimeframe,
    startTime: number,
    endTime: number
  ): Promise<KlineData[]> {
    const cacheKey: CacheKey = { symbol, timeframe, startTime, endTime };

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { from, to } = FOREX_PAIR_MAP[symbol];
    const interval = TIMEFRAME_INTERVAL_MAP[timeframe];

    const data = await this.fetchWithRetry('/query', {
      function: 'FX_INTRADAY',
      from_symbol: from,
      to_symbol: to,
      interval,
      outputsize: 'full',
      apikey: this.apiKey,
    });

    const klines = this.transformResponse(data, timeframe);

    // Filter by time range
    const filtered = klines.filter((k) => k.openTime >= startTime && k.openTime <= endTime);

    this.cache.set(cacheKey, filtered, 300000); // Cache for 5 minutes

    return filtered;
  }

  async getLatestCandles(
    symbol: AlphaVantageForexPair,
    timeframe: AlphaVantageTimeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    const endTime = Date.now();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const startTime = endTime - timeframeMs * limit;

    return this.getCandles(symbol, timeframe, startTime, endTime);
  }

  getCache(): AlphaVantageCache {
    return this.cache;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async fetchWithRetry(
    endpoint: string,
    params: Record<string, any>,
    attempt: number = 1
  ): Promise<AlphaVantageResponse> {
    await this.checkRateLimit();

    try {
      const response = await this.axiosInstance.get(endpoint, { params });

      if (!AlphaVantageResponseValidator.validateResponse(response.data)) {
        throw new Error('Invalid response format from Alpha Vantage API');
      }

      if (!AlphaVantageResponseValidator.validateTimeSeries(response.data['Time Series FX (Intraday)'])) {
        throw new Error('Invalid time series data in Alpha Vantage response');
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

      throw new Error(`Failed to fetch data from Alpha Vantage: ${axiosError.message}`);
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

  private transformResponse(data: AlphaVantageResponse, timeframe: AlphaVantageTimeframe): KlineData[] {
    const timeSeries = data['Time Series FX (Intraday)'];
    const klines: KlineData[] = [];

    for (const [timestamp, entry] of Object.entries(timeSeries)) {
      const openTime = new Date(timestamp).getTime();
      const timeframeMs = this.getTimeframeMs(timeframe);
      const closeTime = openTime + timeframeMs;

      klines.push({
        openTime,
        open: entry['1. open'],
        high: entry['2. high'],
        low: entry['3. low'],
        close: entry['4. close'],
        volume: '0', // Alpha Vantage doesn't provide volume for forex
        closeTime,
        quoteVolume: '0',
        trades: 0,
        takerBuyBaseVolume: '0',
        takerBuyQuoteVolume: '0',
      });
    }

    // Sort by time ascending
    klines.sort((a, b) => a.openTime - b.openTime);

    // Aggregate for 4h if needed
    if (timeframe === '4h') {
      return this.aggregate4hCandles(klines);
    }

    return klines;
  }

  private aggregate4hCandles(hourlyCandles: KlineData[]): KlineData[] {
    const fourHourCandles: KlineData[] = [];

    for (let i = 0; i < hourlyCandles.length; i += 4) {
      const chunk = hourlyCandles.slice(i, i + 4);
      if (chunk.length === 0) continue;

      const open = chunk[0].open;
      const close = chunk[chunk.length - 1].close;
      const high = Math.max(...chunk.map((c) => parseFloat(c.high))).toString();
      const low = Math.min(...chunk.map((c) => parseFloat(c.low))).toString();
      const openTime = chunk[0].openTime;
      const closeTime = chunk[chunk.length - 1].closeTime;

      fourHourCandles.push({
        openTime,
        open,
        high,
        low,
        close,
        volume: '0',
        closeTime,
        quoteVolume: '0',
        trades: 0,
        takerBuyBaseVolume: '0',
        takerBuyQuoteVolume: '0',
      });
    }

    return fourHourCandles;
  }

  private getTimeframeMs(timeframe: AlphaVantageTimeframe): number {
    const map: Record<AlphaVantageTimeframe, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
    };
    return map[timeframe];
  }
}
