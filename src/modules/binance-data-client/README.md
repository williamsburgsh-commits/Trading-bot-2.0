# Binance Data Client Module

A comprehensive TypeScript module for fetching historical candles and real-time price data from Binance REST and WebSocket APIs.

## Features

- **REST API Client**: Fetch historical klines with automatic retry/backoff
- **WebSocket Client**: Real-time price updates with automatic reconnection
- **In-Memory Caching**: Avoid redundant API requests
- **Response Validation**: Schema validation for all Binance responses
- **Rate Limiting**: Built-in request throttling
- **Typed Events**: Strongly-typed event emitters for downstream modules
- **Error Handling**: Graceful handling of rate limits and network failures

## Supported Assets

- BTCUSDT
- ETHUSDT
- XRPUSDT
- SOLUSDT

## Supported Timeframes

- 5m (5 minutes)
- 15m (15 minutes)
- 1h (1 hour)
- 4h (4 hours)

## Installation

The module is already part of the project. Dependencies:

```bash
npm install axios ws
npm install --save-dev @types/ws
```

## Usage

### Basic Setup

```typescript
import { BinanceDataClient } from './modules/binance-data-client';

const client = new BinanceDataClient({
  baseUrl: 'https://api.binance.com',
  wsBaseUrl: 'wss://stream.binance.com:9443',
  cacheTTL: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  rateLimit: {
    maxRequests: 20,
    perMinutes: 1,
  },
});
```

### Fetching Historical Klines

```typescript
// Fetch recent klines
const klines = await client.getKlines('BTCUSDT', '1h', 100);

// Fetch historical klines with time range
const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
const endTime = Date.now();
const historical = await client.getHistoricalKlines(
  'BTCUSDT',
  '1h',
  startTime,
  endTime,
  1000
);

// Bulk historical download (automatically handles pagination)
const bulkData = await client.bulkHistoricalDownload(
  'BTCUSDT',
  '1h',
  startTime,
  endTime
);
```

### Real-Time WebSocket Updates

```typescript
// Subscribe to real-time updates
client.subscribeRealtime('BTCUSDT', '1h');

// Subscribe to multiple symbols and timeframes
client.subscribeMultiple(
  ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT'],
  ['5m', '15m', '1h', '4h']
);

// Listen to kline updates
client.onKlineUpdate((event) => {
  console.log(`${event.symbol} ${event.timeframe}:`, event.kline.close);
  console.log('Is final candle:', event.isFinal);
});

// Listen to connection status
client.onConnectionStatus((event) => {
  console.log('Connection status:', event.status, event.message);
});

// Listen to errors
client.onError((error) => {
  console.error('WebSocket error:', error.message);
});

// Get latest kline for a stream
const latestKline = client.getLatestKline('BTCUSDT', '1h');

// Get all latest klines
const allKlines = client.getAllLatestKlines();

// Check connection status
if (client.isConnected('BTCUSDT', '1h')) {
  console.log('Connected to BTCUSDT 1h stream');
}

// Unsubscribe from a stream
client.unsubscribeRealtime('BTCUSDT', '1h');
```

### Cache Management

```typescript
// Get cache instance
const cache = client.getCache();

// Check cache size
console.log('Cache entries:', cache.size());

// Clear all cache
client.clearCache();

// Invalidate specific cache entry
cache.invalidate({ symbol: 'BTCUSDT', timeframe: '1h', limit: 100 });

// Invalidate all entries for a symbol
cache.invalidateSymbol('BTCUSDT');

// Invalidate all entries for a timeframe
cache.invalidateTimeframe('1h');

// Cleanup expired entries
cache.cleanup();
```

### Cleanup

```typescript
// Close all WebSocket connections and cleanup
client.close();
```

## Architecture

### Components

1. **BinanceRestClient**: Handles REST API requests with retry/backoff
2. **BinanceWebSocketClient**: Manages WebSocket connections and reconnection
3. **BinanceCache**: In-memory cache with TTL support
4. **BinanceResponseValidator**: Validates API responses against schemas
5. **BinanceDataClient**: Main facade combining REST and WebSocket functionality

### Retry Mechanism

The REST client implements exponential backoff for failed requests:

- Retries on 5xx server errors, 429 rate limits, and 408 timeouts
- Exponential backoff: `delay * (backoffMultiplier ^ attempt)`
- Configurable max retries (default: 3)
- Does not retry on 4xx client errors (except 429)

### Rate Limiting

Built-in rate limiting to respect Binance API limits:

- Configurable requests per minute (default: 20 per minute)
- Automatic throttling when limit reached
- Per-client tracking (not shared across instances)

### Caching

Smart caching to reduce API calls:

- Configurable TTL per cache entry
- Longer TTL for historical data (5 minutes)
- Shorter TTL for recent data (1 minute)
- Cache key includes symbol, timeframe, and parameters
- Automatic cleanup of expired entries

### WebSocket Reconnection

Automatic reconnection with exponential backoff:

- Max reconnection attempts (default: 5)
- Exponential delay between attempts
- Separate connection per symbol/timeframe pair
- Graceful shutdown prevention of reconnection

## Error Handling

### Common Errors

- **Rate Limit Exceeded (429)**: Automatic retry with backoff
- **Server Error (5xx)**: Automatic retry with backoff
- **Geo-Restriction (451)**: Immediate failure with clear message
- **Invalid Response**: Schema validation failure
- **Network Error**: Retry up to max attempts

### Error Recovery

```typescript
try {
  const klines = await client.getKlines('BTCUSDT', '1h', 100);
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 60000));
  } else if (error.message.includes('API access restricted')) {
    // Handle geo-restriction
    console.error('Binance API not available in your region');
  } else {
    // Handle other errors
    console.error('Failed to fetch klines:', error.message);
  }
}
```

## Testing

Run the test suite:

```bash
# All tests
npm test -- binance-data-client

# Unit tests only
npm run test:unit -- binance-data-client

# Integration tests only
npm run test:integration -- binance-data-client

# With coverage
npm run test:coverage -- binance-data-client
```

### Test Coverage

- Validator: Response schema validation (valid/invalid data)
- Cache: Set, get, expiration, invalidation
- REST Client: Fetching, retry logic, rate limiting, error handling
- WebSocket Client: Connection, message handling, reconnection, events
- Integration: End-to-end scenarios with REST + WebSocket

## Type Definitions

### KlineData

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

### KlineUpdateEvent

```typescript
interface KlineUpdateEvent {
  symbol: BinanceSymbol;
  timeframe: BinanceTimeframe;
  kline: KlineData;
  isFinal: boolean; // true when candle is closed
}
```

### ConnectionStatusEvent

```typescript
interface ConnectionStatusEvent {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  timestamp: number;
  message?: string;
}
```

## Best Practices

1. **Reuse Client Instances**: Create one client and reuse for multiple operations
2. **Handle Errors Gracefully**: Always wrap API calls in try-catch
3. **Monitor Rate Limits**: Use onError to track rate limit issues
4. **Cache Historical Data**: Historical data changes infrequently, cache it
5. **Use WebSocket for Real-Time**: Avoid polling REST API for latest prices
6. **Cleanup on Exit**: Always call `client.close()` before application exit
7. **Subscribe Once**: Avoid duplicate subscriptions to the same stream

## Performance Considerations

- REST API calls are cached by default (reduces API load)
- WebSocket connections are persistent (no reconnection overhead)
- Bulk downloads handle pagination automatically (no manual chunking)
- Rate limiting prevents API bans (automatic throttling)

## Limitations

- Cache is in-memory only (not persisted across restarts)
- No support for other Binance endpoints (only klines)
- WebSocket is one-way (no subscriptions for depth, trades, etc.)
- No authentication (public endpoints only)

## Future Enhancements

- Redis cache support for distributed systems
- Support for authenticated endpoints (account, orders)
- Additional WebSocket streams (depth, trades, ticker)
- Metrics and monitoring (request counts, error rates)
- Circuit breaker pattern for failing endpoints
