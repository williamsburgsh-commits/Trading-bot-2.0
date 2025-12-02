import { Signal, KlineData } from '../types';
import { UnifiedMarketDataService, AllSymbols, Timeframe, AssetType } from './unifiedMarketData';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateVolatility,
} from '../utils/indicators';

interface SignalConfig {
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  volumeThreshold: number;
}

export class UnifiedSignalEngine {
  private marketDataService: UnifiedMarketDataService;
  private config: SignalConfig;

  constructor(marketDataService: UnifiedMarketDataService, config?: Partial<SignalConfig>) {
    this.marketDataService = marketDataService;
    this.config = {
      rsiPeriod: config?.rsiPeriod || 14,
      rsiOversold: config?.rsiOversold || 30,
      rsiOverbought: config?.rsiOverbought || 70,
      macdFast: config?.macdFast || 12,
      macdSlow: config?.macdSlow || 26,
      macdSignal: config?.macdSignal || 9,
      volumeThreshold: config?.volumeThreshold || 1.5,
    };
  }

  async generateSignals(asset: AllSymbols, timeframe: Timeframe): Promise<Signal[]> {
    try {
      console.log(`Analyzing ${asset} on ${timeframe}...`);

      const klines = await this.marketDataService.getKlines(asset, timeframe, 100);

      if (klines.length < 50) {
        console.log(`Insufficient data for ${asset} on ${timeframe}`);
        return [];
      }

      const closes = klines.map((k) => parseFloat(k.close));
      const volumes = klines.map((k) => parseFloat(k.volume));
      const currentPrice = closes[closes.length - 1]!;

      const rsi = calculateRSI(closes, this.config.rsiPeriod);
      const macd = calculateMACD(
        closes,
        this.config.macdFast,
        this.config.macdSlow,
        this.config.macdSignal
      );

      const avgVolume = calculateSMA(volumes, 20);
      const currentVolume = volumes[volumes.length - 1]!;
      const volumeRatio = currentVolume / avgVolume;

      const volatility = calculateVolatility(closes, 20);
      const assetType = this.marketDataService.getAssetType(asset);
      const signals: Signal[] = [];

      if (this.isBuySignal(rsi, macd, volumeRatio)) {
        const signal = this.createBuySignal(asset, timeframe, currentPrice, volatility, assetType, {
          rsi,
          macd: macd!,
          volumeRatio,
        });
        signals.push(signal);
        console.log(`BUY signal generated for ${asset}`);
      } else if (this.isSellSignal(rsi, macd, volumeRatio)) {
        const signal = this.createSellSignal(
          asset,
          timeframe,
          currentPrice,
          volatility,
          assetType,
          {
            rsi,
            macd: macd!,
            volumeRatio,
          }
        );
        signals.push(signal);
        console.log(`SELL signal generated for ${asset}`);
      } else {
        console.log(`No signal for ${asset} on ${timeframe}`);
      }

      return signals;
    } catch (error) {
      console.error(`Error generating signals for ${asset}:`, error);
      return [];
    }
  }

  async generateAllSignals(timeframes: Timeframe[]): Promise<Signal[]> {
    const allSymbols = this.marketDataService.getAllSymbols();
    const signals: Signal[] = [];

    for (const symbol of allSymbols) {
      for (const timeframe of timeframes) {
        const symbolSignals = await this.generateSignals(symbol, timeframe);
        signals.push(...symbolSignals);
      }
    }

    return signals;
  }

  private isBuySignal(
    rsi: number,
    macd: { macd: number; signal: number; histogram: number } | null,
    volumeRatio: number
  ): boolean {
    if (!macd) return false;

    const rsiCondition = rsi < this.config.rsiOversold;
    const macdCondition = macd.histogram > 0 && macd.macd > macd.signal;
    const volumeCondition = volumeRatio > this.config.volumeThreshold;

    return rsiCondition && macdCondition && volumeCondition;
  }

  private isSellSignal(
    rsi: number,
    macd: { macd: number; signal: number; histogram: number } | null,
    volumeRatio: number
  ): boolean {
    if (!macd) return false;

    const rsiCondition = rsi > this.config.rsiOverbought;
    const macdCondition = macd.histogram < 0 && macd.macd < macd.signal;
    const volumeCondition = volumeRatio > this.config.volumeThreshold;

    return rsiCondition && macdCondition && volumeCondition;
  }

  private createBuySignal(
    asset: string,
    timeframe: string,
    entryPrice: number,
    volatility: number,
    assetType: AssetType,
    indicators: any
  ): Signal {
    const riskPercent = assetType === 'forex' ? 0.005 : 0.02;
    const rewardRatio = 2;

    const stopLoss = entryPrice * (1 - riskPercent);
    const takeProfit = entryPrice * (1 + riskPercent * rewardRatio);

    return {
      asset,
      timeframe,
      entryPrice,
      takeProfit,
      stopLoss,
      status: 'active',
      signalType: 'BUY',
      metadata: JSON.stringify({
        assetType,
        rsi: indicators.rsi,
        macd: indicators.macd,
        volumeRatio: indicators.volumeRatio,
        volatility,
      }),
    };
  }

  private createSellSignal(
    asset: string,
    timeframe: string,
    entryPrice: number,
    volatility: number,
    assetType: AssetType,
    indicators: any
  ): Signal {
    const riskPercent = assetType === 'forex' ? 0.005 : 0.02;
    const rewardRatio = 2;

    const stopLoss = entryPrice * (1 + riskPercent);
    const takeProfit = entryPrice * (1 - riskPercent * rewardRatio);

    return {
      asset,
      timeframe,
      entryPrice,
      takeProfit,
      stopLoss,
      status: 'active',
      signalType: 'SELL',
      metadata: JSON.stringify({
        assetType,
        rsi: indicators.rsi,
        macd: indicators.macd,
        volumeRatio: indicators.volumeRatio,
        volatility,
      }),
    };
  }
}
