import { MarketDataService } from './marketData';
import { config } from '../config';
import { Signal, KlineData } from '../types';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateVolatility,
} from '../utils/indicators';

export class SignalEngine {
  private marketDataService: MarketDataService;

  constructor() {
    this.marketDataService = new MarketDataService();
  }

  async generateSignals(asset: string, timeframe: string): Promise<Signal[]> {
    try {
      console.log(`Analyzing ${asset} on ${timeframe}...`);

      const klines = await this.marketDataService.getKlines(
        asset,
        timeframe,
        100
      );

      if (klines.length < 50) {
        console.log(`Insufficient data for ${asset} on ${timeframe}`);
        return [];
      }

      const closes = klines.map((k) => parseFloat(k.close));
      const volumes = klines.map((k) => parseFloat(k.volume));
      const currentPrice = closes[closes.length - 1]!;

      const rsi = calculateRSI(closes, config.strategy.rsiPeriod);
      const macd = calculateMACD(
        closes,
        config.strategy.macdFast,
        config.strategy.macdSlow,
        config.strategy.macdSignal
      );

      const avgVolume = calculateSMA(volumes, 20);
      const currentVolume = volumes[volumes.length - 1]!;
      const volumeRatio = currentVolume / avgVolume;

      const volatility = calculateVolatility(closes, 20);
      const signals: Signal[] = [];

      if (this.isBuySignal(rsi, macd, volumeRatio)) {
        const signal = this.createBuySignal(
          asset,
          timeframe,
          currentPrice,
          volatility,
          { rsi, macd: macd!, volumeRatio }
        );
        signals.push(signal);
        console.log(`BUY signal generated for ${asset}`);
      } else if (this.isSellSignal(rsi, macd, volumeRatio)) {
        const signal = this.createSellSignal(
          asset,
          timeframe,
          currentPrice,
          volatility,
          { rsi, macd: macd!, volumeRatio }
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

  private isBuySignal(
    rsi: number,
    macd: { macd: number; signal: number; histogram: number } | null,
    volumeRatio: number
  ): boolean {
    if (!macd) return false;

    const rsiCondition = rsi < config.strategy.rsiOversold;
    const macdCondition = macd.histogram > 0 && macd.macd > macd.signal;
    const volumeCondition = volumeRatio > config.strategy.volumeThreshold;

    return rsiCondition && macdCondition && volumeCondition;
  }

  private isSellSignal(
    rsi: number,
    macd: { macd: number; signal: number; histogram: number } | null,
    volumeRatio: number
  ): boolean {
    if (!macd) return false;

    const rsiCondition = rsi > config.strategy.rsiOverbought;
    const macdCondition = macd.histogram < 0 && macd.macd < macd.signal;
    const volumeCondition = volumeRatio > config.strategy.volumeThreshold;

    return rsiCondition && macdCondition && volumeCondition;
  }

  private createBuySignal(
    asset: string,
    timeframe: string,
    entryPrice: number,
    volatility: number,
    indicators: any
  ): Signal {
    const riskPercent = 0.02;
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
    indicators: any
  ): Signal {
    const riskPercent = 0.02;
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
        rsi: indicators.rsi,
        macd: indicators.macd,
        volumeRatio: indicators.volumeRatio,
        volatility,
      }),
    };
  }
}
