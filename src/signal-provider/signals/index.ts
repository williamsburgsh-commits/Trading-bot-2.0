export interface Signal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  timestamp: Date;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface ISignalGenerator {
  generateSignals(indicators: unknown, marketData: unknown): Signal[];
}

export interface ISignalValidator {
  validate(signal: Signal): boolean;
}
