import { Signal, KlineData } from '../../types';
import { AssetType, AllSymbols, Timeframe } from '../unifiedMarketData';
import { computeIndicators } from '../../modules/technical-analysis';
import { Stochastic } from 'technicalindicators';
import { SignalFactory, BacktestMetrics } from './SignalFactory';
import { normalizeKlineData } from '../../modules/technical-analysis/normalizer';

export interface ScalpingStrategyConfig {
  maxSignalsPerAsset: number;
  emaFastPeriod: number;
  emaSlowPeriod: number;
  rsiPeriod: number;
  rsiNeutralLow: number;
  rsiNeutralHigh: number;
  bbPeriod: number;
  bbStdDev: number;
  stochPeriod: number;
  stochSignalPeriod: number;
  stochOverbought: number;
  stochOversold: number;
}

const DEFAULT_CONFIG: ScalpingStrategyConfig = {
  maxSignalsPerAsset: 3,
  emaFastPeriod: 9,
  emaSlowPeriod: 21,
  rsiPeriod: 14,
  rsiNeutralLow: 40,
  rsiNeutralHigh: 60,
  bbPeriod: 20,
  bbStdDev: 2,
  stochPeriod: 14,
  stochSignalPeriod: 3,
  stochOverbought: 80,
  stochOversold: 20,
};

export class ScalpingStrategy {
  private config: ScalpingStrategyConfig;
  private backtestMetrics: Map<string, BacktestMetrics>;

  constructor(
    config?: Partial<ScalpingStrategyConfig>,
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
      ema: { periods: [this.config.emaFastPeriod, this.config.emaSlowPeriod] },
      rsi: {
        period: this.config.rsiPeriod,
        overbought: 70,
        oversold: 30,
      },
      bollingerBands: {
        period: this.config.bbPeriod,
        stdDev: this.config.bbStdDev,
      },
    });

    if (!indicators) {
      console.log(`Insufficient data for ${asset} on ${timeframe}`);
      return signals;
    }

    const ema9 = indicators.ema[this.config.emaFastPeriod];
    const ema21 = indicators.ema[this.config.emaSlowPeriod];

    if (!ema9 || !ema21) {
      console.log(`Missing EMA data for ${asset}`);
      return signals;
    }

    const stochastic = this.calculateStochastic(klines);
    if (!stochastic) {
      console.log(`Missing Stochastic data for ${asset}`);
      return signals;
    }

    const backtestKey = `scalping_${asset}_${timeframe}`;
    const metrics = this.backtestMetrics.get(backtestKey);

    const strategy1 = this.emaRsiStrategy(
      indicators,
      ema9,
      ema21,
      stochastic,
      asset,
      assetType,
      timeframe,
      metrics
    );
    signals.push(...strategy1);

    const strategy2 = this.bbSqueezeStrategy(
      indicators,
      ema9,
      ema21,
      stochastic,
      asset,
      assetType,
      timeframe,
      metrics
    );
    signals.push(...strategy2);

    const strategy3 = this.stochasticCrossoverStrategy(
      indicators,
      ema9,
      ema21,
      stochastic,
      asset,
      assetType,
      timeframe,
      metrics
    );
    signals.push(...strategy3);

    return signals.slice(0, this.config.maxSignalsPerAsset);
  }

  private emaRsiStrategy(
    indicators: any,
    ema9: any,
    ema21: any,
    stochastic: any,
    asset: string,
    assetType: AssetType,
    timeframe: string,
    metrics?: BacktestMetrics
  ): Signal[] {
    const signals: Signal[] = [];

    const emaBullish = ema9.value > ema21.value;
    const emaBearish = ema9.value < ema21.value;
    const rsiNeutral =
      indicators.rsi.value > this.config.rsiNeutralLow &&
      indicators.rsi.value < this.config.rsiNeutralHigh;

    if (
      emaBullish &&
      rsiNeutral &&
      indicators.macd.bullish &&
      stochastic.k < this.config.stochOversold
    ) {
      const signal = SignalFactory.createSignal(
        {
          asset,
          timeframe,
          signalType: 'BUY',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema9: ema9.value,
            ema21: ema21.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bullish: indicators.macd.bullish,
            },
            stochastic: { k: stochastic.k, d: stochastic.d },
            volumeRatio: indicators.volume.ratio,
            emaSignal: true,
          },
        },
        {
          takeProfitPips: assetType === 'forex' ? 15 : undefined,
          stopLossPips: assetType === 'forex' ? 10 : undefined,
          takeProfitPercent: assetType === 'crypto' ? 0.008 : undefined,
          stopLossPercent: assetType === 'crypto' ? 0.005 : undefined,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Scalping EMA-RSI BUY signal for ${asset} on ${timeframe}`);
    }

    if (
      emaBearish &&
      rsiNeutral &&
      indicators.macd.bearish &&
      stochastic.k > this.config.stochOverbought
    ) {
      const signal = SignalFactory.createSignal(
        {
          asset,
          timeframe,
          signalType: 'SELL',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema9: ema9.value,
            ema21: ema21.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bearish: indicators.macd.bearish,
            },
            stochastic: { k: stochastic.k, d: stochastic.d },
            volumeRatio: indicators.volume.ratio,
            emaSignal: true,
          },
        },
        {
          takeProfitPips: assetType === 'forex' ? 15 : undefined,
          stopLossPips: assetType === 'forex' ? 10 : undefined,
          takeProfitPercent: assetType === 'crypto' ? 0.008 : undefined,
          stopLossPercent: assetType === 'crypto' ? 0.005 : undefined,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Scalping EMA-RSI SELL signal for ${asset} on ${timeframe}`);
    }

    return signals;
  }

  private bbSqueezeStrategy(
    indicators: any,
    ema9: any,
    ema21: any,
    stochastic: any,
    asset: string,
    assetType: AssetType,
    timeframe: string,
    metrics?: BacktestMetrics
  ): Signal[] {
    const signals: Signal[] = [];

    const squeeze = indicators.bollingerBands.bandwidth < 0.02;
    const priceNearLower = indicators.bollingerBands.percentB < 0.2;
    const priceNearUpper = indicators.bollingerBands.percentB > 0.8;

    if (squeeze && priceNearLower && indicators.macd.bullish && indicators.volume.ratio > 1.5) {
      const signal = SignalFactory.createSignal(
        {
          asset,
          timeframe,
          signalType: 'BUY',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema9: ema9.value,
            ema21: ema21.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bullish: indicators.macd.bullish,
            },
            bollingerBands: {
              bandwidth: indicators.bollingerBands.bandwidth,
              percentB: indicators.bollingerBands.percentB,
            },
            stochastic: { k: stochastic.k, d: stochastic.d },
            volumeRatio: indicators.volume.ratio,
            bbSignal: true,
          },
        },
        {
          takeProfitPips: assetType === 'forex' ? 20 : undefined,
          stopLossPips: assetType === 'forex' ? 12 : undefined,
          takeProfitPercent: assetType === 'crypto' ? 0.012 : undefined,
          stopLossPercent: assetType === 'crypto' ? 0.006 : undefined,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Scalping BB-Squeeze BUY signal for ${asset} on ${timeframe}`);
    }

    if (squeeze && priceNearUpper && indicators.macd.bearish && indicators.volume.ratio > 1.5) {
      const signal = SignalFactory.createSignal(
        {
          asset,
          timeframe,
          signalType: 'SELL',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema9: ema9.value,
            ema21: ema21.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
              bearish: indicators.macd.bearish,
            },
            bollingerBands: {
              bandwidth: indicators.bollingerBands.bandwidth,
              percentB: indicators.bollingerBands.percentB,
            },
            stochastic: { k: stochastic.k, d: stochastic.d },
            volumeRatio: indicators.volume.ratio,
            bbSignal: true,
          },
        },
        {
          takeProfitPips: assetType === 'forex' ? 20 : undefined,
          stopLossPips: assetType === 'forex' ? 12 : undefined,
          takeProfitPercent: assetType === 'crypto' ? 0.012 : undefined,
          stopLossPercent: assetType === 'crypto' ? 0.006 : undefined,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Scalping BB-Squeeze SELL signal for ${asset} on ${timeframe}`);
    }

    return signals;
  }

  private stochasticCrossoverStrategy(
    indicators: any,
    ema9: any,
    ema21: any,
    stochastic: any,
    asset: string,
    assetType: AssetType,
    timeframe: string,
    metrics?: BacktestMetrics
  ): Signal[] {
    const signals: Signal[] = [];

    const bullishCrossover =
      stochastic.k > stochastic.d && stochastic.k < this.config.stochOversold + 10;
    const bearishCrossover =
      stochastic.k < stochastic.d && stochastic.k > this.config.stochOverbought - 10;

    if (bullishCrossover && ema9.value > ema21.value) {
      const signal = SignalFactory.createSignal(
        {
          asset,
          timeframe,
          signalType: 'BUY',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema9: ema9.value,
            ema21: ema21.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
            },
            stochastic: { k: stochastic.k, d: stochastic.d, crossover: 'bullish' },
            volumeRatio: indicators.volume.ratio,
            stochSignal: true,
          },
        },
        {
          takeProfitPips: assetType === 'forex' ? 12 : undefined,
          stopLossPips: assetType === 'forex' ? 8 : undefined,
          takeProfitPercent: assetType === 'crypto' ? 0.006 : undefined,
          stopLossPercent: assetType === 'crypto' ? 0.004 : undefined,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Scalping Stochastic BUY signal for ${asset} on ${timeframe}`);
    }

    if (bearishCrossover && ema9.value < ema21.value) {
      const signal = SignalFactory.createSignal(
        {
          asset,
          timeframe,
          signalType: 'SELL',
          entryPrice: indicators.price,
          assetType,
          indicators: {
            ema9: ema9.value,
            ema21: ema21.value,
            rsi: indicators.rsi.value,
            macd: {
              macd: indicators.macd.macd,
              signal: indicators.macd.signal,
              histogram: indicators.macd.histogram,
            },
            stochastic: { k: stochastic.k, d: stochastic.d, crossover: 'bearish' },
            volumeRatio: indicators.volume.ratio,
            stochSignal: true,
          },
        },
        {
          takeProfitPips: assetType === 'forex' ? 12 : undefined,
          stopLossPips: assetType === 'forex' ? 8 : undefined,
          takeProfitPercent: assetType === 'crypto' ? 0.006 : undefined,
          stopLossPercent: assetType === 'crypto' ? 0.004 : undefined,
        },
        metrics
      );
      signals.push(signal);
      console.log(`Scalping Stochastic SELL signal for ${asset} on ${timeframe}`);
    }

    return signals;
  }

  private calculateStochastic(klines: KlineData[]): { k: number; d: number } | null {
    if (klines.length < this.config.stochPeriod + this.config.stochSignalPeriod) {
      return null;
    }

    const candles = normalizeKlineData(klines);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);

    const stochResults = Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: this.config.stochPeriod,
      signalPeriod: this.config.stochSignalPeriod,
    });

    if (stochResults.length === 0) {
      return null;
    }

    const lastResult = stochResults[stochResults.length - 1];
    if (!lastResult || lastResult.k === undefined || lastResult.d === undefined) {
      return null;
    }

    return {
      k: lastResult.k,
      d: lastResult.d,
    };
  }
}
