# Alpha Vantage Integration Guide

## Overview

This project uses **Alpha Vantage API** to fetch real-time forex data for USD/JPY, EUR/USD, and GBP/USD pairs. Alpha Vantage has replaced Finnhub as the forex data provider.

## Why Alpha Vantage?

- ✅ **Free tier available**: 5 requests per minute, 500 requests per day
- ✅ **Comprehensive forex data**: FX_INTRADAY with multiple timeframes
- ✅ **Reliable**: Stable API with good uptime
- ✅ **Easy to use**: Simple REST API with JSON responses
- ✅ **No credit card required**: Free API key available

## Getting Your API Key

1. Visit [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Enter your email address and organization name (can be your name)
3. Click "GET FREE API KEY"
4. Copy your API key (it will be displayed immediately)
5. Add it to your `.env` file:

```bash
ALPHA_VANTAGE_API_KEY="your-api-key-here"
```

## Configuration

### Environment Variables

Add these to your `.env` file (see `.env.example` for reference):

```bash
# Alpha Vantage API Configuration
ALPHA_VANTAGE_API_URL="https://www.alphavantage.co"
ALPHA_VANTAGE_API_KEY="your-api-key-here"

# Alpha Vantage Rate Limiting (Free tier: 5 calls/minute, 500 calls/day)
ALPHA_VANTAGE_RATE_LIMIT_MAX=5
ALPHA_VANTAGE_RATE_LIMIT_MINUTES=1
```

### Rate Limits

**Free Tier:**
- 5 API requests per minute
- 500 API requests per day
- No credit card required

**Premium Tiers:**
- 25-75 requests per minute (depending on plan)
- Higher daily limits
- More data points per request

The client automatically handles rate limiting with exponential backoff.

## Supported Features

### Forex Pairs

- **USD/JPY**: US Dollar / Japanese Yen
- **EUR/USD**: Euro / US Dollar
- **GBP/USD**: British Pound / US Dollar

### Timeframes

- **5m**: 5-minute candles
- **15m**: 15-minute candles
- **1h**: 1-hour candles
- **4h**: 4-hour candles (aggregated from 1h data)

### Data Points

For each candle:
- Open price
- High price
- Low price
- Close price
- Timestamp

**Note**: Alpha Vantage doesn't provide volume data for forex pairs.

## Architecture

### Module Structure

```
src/modules/alphavantage-data-client/
├── index.ts              # Main export file
├── rest-client.ts        # REST API client with rate limiting
├── cache.ts              # Caching layer
├── types.ts              # TypeScript type definitions
├── validator.ts          # Response validation
├── README.md             # Module documentation
└── __tests__/            # Unit tests
    └── rest-client.unit.test.ts
```

### Integration Points

1. **UnifiedMarketDataService** (`src/services/unifiedMarketData.ts`)
   - Uses `AlphaVantageDataClient` for forex data
   - Uses `BinanceDataClient` for crypto data
   - Provides unified interface for all assets

2. **Signal Provider Config** (`src/signal-provider/config/index.ts`)
   - Loads `ALPHA_VANTAGE_API_KEY` from environment
   - Configures rate limits
   - Validates configuration

3. **Test Scripts** (`src/test-unified-signals.ts`)
   - Generates signals for both crypto and forex
   - Tests Alpha Vantage integration

## Usage Examples

### Basic Usage

```typescript
import { AlphaVantageDataClient } from './modules/alphavantage-data-client';

const client = new AlphaVantageDataClient({
  apiKey: process.env.ALPHA_VANTAGE_API_KEY!,
  rateLimit: { maxRequests: 5, perMinutes: 1 },
});

// Get latest 500 candles for EUR/USD (1h timeframe)
const candles = await client.getLatestCandles('EUR/USD', '1h', 500);

console.log('Latest EUR/USD candle:', candles[candles.length - 1]);
```

### With Unified Market Data Service

```typescript
import { UnifiedMarketDataService } from './services/unifiedMarketData';

const marketData = new UnifiedMarketDataService({
  binance: {
    rateLimit: { maxRequests: 1200, perMinutes: 1 },
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY!,
    rateLimit: { maxRequests: 5, perMinutes: 1 },
  },
});

// Fetch crypto data (uses Binance)
const btcCandles = await marketData.getKlines('BTCUSDT', '1h', 500);

// Fetch forex data (uses Alpha Vantage)
const eurCandles = await marketData.getKlines('EUR/USD', '1h', 500);
```

### Generating Signals

```bash
# Generate signals for both crypto and forex
npm run test:unified-signals
```

This will:
1. Fetch latest data from Binance (crypto) and Alpha Vantage (forex)
2. Run technical analysis on all assets
3. Generate BUY/SELL signals with entry/TP/SL levels
4. Store signals in the database

## Testing

### Run Unit Tests

```bash
# Run all Alpha Vantage tests
npm test -- alphavantage

# Run specific test file
npm test -- rest-client.unit.test.ts
```

### Test with Real API

```bash
# Generate test signals (requires API key)
npm run test:unified-signals
```

## Error Handling

### Common Errors

**Rate Limit Exceeded:**
```
Error: Alpha Vantage API Rate Limit: Thank you for using Alpha Vantage! 
Our standard API call frequency is 5 calls per minute.
```

**Solution**: Wait for the rate limit window to reset. The client automatically retries with exponential backoff.

**Invalid API Key:**
```
Error: Invalid API key or unauthorized access.
```

**Solution**: Check that your API key is correct and added to `.env` file.

**API Error:**
```
Error: Alpha Vantage API Error: [error message]
```

**Solution**: Check the error message for details. Common issues include invalid parameters or service downtime.

## Graceful Degradation

If `ALPHA_VANTAGE_API_KEY` is not set:
- The system will log a warning
- Forex signals will be skipped
- Crypto signals will continue to work normally

This allows the system to function with crypto-only data if needed.

## Vercel Deployment

For Vercel deployment, add the environment variable in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Key**: `ALPHA_VANTAGE_API_KEY`
   - **Value**: Your API key
   - **Environment**: Production, Preview, Development (select all)
4. Redeploy your application

## Migration from Finnhub

### What Changed

1. **API Provider**: Finnhub → Alpha Vantage
2. **Environment Variable**: `FINNHUB_API_KEY` → `ALPHA_VANTAGE_API_KEY`
3. **Rate Limit**: 80 req/min → 5 req/min (free tier)
4. **Module**: `finnhub-data-client` → `alphavantage-data-client`
5. **Service Method**: `isFinnhubEnabled()` → `isAlphaVantageEnabled()`

### Migration Steps

1. Get Alpha Vantage API key (see above)
2. Update `.env` file:
   ```bash
   # Remove:
   FINNHUB_API_KEY="..."
   
   # Add:
   ALPHA_VANTAGE_API_KEY="your-new-key"
   ```
3. Restart your services
4. Test signal generation

### Data Compatibility

Both APIs return data in the same `KlineData` format:
- Open, High, Low, Close prices
- Timestamps (openTime, closeTime)
- Volume (set to '0' for forex)

No changes needed in downstream code!

## Best Practices

1. **Cache Aggressively**: Use the built-in caching to minimize API calls
2. **Batch Requests**: Fetch larger time ranges less frequently
3. **Monitor Usage**: Track your daily API call count (500 limit for free tier)
4. **Exponential Backoff**: The client handles retries automatically
5. **Upgrade if Needed**: Consider premium tier if you hit rate limits frequently

## Troubleshooting

### No Forex Signals Generated

**Check:**
1. Is `ALPHA_VANTAGE_API_KEY` set in `.env`?
2. Is the API key valid?
3. Have you hit the daily limit (500 calls)?
4. Check logs for API errors

### Rate Limit Errors

**Solution:**
- Reduce request frequency
- Increase cache TTL
- Consider upgrading to premium tier
- Batch requests more efficiently

### 4h Candle Aggregation Issues

The system aggregates 1h candles to create 4h candles. If you see incomplete 4h candles:
- Ensure you have enough 1h data (at least 4 candles per 4h period)
- Check that 1h candles are properly aligned

## Resources

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [FX_INTRADAY API Reference](https://www.alphavantage.co/documentation/#fx-intraday)
- [API Key Registration](https://www.alphavantage.co/support/#api-key)
- [Support & FAQ](https://www.alphavantage.co/support/)

## Support

For issues related to:
- **Alpha Vantage API**: Contact Alpha Vantage support
- **Integration**: Check module README (`src/modules/alphavantage-data-client/README.md`)
- **Signal Generation**: See unified signal engine documentation
