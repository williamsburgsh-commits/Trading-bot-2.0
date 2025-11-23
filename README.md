# Trading Signal Monitor

An automated trading signal monitoring system that generates, stores, and alerts on cryptocurrency trading signals using technical analysis.

## Features

- **Persistence Layer**: SQLite database via Prisma for storing signals with full metadata
- **Signal Generation**: Technical analysis-based signal engine using RSI, MACD, and volume indicators
- **Scheduled Monitoring**: Node-cron scheduler for periodic market scanning
- **Multi-Asset Support**: Monitor multiple cryptocurrency pairs simultaneously
- **Multi-Timeframe Analysis**: Analyze signals across different timeframes
- **Alerting System**: Console logging with pluggable webhook/email support
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Duplicate Detection**: Idempotent storage checks to prevent duplicate alerts
- **Error Handling**: Comprehensive error logging and recovery

## Architecture

```
src/
├── config/          # Configuration management
├── services/        # Core business logic
│   ├── database.ts      # Database operations
│   ├── marketData.ts    # Market data fetching
│   ├── signalEngine.ts  # Signal generation logic
│   ├── alerting.ts      # Alert distribution
│   └── monitor.ts       # Main monitoring orchestration
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (indicators)
├── index.ts         # One-time scan entry point
└── monitor.ts       # Scheduled monitor entry point
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

- `MONITOR_INTERVAL`: Cron expression for scan frequency (e.g., `*/5 * * * *` for every 5 minutes)
- `ASSETS`: Comma-separated list of trading pairs (e.g., `BTCUSDT,ETHUSDT`)
- `TIMEFRAMES`: Comma-separated list of timeframes (e.g., `15m,1h,4h`)
- `RSI_OVERSOLD`/`RSI_OVERBOUGHT`: RSI thresholds for signals
- `WEBHOOK_URL`: Optional webhook endpoint for alerts

## Usage

### Run One-Time Scan

Run a single scan across all configured assets and timeframes:

```bash
npm run dev
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
- Take profit (2% above entry for buy, 2% below for sell)
- Stop loss (2% below entry for buy, 2% above for sell)
- Metadata (RSI, MACD, volume ratio, volatility)

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

The acceptance criteria is met by running the monitor for a short interval:

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

## Customization

### Adding New Indicators

Add indicator functions to `src/utils/indicators.ts` and integrate into `SignalEngine`.

### Custom Strategy

Modify `isBuySignal()` and `isSellSignal()` in `SignalEngine` to implement custom logic.

### Additional Alert Channels

Extend `AlertingService` to add new notification methods (Telegram, Discord, SMS, etc.).

## License

ISC
