# Signal Provider Service

A TypeScript-based signal provider service for cryptocurrency trading signals with inversion-of-control architecture.

## Features

- **Centralized Configuration**: Environment-based configuration with validation
- **Structured Logging**: Winston logger with JSON and human-readable formats
- **Error Handling**: Comprehensive error handling with typed errors
- **IoC Architecture**: Dependency injection friendly structure
- **Type Safety**: Full TypeScript support

## Directory Structure

```
src/signal-provider/
├── config/           # Configuration management with validation
├── clients/          # External service clients (market data, storage)
├── indicators/       # Technical indicator interfaces
├── signals/          # Signal generation and validation
├── storage/          # Data persistence interfaces
├── monitoring/       # Health checks and metrics
├── utils/            # Shared utilities (logger, errors)
├── orchestrator.ts   # Main service orchestrator
└── index.ts          # Entry point
```

## Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and adjust:

```bash
# Binance API Configuration
BINANCE_API_URL="https://api.binance.com"
# BINANCE_API_KEY="your-api-key"       # Optional - not needed for public price data
# BINANCE_API_SECRET="your-secret"      # Optional - not needed for public price data

# Database
DATABASE_URL="file:./dev.db"

# Logging
LOG_LEVEL="info"                      # error, warn, info, http, verbose, debug, silly
LOG_FORMAT="pretty"                   # json or pretty

# Rate Limiting
RATE_LIMIT_MAX=1200                   # Public endpoints: up to 1200 req/min
RATE_LIMIT_MINUTES=1
```

### Binance API Keys

**API keys are optional** for this service. The signal provider only uses public Binance endpoints for fetching price data (klines), which do not require authentication.

- **Without API keys**: Full access to public market data (OHLCV, klines, ticker)
- **With API keys**: Same as above + access to private account endpoints (not currently used)

If API keys are not provided in the environment, the service will operate in public-only mode with no limitations on functionality.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture Patterns

### Dependency Injection

The service uses constructor-based dependency injection:

```typescript
const orchestrator = new SignalProviderOrchestrator({
  logger,
  config,
});
```

### Error Handling

Structured error types with operational vs non-operational distinction:

```typescript
throw new ValidationError('Invalid parameter');
throw new RateLimitError('Too many requests');
throw new ExternalServiceError('API unavailable');
```

### Logging

Structured logging with context:

```typescript
logger.info('Operation completed', {
  service: 'MyService',
  operation: 'fetchData',
  duration: 123,
});
```

## Extending the Service

### Adding a New Client

1. Create interface in `clients/`
2. Implement the client with dependency injection
3. Register in orchestrator

### Adding Indicators

1. Define interface in `indicators/`
2. Implement calculation logic
3. Integrate with signal generation

### Adding Storage

1. Define repository interface in `storage/`
2. Implement storage backend
3. Inject into services that need persistence

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Production

```bash
# Build
npm run build

# Start compiled version
npm start
```

## License

ISC
