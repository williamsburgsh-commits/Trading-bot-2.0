# Unified Market Data Service Documentation

## Overview

The Market Data Service provides a unified interface for fetching OHLCV (Open, High, Low, Close, Volume) data from multiple data providers:

- **Binance** - Crypto pairs (BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT)
- **Twelve Data** - Forex pairs (EUR/USD, GBP/USD, USD/JPY) and commodities (XAU/USD)

## Features

✅ **Unified API** - Single interface for all asset types  
✅ **Smart Caching** - TTL-based cache with midnight expiration for daily candles  
✅ **Rate Limiting** - Built-in rate limit enforcement per provider  
✅ **Graceful Fallback** - Automatic mock data generation when APIs fail  
✅ **Type Safety** - Full TypeScript support with validated responses  
✅ **Centralized Config** - Asset metadata and timeframes in one place  

## Quick Start

### 1. Configuration

Add to your `.env` file:

```bash
# Twelve Data API (required for forex/commodity data)
TWELVEDATA_API_KEY="your-api-key-here"
TWELVEDATA_RATE_LIMIT_MAX=8
TWELVEDATA_RATE_LIMIT_MINUTES=1
TWELVEDATA_CACHE_TTL=300000

# Binance Configuration
BINANCE_CACHE_TTL=60000
BINANCE_RATE_LIMIT_MAX=1200
BINANCE_RATE_LIMIT_MINUTES=1

# Market Data Service
MARKET_DATA_MOCK_FALLBACK=true
MARKET_DATA_POLLING_INTERVAL=60000
```

Get your free Twelve Data API key at: https://twelvedata.com/

### 2. Basic Usage

```typescript
import { MarketDataService } from './services/market-data-service';
import { config } from './config';

const service = new MarketDataService({
  binance: config.binance,
  twelvedata: {
    apiKey: config.twelvedata.apiKey,
    baseUrl: config.twelvedata.baseUrl,
    cacheTTL: config.twelvedata.cacheTTL,
    rateLimit: config.twelvedata.rateLimit,
  },
  enableMockFallback: true,
});

// Fetch crypto data
const btcData = await service.getKlines('BTCUSDT', '1h', 100);

// Fetch forex data
const eurData = await service.getKlines('EUR/USD', '1h', 100);

// Fetch commodity data
const goldData = await service.getKlines('XAU/USD', '1d', 30);

// Get all available symbols
const allSymbols = service.getAllSymbols();

// Get symbols by type
const cryptoSymbols = service.getSymbolsByType('crypto');
const forexSymbols = service.getSymbolsByType('forex');
const commoditySymbols = service.getSymbolsByType('commodity');
```

## Supported Assets

### Crypto (via Binance)
- `BTCUSDT` - Bitcoin/USDT
- `ETHUSDT` - Ethereum/USDT
- `SOLUSDT` - Solana/USDT
- `BNBUSDT` - Binance Coin/USDT
- `XRPUSDT` - Ripple/USDT

### Forex (via Twelve Data)
- `EUR/USD` - Euro/US Dollar
- `GBP/USD` - British Pound/US Dollar
- `USD/JPY` - US Dollar/Japanese Yen

### Commodities (via Twelve Data)
- `XAU/USD` - Gold/US Dollar

## Supported Timeframes

All assets support these timeframes:
- `5m` - 5 minutes
- `15m` - 15 minutes
- `30m` - 30 minutes
- `1h` - 1 hour
- `4h` - 4 hours
- `1d` - 1 day

## Caching Strategy

The service implements intelligent caching based on timeframe:

| Timeframe | Cache TTL | Strategy |
|-----------|-----------|----------|
| 5m, 15m, 30m | 1 minute | Scalping intervals |
| 1h, 4h | 5 minutes | Intraday intervals |
| 1d | Until midnight UTC | Daily candles |

### Cache Benefits

- **Reduced API Calls** - Prevents duplicate requests within TTL
- **Faster Response** - Cached data returns instantly
- **Rate Limit Protection** - Stays within provider limits
- **Cost Savings** - Reduces API quota usage

## API Reference

### MarketDataService

#### Constructor

```typescript
constructor(config: MarketDataServiceConfig)
```

**Config:**
```typescript
interface MarketDataServiceConfig {
  binance?: {
    baseUrl?: string;
    cacheTTL?: number;
    rateLimit?: { maxRequests: number; perMinutes: number };
  };
  twelvedata?: {
    apiKey: string;
    baseUrl?: string;
    cacheTTL?: number;
    rateLimit?: { maxRequests: number; perMinutes: number };
  };
  enableMockFallback?: boolean;
}
```

#### Methods

##### getKlines()

Fetch latest OHLCV candles for any asset.

```typescript
async getKlines(
  symbol: AllSymbols,
  timeframe: Timeframe,
  limit: number = 500
): Promise<KlineData[]>
```

**Example:**
```typescript
const candles = await service.getKlines('BTCUSDT', '1h', 100);
```

##### getHistoricalKlines()

Fetch historical OHLCV data for a specific time range.

```typescript
async getHistoricalKlines(
  symbol: AllSymbols,
  timeframe: Timeframe,
  startTime: number | string,
  endTime?: number | string,
  limit: number = 1000
): Promise<KlineData[]>
```

**Example:**
```typescript
// Using timestamps
const historical = await service.getHistoricalKlines(
  'EUR/USD',
  '1d',
  Date.parse('2024-01-01'),
  Date.parse('2024-12-31')
);

// Using date strings (Twelve Data)
const historical = await service.getHistoricalKlines(
  'XAU/USD',
  '1d',
  '2024-01-01',
  '2024-12-31'
);
```

##### getAssetType()

Get the asset type for a symbol.

```typescript
getAssetType(symbol: string): AssetType
```

**Example:**
```typescript
const type = service.getAssetType('BTCUSDT'); // 'crypto'
const type = service.getAssetType('EUR/USD'); // 'forex'
const type = service.getAssetType('XAU/USD'); // 'commodity'
```

##### getAllSymbols()

Get all available symbols based on configured providers.

```typescript
getAllSymbols(): AllSymbols[]
```

##### getSymbolsByType()

Get symbols filtered by asset type.

```typescript
getSymbolsByType(type: AssetType): AllSymbols[]
```

##### isTwelveDataEnabled()

Check if Twelve Data provider is configured.

```typescript
isTwelveDataEnabled(): boolean
```

##### close()

Close all connections (WebSockets, etc).

```typescript
close(): void
```

## Data Format

All responses are normalized to the `KlineData` format:

```typescript
interface KlineData {
  openTime: number;        // Unix timestamp in milliseconds
  open: string;            // Opening price
  high: string;            // Highest price
  low: string;             // Lowest price
  close: string;           // Closing price
  volume: string;          // Trading volume
  closeTime: number;       // Unix timestamp in milliseconds
  quoteVolume: string;     // Quote asset volume
  trades: number;          // Number of trades
  takerBuyBaseVolume: string;  // Taker buy base volume
  takerBuyQuoteVolume: string; // Taker buy quote volume
}
```

## Asset Configuration

Asset metadata is centralized in `src/config/assets.ts`:

```typescript
import { ASSET_METADATA, getAssetType, getAssetProvider } from './config/assets';

// Get metadata for any asset
const metadata = ASSET_METADATA['BTCUSDT'];
console.log(metadata);
// {
//   symbol: 'BTCUSDT',
//   type: 'crypto',
//   displayName: 'Bitcoin/USDT',
//   provider: 'binance',
//   supportedTimeframes: ['5m', '15m', '30m', '1h', '4h', '1d'],
//   cacheTTL: { scalping: 60000, intraday: 300000, daily: true }
// }

// Utility functions
const type = getAssetType('EUR/USD'); // 'forex'
const provider = getAssetProvider('XAU/USD'); // 'twelvedata'
```

## Rate Limits

### Binance (Free Tier)
- **REST API**: 1200 requests per minute
- **Weight**: Varies by endpoint
- **Cache**: 1 minute for scalping, 5 minutes for intraday

### Twelve Data (Free Tier)
- **API Calls**: 8 per minute, 800 per day
- **Cache**: 1 minute for scalping, 5 minutes for intraday, midnight for daily
- **Recommendation**: Use daily candles when possible to minimize API usage

## Error Handling

### Graceful Fallback

When `enableMockFallback: true`, the service automatically generates mock data if:
- API key is missing or invalid
- Rate limit is exceeded
- Network error occurs
- Provider is temporarily unavailable

```typescript
const service = new MarketDataService({
  binance: config.binance,
  twelvedata: config.twelvedata,
  enableMockFallback: true, // Enable automatic fallback
});

// Will return mock data if Twelve Data API fails
const forexData = await service.getKlines('EUR/USD', '1h', 100);
```

### Error Types

```typescript
try {
  const data = await service.getKlines('EUR/USD', '1h');
} catch (error) {
  if (error.message.includes('not configured')) {
    // Twelve Data API key missing
  } else if (error.message.includes('rate limit')) {
    // Rate limit exceeded
  } else if (error.message.includes('API error')) {
    // Provider API error
  }
}
```

## Testing

### Run the Test Script

```bash
npm run example:market-data
```

### Manual Testing

```typescript
import { MarketDataService } from './services/market-data-service';
import { config } from './config';

async function test() {
  const service = new MarketDataService({
    binance: config.binance,
    twelvedata: config.twelvedata,
    enableMockFallback: true,
  });

  // Test crypto
  const btc = await service.getKlines('BTCUSDT', '1h', 10);
  console.log(`BTC data points: ${btc.length}`);

  // Test forex (requires Twelve Data API key)
  if (service.isTwelveDataEnabled()) {
    const eur = await service.getKlines('EUR/USD', '1h', 10);
    console.log(`EUR/USD data points: ${eur.length}`);
  }

  // Test cache performance
  const start1 = Date.now();
  await service.getKlines('ETHUSDT', '15m', 100);
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  await service.getKlines('ETHUSDT', '15m', 100);
  const time2 = Date.now() - start2;

  console.log(`First call: ${time1}ms, Cached call: ${time2}ms`);
  console.log(`Speedup: ${(time1 / time2).toFixed(2)}x`);

  service.close();
}

test();
```

## Integration with Existing Code

### Replace unifiedMarketData.ts

The new `MarketDataService` replaces `unifiedMarketData.ts` with:
- Support for commodities
- Better caching strategy
- Centralized asset configuration
- More flexible provider architecture

### Update Strategy Orchestrator

```typescript
// Old
import { UnifiedMarketDataService } from './services/unifiedMarketData';

// New
import { MarketDataService } from './services/market-data-service';
import { config } from './config';

const marketData = new MarketDataService({
  binance: config.binance,
  twelvedata: {
    apiKey: config.twelvedata.apiKey,
    cacheTTL: config.twelvedata.cacheTTL,
    rateLimit: config.twelvedata.rateLimit,
  },
});
```

## Best Practices

1. **Use Daily Candles When Possible**
   - Reduces API calls significantly
   - Better cache efficiency
   - Lower cost

2. **Enable Mock Fallback in Development**
   - Prevents API quota exhaustion
   - Faster development cycles
   - No API key required for testing

3. **Monitor Cache Hit Rates**
   - Log cache hits/misses
   - Adjust TTL based on usage patterns
   - Balance freshness vs API calls

4. **Batch Requests**
   - Fetch data for multiple symbols sequentially
   - Respect rate limits
   - Use cache for repeated requests

5. **Handle Errors Gracefully**
   - Always wrap API calls in try-catch
   - Implement retry logic for transient errors
   - Log errors with context

## Troubleshooting

### Twelve Data API returns 429 (Rate Limit)

**Solution:** Increase cache TTL or reduce polling frequency.

```bash
TWELVEDATA_CACHE_TTL=600000  # 10 minutes
MARKET_DATA_POLLING_INTERVAL=120000  # 2 minutes
```

### Missing data for forex/commodity symbols

**Solution:** Verify Twelve Data API key is set.

```bash
# Check if key is configured
echo $TWELVEDATA_API_KEY

# Test the service
npm run example:market-data
```

### Mock data being returned instead of real data

**Solution:** Check API configuration and disable fallback if needed.

```bash
MARKET_DATA_MOCK_FALLBACK=false
```

### Slow API responses

**Solution:** Cache is working! Second request should be instant.

```typescript
// First call (slow - fetches from API)
const data1 = await service.getKlines('BTCUSDT', '1h', 100);

// Second call (fast - returns from cache)
const data2 = await service.getKlines('BTCUSDT', '1h', 100);
```

## Migration from Alpha Vantage

The new service replaces Alpha Vantage with Twelve Data:

| Feature | Alpha Vantage | Twelve Data |
|---------|--------------|-------------|
| Rate Limit | 5/min, 500/day | 8/min, 800/day |
| Forex | ✅ | ✅ |
| Commodities | ❌ | ✅ |
| Response Time | Slow | Fast |
| Data Quality | Good | Excellent |

**Migration Steps:**

1. Get Twelve Data API key
2. Set `TWELVEDATA_API_KEY` in `.env`
3. Update service initialization
4. Test with `npm run example:market-data`

## Performance Metrics

Typical response times (with 100ms network latency):

| Scenario | Time | Cache Hit |
|----------|------|-----------|
| First crypto request | ~200ms | ❌ |
| Cached crypto request | <1ms | ✅ |
| First forex request | ~300ms | ❌ |
| Cached forex request | <1ms | ✅ |
| Mock data generation | ~1ms | N/A |

## Future Enhancements

- [ ] WebSocket support for real-time forex/commodity data
- [ ] More commodity symbols (silver, oil, etc.)
- [ ] Alternative provider fallback (e.g., Alpha Vantage as backup)
- [ ] Redis-based distributed cache
- [ ] Request queuing for rate limit optimization
- [ ] Historical data bulk download with automatic pagination

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify API keys are correctly configured
3. Test with mock fallback enabled first
4. Review rate limit quotas on provider dashboards

## References

- [Twelve Data API Documentation](https://twelvedata.com/docs)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [Asset Configuration](./src/config/assets.ts)
- [Cache Implementation](./src/lib/cache.ts)
