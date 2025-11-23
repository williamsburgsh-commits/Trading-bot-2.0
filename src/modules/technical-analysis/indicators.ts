import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  ATR,
} from 'technicalindicators';
import {
  NormalizedCandle,
  RSISnapshot,
  MACDSnapshot,
  BollingerBandsSnapshot,
  SMASnapshot,
  EMASnapshot,
  ATRSnapshot,
  VolumeSnapshot,
  MultiPeriodSMA,
  MultiPeriodEMA,
  IndicatorConfig,
} from './types';
import { extractCloses, extractHighs, extractLows, extractVolumes } from './normalizer';

export function calculateRSI(
  candles: NormalizedCandle[],
  period: number = 14,
  overbought: number = 70,
  oversold: number = 30
): RSISnapshot | null {
  if (candles.length < period + 1) {
    return null;
  }

  const closes = extractCloses(candles);
  const rsiValues = RSI.calculate({ values: closes, period });

  if (rsiValues.length === 0) {
    return null;
  }

  const value = rsiValues[rsiValues.length - 1]!;

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  return {
    value,
    period,
    overbought: value > overbought,
    oversold: value < oversold,
  };
}

export function calculateMACD(
  candles: NormalizedCandle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDSnapshot | null {
  if (candles.length < slowPeriod + signalPeriod) {
    return null;
  }

  const closes = extractCloses(candles);
  const macdResults = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  if (macdResults.length === 0) {
    return null;
  }

  const lastResult = macdResults[macdResults.length - 1];
  if (!lastResult) {
    return null;
  }

  const { MACD: macd, signal, histogram } = lastResult;

  if (
    macd === undefined ||
    signal === undefined ||
    histogram === undefined ||
    isNaN(macd) ||
    isNaN(signal) ||
    isNaN(histogram) ||
    !isFinite(macd) ||
    !isFinite(signal) ||
    !isFinite(histogram)
  ) {
    return null;
  }

  return {
    macd,
    signal,
    histogram,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    bullish: histogram > 0 && macd > signal,
    bearish: histogram < 0 && macd < signal,
  };
}

export function calculateBollingerBands(
  candles: NormalizedCandle[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsSnapshot | null {
  if (candles.length < period) {
    return null;
  }

  const closes = extractCloses(candles);
  const bbResults = BollingerBands.calculate({
    values: closes,
    period,
    stdDev,
  });

  if (bbResults.length === 0) {
    return null;
  }

  const lastResult = bbResults[bbResults.length - 1];
  if (!lastResult) {
    return null;
  }

  const { upper, middle, lower } = lastResult;

  if (
    upper === undefined ||
    middle === undefined ||
    lower === undefined ||
    isNaN(upper) ||
    isNaN(middle) ||
    isNaN(lower) ||
    !isFinite(upper) ||
    !isFinite(middle) ||
    !isFinite(lower)
  ) {
    return null;
  }

  const currentPrice = closes[closes.length - 1]!;
  const bandwidth = (upper - lower) / middle;
  const percentB = (currentPrice - lower) / (upper - lower);

  return {
    upper,
    middle,
    lower,
    period,
    stdDev,
    bandwidth,
    percentB,
  };
}

export function calculateSMA(
  candles: NormalizedCandle[],
  period: number
): SMASnapshot | null {
  if (candles.length < period) {
    return null;
  }

  const closes = extractCloses(candles);
  const smaValues = SMA.calculate({ values: closes, period });

  if (smaValues.length === 0) {
    return null;
  }

  const value = smaValues[smaValues.length - 1]!;

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  return {
    value,
    period,
  };
}

export function calculateEMA(
  candles: NormalizedCandle[],
  period: number
): EMASnapshot | null {
  if (candles.length < period) {
    return null;
  }

  const closes = extractCloses(candles);
  const emaValues = EMA.calculate({ values: closes, period });

  if (emaValues.length === 0) {
    return null;
  }

  const value = emaValues[emaValues.length - 1]!;

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  return {
    value,
    period,
  };
}

export function calculateATR(
  candles: NormalizedCandle[],
  period: number = 14
): ATRSnapshot | null {
  if (candles.length < period + 1) {
    return null;
  }

  const highs = extractHighs(candles);
  const lows = extractLows(candles);
  const closes = extractCloses(candles);

  const atrValues = ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period,
  });

  if (atrValues.length === 0) {
    return null;
  }

  const value = atrValues[atrValues.length - 1]!;

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  return {
    value,
    period,
  };
}

export function calculateVolume(
  candles: NormalizedCandle[],
  period: number = 20
): VolumeSnapshot | null {
  if (candles.length < period) {
    return null;
  }

  const volumes = extractVolumes(candles);
  const current = volumes[volumes.length - 1]!;

  const smaValues = SMA.calculate({ values: volumes, period });

  if (smaValues.length === 0) {
    return null;
  }

  const average = smaValues[smaValues.length - 1]!;

  if (isNaN(current) || isNaN(average) || !isFinite(current) || !isFinite(average)) {
    return null;
  }

  const ratio = average > 0 ? current / average : 0;

  return {
    current,
    average,
    ratio,
    period,
  };
}

export function calculateMultiPeriodSMA(
  candles: NormalizedCandle[],
  periods: number[]
): MultiPeriodSMA {
  const result: MultiPeriodSMA = {};

  for (const period of periods) {
    const sma = calculateSMA(candles, period);
    if (sma) {
      result[period] = sma;
    }
  }

  return result;
}

export function calculateMultiPeriodEMA(
  candles: NormalizedCandle[],
  periods: number[]
): MultiPeriodEMA {
  const result: MultiPeriodEMA = {};

  for (const period of periods) {
    const ema = calculateEMA(candles, period);
    if (ema) {
      result[period] = ema;
    }
  }

  return result;
}
