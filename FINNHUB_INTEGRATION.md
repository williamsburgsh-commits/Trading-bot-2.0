# Finnhub Forex API Integration

This document describes the integration of Finnhub API for forex pair signals alongside existing crypto signals.

## Overview

The trading signal monitor now supports both cryptocurrency (via Binance) and forex pairs (via Finnhub). Signals are generated using the same technical analysis indicators (RSI, MACD, volume) for both asset types, with risk parameters adjusted for forex's tighter spreads.

## Supported Assets

### Cryptocurrency (Binance)
- BTCUSDT (Bitcoin)
- ETHUSDT (Ethereum)
- XRPUSDT (Ripple)
- SOLUSDT (Solana)

### Forex (Finnhub)
- USD/JPY (US Dollar / Japanese Yen)
- EUR/USD (Euro / US Dollar)
- GBP/USD (British Pound / US Dollar)

## Architecture

### Finnhub Data Client Module
Located in `src/modules/finnhub-data-client/`:

```
finnhub-data-client/
├── types.ts           # Type definitions for forex pairs, timeframes, API responses
├── rest-client.ts     # REST API client with retry/backoff and rate limiting
├── cache.ts           # In-memory caching with TTL
├── validator.ts       # Response schema validation
├── index.ts           # Main module exports
├── README.md          # Module documentation
└── __tests__/         # Unit tests (37 tests, 100% pass rate)
```

**Key Features:**
- REST API client for historical and real-time forex candles
- Rate limiting (80 calls/minute for free tier)
- In-memory caching with TTL to reduce API calls
- Automatic retry with exponential backoff
- Response validation for data integrity

### Unified Market Data Service
Located in `src/services/unifiedMarketData.ts`:

Provides a unified interface for fetching market data from both Binance (crypto) and Finnhub (forex):

```typescript
const marketData = new UnifiedMarketDataService({
  binance: {
    rateLimit: { maxRequests: 1200, perMinutes: 1 }
  },
  finnhub: {
    apiKey: process.env.FINNHUB_API_KEY,
    rateLimit: { maxRequests: 80, perMinutes: 1 }
  }
});

// Automatically routes to the appropriate client
const btcData = await marketData.getKlines('BTCUSDT', '1h', 500);
const forexData = await marketData.getKlines('EUR/USD', '1h', 500);
```

### Unified Signal Engine
Located in `src/services/unifiedSignalEngine.ts`:

Generates signals for both crypto and forex using the same technical analysis:

**Signal Criteria (same for both asset types):**
- Buy: RSI < 30, MACD positive, volume > 1.5x average
- Sell: RSI > 70, MACD negative, volume > 1.5x average

**Risk Management (adjusted per asset type):**
- Crypto: 2% risk, 2:1 reward ratio
- Forex: 0.5% risk, 2:1 reward ratio (tighter spreads)

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Finnhub API Configuration
FINNHUB_API_KEY=your-api-key-here
FINNHUB_API_URL=https://finnhub.io/api/v1
FINNHUB_RATE_LIMIT_MAX=80
FINNHUB_RATE_LIMIT_MINUTES=1
```

**Get Your API Key:**
1. Register at https://finnhub.io/register
2. Free tier includes 80 API calls/minute
3. Copy your API key to `.env`

### Service Configuration

The signal provider automatically loads Finnhub configuration:

```typescript
// src/signal-provider/config/index.ts
export interface FinnhubConfig {
  apiKey?: string;
  baseUrl: string;
  rateLimit: {
    maxRequests: number;
    perMinutes: number;
  };
}
```

## Database Storage

Signals are stored in the same `Signal` table with asset type classification in metadata:

```prisma
model Signal {
  id          String   @id @default(uuid())
  asset       String   // e.g., "BTCUSDT" or "EUR/USD"
  timeframe   String   // "5m", "15m", "1h", "4h"
  entryPrice  Float
  takeProfit  Float
  stopLoss    Float
  status      String   @default("active")
  signalType  String   // "BUY" or "SELL"
  metadata    String?  // JSON with assetType, indicators, etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Metadata Structure:**
```json
{
  "assetType": "forex",
  "rsi": 28.5,
  "macd": {
    "macd": 0.0012,
    "signal": 0.0008,
    "histogram": 0.0004
  },
  "volumeRatio": 1.8,
  "volatility": 0.0032
}
```

## Usage

### Test Signal Generation

Generate signals for all assets (crypto + forex):

```bash
npm run test:unified-signals
```

**Output:**
```
=== Unified Signal Generation Test ===

Configured Assets:
  Crypto: BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT
  Forex: USD/JPY, EUR/USD, GBP/USD

Generating signals for timeframes: 15m, 1h, 4h

✅ Generated 3 signal(s)

Storing signals in database...
  [CRYPTO] BUY BTCUSDT @ 45000.00000
    TP: 45900.00000 | SL: 44100.00000
    RSI: 28.50 | Volume Ratio: 1.80

  [FOREX] BUY EUR/USD @ 1.08500
    TP: 1.08608 | SL: 1.08446
    RSI: 29.20 | Volume Ratio: 1.65

  [FOREX] SELL USD/JPY @ 150.25000
    TP: 149.50000 | SL: 150.50000
    RSI: 72.10 | Volume Ratio: 1.90

📊 Recent signals in database (last 20):
  Total: 20 | Crypto: 15 | Forex: 5
```

### Programmatic Usage

```typescript
import { UnifiedMarketDataService } from './services/unifiedMarketData';
import { UnifiedSignalEngine } from './services/unifiedSignalEngine';

const marketData = new UnifiedMarketDataService({
  binance: { rateLimit: { maxRequests: 1200, perMinutes: 1 } },
  finnhub: {
    apiKey: process.env.FINNHUB_API_KEY!,
    rateLimit: { maxRequests: 80, perMinutes: 1 }
  }
});

const signalEngine = new UnifiedSignalEngine(marketData);

// Generate signals for specific asset
const btcSignals = await signalEngine.generateSignals('BTCUSDT', '1h');
const forexSignals = await signalEngine.generateSignals('EUR/USD', '1h');

// Generate signals for all assets
const allSignals = await signalEngine.generateAllSignals(['1h', '4h']);
```

## API Rate Limits

### Binance (Crypto)
- Public endpoints: 1200 requests/minute
- No authentication required
- Built-in rate limiting and backoff

### Finnhub (Forex)
- Free tier: 80 API calls/minute
- Requires API key
- Built-in rate limiting and backoff
- Upgrade available for higher limits

## Testing

### Unit Tests

Run all Finnhub tests:
```bash
npm test -- finnhub
```

**Test Coverage:**
- Validator: 14 tests
- Cache: 13 tests
- REST Client: 10 tests
- Total: 37 tests, 100% pass rate

Run unified signal engine tests:
```bash
npm test -- unifiedSignalEngine
```

**Test Coverage:**
- Signal generation for crypto and forex
- Risk management per asset type
- Multi-asset signal generation
- Error handling
- Total: 10 tests, 100% pass rate

### Integration Tests

Test the complete flow:
```bash
npm run test:unified-signals
```

This will:
1. Connect to Binance and Finnhub APIs
2. Fetch real market data
3. Generate signals using technical analysis
4. Store signals in database
5. Display summary and statistics

## Error Handling

The integration includes comprehensive error handling:

### API Errors
- **401/403**: Invalid API key → Clear error message
- **429**: Rate limit exceeded → Automatic retry with backoff
- **5xx**: Server errors → Automatic retry with backoff
- **no_data**: No data available → Returns empty array

### Configuration Errors
- Missing API key → Forex signals skipped, warning logged
- Invalid URL → ConfigurationError thrown at startup
- Invalid rate limits → ConfigurationError thrown at startup

### Network Errors
- Connection timeout → Automatic retry (max 3 attempts)
- DNS failures → Error logged, operation continues
- Intermittent failures → Exponential backoff retry

## Performance Considerations

### Caching
- Default TTL: 60 seconds for real-time data
- Historical data: 5 minutes TTL
- Reduces API calls by ~70% in typical usage

### Rate Limiting
- Automatic request throttling
- Prevents API key suspension
- Smooth backoff when limits approached

### Data Efficiency
- Batch requests when possible
- Reuse kline data across indicators
- Minimal memory footprint

## Future Enhancements

Potential improvements for future releases:

1. **More Forex Pairs**: Add support for additional pairs (AUD/USD, USD/CAD, etc.)
2. **WebSocket Support**: Real-time forex price updates via Finnhub WebSocket
3. **Advanced Strategies**: Forex-specific indicators (e.g., pivot points, Fibonacci)
4. **Correlation Analysis**: Cross-asset correlation between crypto and forex
5. **Premium Features**: Integration with Finnhub premium tier for more data

## Troubleshooting

### Forex signals not generating
- Check that `FINNHUB_API_KEY` is set in `.env`
- Verify API key is valid at https://finnhub.io/dashboard
- Check rate limit not exceeded (80 calls/min free tier)
- Review logs for API errors

### Invalid API key error
- Verify API key copied correctly (no spaces/newlines)
- Check API key is active in Finnhub dashboard
- Ensure sufficient API quota remaining

### Rate limit errors
- Reduce scan frequency if hitting limits
- Consider upgrading Finnhub plan for higher limits
- Check cache TTL is not too short

### Data quality issues
- Finnhub data may have gaps during market hours
- Forex market closed on weekends (no new data)
- Use higher timeframes (1h, 4h) for more stable signals

## Support

For issues or questions:
- Review module README: `src/modules/finnhub-data-client/README.md`
- Check test examples: `src/modules/finnhub-data-client/__tests__/`
- Run test script: `npm run test:unified-signals`
- Review Finnhub API docs: https://finnhub.io/docs/api

## License

This integration follows the same ISC license as the main project.
