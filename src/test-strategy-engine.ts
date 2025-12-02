import 'dotenv/config';
import { UnifiedMarketDataService } from './services/unifiedMarketData';
import { StrategyOrchestrator } from './services/StrategyOrchestrator';
import { SignalFactory } from './services/strategies/SignalFactory';

async function testStrategyEngine() {
  console.log('='.repeat(80));
  console.log('Testing New Strategy Engine');
  console.log('='.repeat(80));

  const marketDataService = new UnifiedMarketDataService({
    alphaVantage: {
      apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
    },
  });

  const orchestrator = new StrategyOrchestrator(marketDataService, {
    runBacktestOnStartup: true,
    backtestLookbackDays: 30,
    enableDailyStrategy: true,
    enableScalpingStrategy: true,
  });

  console.log('\n--- Initializing Strategy Orchestrator ---');
  await orchestrator.initialize();

  console.log('\n--- Testing Daily Strategy ---');
  const dailySignals = await orchestrator.generateDailySignals(
    ['BTCUSDT', 'ETHUSDT'],
    ['4h', '1d']
  );

  console.log(`\nGenerated ${dailySignals.length} daily signals:`);
  for (const signal of dailySignals) {
    const metadata = signal.metadata ? JSON.parse(signal.metadata) : {};
    const stars = SignalFactory.convertConfidenceToStars(metadata.confidence || 50);

    console.log(`\n  ${signal.asset} [${signal.timeframe}] - ${signal.signalType}`);
    console.log(`    Entry: ${signal.entryPrice.toFixed(2)}`);
    console.log(`    TP: ${signal.takeProfit.toFixed(2)} | SL: ${signal.stopLoss.toFixed(2)}`);
    console.log(
      `    Confidence: ${metadata.confidence || 'N/A'}% (${'★'.repeat(stars)}${'☆'.repeat(5 - stars)})`
    );

    if (metadata.backtestWinRate) {
      console.log(
        `    Backtest: ${(metadata.backtestWinRate * 100).toFixed(1)}% win rate, ${metadata.backtestTrades} trades`
      );
    }

    if (metadata.multipleTargets) {
      console.log(`    Multiple Targets:`);
      console.log(
        `      TP1: ${metadata.multipleTargets.tp1.price.toFixed(2)} (${(metadata.multipleTargets.tp1.allocation * 100).toFixed(0)}%)`
      );
      console.log(
        `      TP2: ${metadata.multipleTargets.tp2.price.toFixed(2)} (${(metadata.multipleTargets.tp2.allocation * 100).toFixed(0)}%)`
      );
      console.log(
        `      TP3: ${metadata.multipleTargets.tp3.price.toFixed(2)} (${(metadata.multipleTargets.tp3.allocation * 100).toFixed(0)}%)`
      );
    }
  }

  console.log('\n--- Testing Scalping Strategy ---');
  const scalpingSignals = await orchestrator.generateScalpingSignals(['BTCUSDT'], ['5m', '15m']);

  console.log(`\nGenerated ${scalpingSignals.length} scalping signals:`);
  for (const signal of scalpingSignals) {
    const metadata = signal.metadata ? JSON.parse(signal.metadata) : {};
    const stars = SignalFactory.convertConfidenceToStars(metadata.confidence || 50);

    console.log(`\n  ${signal.asset} [${signal.timeframe}] - ${signal.signalType}`);
    console.log(`    Entry: ${signal.entryPrice.toFixed(2)}`);
    console.log(`    TP: ${signal.takeProfit.toFixed(2)} | SL: ${signal.stopLoss.toFixed(2)}`);
    console.log(
      `    Confidence: ${metadata.confidence || 'N/A'}% (${'★'.repeat(stars)}${'☆'.repeat(5 - stars)})`
    );

    if (metadata.backtestWinRate) {
      console.log(
        `    Backtest: ${(metadata.backtestWinRate * 100).toFixed(1)}% win rate, ${metadata.backtestTrades} trades`
      );
    }

    const indicators = metadata.indicators || {};
    if (indicators.emaSignal) {
      console.log(`    Strategy: EMA-RSI Crossover`);
    } else if (indicators.bbSignal) {
      console.log(`    Strategy: Bollinger Bands Squeeze`);
    } else if (indicators.stochSignal) {
      console.log(`    Strategy: Stochastic Crossover`);
    }
  }

  console.log('\n--- Backtest Metrics Summary ---');
  const metrics = orchestrator.getBacktestMetrics();
  console.log(`Total cached metrics: ${metrics.size}`);

  let dailyMetricsCount = 0;
  let scalpingMetricsCount = 0;
  let totalWinRate = 0;
  let metricsWithWinRate = 0;

  for (const [key, metric] of metrics.entries()) {
    if (key.startsWith('daily_')) {
      dailyMetricsCount++;
    } else if (key.startsWith('scalping_')) {
      scalpingMetricsCount++;
    }

    if (metric.winRate > 0) {
      totalWinRate += metric.winRate;
      metricsWithWinRate++;
    }
  }

  console.log(`  Daily strategy metrics: ${dailyMetricsCount}`);
  console.log(`  Scalping strategy metrics: ${scalpingMetricsCount}`);

  if (metricsWithWinRate > 0) {
    const avgWinRate = (totalWinRate / metricsWithWinRate) * 100;
    console.log(`  Average win rate: ${avgWinRate.toFixed(1)}%`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Strategy Engine Test Completed');
  console.log('='.repeat(80));
}

testStrategyEngine()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
