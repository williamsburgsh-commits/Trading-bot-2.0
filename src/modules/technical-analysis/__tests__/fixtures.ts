import { KlineData } from '../../../types';
import { NormalizedCandle } from '../types';

export function generateMockKlines(count: number, basePrice: number = 50000): KlineData[] {
  const klines: KlineData[] = [];
  let price = basePrice;
  const baseTime = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * basePrice * 0.02;
    price += change;
    const open = price;
    const high = price + Math.random() * basePrice * 0.01;
    const low = price - Math.random() * basePrice * 0.01;
    const close = low + Math.random() * (high - low);
    const volume = 100 + Math.random() * 200;

    klines.push({
      openTime: baseTime + i * 60000,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toFixed(2),
      closeTime: baseTime + (i + 1) * 60000,
      quoteVolume: (volume * close).toFixed(2),
      trades: Math.floor(Math.random() * 100) + 50,
      takerBuyBaseVolume: (volume * 0.5).toFixed(2),
      takerBuyQuoteVolume: (volume * close * 0.5).toFixed(2),
    });
  }

  return klines;
}

export function generateBullishTrend(count: number, basePrice: number = 50000): KlineData[] {
  const klines: KlineData[] = [];
  let price = basePrice;
  const baseTime = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const upwardChange = basePrice * 0.005;
    price += upwardChange + (Math.random() - 0.3) * basePrice * 0.01;
    const open = price;
    const high = price + Math.random() * basePrice * 0.008;
    const low = price - Math.random() * basePrice * 0.005;
    const close = low + Math.random() * (high - low) * 0.7 + (high - low) * 0.3;
    const volume = 100 + Math.random() * 200;

    klines.push({
      openTime: baseTime + i * 60000,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toFixed(2),
      closeTime: baseTime + (i + 1) * 60000,
      quoteVolume: (volume * close).toFixed(2),
      trades: Math.floor(Math.random() * 100) + 50,
      takerBuyBaseVolume: (volume * 0.5).toFixed(2),
      takerBuyQuoteVolume: (volume * close * 0.5).toFixed(2),
    });
  }

  return klines;
}

export function generateBearishTrend(count: number, basePrice: number = 50000): KlineData[] {
  const klines: KlineData[] = [];
  let price = basePrice;
  const baseTime = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const downwardChange = basePrice * 0.005;
    price -= downwardChange + (Math.random() - 0.7) * basePrice * 0.01;
    const open = price;
    const high = price + Math.random() * basePrice * 0.005;
    const low = price - Math.random() * basePrice * 0.008;
    const close = low + Math.random() * (high - low) * 0.3;
    const volume = 100 + Math.random() * 200;

    klines.push({
      openTime: baseTime + i * 60000,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toFixed(2),
      closeTime: baseTime + (i + 1) * 60000,
      quoteVolume: (volume * close).toFixed(2),
      trades: Math.floor(Math.random() * 100) + 50,
      takerBuyBaseVolume: (volume * 0.5).toFixed(2),
      takerBuyQuoteVolume: (volume * close * 0.5).toFixed(2),
    });
  }

  return klines;
}

export function generateKnownValuesKlines(): KlineData[] {
  const closes = [
    44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28,
    46.28, 46.0, 46.03, 46.41, 46.22, 45.64,
  ];
  const baseTime = Date.now() - closes.length * 60000;

  return closes.map((close, i) => ({
    openTime: baseTime + i * 60000,
    open: i > 0 ? closes[i - 1]!.toFixed(2) : close.toFixed(2),
    high: (close + 0.5).toFixed(2),
    low: (close - 0.5).toFixed(2),
    close: close.toFixed(2),
    volume: '1000',
    closeTime: baseTime + (i + 1) * 60000,
    quoteVolume: (1000 * close).toFixed(2),
    trades: 100,
    takerBuyBaseVolume: '500',
    takerBuyQuoteVolume: (500 * close).toFixed(2),
  }));
}

export function generateInsufficientKlines(): KlineData[] {
  return generateMockKlines(5);
}

export function generateInvalidKlines(): KlineData[] {
  return [
    {
      openTime: Date.now(),
      open: 'NaN',
      high: '50100',
      low: '49900',
      close: '50000',
      volume: '100',
      closeTime: Date.now() + 60000,
      quoteVolume: '5000000',
      trades: 100,
      takerBuyBaseVolume: '50',
      takerBuyQuoteVolume: '2500000',
    },
  ];
}

export const mockNormalizedCandles: NormalizedCandle[] = [
  { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
  { timestamp: 2000, open: 102, high: 108, low: 100, close: 106, volume: 1200 },
  { timestamp: 3000, open: 106, high: 110, low: 104, close: 108, volume: 1100 },
  { timestamp: 4000, open: 108, high: 112, low: 106, close: 110, volume: 1300 },
  { timestamp: 5000, open: 110, high: 115, low: 108, close: 113, volume: 1400 },
];
