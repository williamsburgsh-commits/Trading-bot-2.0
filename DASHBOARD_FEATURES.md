# Dashboard & Settings UI - New Features

## Overview

This document describes the completely overhauled frontend with enhanced features for trading signal monitoring.

## Main Dashboard (`/`)

### Key Features

#### 1. **Tab-Based Signal Categorization**
- **Daily Signals Tab**: Shows signals for longer timeframes (4h, 1d)
- **Scalping Signals Tab**: Shows signals for shorter timeframes (5m, 15m, 30m, 1h)
- Seamless switching between signal categories

#### 2. **Real-Time Data Updates**
- Uses **SWR (stale-while-revalidate)** for efficient data fetching
- Automatic refresh every **15 seconds**
- Revalidates on browser focus and reconnection
- Shows skeleton loaders during data fetch
- Displays error states with retry functionality

#### 3. **Enhanced Signals Table**
Displays the following columns:
- **Asset**: Trading pair symbol
- **Signal Type**: BUY/SELL with color-coded badges and icons
- **Entry**: Entry price
- **TP**: Take Profit target price
- **SL**: Stop Loss price
- **Timeframe**: Signal timeframe (5m, 15m, 30m, 1h, 4h, 1d)
- **Generated At**: Time since signal creation (e.g., "5m ago")
- **Confidence**: Star rating (1-5 stars) with tooltip showing backtest info

#### 4. **Live Performance Metrics**
5-card grid showing:
- **Active Signals**: Currently open positions
- **Total Signals**: All-time signal count
- **Closed Signals**: Completed trades
- **Win Rate**: Success percentage of closed signals
- **Average Profit**: Average profit/loss percentage

#### 5. **Risk Disclaimer Banner**
- Prominent warning about trading risks
- Dismissable by user
- Professional compliance messaging

#### 6. **Asset Filtering**
- Dynamic dropdown to filter signals by specific assets
- Updates in real-time as you switch tabs
- Shows only assets with available signals

#### 7. **Empty State Handling**
- Informative messages when no signals are available
- Different messages for daily vs scalping categories

## Settings Page (`/settings`)

### Key Features

#### 1. **Authentication Guard**
- Login required to access settings
- Demo credentials: `admin` / `admin123`
- Token-based session management (localStorage)
- Automatic token verification on page load

#### 2. **Asset Management**
Separate sections for:
- **Cryptocurrency Assets**: BTC, ETH, XRP, SOL
- **Forex Assets**: EUR/USD, GBP/USD, USD/JPY

Toggle switches to enable/disable each asset individually.

#### 3. **Notification Channels**
Configure how you want to receive alerts:
- **Email Notifications**: Receive alerts via email
- **Push Notifications**: Browser/mobile push alerts
- **Webhook Notifications**: Send to external webhook URL

#### 4. **Preferred Timeframes**
Visual selector for timeframes:
- 5m, 15m, 30m, 1h, 4h, 1d
- Multi-select (click to toggle)
- Color-coded selection state

#### 5. **Risk Level Slider**
- Adjustable risk tolerance (0-100%)
- Affects position sizing and stop loss distances
- Visual slider with percentage display
- Range from Conservative (0%) to Aggressive (100%)

#### 6. **Optimistic UI Updates**
- Settings save immediately with feedback
- Shows loading state during save
- Success confirmation message
- Persists settings via API

## New UI Components

### Created Components

1. **Tabs** (`components/ui/tabs.tsx`)
   - Context-based tab system
   - TabsList, TabsTrigger, TabsContent
   - Fully accessible with keyboard navigation

2. **Skeleton** (`components/ui/skeleton.tsx`)
   - Animated loading placeholders
   - Consistent styling with theme

3. **Tooltip** (`components/ui/tooltip.tsx`)
   - Hover-based information display
   - Used for confidence/backtest info

4. **Switch** (`components/ui/switch.tsx`)
   - Toggle switch component
   - Used for asset and notification settings

5. **Slider** (`components/ui/slider.tsx`)
   - Range input component
   - Used for risk level adjustment

6. **Input** (`components/ui/input.tsx`)
   - Text input with consistent styling
   - Used in login form

7. **Label** (`components/ui/label.tsx`)
   - Form field labels
   - Accessibility support

8. **ConfidenceStars** (`components/confidence-stars.tsx`)
   - 1-5 star rating display
   - Color-coded based on confidence level

9. **RiskDisclaimer** (`components/risk-disclaimer.tsx`)
   - Warning banner component
   - Dismissable with local state

10. **SignalsTableSkeleton** (`components/signals-table-skeleton.tsx`)
    - Loading state for signals table
    - Matches table structure

## API Endpoints

### Updated Endpoints

#### `GET /api/signals`
Query parameters:
- `type`: 'daily' | 'scalping' (filters by timeframe)
- `status`: 'active' | 'filled' | 'closed'
- `asset`: Specific asset symbol
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

Returns:
```json
{
  "signals": [...],
  "total": 0,
  "metrics": {
    "winRate": 0,
    "avgProfit": 0,
    "totalSignals": 0,
    "closedSignals": 0,
    "activeSignals": 0
  }
}
```

Each signal includes:
- `category`: 'daily' | 'scalping'
- `confidence`: 0-100 number
- Enhanced `metadata` with `backtestWinRate` and `backtestTrades`

### New Endpoints

#### `GET /api/assets`
Returns available assets:
```json
{
  "assets": [
    {
      "symbol": "BTCUSDT",
      "name": "Bitcoin",
      "type": "crypto",
      "enabled": true
    }
  ]
}
```

#### `GET /api/settings`
Returns current user settings:
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
  }
}
```

#### `POST /api/settings`
Save user settings:
```json
{
  "settings": {
    "enabledAssets": [...],
    "notificationChannels": {...},
    "preferredTimeframes": [...],
    "riskLevel": 50
  }
}
```

#### `POST /api/auth`
Authentication endpoint:

Login:
```json
{
  "action": "login",
  "username": "admin",
  "password": "admin123"
}
```

Verify token:
```json
{
  "action": "verify",
  "token": "demo-token-..."
}
```

## Technical Stack

### Dependencies Added
- **SWR**: Data fetching and caching library
  - Automatic revalidation
  - Optimistic UI updates
  - Cache management

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Full theme support via next-themes
- **Responsive Design**: Mobile-first approach
- **Design System**: Consistent colors, spacing, typography

### Type Safety
- Full TypeScript coverage
- Extended type definitions in `lib/types.ts`
- Strict type checking enabled

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

Visit:
- Dashboard: http://localhost:3000
- Settings: http://localhost:3000/settings

### Building for Production

```bash
npm run build
npm start
```

## Deployment Notes

### Vercel Deployment
- **No vercel.json required** - Configure via Vercel dashboard
- Set environment variables in Vercel dashboard:
  - `DATABASE_URL`: PostgreSQL connection string (recommended for production)
  - `ALPHA_VANTAGE_API_KEY`: For forex data
  - `NODE_ENV`: production

### Configuration
All settings managed through Vercel dashboard:
- Build Command: `npm run build`
- Output Directory: `.next`
- Development Command: `npm run dev`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ support required
- Local storage for auth tokens
- Fetch API for network requests

## Accessibility

- Semantic HTML throughout
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Performance

- SWR caching reduces unnecessary requests
- Skeleton loaders improve perceived performance
- Code splitting via Next.js
- Optimized bundle size
- Server-side rendering for initial load

## Future Enhancements

Potential additions:
- Real-time WebSocket updates
- Advanced chart visualizations
- Trade history and analytics
- Multi-user authentication
- Email notification setup
- Webhook configuration UI
- Export signals to CSV
- Custom alert conditions
- Mobile app (React Native)
