import { Signal, KlineData } from '../../types';
import { AssetType } from '../unifiedMarketData';

export interface StrategySignalInput {
  asset: string;
  timeframe: string;
  signalType: 'BUY' | 'SELL';
  entryPrice: number;
  assetType: AssetType;
  indicators: {
    [key: string]: any;
  };
  confidence?: number;
}

export interface TPSLConfig {
  takeProfitPercent?: number;
  stopLossPercent?: number;
  takeProfitPips?: number;
  stopLossPips?: number;
}

export interface BacktestMetrics {
  winRate: number;
  totalTrades: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
}

export interface ConfidenceFactors {
  indicatorConfluence: number;
  backtestWinRate?: number;
  volumeConfirmation?: number;
  trendAlignment?: number;
}

export class SignalFactory {
  private static readonly RISK_DISCLAIMER =
    'Trading carries significant risk. Past performance does not guarantee future results. Only trade with capital you can afford to lose.';

  static createSignal(
    input: StrategySignalInput,
    tpslConfig: TPSLConfig,
    backtestMetrics?: BacktestMetrics
  ): Signal {
    const { entryPrice, takeProfit, stopLoss } = this.calculateTPSL(
      input.entryPrice,
      input.signalType,
      input.assetType,
      tpslConfig
    );

    const confidence =
      input.confidence ||
      this.calculateConfidence({
        indicatorConfluence: this.calculateIndicatorConfluence(input.indicators),
        backtestWinRate: backtestMetrics?.winRate,
        volumeConfirmation: input.indicators.volumeRatio,
      });

    const metadata = {
      assetType: input.assetType,
      indicators: input.indicators,
      confidence,
      backtestWinRate: backtestMetrics?.winRate,
      backtestTrades: backtestMetrics?.totalTrades,
      expectancy: backtestMetrics?.expectancy,
      riskDisclaimer: this.RISK_DISCLAIMER,
    };

    return {
      asset: input.asset,
      timeframe: input.timeframe,
      entryPrice,
      takeProfit,
      stopLoss,
      status: 'active',
      signalType: input.signalType,
      metadata: JSON.stringify(metadata),
    };
  }

  static createMultiTargetSignal(
    input: StrategySignalInput,
    tpslConfig: TPSLConfig,
    backtestMetrics?: BacktestMetrics
  ): Signal {
    const baseSignal = this.createSignal(input, tpslConfig, backtestMetrics);

    const { tp1, tp2, tp3 } = this.calculateMultipleTargets(
      input.entryPrice,
      input.signalType,
      input.assetType,
      tpslConfig
    );

    const metadata = JSON.parse(baseSignal.metadata || '{}');
    metadata.multipleTargets = {
      tp1: { price: tp1, allocation: 0.4 },
      tp2: { price: tp2, allocation: 0.35 },
      tp3: { price: tp3, allocation: 0.25 },
    };

    return {
      ...baseSignal,
      takeProfit: tp3,
      metadata: JSON.stringify(metadata),
    };
  }

  private static calculateTPSL(
    entryPrice: number,
    signalType: 'BUY' | 'SELL',
    assetType: AssetType,
    config: TPSLConfig
  ): { entryPrice: number; takeProfit: number; stopLoss: number } {
    if (config.takeProfitPips && config.stopLossPips) {
      return this.calculateTPSLInPips(
        entryPrice,
        signalType,
        config.takeProfitPips,
        config.stopLossPips
      );
    }

    const defaultTP = assetType === 'forex' ? 0.01 : 0.015;
    const defaultSL = assetType === 'forex' ? 0.005 : 0.0075;

    const tpPercent = config.takeProfitPercent || defaultTP;
    const slPercent = config.stopLossPercent || defaultSL;

    if (signalType === 'BUY') {
      return {
        entryPrice,
        takeProfit: entryPrice * (1 + tpPercent),
        stopLoss: entryPrice * (1 - slPercent),
      };
    } else {
      return {
        entryPrice,
        takeProfit: entryPrice * (1 - tpPercent),
        stopLoss: entryPrice * (1 + slPercent),
      };
    }
  }

  private static calculateTPSLInPips(
    entryPrice: number,
    signalType: 'BUY' | 'SELL',
    tpPips: number,
    slPips: number
  ): { entryPrice: number; takeProfit: number; stopLoss: number } {
    const pipValue = 0.0001;
    const tpDistance = tpPips * pipValue;
    const slDistance = slPips * pipValue;

    if (signalType === 'BUY') {
      return {
        entryPrice,
        takeProfit: entryPrice + tpDistance,
        stopLoss: entryPrice - slDistance,
      };
    } else {
      return {
        entryPrice,
        takeProfit: entryPrice - tpDistance,
        stopLoss: entryPrice + slDistance,
      };
    }
  }

  private static calculateMultipleTargets(
    entryPrice: number,
    signalType: 'BUY' | 'SELL',
    assetType: AssetType,
    config: TPSLConfig
  ): { tp1: number; tp2: number; tp3: number } {
    const defaultTP = assetType === 'forex' ? 0.01 : 0.02;
    const tpPercent = config.takeProfitPercent || defaultTP;

    const tp1Percent = tpPercent * 0.33;
    const tp2Percent = tpPercent * 0.67;
    const tp3Percent = tpPercent;

    if (signalType === 'BUY') {
      return {
        tp1: entryPrice * (1 + tp1Percent),
        tp2: entryPrice * (1 + tp2Percent),
        tp3: entryPrice * (1 + tp3Percent),
      };
    } else {
      return {
        tp1: entryPrice * (1 - tp1Percent),
        tp2: entryPrice * (1 - tp2Percent),
        tp3: entryPrice * (1 - tp3Percent),
      };
    }
  }

  private static calculateConfidence(factors: ConfidenceFactors): number {
    let score = 0;
    let weights = 0;

    if (factors.indicatorConfluence !== undefined) {
      score += factors.indicatorConfluence * 40;
      weights += 40;
    }

    if (factors.backtestWinRate !== undefined) {
      score += factors.backtestWinRate * 100 * 35;
      weights += 35;
    }

    if (factors.volumeConfirmation !== undefined) {
      const volumeScore = Math.min(factors.volumeConfirmation / 2, 1);
      score += volumeScore * 15;
      weights += 15;
    }

    if (factors.trendAlignment !== undefined) {
      score += factors.trendAlignment * 10;
      weights += 10;
    }

    const normalizedScore = weights > 0 ? score / weights : 0.5;
    return Math.round(Math.max(0, Math.min(100, normalizedScore * 100)));
  }

  private static calculateIndicatorConfluence(indicators: { [key: string]: any }): number {
    let confirming = 0;
    let total = 0;

    if (indicators.rsi !== undefined) {
      total++;
      if (indicators.rsi < 30 || indicators.rsi > 70) {
        confirming++;
      }
    }

    if (indicators.macd !== undefined) {
      total++;
      if (indicators.macd.bullish || indicators.macd.bearish) {
        confirming++;
      }
    }

    if (indicators.emaSignal !== undefined) {
      total++;
      if (indicators.emaSignal) {
        confirming++;
      }
    }

    if (indicators.bbSignal !== undefined) {
      total++;
      if (indicators.bbSignal) {
        confirming++;
      }
    }

    if (indicators.stochSignal !== undefined) {
      total++;
      if (indicators.stochSignal) {
        confirming++;
      }
    }

    return total > 0 ? confirming / total : 0.5;
  }

  static convertConfidenceToStars(confidence: number): number {
    if (confidence >= 80) return 5;
    if (confidence >= 65) return 4;
    if (confidence >= 50) return 3;
    if (confidence >= 35) return 2;
    return 1;
  }
}
