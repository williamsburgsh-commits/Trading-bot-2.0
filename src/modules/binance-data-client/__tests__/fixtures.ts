import { KlineData } from '../../../types';
import { BinanceWebSocketMessage } from '../types';

export function generateMockBinanceKline(
  openTime: number = Date.now(),
  price: number = 50000
): any[] {
  const open = price;
  const high = price * 1.01;
  const low = price * 0.99;
  const close = price * 1.005;
  const volume = 100;

  return [
    openTime,
    open.toFixed(2),
    high.toFixed(2),
    low.toFixed(2),
    close.toFixed(2),
    volume.toFixed(2),
    openTime + 60000,
    (volume * close).toFixed(2),
    100,
    (volume * 0.6).toFixed(2),
    (volume * close * 0.6).toFixed(2),
    '0',
  ];
}

export function generateMockBinanceKlines(count: number, basePrice: number = 50000): any[] {
  const klines: any[] = [];
  let price = basePrice;
  const baseTime = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * basePrice * 0.02;
    price += change;
    klines.push(generateMockBinanceKline(baseTime + i * 60000, price));
  }

  return klines;
}

export function generateMockKlineData(
  openTime: number = Date.now(),
  price: number = 50000
): KlineData {
  const open = price;
  const high = price * 1.01;
  const low = price * 0.99;
  const close = price * 1.005;
  const volume = 100;

  return {
    openTime,
    open: open.toFixed(2),
    high: high.toFixed(2),
    low: low.toFixed(2),
    close: close.toFixed(2),
    volume: volume.toFixed(2),
    closeTime: openTime + 60000,
    quoteVolume: (volume * close).toFixed(2),
    trades: 100,
    takerBuyBaseVolume: (volume * 0.6).toFixed(2),
    takerBuyQuoteVolume: (volume * close * 0.6).toFixed(2),
  };
}

export function generateMockWebSocketMessage(
  symbol: string = 'BTCUSDT',
  timeframe: string = '1h',
  isFinal: boolean = false
): BinanceWebSocketMessage {
  const now = Date.now();
  const price = 50000;
  const open = price;
  const high = price * 1.01;
  const low = price * 0.99;
  const close = price * 1.005;
  const volume = 100;

  return {
    e: 'kline',
    E: now,
    s: symbol,
    k: {
      t: now - 60000,
      T: now,
      s: symbol,
      i: timeframe,
      f: 100,
      L: 200,
      o: open.toFixed(2),
      c: close.toFixed(2),
      h: high.toFixed(2),
      l: low.toFixed(2),
      v: volume.toFixed(2),
      n: 100,
      x: isFinal,
      q: (volume * close).toFixed(2),
      V: (volume * 0.6).toFixed(2),
      Q: (volume * close * 0.6).toFixed(2),
      B: '0',
    },
  };
}

export function generateInvalidBinanceKline(): any[] {
  return [
    Date.now(),
    'NaN',
    '50100',
    '49900',
    '50000',
    '100',
    Date.now() + 60000,
    '5000000',
    100,
    '50',
    '2500000',
    '0',
  ];
}

export function generateInvalidStructureKline(): any {
  return {
    openTime: Date.now(),
    open: '50000',
  };
}

export function generateInvalidWebSocketMessage(): any {
  return {
    e: 'trade',
    E: Date.now(),
    s: 'BTCUSDT',
  };
}

export const mockApiResponses = {
  successfulKlines: generateMockBinanceKlines(100),
  emptyKlines: [],
  singleKline: [generateMockBinanceKline()],
  rateLimitError: {
    code: -1003,
    msg: 'Too many requests',
  },
  serverError: {
    code: -1001,
    msg: 'Internal error',
  },
};
