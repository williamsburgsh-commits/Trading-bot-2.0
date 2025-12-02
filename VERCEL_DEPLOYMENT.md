# Vercel Deployment Guide

## Overview

This application is configured to deploy seamlessly on Vercel with the updated `vercel.json` configuration.

## Environment Variables

Configure these environment variables in your Vercel project settings:

### Required
- `DATABASE_URL` - Database connection string (use Vercel Postgres or external PostgreSQL)
- `ALPHA_VANTAGE_API_KEY` - Alpha Vantage API key for forex data (get free key at https://www.alphavantage.co/support/#api-key)
- `NODE_ENV` - Set to `production`

### OneSignal Push Notifications (Recommended)
- `ONESIGNAL_APP_ID` - Your OneSignal App ID from https://app.onesignal.com
- `ONESIGNAL_REST_API_KEY` - Your OneSignal REST API Key
- `ONESIGNAL_ENABLED` - Enable/disable notifications (default: true)
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` - Frontend OneSignal App ID (same as ONESIGNAL_APP_ID)

### NextAuth (Optional - for user authentication)
- `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - Secret key for JWT encryption (generate with: `openssl rand -base64 32`)

### Optional
- `BINANCE_API_URL` - Binance API URL (default: https://api.binance.com)
- `ALPHA_VANTAGE_API_URL` - Alpha Vantage API URL (default: https://www.alphavantage.co)
- `LOG_LEVEL` - Logging level (default: info)
- `MONITOR_INTERVAL` - Cron expression for monitoring (default: */5 * * * *)
- `ASSETS` - Comma-separated list of assets to monitor (default: BTCUSDT,ETHUSDT,BNBUSDT)
- `TIMEFRAMES` - Comma-separated list of timeframes (default: 15m,1h,4h)

**Note:** Binance API keys (BINANCE_API_KEY, BINANCE_API_SECRET) are **optional** - only public endpoints are used.

## Database Setup

For production, you'll need to configure a proper database:

### Option 1: Vercel Postgres (Recommended)
1. Add Vercel Postgres to your project
2. Use the provided DATABASE_URL
3. Run `prisma generate` and `prisma migrate deploy` during build

### Option 2: External Database
1. Set up a PostgreSQL database elsewhere
2. Configure the DATABASE_URL environment variable

## Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Build Process

The updated `vercel.json` uses Vercel's built-in Next.js support:

- **Build Command**: `npm run build` (TypeScript compilation + Next.js build)
- **Output Directory**: `.next` (Next.js build output)
- **No custom routing needed**: Next.js handles all routing automatically

## OneSignal Setup for Vercel

### Step 1: Create OneSignal Account
1. Sign up at https://app.onesignal.com
2. Create a new app and select "Web Push" platform
3. Configure your site URL (your Vercel deployment URL)

### Step 2: Get Credentials
1. Navigate to Settings → Keys & IDs
2. Copy your **App ID**
3. Copy your **REST API Key**

### Step 3: Configure Vercel Environment Variables
Add these variables in your Vercel project settings:
```
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_REST_API_KEY=your-rest-api-key-here
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_ENABLED=true
```

### Step 4: Deploy
- Push your code to trigger Vercel deployment
- OneSignal service workers will be automatically served from `/public`
- Users will be prompted to allow notifications on first visit

## Cron Jobs / Scheduled Monitoring

Vercel serverless functions have a 10-second execution limit for the free tier. For continuous monitoring:

### Option 1: External Cron Service (Recommended)
Use a service like **Vercel Cron Jobs** (paid) or external services:
- **Cron-job.org** - Free HTTP cron jobs
- **EasyCron** - Scheduled HTTP requests
- **GitHub Actions** - Free scheduled workflows

Example GitHub Actions cron:
```yaml
name: Monitor Trading Signals
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run dev:backend
```

### Option 2: Self-Hosted Backend
Run the monitoring service on a separate server:
- Deploy backend to a VPS, DigitalOcean, or AWS EC2
- Use PM2 or Docker for process management
- Keep Vercel for the dashboard frontend only

## Features After Deployment

- ✅ Dashboard loads without 404 errors
- ✅ API endpoints respond correctly
- ✅ Real-time signal fetching
- ✅ Push notifications via OneSignal
- ✅ Offline support with service workers
- ✅ Responsive design with dark mode
- ✅ Performance metrics display
- ✅ Signal filtering and search

## Troubleshooting

### Build Fails
- Check that all dependencies are installed
- Verify TypeScript compilation passes locally
- Ensure Tailwind CSS configuration is correct

### API Errors
- Verify DATABASE_URL is correctly set
- Check ALPHA_VANTAGE_API_KEY is valid
- Ensure database schema is up to date
- Confirm Prisma client is generated during build

### OneSignal Not Working
- Verify `NEXT_PUBLIC_ONESIGNAL_APP_ID` is set (must start with `NEXT_PUBLIC_`)
- Check browser console for service worker registration errors
- Ensure your site is served over HTTPS (Vercel does this automatically)
- Verify OneSignal App ID and REST API Key match

### Push Notifications Not Sending
- Check Vercel function logs for notification errors
- Verify ONESIGNAL_REST_API_KEY is correct
- Ensure users have subscribed to notifications
- Check OneSignal dashboard for delivery logs

### Runtime Errors
- Check Vercel function logs
- Verify all environment variables are set
- Ensure database is accessible from Vercel
- Confirm service workers are being served correctly

## Notes

- The application automatically handles both frontend and backend
- No custom server configuration needed
- API routes are served from `/api/*` paths
- Static assets are optimized automatically
- Database migrations should be run before first deployment
- Service workers are automatically served from `/public` directory
- OneSignal requires HTTPS (Vercel provides this by default)

## Risk Disclaimer

⚠️ **This trading system is for educational purposes only.** Trading involves substantial risk of loss. Always conduct your own research and never invest more than you can afford to lose. See main README.md for complete disclaimer.