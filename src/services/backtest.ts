import { KlineData, Signal } from '../types';
import { UnifiedMarketDataService, AllSymbols, Timeframe, AssetType } from './unifiedMarketData';
import { DailyStrategy } from './strategies/daily';
import { ScalpingStrategy } from './strategies/scalping';
import { BacktestMetrics } from './strategies/SignalFactory';

export interface BacktestConfig {
  lookbackDays: number;
  commissionPercent: number;
}

export interface BacktestResult {
  strategy: string;
  asset: string;
  timeframe: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
}

const DEFAULT_CONFIG: BacktestConfig = {
  lookbackDays: 90,
  commissionPercent: 0.001,
};

export class BacktestService {
  private marketDataService: UnifiedMarketDataService;
  private config: BacktestConfig;
  private cachedMetrics: Map<string, BacktestMetrics>;

  constructor(marketDataService: UnifiedMarketDataService, config?: Partial<BacktestConfig>) {
    this.marketDataService = marketDataService;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cachedMetrics = new Map();
  }

  async backtestAllStrategies(): Promise<Map<string, BacktestMetrics>> {
    console.log('Starting backtest for all strategies...');

    const assets = this.marketDataService.getAllSymbols();
    const dailyTimeframes: Timeframe[] = ['4h', '1d'];
    const scalpingTimeframes: Timeframe[] = ['5m', '15m', '30m', '1h'];

    for (const asset of assets) {
      const assetType = this.marketDataService.getAssetType(asset);

      for (const timeframe of dailyTimeframes) {
        await this.backtestStrategy('daily', asset, assetType, timeframe);
      }

      if (assetType === 'crypto') {
        for (const timeframe of scalpingTimeframes) {
          await this.backtestStrategy('scalping', asset, assetType, timeframe);
        }
      }
    }

    console.log(`Backtest completed. Cached ${this.cachedMetrics.size} metrics.`);
    return this.cachedMetrics;
  }

  async backtestStrategy(
    strategyName: 'daily' | 'scalping',
    asset: AllSymbols,
    assetType: AssetType,
    timeframe: Timeframe
  ): Promise<BacktestResult | null> {
    try {
      console.log(`Backtesting ${strategyName} strategy for ${asset} on ${timeframe}...`);

      const limit = this.calculateLimitForTimeframe(timeframe);
      const klines = await this.marketDataService.getKlines(asset, timeframe, limit);

      if (klines.length < 200) {
        console.log(`Insufficient data for backtesting ${asset} on ${timeframe}`);
        return null;
      }

      const signals = await this.generateBacktestSignals(
        strategyName,
        asset,
        assetType,
        timeframe,
        klines
      );

      if (signals.length === 0) {
        console.log(`No signals generated for ${asset} on ${timeframe}`);
        return null;
      }

      const result = this.calculateBacktestMetrics(signals, klines, strategyName, asset, timeframe);

      const metricsKey = `${strategyName}_${asset}_${timeframe}`;
      this.cachedMetrics.set(metricsKey, {
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        expectancy: result.expectancy,
        avgWin: result.avgWin,
        avgLoss: result.avgLoss,
      });

      console.log(
        `Backtest ${asset} ${timeframe}: ${result.totalTrades} trades, ${(result.winRate * 100).toFixed(1)}% win rate, ${result.expectancy.toFixed(2)} expectancy`
      );

      return result;
    } catch (error: any) {
      console.error(`Error backtesting ${asset} on ${timeframe}:`, error.message);
      return null;
    }
  }

  private async generateBacktestSignals(
    strategyName: 'daily' | 'scalping',
    asset: AllSymbols,
    assetType: AssetType,
    timeframe: Timeframe,
    klines: KlineData[]
  ): Promise<Signal[]> {
    const allSignals: Signal[] = [];
    const windowSize = 200;
    const stepSize = strategyName === 'daily' ? 10 : 5;

    for (let i = windowSize; i < klines.length; i += stepSize) {
      const windowKlines = klines.slice(i - windowSize, i);

      let signals: Signal[] = [];
      if (strategyName === 'daily') {
        const strategy = new DailyStrategy();
        signals = await strategy.generateSignals(asset, assetType, timeframe, windowKlines);
      } else {
        const strategy = new ScalpingStrategy();
        signals = await strategy.generateSignals(asset, assetType, timeframe, windowKlines);
      }

      allSignals.push(...signals);
    }

    return allSignals;
  }

  private calculateBacktestMetrics(
    signals: Signal[],
    klines: KlineData[],
    strategyName: string,
    asset: string,
    timeframe: string
  ): BacktestResult {
    let winningTrades = 0;
    let losingTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let equity = 10000;
    let peak = 10000;
    let maxDrawdown = 0;

    for (const signal of signals) {
      const entryPrice = signal.entryPrice;
      const takeProfit = signal.takeProfit;
      const stopLoss = signal.stopLoss;

      const futureKlines = klines.filter((k) => parseInt(k.openTime.toString()) > Date.now());
      let hitTP = false;
      let hitSL = false;

      for (const kline of futureKlines) {
        const high = parseFloat(kline.high);
        const low = parseFloat(kline.low);

        if (signal.signalType === 'BUY') {
          if (high >= takeProfit) {
            hitTP = true;
            break;
          }
          if (low <= stopLoss) {
            hitSL = true;
            break;
          }
        } else {
          if (low <= takeProfit) {
            hitTP = true;
            break;
          }
          if (high >= stopLoss) {
            hitSL = true;
            break;
          }
        }

        if (futureKlines.indexOf(kline) > 50) {
          break;
        }
      }

      let pnl = 0;
      if (hitTP) {
        if (signal.signalType === 'BUY') {
          pnl = ((takeProfit - entryPrice) / entryPrice) * 100;
        } else {
          pnl = ((entryPrice - takeProfit) / entryPrice) * 100;
        }
        pnl -= this.config.commissionPercent * 100;
        winningTrades++;
        totalProfit += pnl;
      } else if (hitSL) {
        if (signal.signalType === 'BUY') {
          pnl = ((stopLoss - entryPrice) / entryPrice) * 100;
        } else {
          pnl = ((entryPrice - stopLoss) / entryPrice) * 100;
        }
        pnl -= this.config.commissionPercent * 100;
        losingTrades++;
        totalLoss += Math.abs(pnl);
      }

      equity += (equity * pnl) / 100;
      if (equity > peak) {
        peak = equity;
      }
      const drawdown = ((peak - equity) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const totalTrades = winningTrades + losingTrades;
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
    const netProfit = totalProfit - totalLoss;
    const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

    return {
      strategy: strategyName,
      asset,
      timeframe,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      expectancy,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
    };
  }

  private calculateLimitForTimeframe(timeframe: Timeframe): number {
    const timeframeToLimit: Record<string, number> = {
      '1m': 1440 * 7,
      '5m': 288 * 30,
      '15m': 96 * 60,
      '30m': 48 * 90,
      '1h': 24 * 120,
      '4h': 6 * 180,
      '1d': 365,
    };

    return timeframeToLimit[timeframe] || 500;
  }

  getCachedMetrics(): Map<string, BacktestMetrics> {
    return this.cachedMetrics;
  }

  getMetricsForStrategy(
    strategy: string,
    asset: string,
    timeframe: string
  ): BacktestMetrics | undefined {
    const key = `${strategy}_${asset}_${timeframe}`;
    return this.cachedMetrics.get(key);
  }
}
