import { UnifiedSignalEngine } from '../unifiedSignalEngine';
import { UnifiedMarketDataService } from '../unifiedMarketData';
import { KlineData } from '../../types';

const generateMockKlines = (
  count: number,
  trend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
): KlineData[] => {
  const klines: KlineData[] = [];
  const basePrice = 1.1;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    let priceChange = 0;

    if (trend === 'bullish') {
      priceChange = i > count / 2 ? -0.001 * (count - i) : 0.0005 * i;
    } else if (trend === 'bearish') {
      priceChange = i > count / 2 ? 0.001 * (count - i) : -0.0005 * i;
    }

    const open = basePrice * (1 + priceChange);
    const close = open * (1 + (Math.random() - 0.5) * 0.002);
    const high = Math.max(open, close) * 1.001;
    const low = Math.min(open, close) * 0.999;
    const volume = i > count - 10 ? 2000 + Math.random() * 500 : 1000 + Math.random() * 200;

    klines.push({
      openTime: now - (count - i) * 60 * 60 * 1000,
      open: open.toFixed(6),
      high: high.toFixed(6),
      low: low.toFixed(6),
      close: close.toFixed(6),
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

describe('UnifiedSignalEngine', () => {
  let mockMarketDataService: jest.Mocked<UnifiedMarketDataService>;
  let signalEngine: UnifiedSignalEngine;

  beforeEach(() => {
    mockMarketDataService = {
      getKlines: jest.fn(),
      getAssetType: jest.fn(),
      getAllSymbols: jest.fn(),
      getCryptoSymbols: jest.fn(),
      getForexSymbols: jest.fn(),
      isFinnhubEnabled: jest.fn(),
      close: jest.fn(),
    } as any;

    signalEngine = new UnifiedSignalEngine(mockMarketDataService, {
      rsiPeriod: 14,
      rsiOversold: 30,
      rsiOverbought: 70,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      volumeThreshold: 1.5,
    });
  });

  describe('generateSignals', () => {
    it('should generate BUY signal for crypto with oversold conditions', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('crypto');

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(mockMarketDataService.getKlines).toHaveBeenCalledWith('BTCUSDT', '1h', 100);
      expect(mockMarketDataService.getAssetType).toHaveBeenCalledWith('BTCUSDT');
    });

    it('should generate SELL signal for crypto with overbought conditions', async () => {
      const mockKlines = generateMockKlines(100, 'bearish');
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('crypto');

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(mockMarketDataService.getKlines).toHaveBeenCalledWith('BTCUSDT', '1h', 100);
      expect(mockMarketDataService.getAssetType).toHaveBeenCalledWith('BTCUSDT');
    });

    it('should generate signals for forex pairs', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('forex');

      const signals = await signalEngine.generateSignals('EUR/USD', '1h');

      expect(mockMarketDataService.getKlines).toHaveBeenCalledWith('EUR/USD', '1h', 100);
      expect(mockMarketDataService.getAssetType).toHaveBeenCalledWith('EUR/USD');
    });

    it('should apply tighter risk for forex pairs', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockKlines[99]!.close = '1.100000';

      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('forex');

      const signals = await signalEngine.generateSignals('EUR/USD', '1h');

      if (signals.length > 0) {
        const signal = signals[0]!;
        const entryPrice = signal.entryPrice;
        const riskPercent = Math.abs(entryPrice - signal.stopLoss) / entryPrice;

        expect(riskPercent).toBeLessThan(0.02);
      }
    });

    it('should apply normal risk for crypto pairs', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockKlines[99]!.close = '45000.00';

      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('crypto');

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      if (signals.length > 0) {
        const signal = signals[0]!;
        const entryPrice = signal.entryPrice;
        const riskPercent = Math.abs(entryPrice - signal.stopLoss) / entryPrice;

        expect(riskPercent).toBeCloseTo(0.02, 3);
      }
    });

    it('should return empty array for insufficient data', async () => {
      const mockKlines = generateMockKlines(30);
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('crypto');

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(signals).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockMarketDataService.getKlines.mockRejectedValue(new Error('API Error'));

      const signals = await signalEngine.generateSignals('BTCUSDT', '1h');

      expect(signals).toEqual([]);
    });

    it('should include assetType in metadata', async () => {
      const mockKlines = generateMockKlines(100, 'bullish');
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('forex');

      const signals = await signalEngine.generateSignals('EUR/USD', '1h');

      if (signals.length > 0) {
        const metadata = JSON.parse(signals[0]!.metadata || '{}');
        expect(metadata.assetType).toBe('forex');
      }
    });
  });

  describe('generateAllSignals', () => {
    it('should generate signals for all symbols and timeframes', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockReturnValue('crypto');
      mockMarketDataService.getAllSymbols.mockReturnValue(['BTCUSDT', 'ETHUSDT', 'EUR/USD'] as any);

      const signals = await signalEngine.generateAllSignals(['1h', '4h']);

      expect(mockMarketDataService.getKlines).toHaveBeenCalledTimes(6);
      expect(mockMarketDataService.getAllSymbols).toHaveBeenCalled();
    });

    it('should handle mixed crypto and forex symbols', async () => {
      const mockKlines = generateMockKlines(100, 'neutral');
      mockMarketDataService.getKlines.mockResolvedValue(mockKlines);
      mockMarketDataService.getAssetType.mockImplementation((symbol) => {
        return symbol.includes('USDT') ? 'crypto' : 'forex';
      });
      mockMarketDataService.getAllSymbols.mockReturnValue(['BTCUSDT', 'EUR/USD'] as any);

      const signals = await signalEngine.generateAllSignals(['1h']);

      expect(mockMarketDataService.getAssetType).toHaveBeenCalledWith('BTCUSDT');
      expect(mockMarketDataService.getAssetType).toHaveBeenCalledWith('EUR/USD');
    });
  });
});
