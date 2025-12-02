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
- **Push Notifications**: OneSignal integration for real-time signal alerts on web and mobile
- **Offline Support**: Progressive Web App capabilities with service worker caching
- **Alerting System**: Console logging with pluggable webhook/email/push notification support
- **Rate Limiting**: Built-in rate limiting to respect API limits (Binance: 1200/min, Alpha Vantage: 5/min free tier)
- **Duplicate Detection**: Idempotent storage checks to prevent duplicate alerts
- **Error Handling**: Comprehensive error logging and recovery
- **Test Coverage**: 100+ unit and integration tests with comprehensive coverage

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

**OneSignal Push Notifications (Optional):**
- `ONESIGNAL_APP_ID`: Your OneSignal App ID from https://app.onesignal.com
- `ONESIGNAL_REST_API_KEY`: Your OneSignal REST API Key
- `ONESIGNAL_ENABLED`: Enable/disable notifications (default: true)
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`: Frontend OneSignal App ID (same as ONESIGNAL_APP_ID)

**NextAuth (Optional):**
- `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Secret key for JWT encryption (generate with `openssl rand -base64 32`)

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

### OneSignal Push Notifications (Optional)
Real-time push notifications to subscribed users:

1. **Setup OneSignal:**
   - Create account at https://app.onesignal.com
   - Create a new Web app
   - Copy your App ID and REST API Key
   - Add to `.env`:
     ```
     ONESIGNAL_APP_ID=your-app-id
     ONESIGNAL_REST_API_KEY=your-rest-api-key
     NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id
     ```

2. **Features:**
   - Automatic notification on new signal creation
   - Rich notification content with entry, TP, and SL
   - User segmentation support
   - Offline notification queue
   - Works on web and mobile browsers

3. **User Opt-in:**
   - Users prompted to allow notifications on first visit
   - Notification preference persisted by OneSignal
   - Only fires for new, non-duplicate signals

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

### Comprehensive Test Suite

Run comprehensive test suite with 100+ tests covering strategies, notifications, and integrations:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- oneSignal
npm test -- database
npm test -- signalEngine

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- **Technical Analysis**: RSI, MACD, Bollinger Bands, SMA, EMA, ATR, Volume indicators
- **Signal Engine**: Strategy logic, indicator calculations, risk/reward ratios
- **Database Service**: Signal persistence, duplicate detection, notification triggering
- **OneSignal Notifications**: Alert sending, error handling, user targeting, segment broadcasts
- **Unified Signal Engine**: Multi-asset support, crypto vs forex risk management
- **Data Normalization**: Candle data conversion, extraction, validation
- **Integration Tests**: End-to-end scenarios, multi-timeframe analysis, edge cases

### New Test Files

The following test files ensure notification and strategy reliability:

1. **`lib/notifications/__tests__/oneSignal.test.ts`**: OneSignal notification service tests
   - Notification sending (success/failure)
   - User and segment targeting
   - Error handling (network errors, API failures)
   - Configuration validation

2. **`src/services/__tests__/database.test.ts`**: Database service with notification integration
   - Signal persistence with notifications
   - Duplicate detection (no duplicate notifications)
   - Notification error handling (graceful degradation)
   - Metadata parsing

3. **`src/services/__tests__/signalEngine.test.ts`**: Signal engine strategy tests
   - BUY/SELL signal generation
   - Indicator calculations (RSI, MACD, volume)
   - Risk/reward ratio validation
   - Insufficient data handling
   - API error recovery

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

## Offline Support & Progressive Web App

The dashboard includes service worker support for offline functionality:

### Features
- **Automatic Caching**: Dashboard shell and static assets cached on first load
- **Offline Fallback**: Graceful degradation when network is unavailable
- **Offline Indicator**: Visual indicator when connection is lost
- **Service Worker Updates**: Automatic updates when new version is deployed

### Service Workers
- **`/sw.js`**: Main service worker for offline caching (production only)
- **`/OneSignalSDKWorker.js`**: OneSignal push notification worker
- **`/OneSignalSDKUpdaterWorker.js`**: OneSignal update worker

### Testing Offline Mode
1. Load the dashboard in your browser
2. Open DevTools → Network tab
3. Check "Offline" mode
4. Dashboard should still load from cache
5. Yellow offline indicator appears at bottom of page

## Risk Disclaimer

⚠️ **IMPORTANT: Please Read Carefully**

This trading signal system is provided **for educational and informational purposes only**. 

### Key Disclaimers:
- **Not Financial Advice**: This software does not constitute financial, investment, trading, or other advice
- **No Guarantees**: Past performance does not guarantee future results
- **High Risk**: Trading cryptocurrencies and forex involves substantial risk of loss
- **Your Responsibility**: Always conduct your own research (DYOR) before making trading decisions
- **Capital Risk**: Only trade with capital you can afford to lose completely
- **No Liability**: The authors and contributors are not liable for any losses incurred

### Best Practices:
- Start with paper trading or small amounts
- Use proper risk management (stop losses, position sizing)
- Never risk more than 1-2% of your capital per trade
- Diversify your portfolio
- Stay informed about market conditions
- Consider consulting a licensed financial advisor

**By using this software, you acknowledge that you understand and accept these risks.**

## Persistence & Storage

The system supports two storage backends with automatic fallback:

### Vercel KV (Production)
- **Primary storage**: Uses Vercel KV for production deployments
- **High performance**: Redis-based key-value store
- **Configuration**: Set KV environment variables in Vercel dashboard
- **Automatic detection**: Falls back to JSON if KV is unavailable

### JSON File (Development)
- **Fallback storage**: Local file system for development
- **Location**: `./data/signals.json` and `./data/settings.json`
- **Auto-created**: Data directory created automatically on first run
- **Git ignored**: Data files excluded from version control

### Storage Adapter

The `StorageAdapter` class (`src/signal-provider/storage/adapter.ts`) provides:
- **Signal persistence**: Save and query trading signals
- **User settings**: Store per-user preferences and configurations
- **Filtering**: Query signals by asset, timeframe, status, category
- **Pagination**: Limit and offset support for large datasets

## API Routes

### Signals API (`/api/signals`)

**GET** - Fetch signals with filtering:
```bash
# Get all signals
curl http://localhost:3000/api/signals

# Filter by category
curl http://localhost:3000/api/signals?type=daily
curl http://localhost:3000/api/signals?type=scalping

# Filter by asset and status
curl http://localhost:3000/api/signals?asset=BTCUSDT&status=active

# Pagination
curl http://localhost:3000/api/signals?limit=20&offset=0
```

**POST** - Create signals (cron/internal use):
```bash
curl -X POST http://localhost:3000/api/signals \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "signals": [{
      "asset": "BTCUSDT",
      "timeframe": "1h",
      "entryPrice": 45000,
      "takeProfit": 46000,
      "stopLoss": 44500,
      "signalType": "BUY"
    }]
  }'
```

### Settings API (`/api/settings`)

**GET** - Fetch user settings:
```bash
curl http://localhost:3000/api/settings
```

**POST** - Update settings (requires authentication):
```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "settings": {
      "enabledAssets": ["BTCUSDT", "ETHUSDT"],
      "notificationChannels": {"email": true, "push": true, "webhook": false},
      "preferredTimeframes": ["4h", "1d"],
      "riskLevel": 50
    }
  }'
```

### Cron Endpoints

**Daily Signals** (`/api/cron/daily`):
- **Schedule**: 00:00 UTC daily (configured in `vercel.json`)
- **Timeframes**: 4h, 1d
- **Assets**: All crypto and forex pairs
- **Authentication**: Requires `CRON_SECRET` in Authorization header

```bash
curl -X GET http://localhost:3000/api/cron/daily \
  -H "Authorization: Bearer your-cron-secret"
```

**Scalping Signals** (`/api/cron/scalping`):
- **Schedule**: Every 5 minutes (configured in `vercel.json`)
- **Timeframes**: 5m, 15m, 30m, 1h
- **Assets**: Crypto only (faster execution)
- **Authentication**: Requires `CRON_SECRET` in Authorization header

```bash
curl -X GET http://localhost:3000/api/cron/scalping \
  -H "Authorization: Bearer your-cron-secret"
```

## Authentication

The system uses NextAuth.js for user authentication:

### Configuration

```bash
# .env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Demo Credentials

For development, use these credentials:
- **Email**: admin@example.com
- **Password**: admin123

### Protected Routes

- **Settings page**: Requires authentication to save preferences
- **Dashboard**: Readable without login (anonymous mode)
- **Cron endpoints**: Protected by `CRON_SECRET` token

### API Sessions

Use `getServerSession(authOptions)` in API routes to check authentication:

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Cron Jobs (Vercel)

The system uses Vercel Cron Jobs for automated signal generation:

### Configuration

Cron schedules are defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/scalping",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Schedule Format

Uses standard cron syntax:
- `0 0 * * *` - Daily at 00:00 UTC
- `*/5 * * * *` - Every 5 minutes
- `0 */4 * * *` - Every 4 hours
- `0 9,17 * * *` - At 9 AM and 5 PM UTC

### Local Testing

Test cron endpoints locally:

```bash
# Set environment variable
export CRON_SECRET="dev-secret"

# Test daily endpoint
curl http://localhost:3000/api/cron/daily \
  -H "Authorization: Bearer dev-secret"

# Test scalping endpoint
curl http://localhost:3000/api/cron/scalping \
  -H "Authorization: Bearer dev-secret"
```

### Monitoring

Cron job responses include execution stats:

```json
{
  "success": true,
  "stats": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "type": "daily",
    "assets": 7,
    "timeframes": 2,
    "signalsGenerated": 15,
    "errors": 0
  },
  "signalIds": ["uuid1", "uuid2", "..."]
}
```

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Cron Security
CRON_SECRET="your-cron-secret-here"
```

### Optional Variables

```bash
# Alpha Vantage (for forex signals)
ALPHA_VANTAGE_API_KEY="your-api-key"

# Vercel KV (for production storage)
KV_REST_API_URL="your-kv-url"
KV_REST_API_TOKEN="your-kv-token"

# Binance (optional - only for private endpoints)
BINANCE_API_KEY="your-api-key"
BINANCE_API_SECRET="your-api-secret"
```

### Generating Secrets

```bash
# NextAuth secret
openssl rand -base64 32

# Cron secret
openssl rand -base64 32
```

## Deployment

### Vercel Deployment

1. **Push to GitHub**:
```bash
git add .
git commit -m "Add persistence and cron jobs"
git push origin main
```

2. **Configure Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL` - Your production database (Vercel Postgres recommended)
   - `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET` - Generated secret
   - `CRON_SECRET` - Generated secret
   - `ALPHA_VANTAGE_API_KEY` - Your API key
   - `KV_REST_API_URL` - Vercel KV URL (optional)
   - `KV_REST_API_TOKEN` - Vercel KV token (optional)

3. **Enable Cron Jobs** in Vercel Dashboard:
   - Navigate to Project Settings → Cron Jobs
   - Verify both cron jobs are detected from `vercel.json`
   - Enable each cron job

4. **Deploy**:
```bash
vercel --prod
```

### Database Setup (Production)

For production, use Vercel Postgres or another PostgreSQL database:

```bash
# Update schema for PostgreSQL
# Change datasource in schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Run migrations
npx prisma migrate deploy
```

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

### Custom Storage Backend

Implement the `KVAdapter` interface to add new storage backends:

```typescript
import { KVAdapter } from '@/lib/kv';

class CustomStorage implements KVAdapter {
  async get<T>(key: string): Promise<T | null> { /* ... */ }
  async set(key: string, value: unknown): Promise<void> { /* ... */ }
  async delete(key: string): Promise<void> { /* ... */ }
  async keys(pattern: string): Promise<string[]> { /* ... */ }
  async exists(key: string): Promise<boolean> { /* ... */ }
}
```

## License

ISC
