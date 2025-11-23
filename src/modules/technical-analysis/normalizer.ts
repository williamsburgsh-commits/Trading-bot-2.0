import { KlineData } from '../../types';
import { NormalizedCandle } from './types';

export function normalizeKlineData(klines: KlineData[]): NormalizedCandle[] {
  return klines.map((kline) => ({
    timestamp: kline.openTime,
    open: parseFloat(kline.open),
    high: parseFloat(kline.high),
    low: parseFloat(kline.low),
    close: parseFloat(kline.close),
    volume: parseFloat(kline.volume),
  }));
}

export function extractCloses(candles: NormalizedCandle[]): number[] {
  return candles.map((c) => c.close);
}

export function extractHighs(candles: NormalizedCandle[]): number[] {
  return candles.map((c) => c.high);
}

export function extractLows(candles: NormalizedCandle[]): number[] {
  return candles.map((c) => c.low);
}

export function extractVolumes(candles: NormalizedCandle[]): number[] {
  return candles.map((c) => c.volume);
}

export function extractOpens(candles: NormalizedCandle[]): number[] {
  return candles.map((c) => c.open);
}

export function validateCandles(candles: NormalizedCandle[]): boolean {
  if (!candles || candles.length === 0) {
    return false;
  }

  return candles.every((candle) => {
    return (
      !isNaN(candle.open) &&
      !isNaN(candle.high) &&
      !isNaN(candle.low) &&
      !isNaN(candle.close) &&
      !isNaN(candle.volume) &&
      candle.open > 0 &&
      candle.high > 0 &&
      candle.low > 0 &&
      candle.close > 0 &&
      candle.volume >= 0 &&
      candle.high >= candle.low &&
      candle.high >= candle.open &&
      candle.high >= candle.close &&
      candle.low <= candle.open &&
      candle.low <= candle.close
    );
  });
}
