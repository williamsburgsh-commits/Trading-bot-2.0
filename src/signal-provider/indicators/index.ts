export interface Indicator {
  name: string;
  calculate(data: number[]): number | null;
}

export interface IndicatorSnapshot {
  timestamp: Date;
  values: Record<string, number | null>;
}

export interface IIndicatorService {
  computeIndicators(klines: unknown[]): IndicatorSnapshot;
}
