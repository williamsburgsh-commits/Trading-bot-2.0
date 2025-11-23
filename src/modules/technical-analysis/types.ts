export interface NormalizedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSISnapshot {
  value: number;
  period: number;
  overbought: boolean;
  oversold: boolean;
}

export interface MACDSnapshot {
  macd: number;
  signal: number;
  histogram: number;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  bullish: boolean;
  bearish: boolean;
}

export interface BollingerBandsSnapshot {
  upper: number;
  middle: number;
  lower: number;
  period: number;
  stdDev: number;
  bandwidth: number;
  percentB: number;
}

export interface SMASnapshot {
  value: number;
  period: number;
}

export interface EMASnapshot {
  value: number;
  period: number;
}

export interface ATRSnapshot {
  value: number;
  period: number;
}

export interface VolumeSnapshot {
  current: number;
  average: number;
  ratio: number;
  period: number;
}

export interface MultiPeriodSMA {
  [period: number]: SMASnapshot;
}

export interface MultiPeriodEMA {
  [period: number]: EMASnapshot;
}

export interface IndicatorSnapshot {
  timestamp: number;
  asset: string;
  timeframe: string;
  price: number;
  rsi: RSISnapshot;
  macd: MACDSnapshot;
  bollingerBands: BollingerBandsSnapshot;
  sma: MultiPeriodSMA;
  ema: MultiPeriodEMA;
  atr: ATRSnapshot;
  volume: VolumeSnapshot;
}

export interface MultiTimeframeIndicators {
  [key: string]: IndicatorSnapshot;
}

export interface IndicatorConfig {
  rsi: {
    period: number;
    overbought: number;
    oversold: number;
  };
  macd: {
    fast: number;
    slow: number;
    signal: number;
  };
  bollingerBands: {
    period: number;
    stdDev: number;
  };
  sma: {
    periods: number[];
  };
  ema: {
    periods: number[];
  };
  atr: {
    period: number;
  };
  volume: {
    period: number;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
