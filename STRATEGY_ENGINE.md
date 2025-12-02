# Strategy Engine Implementation

This document describes the comprehensive strategy engine implementation that replaces the simplistic `SignalEngine` with dedicated strategy modules for Daily and Scalping trading flows.

## Architecture Overview

The new strategy engine consists of the following components:

1. **SignalFactory** - Centralized signal creation with TP/SL calculation and confidence scoring
2. **DailyStrategy** - Long-term trading strategy (4h, 1d timeframes)
3. **ScalpingStrategy** - Short-term trading strategy (5m, 15m, 30m, 1h timeframes)
4. **BacktestService** - Historical data backtesting for strategy validation
5. **StrategyOrchestrator** - Coordinates strategy execution and backtest initialization

## Directory Structure

```
src/services/
├── strategies/
│   ├── SignalFactory.ts       # Signal creation and confidence scoring
│   ├── daily.ts                # Daily trading strategy
│   ├── scalping.ts             # Scalping trading strategy
│   └── index.ts                # Module exports
├── backtest.ts                 # Backtesting service
└── StrategyOrchestrator.ts     # Strategy coordination
```

## SignalFactory

The `SignalFactory` provides centralized signal creation with consistent TP/SL calculation and confidence scoring.

### Features

- **Multiple TP/SL Modes**: Percentage-based or pip-based (for forex)
- **Multi-Target Signals**: TP1 (40%), TP2 (35%), TP3 (25%)
- **Confidence Scoring**: Based on indicator confluence and backtest metrics
- **Star Rating**: 1-5 stars (1-star: <35%, 5-star: 80%+)
- **Risk Disclaimer**: Automatically added to signal metadata

### Usage

```typescript
import { SignalFactory } from './strategies/SignalFactory';

const signal = SignalFactory.createMultiTargetSignal(
  {
    asset: 'BTCUSDT',
    timeframe: '4h',
    signalType: 'BUY',
    entryPrice: 45000,
    assetType: 'crypto',
    indicators: {
      rsi: 28,
      macd: { bullish: true },
      volumeRatio: 1.8,
    },
  },
  {
    takeProfitPercent: 0.02,
    stopLossPercent: 0.01,
  },
  backtestMetrics
);
```

### Confidence Calculation

Confidence is calculated from multiple factors:

- **Indicator Confluence (40%)**: How many indicators agree
- **Backtest Win Rate (35%)**: Historical strategy performance
- **Volume Confirmation (15%)**: Volume ratio relative to average
- **Trend Alignment (10%)**: Direction alignment across timeframes

## Daily Strategy

The `DailyStrategy` implements three sub-strategies for longer-term trading:

### 1. EMA Crossover Strategy

- **Indicators**: 50/200 EMA crossover
- **Confirmation**: MACD bullish/bearish + RSI oversold/overbought
- **TP/SL**: 
  - Crypto: TP 1.5%, SL 0.75%
  - Forex: TP 1.0%, SL 0.5%

### 2. RSI Divergence Strategy

- **Indicators**: RSI(14) divergence detection
- **Entry Points**:
  - Bullish: RSI < 30
  - Bearish: RSI > 70
- **Confirmation**: MACD + EMA crossover
- **TP/SL**: Same as EMA strategy

### 3. Momentum Strategy

- **Indicators**: Strong EMA crossover + high volume
- **Requirements**: Volume ratio > 1.2, RSI neutral (30-70)
- **TP/SL**: 
  - Crypto: TP 2.0%, SL 1.0%
  - Forex: TP 2.0%, SL 0.7%

### Configuration

```typescript
const dailyStrategy = new DailyStrategy({
  maxSignalsPerAsset: 3,
  emaFastPeriod: 50,
  emaSlowPeriod: 200,
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
}, backtestMetrics);
```

### Signal Frequency

- Up to **3 signals per asset per daily run**
- Runs on: 4h, 1d timeframes
- Cron schedule: 00:00 UTC daily

## Scalping Strategy

The `ScalpingStrategy` implements three sub-strategies for short-term trading:

### 1. EMA-RSI Strategy

- **Indicators**: EMA9/EMA21 crossover + RSI filter
- **Entry Points**:
  - Buy: EMA9 > EMA21, RSI neutral, MACD bullish, Stochastic < 20
  - Sell: EMA9 < EMA21, RSI neutral, MACD bearish, Stochastic > 80
- **TP/SL**:
  - Crypto: TP 0.8%, SL 0.5%
  - Forex: TP 15 pips, SL 10 pips

### 2. Bollinger Bands Squeeze Strategy

- **Indicators**: BB(20/2) + MACD
- **Entry Points**:
  - Squeeze detection: Bandwidth < 0.02
  - Buy: Price near lower band + MACD bullish + volume > 1.5x
  - Sell: Price near upper band + MACD bearish + volume > 1.5x
- **TP/SL**:
  - Crypto: TP 1.2%, SL 0.6%
  - Forex: TP 20 pips, SL 12 pips

### 3. Stochastic Crossover Strategy

- **Indicators**: Stochastic(14/3) + EMA9/21
- **Entry Points**:
  - Bullish crossover: K > D, K < 30, EMA9 > EMA21
  - Bearish crossover: K < D, K > 70, EMA9 < EMA21
- **TP/SL**:
  - Crypto: TP 0.6%, SL 0.4%
  - Forex: TP 12 pips, SL 8 pips

### Configuration

```typescript
const scalpingStrategy = new ScalpingStrategy({
  maxSignalsPerAsset: 3,
  emaFastPeriod: 9,
  emaSlowPeriod: 21,
  rsiPeriod: 14,
  bbPeriod: 20,
  bbStdDev: 2,
  stochPeriod: 14,
  stochSignalPeriod: 3,
}, backtestMetrics);
```

### Signal Frequency

- Up to **3 signals per asset per run**
- Runs on: 5m, 15m, 30m, 1h timeframes
- Cron schedule: Every 5 minutes
- Assets: **Crypto only** (forex excluded for scalping)

## Backtest Service

The `BacktestService` validates strategies using historical data.

### Features

- **Historical Data Download**: Fetches appropriate candle count per timeframe
- **Walk-Forward Testing**: Sliding window approach for realistic results
- **Comprehensive Metrics**:
  - Win rate
  - Total trades
  - Expectancy
  - Average win/loss
  - Profit factor
  - Maximum drawdown

### Usage

```typescript
const backtestService = new BacktestService(marketDataService, {
  lookbackDays: 90,
  commissionPercent: 0.001,
});

const metrics = await backtestService.backtestAllStrategies();
```

### Backtest Metrics

Each strategy-asset-timeframe combination receives:

```typescript
{
  winRate: 0.65,        // 65% win rate
  totalTrades: 150,     // 150 trades executed
  expectancy: 1.2,      // 1.2% average profit per trade
  avgWin: 2.5,          // 2.5% average winning trade
  avgLoss: 1.0,         // 1.0% average losing trade
}
```

### Caching

- Metrics cached in memory after initial run
- Cache key format: `{strategy}_{asset}_{timeframe}`
- Shared across all strategy instances

## StrategyOrchestrator

The `StrategyOrchestrator` manages strategy execution and backtest initialization.

### Features

- **Backtest on Startup**: Optional automatic backtesting
- **Strategy Management**: Centralized strategy instantiation
- **Metrics Sharing**: Backtest metrics shared with all strategies
- **Flexible Configuration**: Enable/disable strategies independently

### Configuration

```typescript
const orchestrator = new StrategyOrchestrator(marketDataService, {
  runBacktestOnStartup: true,
  backtestLookbackDays: 90,
  enableDailyStrategy: true,
  enableScalpingStrategy: true,
});

await orchestrator.initialize();
```

### API

```typescript
// Generate daily signals
const dailySignals = await orchestrator.generateDailySignals(
  ['BTCUSDT', 'ETHUSDT'],
  ['4h', '1d']
);

// Generate scalping signals
const scalpingSignals = await orchestrator.generateScalpingSignals(
  ['BTCUSDT'],
  ['5m', '15m']
);

// Get backtest metrics
const metrics = orchestrator.getBacktestMetrics();
const btcMetrics = orchestrator.getMetricsForStrategy('daily', 'BTCUSDT', '4h');

// Run backtest manually
await orchestrator.runBacktest();
```

## Integration with Cron Jobs

### Daily Cron (`/api/cron/daily`)

```typescript
const orchestrator = new StrategyOrchestrator(marketDataService, {
  runBacktestOnStartup: false,  // Skip backtest in cron
  enableDailyStrategy: true,
  enableScalpingStrategy: false,
});

const signals = await orchestrator.generateDailySignals(ASSETS, TIMEFRAMES);
```

### Scalping Cron (`/api/cron/scalping`)

```typescript
const orchestrator = new StrategyOrchestrator(marketDataService, {
  runBacktestOnStartup: false,  // Skip backtest in cron
  enableDailyStrategy: false,
  enableScalpingStrategy: true,
});

const signals = await orchestrator.generateScalpingSignals(ASSETS, TIMEFRAMES);
```

## Signal Metadata Structure

Signals now include comprehensive metadata:

```json
{
  "assetType": "crypto",
  "indicators": {
    "ema50": 44500,
    "ema200": 43000,
    "rsi": 28,
    "macd": {
      "macd": 150.5,
      "signal": 120.2,
      "histogram": 30.3,
      "bullish": true
    },
    "volumeRatio": 1.8,
    "emaCrossover": true,
    "rsiDivergence": true
  },
  "confidence": 78,
  "backtestWinRate": 0.68,
  "backtestTrades": 145,
  "expectancy": 1.35,
  "multipleTargets": {
    "tp1": { "price": 45675, "allocation": 0.4 },
    "tp2": { "price": 46012, "allocation": 0.35 },
    "tp3": { "price": 46350, "allocation": 0.25 }
  },
  "riskDisclaimer": "Trading carries significant risk..."
}
```

## Testing

### Test Script

Run the test script to verify strategy engine functionality:

```bash
npm run test:strategy-engine
```

This will:
1. Initialize the orchestrator with backtesting
2. Generate daily signals for BTCUSDT/ETHUSDT
3. Generate scalping signals for BTCUSDT
4. Display signal details with confidence scores
5. Show backtest metrics summary

### Manual Testing

Test individual strategies:

```typescript
import { DailyStrategy } from './services/strategies/daily';
import { UnifiedMarketDataService } from './services/unifiedMarketData';

const marketData = new UnifiedMarketDataService({...});
const strategy = new DailyStrategy();

const klines = await marketData.getKlines('BTCUSDT', '4h', 300);
const signals = await strategy.generateSignals('BTCUSDT', 'crypto', '4h', klines);
```

## Performance Considerations

### Backtest Startup

- **Daily strategies**: ~30-60 seconds for all assets/timeframes
- **Scalping strategies**: ~60-120 seconds (more data points)
- **Recommendation**: Run backtest once at deployment, not in cron jobs

### Signal Generation

- **Daily**: ~2-5 seconds per asset/timeframe
- **Scalping**: ~1-3 seconds per asset/timeframe
- **Total daily cron**: ~30-60 seconds for all assets
- **Total scalping cron**: ~10-20 seconds for crypto assets

### Optimization Tips

1. **Disable backtest in cron jobs**: Set `runBacktestOnStartup: false`
2. **Use cached metrics**: Share metrics across runs via external cache
3. **Limit assets**: Focus on high-volume pairs
4. **Adjust timeframes**: Use fewer timeframes for faster execution

## Migration from Old Engine

### Old Engine (UnifiedSignalEngine)

```typescript
const signalEngine = new UnifiedSignalEngine(marketDataService);
const signals = await signalEngine.generateSignals('BTCUSDT', '4h');
```

### New Engine (StrategyOrchestrator)

```typescript
const orchestrator = new StrategyOrchestrator(marketDataService);
await orchestrator.initialize();
const signals = await orchestrator.generateDailySignals(['BTCUSDT'], ['4h']);
```

### Breaking Changes

1. **Batch Processing**: Strategies now process multiple assets at once
2. **Signal Metadata**: Richer metadata structure with confidence and backtest data
3. **Multiple Strategies**: Different strategies for daily vs. scalping
4. **Initialization Required**: Must call `initialize()` before generating signals

## Future Enhancements

1. **Additional Strategies**: Mean reversion, breakout, trend-following
2. **Machine Learning**: Neural network-based confidence scoring
3. **Real-Time Backtesting**: Continuous backtest updates
4. **Portfolio Management**: Position sizing and risk management
5. **Advanced Filters**: Correlation analysis, market regime detection

## References

- **Technical Analysis Module**: `src/modules/technical-analysis/`
- **Market Data Service**: `src/services/unifiedMarketData.ts`
- **Signal Types**: `src/types/index.ts`
- **Cron Jobs**: `app/api/cron/`
