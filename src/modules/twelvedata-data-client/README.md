# Twelve Data Client Module

A comprehensive TypeScript client for fetching forex and commodity market data from the Twelve Data API.

## Features

- ✅ Forex pairs (EUR/USD, GBP/USD, USD/JPY)
- ✅ Commodities (XAU/USD)
- ✅ Multiple timeframes (5m, 15m, 30m, 1h, 4h, 1d)
- ✅ Smart TTL caching with midnight expiration for daily candles
- ✅ Rate limiting (8 calls/min free tier)
- ✅ Typed responses with validation
- ✅ Historical data queries
- ✅ Normalized KlineData format

## Installation

The module is included in the project. Just ensure you have your Twelve Data API key configured:

```bash
TWELVEDATA_API_KEY="your-api-key-here"
```

Get your free API key at: https://twelvedata.com/

## Usage

### Basic Example

```typescript
import { TwelveDataClient } from './modules/twelvedata-data-client';

const client = new TwelveDataClient({
  apiKey: process.env.TWELVEDATA_API_KEY || '',
});

// Fetch latest 500 candles
const klines = await client.getKlines('EUR/USD', '1h', 500);

// Fetch historical data
const historical = await client.getHistoricalKlines(
  'XAU/USD',
  '1d',
  '2024-01-01',
  '2024-12-31'
);
```

### Supported Symbols

- **Forex**: `EUR/USD`, `GBP/USD`, `USD/JPY`
- **Commodities**: `XAU/USD` (Gold)

### Supported Timeframes

- `5m` - 5 minutes
- `15m` - 15 minutes
- `30m` - 30 minutes
- `1h` - 1 hour
- `4h` - 4 hours
- `1d` - 1 day

## Configuration

```typescript
interface TwelveDataClientConfig {
  apiKey: string;
  baseUrl?: string; // Default: 'https://api.twelvedata.com'
  cacheTTL?: number; // Default: 300000 (5 minutes)
  rateLimit?: {
    maxRequests: number; // Default: 8
    perMinutes: number; // Default: 1
  };
}
```

## Rate Limits

**Free Tier:**
- 8 API calls per minute
- 800 API calls per day

The client automatically enforces rate limits with smart backoff.

## Caching Strategy

- **Scalping intervals (5m, 15m, 30m)**: 1 minute TTL
- **Intraday intervals (1h, 4h)**: 5 minutes TTL
- **Daily candles (1d)**: Expires at midnight UTC
- **Historical queries**: 1 hour TTL

## Data Format

All responses are normalized to the standard `KlineData` format:

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

## Error Handling

```typescript
try {
  const klines = await client.getKlines('EUR/USD', '1h');
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limit
  } else if (error.message.includes('API error')) {
    // Handle API error
  }
}
```

## Cache Management

```typescript
// Get cache instance
const cache = client.getCache();

// Clear all cached data
client.clearCache();

// Check cache size
console.log(`Cache entries: ${cache.size()}`);

// Manual cleanup of expired entries
cache.cleanup();
```

## Testing

```typescript
import { TwelveDataClient } from './modules/twelvedata-data-client';

const client = new TwelveDataClient({
  apiKey: 'demo',
  rateLimit: { maxRequests: 8, perMinutes: 1 },
});

// Test forex data
const forexData = await client.getKlines('EUR/USD', '1h', 100);
console.log(`Fetched ${forexData.length} forex candles`);

// Test commodity data
const goldData = await client.getKlines('XAU/USD', '1d', 30);
console.log(`Fetched ${goldData.length} gold candles`);
```

## Notes

- Volume data may not be available for some forex pairs
- The client normalizes all responses to match Binance KlineData format
- Historical queries use date strings in YYYY-MM-DD format
- All timestamps are in milliseconds (Unix epoch)
