import { KlineData } from '../../types';
import {
  NormalizedCandle,
  IndicatorSnapshot,
  MultiTimeframeIndicators,
  IndicatorConfig,
  DeepPartial,
} from './types';
import { normalizeKlineData, validateCandles } from './normalizer';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateMultiPeriodSMA,
  calculateMultiPeriodEMA,
  calculateATR,
  calculateVolume,
} from './indicators';

const DEFAULT_CONFIG: IndicatorConfig = {
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  macd: {
    fast: 12,
    slow: 26,
    signal: 9,
  },
  bollingerBands: {
    period: 20,
    stdDev: 2,
  },
  sma: {
    periods: [10, 20, 50, 100, 200],
  },
  ema: {
    periods: [10, 20, 50, 100, 200],
  },
  atr: {
    period: 14,
  },
  volume: {
    period: 20,
  },
};

export function computeIndicators(
  klines: KlineData[],
  asset: string,
  timeframe: string,
  config: DeepPartial<IndicatorConfig> = {}
): IndicatorSnapshot | null {
  const fullConfig: IndicatorConfig = {
    rsi: { ...DEFAULT_CONFIG.rsi, ...config.rsi },
    macd: { ...DEFAULT_CONFIG.macd, ...config.macd },
    bollingerBands: { ...DEFAULT_CONFIG.bollingerBands, ...config.bollingerBands },
    sma: { periods: (config.sma?.periods || DEFAULT_CONFIG.sma.periods) as number[] },
    ema: { periods: (config.ema?.periods || DEFAULT_CONFIG.ema.periods) as number[] },
    atr: { ...DEFAULT_CONFIG.atr, ...config.atr },
    volume: { ...DEFAULT_CONFIG.volume, ...config.volume },
  };

  const candles = normalizeKlineData(klines);

  if (!validateCandles(candles)) {
    return null;
  }

  const minRequiredCandles = Math.max(
    fullConfig.rsi.period + 1,
    fullConfig.macd.slow + fullConfig.macd.signal,
    fullConfig.bollingerBands.period,
    fullConfig.atr.period + 1,
    fullConfig.volume.period,
    ...fullConfig.sma.periods,
    ...fullConfig.ema.periods
  );

  if (candles.length < minRequiredCandles) {
    return null;
  }

  const rsi = calculateRSI(
    candles,
    fullConfig.rsi.period,
    fullConfig.rsi.overbought,
    fullConfig.rsi.oversold
  );

  const macd = calculateMACD(
    candles,
    fullConfig.macd.fast,
    fullConfig.macd.slow,
    fullConfig.macd.signal
  );

  const bollingerBands = calculateBollingerBands(
    candles,
    fullConfig.bollingerBands.period,
    fullConfig.bollingerBands.stdDev
  );

  const sma = calculateMultiPeriodSMA(candles, fullConfig.sma.periods);
  const ema = calculateMultiPeriodEMA(candles, fullConfig.ema.periods);
  const atr = calculateATR(candles, fullConfig.atr.period);
  const volume = calculateVolume(candles, fullConfig.volume.period);

  if (!rsi || !macd || !bollingerBands || !atr || !volume) {
    return null;
  }

  const lastCandle = candles[candles.length - 1]!;

  return {
    timestamp: lastCandle.timestamp,
    asset,
    timeframe,
    price: lastCandle.close,
    rsi,
    macd,
    bollingerBands,
    sma,
    ema,
    atr,
    volume,
  };
}

export function computeMultiTimeframeIndicators(
  klinesByTimeframe: Map<string, KlineData[]>,
  asset: string,
  config: DeepPartial<IndicatorConfig> = {}
): MultiTimeframeIndicators {
  const result: MultiTimeframeIndicators = {};

  for (const [timeframe, klines] of klinesByTimeframe.entries()) {
    const key = `${asset}_${timeframe}`;
    const indicators = computeIndicators(klines, asset, timeframe, config);

    if (indicators) {
      result[key] = indicators;
    }
  }

  return result;
}

export * from './types';
export * from './normalizer';
export * from './indicators';
