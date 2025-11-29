# Alpha Vantage Data Client

A TypeScript client for fetching forex intraday candle data from Alpha Vantage API.

## Features

- ✅ Fetch forex intraday candles for USD/JPY, EUR/USD, GBP/USD
- ✅ Support for 5m, 15m, 1h, 4h timeframes
- ✅ Built-in caching to minimize API calls
- ✅ Rate limiting with exponential backoff (5 req/min free tier)
- ✅ Automatic retry logic for failed requests
- ✅ Response validation and error handling
- ✅ 4h candle aggregation from 1h data

## Installation

Get your free API key at [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)

## Usage

```typescript
import { AlphaVantageDataClient } from './modules/alphavantage-data-client';

const client = new AlphaVantageDataClient({
  apiKey: 'your-api-key',
  rateLimit: { maxRequests: 5, perMinutes: 1 }, // Free tier
  cacheTTL: 60000, // 1 minute cache
});

// Get latest candles
const candles = await client.getLatestCandles('EUR/USD', '1h', 500);

// Get candles for specific time range
const start = Date.now() - 24 * 60 * 60 * 1000; // 24h ago
const end = Date.now();
const rangeCandles = await client.getCandles('USD/JPY', '15m', start, end);
```

## Configuration

```typescript
interface AlphaVantageClientConfig {
  apiKey: string; // Required
  baseUrl?: string; // Default: 'https://www.alphavantage.co'
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 2000ms
  backoffMultiplier?: number; // Default: 2
  cacheTTL?: number; // Default: 60000ms (1 minute)
  rateLimit?: {
    maxRequests: number; // Default: 5 (free tier)
    perMinutes: number; // Default: 1
  };
}
```

## Supported Pairs

- USD/JPY
- EUR/USD
- GBP/USD

## Supported Timeframes

- 5m: 5-minute candles
- 15m: 15-minute candles
- 1h: 1-hour candles
- 4h: 4-hour candles (aggregated from 1h data)

## Rate Limits

- **Free Tier**: 5 requests per minute, 500 requests per day
- **Premium**: 25-75 requests per minute (depending on plan)

The client automatically handles rate limiting with exponential backoff.

## Error Handling

```typescript
try {
  const candles = await client.getLatestCandles('EUR/USD', '1h');
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limit error
  } else if (error.message.includes('Invalid API key')) {
    // Handle auth error
  } else {
    // Handle other errors
  }
}
```

## Caching

The client caches responses to minimize API calls. Cache entries expire after the configured TTL (default 1 minute).

```typescript
// Clear cache manually
client.clearCache();

// Get cache instance
const cache = client.getCache();
console.log('Cache size:', cache.size());
```

## Alpha Vantage API Reference

- [FX_INTRADAY Documentation](https://www.alphavantage.co/documentation/#fx-intraday)
- [API Key Registration](https://www.alphavantage.co/support/#api-key)
