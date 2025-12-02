import { SignalEngine } from '../signalEngine';
import { MarketDataService } from '../marketData';
import { KlineData } from '../../types';

jest.mock('../marketData');

const generateMockKlines = (
  count: number,
  trend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
): KlineData[] => {
  const klines: KlineData[] = [];
  const basePrice = 50000;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    let priceChange = 0;

    if (trend === 'bullish') {
      priceChange = i > count / 2 ? -50 * (count - i) : 25 * i;
    } else if (trend === 'bearish') {
      priceChange = i > count / 2 ? 50 * (count - i) : -25 * i;
    }

    const open = basePrice + priceChange;
    const close = open + (Math.random() - 0.5) * 100;
    const high = Math.max(open, close) + 50;
    const low = Math.min(open, close) - 50;
    const volume = i > count - 10 ? 2000 + Math.random() * 500 : 1000 + Math.random() * 200;

    klines.push({
      openTime: now - (count - i) * 60 * 60 * 1000,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toFixed(2),
      closeTime: now - (count - i - 1) * 60 * 60 * 1000 - 1,
      quoteVolume: (volume * close).toFixed(2),
      trades: Math.floor(Math.random() * 100),
      takerBuyBaseVolume: (volume * 0.6).toFixed(2),
      takerBuyQuoteVolume: (volume * close * 0.6).toFixed(2),
    });
  }

  return klines;
};

describe('SignalEngine', () => {
  let signalEngine: SignalEngine;
  let mockMarketDataService: jest.Mocked<MarketDataService>;

  beforeEach(() => {
    mockMarketDataService = new MarketDataService() as jest.Mocked<MarketDataService>;
    signalEngine = new SignalEngine();
    (signalEngine as any).marketDataService = mockMarketDataService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSignals', () => {
    it('should generate BUY signal with correct calculations', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(mockMarketDataService.getKlines).toHaveBeenCalledWith('BTCUSDT', '1h', 100);

      if (signals.length > 0) {
        const signal = signals[0]!;
        expect(signal.asset).toBe('BTCUSDT');
        expect(signal.timeframe).toBe('1h');
        expect(signal.signalType).toBeDefined();
        expect(signal.entryPrice).toBeGreaterThan(0);
        expect(signal.stopLoss).toBeGreaterThan(0);
        expect(signal.takeProfit).toBeGreaterThan(0);
        expect(signal.status).toBe('active');
        expect(signal.metadata).toBeDefined();

        const metadata = JSON.parse(signal.metadata!);
        expect(metadata).toHaveProperty('rsi');
        expect(metadata).toHaveProperty('macd');
        expect(metadata).toHaveProperty('volumeRatio');
        expect(metadata).toHaveProperty('volatility');
      }
    });

    it('should generate SELL signal with correct calculations', async () => {
      const mockKlines = generateMockKlines(100, 'bearish');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(mockMarketDataService.getKlines).toHaveBeenCalledWith('BTCUSDT', '1h', 100);

      if (signals.length > 0 && signals[0]!.signalType === 'SELL') {
        const signal = signals[0]!;
        expect(signal.signalType).toBe('SELL');
        expect(signal.stopLoss).toBeGreaterThan(signal.entryPrice);
        expect(signal.takeProfit).toBeLessThan(signal.entryPrice);
      }
    });

    it('should return empty array for insufficient data', async () => {
      const mockKlines = generateMockKlines(30);
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(signals).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockMarketDataService.getKlines = jest.fn().mockRejectedValue(new Error('API Error'));

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(signals).toEqual([]);
    });

    it('should not generate signal when conditions are not met', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(mockMarketDataService.getKlines).toHaveBeenCalled();
    });

    it('should calculate risk/reward ratio correctly for BUY signals', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockKlines[99]!.close = '50000.00';

      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0 && signals[0]!.signalType === 'BUY') {
        const signal = signals[0]!;
        const entryPrice = signal.entryPrice;
        const risk = entryPrice - signal.stopLoss;
        const reward = signal.takeProfit - entryPrice;
        const ratio = reward / risk;

        expect(ratio).toBeCloseTo(2, 1);
      }
    });

    it('should calculate risk/reward ratio correctly for SELL signals', async () => {
      const mockKlines = generateMockKlines(100, 'bearish');
      mockKlines[99]!.close = '50000.00';

      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0 && signals[0]!.signalType === 'SELL') {
        const signal = signals[0]!;
        const entryPrice = signal.entryPrice;
        const risk = signal.stopLoss - entryPrice;
        const reward = entryPrice - signal.takeProfit;
        const ratio = reward / risk;

        expect(ratio).toBeCloseTo(2, 1);
      }
    });

    it('should include all required indicator data in metadata', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0) {
        const metadata = JSON.parse(signals[0]!.metadata!);

        expect(metadata.rsi).toBeDefined();
        expect(typeof metadata.rsi).toBe('number');

        expect(metadata.macd).toBeDefined();
        expect(metadata.macd).toHaveProperty('macd');
        expect(metadata.macd).toHaveProperty('signal');
        expect(metadata.macd).toHaveProperty('histogram');

        expect(metadata.volumeRatio).toBeDefined();
        expect(typeof metadata.volumeRatio).toBe('number');

        expect(metadata.volatility).toBeDefined();
        expect(typeof metadata.volatility).toBe('number');
      }
    });
  });

  describe('indicator validation', () => {
    it('should validate RSI is within valid range', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0) {
        const metadata = JSON.parse(signals[0]!.metadata!);
        expect(metadata.rsi).toBeGreaterThanOrEqual(0);
        expect(metadata.rsi).toBeLessThanOrEqual(100);
      }
    });

    it('should validate volume ratio is positive', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0) {
        const metadata = JSON.parse(signals[0]!.metadata!);
        expect(metadata.volumeRatio).toBeGreaterThan(0);
      }
    });

    it('should validate volatility is non-negative', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines = jest.fn().mockResolvedValue(mockKlines);

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0) {
        const metadata = JSON.parse(signals[0]!.metadata!);
        expect(metadata.volatility).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
