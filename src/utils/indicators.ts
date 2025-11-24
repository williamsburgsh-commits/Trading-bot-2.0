import { KlineData } from '../types';

export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i]! - closes[i - 1]!;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i]! - closes[i - 1]!;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  ema.push(data[0]!);

  for (let i = 1; i < data.length; i++) {
    const value = (data[i]! - ema[i - 1]!) * multiplier + ema[i - 1]!;
    ema.push(value);
  }

  return ema;
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < slowPeriod + signalPeriod) {
    return null;
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]!);
  const signalLine = calculateEMA(macdLine, signalPeriod);

  const lastIndex = macdLine.length - 1;
  const macd = macdLine[lastIndex]!;
  const signal = signalLine[lastIndex]!;
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

export function calculateVolatility(closes: number[], period: number = 20): number {
  if (closes.length < period) {
    return 0;
  }

  const slice = closes.slice(-period);
  const mean = slice.reduce((sum, val) => sum + val, 0) / period;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;

  return Math.sqrt(variance);
}
