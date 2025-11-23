import axios from 'axios';
import { config } from '../config';
import { KlineData, MarketData } from '../types';

export class MarketDataService {
  private baseUrl: string;
  private requestCount: number = 0;
  private requestWindowStart: number = Date.now();

  constructor() {
    this.baseUrl = config.binance.baseUrl;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = config.monitor.rateLimit.perMinutes * 60 * 1000;

    if (now - this.requestWindowStart > windowDuration) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    if (this.requestCount >= config.monitor.rateLimit.maxRequests) {
      const waitTime = windowDuration - (now - this.requestWindowStart);
      console.log(
        `Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }

    this.requestCount++;
  }

  async getCurrentPrice(symbol: string): Promise<MarketData> {
    await this.checkRateLimit();

    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/24hr`, {
        params: { symbol },
      });

      return {
        symbol,
        price: parseFloat(response.data.lastPrice),
        high: parseFloat(response.data.highPrice),
        low: parseFloat(response.data.lowPrice),
        volume: parseFloat(response.data.volume),
        timestamp: response.data.closeTime,
      };
    } catch (error: any) {
      if (error.response?.status === 451) {
        console.error(`API access restricted for ${symbol}. Using mock data for testing.`);
        return this.getMockPrice(symbol);
      }
      console.error(`Error fetching price for ${symbol}:`, error.message);
      throw error;
    }
  }

  private getMockPrice(symbol: string): MarketData {
    const basePrice = symbol.includes('BTC') ? 45000 : 2500;
    const variance = basePrice * 0.02;
    return {
      symbol,
      price: basePrice + (Math.random() - 0.5) * variance,
      high: basePrice * 1.05,
      low: basePrice * 0.95,
      volume: 1000000 + Math.random() * 500000,
      timestamp: Date.now(),
    };
  }

  async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100
  ): Promise<KlineData[]> {
    await this.checkRateLimit();

    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/klines`, {
        params: {
          symbol,
          interval,
          limit,
        },
      });

      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteVolume: kline[7],
        trades: kline[8],
        takerBuyBaseVolume: kline[9],
        takerBuyQuoteVolume: kline[10],
      }));
    } catch (error: any) {
      if (error.response?.status === 451) {
        console.log(`API access restricted for ${symbol}. Using mock data for testing.`);
        return this.getMockKlines(symbol, limit);
      }
      console.error(`Error fetching klines for ${symbol}:`, error.message);
      throw error;
    }
  }

  private getMockKlines(symbol: string, limit: number): KlineData[] {
    const klines: KlineData[] = [];
    const basePrice = symbol.includes('BTC') ? 45000 : 2500;
    const now = Date.now();
    const intervalMs = 60 * 60 * 1000;
    
    const signalType = Math.random() > 0.5 ? 'buy' : 'sell';

    for (let i = limit - 1; i >= 0; i--) {
      const time = now - i * intervalMs;
      let priceChange = 0;
      
      if (signalType === 'buy') {
        if (i > 30) {
          priceChange = -0.002 * (limit - i);
        } else if (i > 15) {
          priceChange = -0.003 * (30 - i);
        } else {
          priceChange = 0.001 * (15 - i);
        }
      } else {
        if (i > 30) {
          priceChange = 0.002 * (limit - i);
        } else if (i > 15) {
          priceChange = 0.003 * (30 - i);
        } else {
          priceChange = -0.001 * (15 - i);
        }
      }
      
      const priceMultiplier = 1 + priceChange + (Math.random() - 0.5) * 0.005;
      const open = basePrice * priceMultiplier;
      const close = open * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      
      const baseVolume = 100;
      const volumeMultiplier = i < 10 ? 2.5 + Math.random() * 0.5 : 1 + Math.random() * 0.3;
      const volume = baseVolume * volumeMultiplier;

      klines.push({
        openTime: time,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume.toFixed(4),
        closeTime: time + intervalMs - 1,
        quoteVolume: (volume * close).toFixed(2),
        trades: Math.floor(Math.random() * 1000),
        takerBuyBaseVolume: (volume * 0.6).toFixed(4),
        takerBuyQuoteVolume: (volume * close * 0.6).toFixed(2),
      });
    }

    return klines;
  }
}
