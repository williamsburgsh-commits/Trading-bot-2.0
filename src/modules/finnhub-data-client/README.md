# Finnhub Forex Data Client

A TypeScript client for fetching real-time forex candle data from the Finnhub API.

## Features

- ✅ **REST API Client** - Fetch historical and real-time forex candle data
- ✅ **Rate Limiting** - Configurable rate limiting (default: 80 calls/minute for free tier)
- ✅ **Caching** - In-memory caching with TTL to reduce API calls
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Validation** - Schema validation for all API responses
- ✅ **TypeScript** - Full type safety with TypeScript

## Supported Forex Pairs

- USD/JPY
- EUR/USD
- GBP/USD

## Supported Timeframes

- 5m (5 minutes)
- 15m (15 minutes)
- 1h (1 hour)
- 4h (4 hours)

## Configuration

Get your free API key at https://finnhub.io/register

Add to your `.env` file:
```env
FINNHUB_API_KEY=your-api-key-here
FINNHUB_API_URL=https://finnhub.io/api/v1
FINNHUB_RATE_LIMIT_MAX=80
FINNHUB_RATE_LIMIT_MINUTES=1
```

## Usage

```typescript
import { FinnhubDataClient } from './modules/finnhub-data-client';

const client = new FinnhubDataClient({
  apiKey: 'your-api-key',
  cacheTTL: 60000, // 1 minute
  rateLimit: { maxRequests: 80, perMinutes: 1 },
});

// Fetch latest candles
const candles = await client.getLatestCandles('EUR/USD', '1h', 100);

// Fetch candles for a specific time range
const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
const endTime = Date.now();
const historicalCandles = await client.getCandles('USD/JPY', '4h', startTime, endTime);
```

## API Rate Limits

Finnhub free tier allows:
- **80 API calls per minute**
- 30 API calls per second

The client automatically handles rate limiting to stay within these limits.

## Error Handling

The client handles various error scenarios:

- **401/403**: Invalid API key
- **429**: Rate limit exceeded (automatic retry with backoff)
- **5xx**: Server errors (automatic retry with backoff)
- **no_data**: Returns empty array when no data is available

## Caching

The client includes built-in caching to reduce API calls:

- Default TTL: 60 seconds for real-time data
- Historical data: 5 minutes
- Cache can be cleared manually: `client.clearCache()`

## Symbol Format

Finnhub uses the format `OANDA:SYMBOL` for forex pairs:
- USD/JPY → OANDA:USD_JPY
- EUR/USD → OANDA:EUR_USD
- GBP/USD → OANDA:GBP_USD

The client handles this conversion automatically.

## Response Format

The client returns data in the same `KlineData` format as the Binance client for consistency:

```typescript
interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}
```

## Testing

Run the unit tests:
```bash
npm test -- finnhub
```
