# Getting Started with the Trading Signals Dashboard

This guide will help you get the dashboard up and running quickly.

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Make sure you have a `.env` file with the required configuration:

```bash
# Copy from .env.example if needed
cp .env.example .env
```

Ensure `DATABASE_URL` is set correctly:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Start the Dashboard

Open two terminals:

**Terminal 1 - Dashboard (Next.js)**
```bash
npm run dev
```
The dashboard will be available at http://localhost:3000

**Terminal 2 - Signal Provider (Backend)**
```bash
npm run dev:backend
```

This runs the signal generation service that populates the database with signals.

### 5. View the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## What You'll See

### Dashboard Features

1. **Performance Metrics** at the top:
   - Active Signals: Currently open positions
   - Total Signals: All-time signal count
   - Closed Signals: Completed trades
   - Win Rate: Percentage of profitable signals
   - Avg Profit: Average profit/loss per signal

2. **Filter Bar**: Narrow signals by:
   - Status (Active, Filled, Closed)
   - Asset (BTCUSDT, ETHUSDT, EUR/USD, etc.)
   - Type (Crypto, Forex)
   - Signal (BUY, SELL)

3. **Signals Display**: Toggle between:
   - **Table View** (List icon): See all details in columns
   - **Grid View** (Grid icon): Visual card-based layout

4. **Real-time Updates**:
   - Auto-refresh checkbox to enable/disable
   - Refresh interval selector (5s to 1m)
   - Manual refresh button

## Understanding Signals

### Price Levels Explained

For each signal, you'll see:
- **Entry**: The price to enter the position
- **Stop Loss (SL)**: Where to exit if trade goes wrong (risk protection)
- **Take Profit Levels (TP)**:
  - **TP1 (40%)**: Sell 40% at this level
  - **TP2 (35%)**: Sell 35% at this level  
  - **TP3 (25%)**: Sell remaining 25% at this level

This 3-level approach locks in profits gradually while letting winners run.

### Color Coding

- 🟢 **Green**: BUY signal (bullish)
- 🔴 **Red**: SELL signal (bearish)
- 🔵 **Blue Badge**: Active signal (open trade)
- 🟡 **Yellow Badge**: Filled signal (partially executed)
- ⚫ **Gray Badge**: Closed signal (trade complete)

### Technical Indicators

When viewing signal cards, you may see:
- **RSI**: Relative Strength Index (0-100, <30 oversold, >70 overbought)
- **Volume**: Volume relative to 20-period average (higher = more conviction)
- **Volatility**: Market volatility percentage

## Common Tasks

### View Only Active Signals
1. Click "Status" filter
2. Select "active"
3. All inactive signals will be hidden

### See All Forex Signals
1. Click "Type" filter
2. Select "forex"
3. Dashboard updates to show only forex signals

### Switch to Card View
1. Click the Grid icon (top right of signals section)
2. Signals now display as cards with visual styling

### Reset All Filters
1. Click "Clear All" button (appears when filters are active)
2. All filters are removed

### Change Auto-Refresh Speed
1. Toggle "Auto-refresh" checkbox (top right)
2. Select your preferred interval
3. Dashboard will poll for updates at that speed

## Troubleshooting

### No Signals Showing?

1. **Check Backend is Running**
   ```bash
   # Should see signal generation logs
   npm run dev:backend
   ```

2. **Verify Database**
   ```bash
   sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Signal;"
   ```
   Should return a number > 0

3. **Clear Filters**
   Click "Clear All" to remove any active filters

4. **Refresh Page**
   Press F5 or Cmd+R to refresh the browser

### Dashboard Won't Load?

1. **Check Port 3000 is Free**
   ```bash
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
   ```

2. **Clear Next.js Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check Dependencies Installed**
   ```bash
   npm install
   npm run prisma:generate
   ```

### Wrong Data Showing?

1. **Regenerate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

2. **Check .env File**
   Verify DATABASE_URL points to the correct database

## Development Tips

### Format Your Code
```bash
npm run format
```

### Check for Linting Issues
```bash
npm run lint
```

### Auto-fix Linting Issues
```bash
npm run lint:fix
```

### Build for Production
```bash
npm run build
npm start
```

## API Reference

### Get Signals

```bash
curl "http://localhost:3000/api/signals"
```

Query Parameters:
- `status=active` - Filter by status
- `asset=BTCUSDT` - Filter by asset
- `assetType=crypto` - Filter by type
- `signalType=BUY` - Filter by signal type
- `limit=50` - Limit results (default: 100)
- `offset=0` - Pagination offset

Example with filters:
```bash
curl "http://localhost:3000/api/signals?status=active&assetType=crypto"
```

### Response Format

```json
{
  "signals": [
    {
      "id": "uuid",
      "asset": "BTCUSDT",
      "timeframe": "1h",
      "entryPrice": 45000.50,
      "takeProfit": 46500.00,
      "stopLoss": 44000.00,
      "status": "active",
      "signalType": "BUY",
      "metadata": {
        "assetType": "crypto",
        "rsi": 28.5
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "metrics": {
    "winRate": 62.5,
    "avgProfit": 125.50,
    "totalSignals": 45,
    "closedSignals": 40,
    "activeSignals": 5
  }
}
```

## Next Steps

1. **Generate Test Signals**: `npm run test:signals`
2. **Generate Unified Signals** (crypto + forex): `npm run test:unified-signals`
3. **Read Full Documentation**: See `DASHBOARD_README.md`
4. **Explore Backend**: See `README.md` for system overview

## Need Help?

- Check `DASHBOARD_README.md` for detailed features
- Review `README.md` for system architecture
- Check logs in `logs/` directory for errors
- Database stored at `prisma/dev.db`

Happy trading! 📊
