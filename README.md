# Trading Signal Monitor

An automated trading signal monitoring system that generates, stores, and alerts on cryptocurrency and forex trading signals using technical analysis.

## Features

- **Technical Analysis Module**: Comprehensive TA library with RSI, MACD, Bollinger Bands, SMA/EMA (multi-period), ATR, and volume indicators
- **Multi-Timeframe Support**: Aggregate indicators across multiple timeframes for comprehensive analysis
- **Multi-Asset Support**: Monitor both cryptocurrency pairs (Binance) and forex pairs (Alpha Vantage)
  - Crypto: BTC, ETH, XRP, SOL (via Binance API)
  - Forex: USD/JPY, EUR/USD, GBP/USD (via Alpha Vantage API)
- **Persistence Layer**: SQLite database via Prisma for storing signals with full metadata
- **Signal Generation**: Technical analysis-based signal engine using multiple indicators
- **Scheduled Monitoring**: Node-cron scheduler for periodic market scanning
- **Alerting System**: Console logging with pluggable webhook/email support
- **Rate Limiting**: Built-in rate limiting to respect API limits (Binance: 1200/min, Alpha Vantage: 5/min free tier)
- **Duplicate Detection**: Idempotent storage checks to prevent duplicate alerts
- **Error Handling**: Comprehensive error logging and recovery
- **Test Coverage**: 75+ unit and integration tests with ~89% coverage

## Architecture

```
src/
├── modules/
│   ├── binance-data-client/   # Binance REST/WebSocket client
│   │   ├── types.ts           # Type definitions
│   │   ├── rest-client.ts     # REST API client
│   │   ├── websocket-client.ts # WebSocket client
│   │   ├── cache.ts           # In-memory caching
│   │   ├── validator.ts       # Response validation
│   │   └── __tests__/         # Comprehensive test suite
│   ├── alphavantage-data-client/   # Alpha Vantage forex data client
│   │   ├── types.ts           # Type definitions
│   │   ├── rest-client.ts     # REST API client
│   │   ├── cache.ts           # In-memory caching
│   │   ├── validator.ts       # Response validation
│   │   ├── README.md          # Module documentation
│   │   └── __tests__/         # Comprehensive test suite
│   └── technical-analysis/    # Comprehensive TA module
│       ├── types.ts           # TA type definitions
│       ├── normalizer.ts      # Candle data normalization
│       ├── indicators.ts      # Indicator calculations
│       ├── index.ts           # Main module exports
│       ├── README.md          # Module documentation
│       └── __tests__/         # Comprehensive test suite
├── services/            # Core business logic
│   ├── database.ts          # Database operations
│   ├── marketData.ts        # Market data fetching (legacy)
│   ├── unifiedMarketData.ts # Unified crypto + forex data
│   ├── signalEngine.ts      # Signal generation (legacy)
│   ├── unifiedSignalEngine.ts # Unified signal generation
│   ├── alerting.ts          # Alert distribution
│   └── monitor.ts           # Main monitoring orchestration
├── signal-provider/     # Signal provider service (IoC architecture)
├── examples/            # Usage examples
├── config/              # Configuration management
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── test-unified-signals.ts # Test unified signal generation
└── index.ts             # One-time scan entry point
```

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key configuration options:

**Binance (Crypto):**
- `BINANCE_API_KEY` / `BINANCE_API_SECRET`: **Optional** - Only needed for private account endpoints. Public price data works without authentication.
- `BINANCE_API_URL`: Binance API base URL (default: https://api.binance.com)
- `RATE_LIMIT_MAX`: Binance API rate limit (default: 1200 req/min for public endpoints)

**Alpha Vantage (Forex):**
- `ALPHA_VANTAGE_API_KEY`: **Required for forex signals** - Get free API key at https://www.alphavantage.co/support/#api-key
- `ALPHA_VANTAGE_API_URL`: Alpha Vantage API base URL (default: https://www.alphavantage.co)
- `ALPHA_VANTAGE_RATE_LIMIT_MAX`: Alpha Vantage rate limit (default: 5 calls/min for free tier)
- `ALPHA_VANTAGE_RATE_LIMIT_MINUTES`: Rate limit window in minutes (default: 1)

**General:**
- `MONITOR_INTERVAL`: Cron expression for scan frequency (e.g., `*/5 * * * *` for every 5 minutes)
- `ASSETS`: Comma-separated list of trading pairs (e.g., `BTCUSDT,ETHUSDT`)
- `TIMEFRAMES`: Comma-separated list of timeframes (e.g., `15m,1h,4h`)
- `RSI_OVERSOLD`/`RSI_OVERBOUGHT`: RSI thresholds for signals
- `WEBHOOK_URL`: Optional webhook endpoint for alerts

## Usage

### Test Unified Signal Generation

Generate signals for both crypto and forex assets:

```bash
npm run test:unified-signals
```

This will:
1. Fetch market data from Binance (crypto) and Alpha Vantage (forex)
2. Generate signals for all supported assets (BTC, ETH, XRP, SOL, USD/JPY, EUR/USD, GBP/USD)
3. Store signals in the database with asset type classification
4. Display summary of generated signals

Note: Requires `ALPHA_VANTAGE_API_KEY` to be set for forex signals.

### Run One-Time Scan (Legacy)

Run a single scan for crypto assets only:

```bash
npm run dev:legacy
```

### Start Scheduled Monitor

Start the continuous monitoring service:

```bash
npm run monitor
```

The monitor will:
1. Connect to the database
2. Start the cron scheduler
3. Run periodic scans based on `MONITOR_INTERVAL`
4. Generate signals when strategy conditions are met
5. Store new signals in the database
6. Send alerts for new signals

Press `Ctrl+C` to stop gracefully.

### Build for Production

```bash
npm run build
npm start
```

## Signal Generation Logic

Signals are generated when multiple conditions align:

### Buy Signal
- RSI < 30 (oversold)
- MACD histogram positive and MACD > signal line
- Volume > 1.5x average volume

### Sell Signal
- RSI > 70 (overbought)
- MACD histogram negative and MACD < signal line
- Volume > 1.5x average volume

Each signal includes:
- Entry price
- Take profit and stop loss (risk-adjusted based on asset type)
  - Crypto: 2% risk, 2:1 reward ratio
  - Forex: 0.5% risk, 2:1 reward ratio (tighter spreads)
- Metadata (asset type, RSI, MACD, volume ratio, volatility)

## Duplicate Detection

The system prevents duplicate alerts by checking for similar signals within the last 5 minutes:
- Same asset and timeframe
- Same signal type (BUY/SELL)
- Entry price within 2% threshold

## Rate Limiting

Built-in rate limiting ensures API compliance:
- Default: 20 requests per minute
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_MINUTES`
- Automatic backoff when limit reached

## Database Schema

```prisma
model Signal {
  id          String   @id @default(uuid())
  asset       String
  timeframe   String
  entryPrice  Float
  takeProfit  Float
  stopLoss    Float
  status      String   @default("active")
  signalType  String
  metadata    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Alerting

Alerts are sent through multiple channels:

### Console
Default alert showing signal details and indicators

### Webhook (Optional)
JSON payload sent to configured webhook URL:
```json
{
  "type": "TRADING_SIGNAL",
  "signal": {
    "type": "BUY",
    "asset": "BTCUSDT",
    "entryPrice": 45000,
    "takeProfit": 45900,
    "stopLoss": 44100,
    ...
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Email (Placeholder)
Email notification support ready for implementation

## Error Handling

- API errors are logged and don't stop the monitor
- Database connection issues trigger graceful shutdown
- Rate limit violations cause automatic delays
- All errors are logged with context

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run the monitor
npm run monitor

# Generate Prisma client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate
```

## Testing

### Technical Analysis Module Tests

Run comprehensive test suite with 75+ tests:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage report
npm run test:coverage
```

Test coverage:
- **Normalizer**: Data conversion, extraction, validation
- **Indicators**: RSI, MACD, Bollinger Bands, SMA, EMA, ATR, Volume
- **Integration**: End-to-end scenarios, multi-timeframe, edge cases
- **Overall**: ~89% coverage on TA module

### Example Usage

Run the TA module examples:

```bash
npm run example:ta
```

This demonstrates:
- Basic indicator computation
- Custom configuration
- Multi-timeframe analysis
- Signal detection patterns

### Monitor Testing

Test the signal monitor:

```bash
# Set a short interval in .env
MONITOR_INTERVAL="*/1 * * * *"  # Every 1 minute

# Run the monitor
npm run monitor
```

Expected behavior:
1. Monitor starts and runs initial scan
2. Fetches market data for configured assets
3. Analyzes data using technical indicators
4. Generates signals when conditions are met
5. Stores signals in SQLite database
6. Emits console alerts for new signals
7. Prevents duplicate signals
8. Respects rate limits
9. Logs all operations

## Monitoring Logs

The system provides detailed logging:
- Scan start/end timestamps
- Asset/timeframe analysis progress
- Signal generation events
- Database operations
- Alert delivery status
- Error messages with context

## Technical Analysis Module

The TA module (`src/modules/technical-analysis/`) provides a comprehensive, tested foundation for indicator calculations:

### Features
- **Normalized Data**: Converts Binance API kline data to type-safe numerical format
- **Comprehensive Indicators**: RSI, MACD, Bollinger Bands, SMA/EMA (multi-period), ATR, Volume
- **Multi-Timeframe**: Aggregate indicators across multiple timeframes
- **Type-Safe**: Full TypeScript support with detailed interfaces
- **Tested**: 75+ unit and integration tests
- **Pure Functions**: Predictable, side-effect-free calculations
- **NaN Prevention**: Robust validation and edge case handling

### Usage Example

```typescript
import { computeIndicators } from './modules/technical-analysis';

const klines = await marketDataService.getKlines('BTCUSDT', '1h', 250);
const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

if (snapshot) {
  console.log('RSI:', snapshot.rsi.value);
  console.log('MACD Histogram:', snapshot.macd.histogram);
  console.log('Bollinger Bands %B:', snapshot.bollingerBands.percentB);
  console.log('SMA 20:', snapshot.sma[20]?.value);
  console.log('Volume Ratio:', snapshot.volume.ratio);
}
```

See `src/modules/technical-analysis/README.md` for complete documentation.

## Customization

### Adding New Indicators

1. Add indicator function to `src/modules/technical-analysis/indicators.ts`
2. Update types in `src/modules/technical-analysis/types.ts`
3. Integrate into the main `computeIndicators` function
4. Add unit tests in `__tests__/`

### Custom Strategy

Modify `isBuySignal()` and `isSellSignal()` in `SignalEngine` to implement custom logic using the TA module.

### Additional Alert Channels

Extend `AlertingService` to add new notification methods (Telegram, Discord, SMS, etc.).

## License

ISC
