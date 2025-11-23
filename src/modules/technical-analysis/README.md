# Technical Analysis Module

A comprehensive technical analysis module for computing indicators on cryptocurrency candle data with multi-timeframe support.

## Features

- **Data Normalization**: Converts Binance API kline data to normalized numerical format
- **Comprehensive Indicators**:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - SMA (Simple Moving Average) - Multi-period support
  - EMA (Exponential Moving Average) - Multi-period support
  - ATR (Average True Range)
  - Volume Analysis
- **Multi-Timeframe Support**: Aggregate indicators across multiple timeframes for the same asset
- **Type-Safe**: Fully typed TypeScript with comprehensive interfaces
- **NaN Prevention**: Robust validation and edge case handling
- **Pure Functions**: All indicator calculations are pure functions for predictability

## Installation

The module uses the `technicalindicators` library for reliable calculations:

```bash
npm install technicalindicators
```

## Usage

### Basic Usage

```typescript
import { computeIndicators } from './modules/technical-analysis';
import { KlineData } from './types';

// Fetch kline data from your data source
const klines: KlineData[] = await marketDataService.getKlines('BTCUSDT', '1h', 250);

// Compute all indicators
const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

if (snapshot) {
  console.log('RSI:', snapshot.rsi.value);
  console.log('MACD Histogram:', snapshot.macd.histogram);
  console.log('Bollinger Bands:', snapshot.bollingerBands);
  console.log('SMA 20:', snapshot.sma[20]?.value);
  console.log('EMA 50:', snapshot.ema[50]?.value);
  console.log('ATR:', snapshot.atr.value);
  console.log('Volume Ratio:', snapshot.volume.ratio);
}
```

### Custom Configuration

```typescript
const config = {
  rsi: {
    period: 21,
    overbought: 80,
    oversold: 20,
  },
  macd: {
    fast: 8,
    slow: 21,
    signal: 5,
  },
  bollingerBands: {
    period: 30,
    stdDev: 2.5,
  },
  sma: {
    periods: [10, 20, 50],
  },
  ema: {
    periods: [12, 26, 50],
  },
  atr: {
    period: 20,
  },
  volume: {
    period: 30,
  },
};

const snapshot = computeIndicators(klines, 'BTCUSDT', '1h', config);
```

### Multi-Timeframe Analysis

```typescript
import { computeMultiTimeframeIndicators } from './modules/technical-analysis';

// Prepare klines for multiple timeframes
const klinesByTimeframe = new Map([
  ['15m', await marketDataService.getKlines('BTCUSDT', '15m', 250)],
  ['1h', await marketDataService.getKlines('BTCUSDT', '1h', 250)],
  ['4h', await marketDataService.getKlines('BTCUSDT', '4h', 250)],
]);

// Compute indicators for all timeframes
const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, 'BTCUSDT');

// Access by asset_timeframe key
console.log('1h RSI:', multiTF['BTCUSDT_1h']?.rsi.value);
console.log('4h MACD:', multiTF['BTCUSDT_4h']?.macd.histogram);
console.log('15m BB %B:', multiTF['BTCUSDT_15m']?.bollingerBands.percentB);
```

### Using Individual Indicator Functions

```typescript
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateSMA,
  calculateEMA,
  calculateATR,
  calculateVolume,
  normalizeKlineData,
} from './modules/technical-analysis';

const candles = normalizeKlineData(klines);

// Calculate individual indicators
const rsi = calculateRSI(candles, 14, 70, 30);
const macd = calculateMACD(candles, 12, 26, 9);
const bb = calculateBollingerBands(candles, 20, 2);
const sma20 = calculateSMA(candles, 20);
const ema50 = calculateEMA(candles, 50);
const atr = calculateATR(candles, 14);
const volume = calculateVolume(candles, 20);
```

## Data Types

### IndicatorSnapshot

The main output structure containing all computed indicators:

```typescript
interface IndicatorSnapshot {
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
```

### RSISnapshot

```typescript
interface RSISnapshot {
  value: number;           // RSI value (0-100)
  period: number;          // Period used
  overbought: boolean;     // True if RSI > overbought threshold
  oversold: boolean;       // True if RSI < oversold threshold
}
```

### MACDSnapshot

```typescript
interface MACDSnapshot {
  macd: number;            // MACD line
  signal: number;          // Signal line
  histogram: number;       // MACD histogram
  fastPeriod: number;      // Fast EMA period
  slowPeriod: number;      // Slow EMA period
  signalPeriod: number;    // Signal line period
  bullish: boolean;        // True if histogram > 0 and MACD > signal
  bearish: boolean;        // True if histogram < 0 and MACD < signal
}
```

### BollingerBandsSnapshot

```typescript
interface BollingerBandsSnapshot {
  upper: number;           // Upper band
  middle: number;          // Middle band (SMA)
  lower: number;           // Lower band
  period: number;          // Period used
  stdDev: number;          // Standard deviation multiplier
  bandwidth: number;       // Band width percentage
  percentB: number;        // %B indicator
}
```

## Edge Cases Handled

- **Insufficient Data**: Returns `null` if not enough candles for calculation
- **NaN Prevention**: All calculations validate for NaN and Infinity
- **Invalid Candles**: Validates candle structure (high >= low, etc.)
- **Zero Volume**: Handles zero volume gracefully
- **Empty Arrays**: Safely handles empty input arrays

## Testing

The module includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Test Coverage

- **Normalizer Tests**: Data conversion, extraction, validation
- **Indicator Tests**: Each indicator with various market conditions
- **Integration Tests**: End-to-end scenarios, multi-timeframe, edge cases
- **Fixtures**: Mock data generators for bullish, bearish, and ranging markets

## Default Configuration

```typescript
{
  rsi: { period: 14, overbought: 70, oversold: 30 },
  macd: { fast: 12, slow: 26, signal: 9 },
  bollingerBands: { period: 20, stdDev: 2 },
  sma: { periods: [10, 20, 50, 100, 200] },
  ema: { periods: [10, 20, 50, 100, 200] },
  atr: { period: 14 },
  volume: { period: 20 }
}
```

## Performance Considerations

- **Minimum Candles**: Ensure at least 200+ candles for all default indicators
- **Memory**: Large timeframe maps can consume memory; consider pagination
- **Computation**: Indicators are computed on-demand; cache results if needed

## Dependencies

- `technicalindicators`: Core indicator calculations library
- TypeScript type definitions included

## Future Enhancements

Potential additions:
- Stochastic Oscillator
- On-Balance Volume (OBV)
- Fibonacci Retracements
- Ichimoku Cloud
- Custom indicator support
- Indicator caching mechanism
- Streaming indicator updates
