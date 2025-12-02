export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { UnifiedMarketDataService } from '@/src/services/unifiedMarketData';
import { UnifiedSignalEngine } from '@/src/services/unifiedSignalEngine';
import { prisma } from '@/lib/prisma';

const DAILY_TIMEFRAMES = ['4h', '1d'] as const;
const ASSETS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'EUR/USD', 'USD/JPY', 'GBP/USD'];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily signal generation cron job...');

    const marketDataService = new UnifiedMarketDataService({
      alphaVantage: {
        apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
      },
    });
    const signalEngine = new UnifiedSignalEngine(marketDataService);

    const allSignals = [];
    const errors = [];

    for (const asset of ASSETS) {
      for (const timeframe of DAILY_TIMEFRAMES) {
        try {
          console.log(`Generating signals for ${asset} on ${timeframe}...`);
          const signals = await signalEngine.generateSignals(asset as any, timeframe as any);

          for (const signal of signals) {
            try {
              const created = await prisma.signal.create({
                data: {
                  asset: signal.asset,
                  timeframe: signal.timeframe,
                  entryPrice: signal.entryPrice,
                  takeProfit: signal.takeProfit,
                  stopLoss: signal.stopLoss,
                  signalType: signal.signalType,
                  status: signal.status || 'active',
                  metadata: signal.metadata ? JSON.stringify(signal.metadata) : null,
                },
              });
              allSignals.push(created.id);
            } catch (error: any) {
              console.error(`Failed to save signal for ${asset}:`, error.message);
              errors.push({
                asset,
                timeframe,
                error: error.message,
              });
            }
          }
        } catch (error: any) {
          console.error(`Failed to generate signals for ${asset} on ${timeframe}:`, error.message);
          errors.push({
            asset,
            timeframe,
            error: error.message,
          });
        }
      }
    }

    const stats = {
      timestamp: new Date().toISOString(),
      type: 'daily',
      assets: ASSETS.length,
      timeframes: DAILY_TIMEFRAMES.length,
      signalsGenerated: allSignals.length,
      errors: errors.length,
    };

    console.log('Daily cron job completed:', stats);

    return Response.json({
      success: true,
      stats,
      signalIds: allSignals,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Daily cron job failed:', error);
    return Response.json(
      { error: 'Daily cron job failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
