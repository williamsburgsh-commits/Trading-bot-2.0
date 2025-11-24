# Vercel Deployment Guide

## Overview

This application is configured to deploy seamlessly on Vercel with the updated `vercel.json` configuration.

## Environment Variables

Configure these environment variables in your Vercel project settings:

### Required
- `DATABASE_URL` - Database connection string
- `FINNHUB_API_KEY` - Your Finnhub API key (get free key at https://finnhub.io/register)

### Optional
- `BINANCE_API_URL` - Binance API URL (default: https://api.binance.com)
- `FINNHUB_API_URL` - Finnhub API URL (default: https://finnhub.io/api/v1)
- `LOG_LEVEL` - Logging level (default: info)
- `MONITOR_INTERVAL` - Cron expression for monitoring (default: */5 * * * *)
- `ASSETS` - Comma-separated list of assets to monitor (default: BTCUSDT,ETHUSDT,BNBUSDT)
- `TIMEFRAMES` - Comma-separated list of timeframes (default: 15m,1h,4h)

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

## Features After Deployment

- ✅ Dashboard loads without 404 errors
- ✅ API endpoints respond correctly
- ✅ Real-time signal fetching
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
- Check FINNHUB_API_KEY is valid
- Ensure database schema is up to date

### Runtime Errors
- Check Vercel function logs
- Verify all environment variables are set
- Ensure database is accessible from Vercel

## Notes

- The application automatically handles both frontend and backend
- No custom server configuration needed
- API routes are served from `/api/*` paths
- Static assets are optimized automatically
- Database migrations should be run before first deployment