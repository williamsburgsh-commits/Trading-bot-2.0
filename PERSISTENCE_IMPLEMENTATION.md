# Persistence & APIs Implementation

This document describes the persistence layer, API routes, authentication, and cron job implementation for the Trading Bot 2.0 system.

## Overview

The system now includes:
- ✅ Durable storage for signals and user preferences
- ✅ Vercel KV storage with JSON file fallback
- ✅ NextAuth.js authentication
- ✅ Enhanced API routes with validation
- ✅ Automated cron jobs for signal generation
- ✅ Comprehensive security with token-based auth

## Storage Architecture

### Storage Adapter

**Location**: `src/signal-provider/storage/adapter.ts`

The `StorageAdapter` class provides a unified interface for data persistence with automatic fallback:

```typescript
class StorageAdapter {
  // Signal Operations
  saveSignal(signal: StoredSignal): Promise<void>
  getSignals(filters?: SignalFilters): Promise<StoredSignal[]>
  countSignals(filters?: SignalFilters): Promise<number>
  getSignalById(id: string): Promise<StoredSignal | null>
  updateSignalStatus(id: string, status: string): Promise<void>
  
  // User Settings Operations
  getUserSettings(userId: string): Promise<StoredUserSettings | null>
  saveUserSettings(settings: StoredUserSettings): Promise<void>
}
```

### Vercel KV Adapter

**Location**: `lib/kv.ts`

Wrapper for Vercel KV (Redis-based key-value store):

```typescript
interface KVAdapter {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, expiresIn?: number): Promise<void>
  delete(key: string): Promise<void>
  keys(pattern: string): Promise<string[]>
  exists(key: string): Promise<boolean>
}
```

### Fallback Strategy

1. **Primary**: Vercel KV
   - High performance Redis storage
   - Automatic connection detection
   - Used in production on Vercel

2. **Fallback**: JSON Files
   - Local file system storage
   - Auto-created `./data/` directory
   - Used for local development
   - Files: `signals.json`, `settings.json`

### Storage Initialization

```typescript
async function getStorageAdapter(): Promise<StorageAdapter> {
  let storageAdapter: StorageAdapter;
  
  try {
    const { kv } = await import('@/lib/kv');
    storageAdapter = new StorageAdapter(kv);
  } catch {
    storageAdapter = new StorageAdapter(); // Falls back to JSON
  }

  await storageAdapter.initialize();
  return storageAdapter;
}
```

## Authentication (NextAuth.js)

### Configuration

**Location**: `lib/auth.ts`

- Provider: Credentials (email/password)
- Session: JWT-based, 30-day expiry
- Demo Account: `admin@example.com` / `admin123`

### API Routes

**Location**: `app/api/auth/[...nextauth]/route.ts`

Standard NextAuth routes:
- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out
- `/api/auth/session` - Get session
- `/api/auth/csrf` - CSRF token

### Usage in API Routes

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

const userId = session.user.id;
```

### Environment Variables

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

## API Routes

### 1. Signals API (`/api/signals`)

#### GET - Fetch Signals

**Query Parameters**:
- `type`: Filter by category (`daily` or `scalping`)
- `status`: Filter by status (`active`, `filled`, `closed`)
- `asset`: Filter by asset symbol
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "signals": [...],
  "total": 100,
  "metrics": {
    "winRate": 65.5,
    "avgProfit": 3.2,
    "totalSignals": 100,
    "closedSignals": 45,
    "activeSignals": 55
  }
}
```

**Example**:
```bash
curl "http://localhost:3000/api/signals?type=daily&status=active&limit=10"
```

#### POST - Create Signals (Cron/Internal)

**Authentication**: Requires `CRON_SECRET`

**Request Body**:
```json
{
  "signals": [
    {
      "asset": "BTCUSDT",
      "timeframe": "1h",
      "entryPrice": 45000,
      "takeProfit": 46000,
      "stopLoss": 44500,
      "signalType": "BUY",
      "status": "active",
      "metadata": { "rsi": 35, "macd": { ... } }
    }
  ],
  "token": "your-cron-secret"
}
```

**Response**:
```json
{
  "success": true,
  "created": 1,
  "failed": 0,
  "signalIds": ["uuid-1"],
  "errors": []
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/signals \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"signals": [...]}'
```

### 2. Settings API (`/api/settings`)

#### GET - Fetch User Settings

**Authentication**: Optional (returns defaults for anonymous users)

**Response**:
```json
{
  "settings": {
    "enabledAssets": ["BTCUSDT", "ETHUSDT"],
    "notificationChannels": {
      "email": false,
      "push": true,
      "webhook": false
    },
    "preferredTimeframes": ["4h", "1d"],
    "riskLevel": 50
  },
  "authenticated": true,
  "userId": "user-id"
}
```

#### POST - Update Settings

**Authentication**: Required (NextAuth session)

**Request Body**:
```json
{
  "settings": {
    "enabledAssets": ["BTCUSDT"],
    "notificationChannels": {
      "email": true,
      "push": true,
      "webhook": false
    },
    "preferredTimeframes": ["1h", "4h"],
    "riskLevel": 75
  }
}
```

**Response**:
```json
{
  "success": true,
  "settings": { ... }
}
```

### 3. Cron Endpoints

#### Daily Signals (`/api/cron/daily`)

**Schedule**: 00:00 UTC daily (configured in `vercel.json`)

**Timeframes**: 4h, 1d

**Assets**: All crypto and forex pairs

**Authentication**: Bearer token with `CRON_SECRET`

**Response**:
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
  "signalIds": ["uuid-1", "uuid-2", ...],
  "errors": []
}
```

**Test Locally**:
```bash
export CRON_SECRET="dev-secret"
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/daily
```

#### Scalping Signals (`/api/cron/scalping`)

**Schedule**: Every 5 minutes (configured in `vercel.json`)

**Timeframes**: 5m, 15m, 30m, 1h

**Assets**: Crypto only (BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT)

**Authentication**: Bearer token with `CRON_SECRET`

**Response**: Same format as daily endpoint

**Test Locally**:
```bash
export CRON_SECRET="dev-secret"
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/scalping
```

## Input Validation

All API routes use Zod for input validation:

```typescript
import { z } from 'zod';

const signalQuerySchema = z.object({
  type: z.enum(['daily', 'scalping']).optional(),
  status: z.string().optional(),
  asset: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const validation = signalQuerySchema.safeParse(input);
if (!validation.success) {
  return Response.json(
    { error: 'Invalid input', details: validation.error.issues },
    { status: 400 }
  );
}
```

## Vercel Cron Jobs

### Configuration File: `vercel.json`

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

### Cron Syntax

- `0 0 * * *` - Daily at 00:00 UTC
- `*/5 * * * *` - Every 5 minutes
- `0 */4 * * *` - Every 4 hours
- `0 9,17 * * *` - At 9 AM and 5 PM UTC

### Vercel Dashboard Setup

1. Deploy your application to Vercel
2. Navigate to Project Settings → Cron Jobs
3. Verify both cron jobs are detected from `vercel.json`
4. Enable each cron job manually
5. View execution logs in the Cron Jobs dashboard

### Security

- All cron endpoints require `CRON_SECRET` in Authorization header
- Generate secret: `openssl rand -base64 32`
- Set in Vercel environment variables
- Never commit secrets to git

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
KV_REST_API_READ_ONLY_TOKEN="your-kv-read-token"

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

## Cache Headers

All API routes set appropriate cache headers:

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

This ensures:
- No static optimization
- Fresh data on every request
- Proper dynamic behavior in production

## Error Handling

All routes include comprehensive error handling:

```typescript
try {
  // Route logic
} catch (error: any) {
  console.error('Error description:', error);
  return Response.json(
    { 
      error: 'User-friendly message',
      message: error.message 
    },
    { status: 500 }
  );
}
```

## Testing

### Local Development

1. **Start development server**:
```bash
npm run dev
```

2. **Test signal fetching**:
```bash
curl http://localhost:3000/api/signals?type=daily
```

3. **Test settings (anonymous)**:
```bash
curl http://localhost:3000/api/settings
```

4. **Test cron endpoint**:
```bash
export CRON_SECRET="dev-secret"
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/daily
```

### Production Testing

1. **Verify cron jobs are enabled** in Vercel dashboard
2. **Monitor cron execution logs** in Vercel
3. **Check signal persistence** via dashboard
4. **Verify storage backend** (KV or JSON fallback)

## Data Flow

### Signal Generation Flow

```
Cron Trigger (Vercel)
  ↓
/api/cron/daily or /api/cron/scalping
  ↓
UnifiedMarketDataService (fetch market data)
  ↓
UnifiedSignalEngine (generate signals)
  ↓
Prisma (persist to database)
  ↓
Return stats and signal IDs
```

### Settings Update Flow

```
User Updates Settings (Frontend)
  ↓
POST /api/settings (with NextAuth session)
  ↓
Validate with Zod
  ↓
StorageAdapter (KV or JSON)
  ↓
Return success confirmation
```

## Best Practices

1. **Always use Zod validation** for API inputs
2. **Check authentication** before allowing mutations
3. **Use storage adapter** for all persistence operations
4. **Set proper cache headers** on all routes
5. **Handle errors gracefully** with user-friendly messages
6. **Log execution stats** for monitoring
7. **Test locally** before deploying
8. **Secure cron endpoints** with CRON_SECRET
9. **Generate strong secrets** for production
10. **Monitor cron job logs** in Vercel dashboard

## Troubleshooting

### Issue: Cron jobs not executing

**Solution**: 
- Verify cron jobs are enabled in Vercel dashboard
- Check CRON_SECRET environment variable is set
- Review cron execution logs for errors

### Issue: Storage adapter fails

**Solution**:
- Check Vercel KV environment variables
- Verify `./data/` directory exists (auto-created)
- Check file permissions for JSON fallback

### Issue: Authentication not working

**Solution**:
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again
- Use demo credentials: admin@example.com / admin123

### Issue: Signals not persisting

**Solution**:
- Check DATABASE_URL is set correctly
- Run Prisma migrations: `npx prisma migrate deploy`
- Verify database connection in logs

## Future Enhancements

- [ ] Multiple authentication providers (Google, GitHub)
- [ ] User registration and password reset
- [ ] WebSocket real-time signal updates
- [ ] Advanced signal filtering and search
- [ ] Export signals to CSV/JSON
- [ ] Signal performance analytics
- [ ] Custom alert rules per user
- [ ] Integration with trading platforms
- [ ] Backtesting results persistence
- [ ] Signal recommendation engine

## Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Zod Documentation](https://zod.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check environment variables are set correctly
4. Review logs in Vercel dashboard
5. Consult the main README.md for additional context
