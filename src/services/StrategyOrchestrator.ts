import { Signal, KlineData } from '../types';
import { UnifiedMarketDataService, AllSymbols, Timeframe, AssetType } from './unifiedMarketData';
import { DailyStrategy } from './strategies/daily';
import { ScalpingStrategy } from './strategies/scalping';
import { BacktestService } from './backtest';
import { BacktestMetrics } from './strategies/SignalFactory';

export interface StrategyOrchestratorConfig {
  runBacktestOnStartup: boolean;
  backtestLookbackDays: number;
  enableDailyStrategy: boolean;
  enableScalpingStrategy: boolean;
}

const DEFAULT_CONFIG: StrategyOrchestratorConfig = {
  runBacktestOnStartup: true,
  backtestLookbackDays: 90,
  enableDailyStrategy: true,
  enableScalpingStrategy: true,
};

export class StrategyOrchestrator {
  private marketDataService: UnifiedMarketDataService;
  private backtestService: BacktestService;
  private dailyStrategy: DailyStrategy;
  private scalpingStrategy: ScalpingStrategy;
  private config: StrategyOrchestratorConfig;
  private backtestMetrics: Map<string, BacktestMetrics>;
  private initialized: boolean;

  constructor(
    marketDataService: UnifiedMarketDataService,
    config?: Partial<StrategyOrchestratorConfig>
  ) {
    this.marketDataService = marketDataService;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.backtestService = new BacktestService(marketDataService, {
      lookbackDays: this.config.backtestLookbackDays,
    });
    this.backtestMetrics = new Map();
    this.dailyStrategy = new DailyStrategy({}, this.backtestMetrics);
    this.scalpingStrategy = new ScalpingStrategy({}, this.backtestMetrics);
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('StrategyOrchestrator already initialized');
      return;
    }

    console.log('Initializing StrategyOrchestrator...');

    if (this.config.runBacktestOnStartup) {
      console.log('Running backtest on startup...');
      try {
        this.backtestMetrics = await this.backtestService.backtestAllStrategies();

        this.dailyStrategy = new DailyStrategy({}, this.backtestMetrics);
        this.scalpingStrategy = new ScalpingStrategy({}, this.backtestMetrics);

        console.log(`Backtest completed. Loaded ${this.backtestMetrics.size} metrics.`);
      } catch (error: any) {
        console.error('Error running backtest:', error.message);
        console.log('Continuing without backtest metrics...');
      }
    }

    this.initialized = true;
    console.log('StrategyOrchestrator initialized successfully');
  }

  async generateDailySignals(assets: AllSymbols[], timeframes: Timeframe[]): Promise<Signal[]> {
    if (!this.config.enableDailyStrategy) {
      console.log('Daily strategy is disabled');
      return [];
    }

    if (!this.initialized) {
      console.log('Initializing StrategyOrchestrator before generating signals...');
      await this.initialize();
    }

    const allSignals: Signal[] = [];

    for (const asset of assets) {
      const assetType = this.marketDataService.getAssetType(asset);

      for (const timeframe of timeframes) {
        try {
          console.log(`Generating daily signals for ${asset} on ${timeframe}...`);
          const klines = await this.marketDataService.getKlines(asset, timeframe, 300);

          if (klines.length < 200) {
            console.log(`Insufficient data for ${asset} on ${timeframe}`);
            continue;
          }

          const signals = await this.dailyStrategy.generateSignals(
            asset,
            assetType,
            timeframe,
            klines
          );
          allSignals.push(...signals);
        } catch (error: any) {
          console.error(
            `Error generating daily signals for ${asset} on ${timeframe}:`,
            error.message
          );
        }
      }
    }

    console.log(`Generated ${allSignals.length} daily signals`);
    return allSignals;
  }

  async generateScalpingSignals(assets: AllSymbols[], timeframes: Timeframe[]): Promise<Signal[]> {
    if (!this.config.enableScalpingStrategy) {
      console.log('Scalping strategy is disabled');
      return [];
    }

    if (!this.initialized) {
      console.log('Initializing StrategyOrchestrator before generating signals...');
      await this.initialize();
    }

    const allSignals: Signal[] = [];

    for (const asset of assets) {
      const assetType = this.marketDataService.getAssetType(asset);

      if (assetType === 'forex') {
        console.log(`Skipping scalping for forex asset ${asset} (crypto only)`);
        continue;
      }

      for (const timeframe of timeframes) {
        try {
          console.log(`Generating scalping signals for ${asset} on ${timeframe}...`);
          const klines = await this.marketDataService.getKlines(asset, timeframe, 300);

          if (klines.length < 100) {
            console.log(`Insufficient data for ${asset} on ${timeframe}`);
            continue;
          }

          const signals = await this.scalpingStrategy.generateSignals(
            asset,
            assetType,
            timeframe,
            klines
          );
          allSignals.push(...signals);
        } catch (error: any) {
          console.error(
            `Error generating scalping signals for ${asset} on ${timeframe}:`,
            error.message
          );
        }
      }
    }

    console.log(`Generated ${allSignals.length} scalping signals`);
    return allSignals;
  }

  getBacktestMetrics(): Map<string, BacktestMetrics> {
    return this.backtestMetrics;
  }

  getMetricsForStrategy(
    strategy: 'daily' | 'scalping',
    asset: string,
    timeframe: string
  ): BacktestMetrics | undefined {
    return this.backtestService.getMetricsForStrategy(strategy, asset, timeframe);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async runBacktest(): Promise<void> {
    console.log('Running manual backtest...');
    this.backtestMetrics = await this.backtestService.backtestAllStrategies();

    this.dailyStrategy = new DailyStrategy({}, this.backtestMetrics);
    this.scalpingStrategy = new ScalpingStrategy({}, this.backtestMetrics);

    console.log(`Backtest completed. Loaded ${this.backtestMetrics.size} metrics.`);
  }
}
