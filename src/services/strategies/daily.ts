import { Signal, KlineData } from '../../types';
import { AssetType, AllSymbols, Timeframe } from '../unifiedMarketData';
import { computeIndicators } from '../../modules/technical-analysis';
import { SignalFactory, BacktestMetrics } from './SignalFactory';

export interface DailyStrategyConfig {
  maxSignalsPerAsset: number;
  emaFastPeriod: number;
  emaSlowPeriod: number;
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
}

const DEFAULT_CONFIG: DailyStrategyConfig = {
  maxSignalsPerAsset: 3,
  emaFastPeriod: 50,
  emaSlowPeriod: 200,
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
};

export class DailyStrategy {
  private config: DailyStrategyConfig;
  private backtestMetrics: Map<string, BacktestMetrics>;

  constructor(
    config?: Partial<DailyStrategyConfig>,
    backtestMetrics?: Map<string, BacktestMetrics>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.backtestMetrics = backtestMetrics || new Map();
  }

  async generateSignals(
    asset: AllSymbols,
    assetType: AssetType,
    timeframe: Timeframe,
    klines: KlineData[]
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    const indicators = computeIndicators(klines, asset, timeframe, {
      ema: { periods: [this.config.emaFastPeriod, this.config.emaSlowPeriod, 9, 21] },
      rsi: {
        period: this.config.rsiPeriod,
        overbought: this.config.rsiOverbought,
        oversold: this.config.rsiOversold,
      },
    });

    if (!indicators) {
      console.log(`Insufficient data for ${asset} on ${timeframe}`);
      return signals;
    }

    const ema50 = indicators.ema[this.config.emaFastPeriod];
    const ema200 = indicators.ema[this.config.emaSlowPeriod];

    if (!ema50 || !ema200) {
      console.log(`Missing EMA data for ${asset}`);
      return signals;
    }

    const backtestKey = `daily_${asset}_${timeframe}`;
    const metrics = this.backtestMetrics.get(backtestKey);

    const emaCrossoverBuy = this.detectEMACrossover(klines, ema50.value, ema200.value, 'bullish');
    const emaCrossoverSell = this.detectEMACrossover(klines, ema50.value, ema200.value, 'bearish');

    const rsiDivergenceBuy = this.detectRSIDivergence(klines, indicators.rsi.value, 'bullish');
    const rsiDivergenceSell = this.detectRSIDivergence(klines, indicators.rsi.value, 'bearish');

    const macdConfirmsBuy = indicators.macd.bullish;
    const macdConfirmsSell = indicators.macd.bearish;

    if ((emaCrossoverBuy || rsiDivergenceBuy) && macdConfirmsBuy && indicators.rsi.oversold) {
      const signal = SignalFactory.createMultiTargetSignal(
        {
          asset,
          timeframe,
          signalType: 'BUY',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema50: ema50.value,
            ema200: ema200.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bullish: indicators.macd.bullish,
            },
            volumeRatio: indicators.volume.ratio,
            emaCrossover: emaCrossoverBuy,
            rsiDivergence: rsiDivergenceBuy,
          },
        },
        {
          takeProfitPercent: assetType === 'forex' ? 0.01 : 0.015,
          stopLossPercent: assetType === 'forex' ? 0.005 : 0.0075,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Daily BUY signal generated for ${asset} on ${timeframe}`);
    }

    if ((emaCrossoverSell || rsiDivergenceSell) && macdConfirmsSell && indicators.rsi.overbought) {
      const signal = SignalFactory.createMultiTargetSignal(
        {
          asset,
          timeframe,
          signalType: 'SELL',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema50: ema50.value,
            ema200: ema200.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bearish: indicators.macd.bearish,
            },
            volumeRatio: indicators.volume.ratio,
            emaCrossover: emaCrossoverSell,
            rsiDivergence: rsiDivergenceSell,
          },
        },
        {
          takeProfitPercent: assetType === 'forex' ? 0.01 : 0.015,
          stopLossPercent: assetType === 'forex' ? 0.005 : 0.0075,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Daily SELL signal generated for ${asset} on ${timeframe}`);
    }

    if (
      emaCrossoverBuy &&
      macdConfirmsBuy &&
      !indicators.rsi.oversold &&
      indicators.volume.ratio > 1.2
    ) {
      const signal = SignalFactory.createMultiTargetSignal(
        {
          asset,
          timeframe,
          signalType: 'BUY',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema50: ema50.value,
            ema200: ema200.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bullish: indicators.macd.bullish,
            },
            volumeRatio: indicators.volume.ratio,
            emaCrossover: emaCrossoverBuy,
          },
        },
        {
          takeProfitPercent: assetType === 'forex' ? 0.02 : 0.02,
          stopLossPercent: assetType === 'forex' ? 0.007 : 0.01,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Daily momentum BUY signal generated for ${asset} on ${timeframe}`);
    }

    if (
      emaCrossoverSell &&
      macdConfirmsSell &&
      !indicators.rsi.overbought &&
      indicators.volume.ratio > 1.2
    ) {
      const signal = SignalFactory.createMultiTargetSignal(
        {
          asset,
          timeframe,
          signalType: 'SELL',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema50: ema50.value,
            ema200: ema200.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bearish: indicators.macd.bearish,
            },
            volumeRatio: indicators.volume.ratio,
            emaCrossover: emaCrossoverSell,
          },
        },
        {
          takeProfitPercent: assetType === 'forex' ? 0.02 : 0.02,
          stopLossPercent: assetType === 'forex' ? 0.007 : 0.01,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Daily momentum SELL signal generated for ${asset} on ${timeframe}`);
    }

    return signals.slice(0, this.config.maxSignalsPerAsset);
  }

  private detectEMACrossover(
    klines: KlineData[],
    currentFast: number,
    currentSlow: number,
    direction: 'bullish' | 'bearish'
  ): boolean {
    if (klines.length < 2) {
      return false;
    }

    if (direction === 'bullish') {
      return currentFast > currentSlow;
    } else {
      return currentFast < currentSlow;
    }
  }

  private detectRSIDivergence(
    klines: KlineData[],
    currentRSI: number,
    direction: 'bullish' | 'bearish'
  ): boolean {
    if (klines.length < 10) {
      return false;
    }

    if (direction === 'bullish') {
      return currentRSI < this.config.rsiOversold;
    } else {
      return currentRSI > this.config.rsiOverbought;
    }
  }
}
