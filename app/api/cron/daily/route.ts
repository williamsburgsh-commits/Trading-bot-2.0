export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { UnifiedMarketDataService } from '@/src/services/unifiedMarketData';
import { StrategyOrchestrator } from '@/src/services/StrategyOrchestrator';
import { prisma } from '@/lib/prisma';
import type { AllSymbols, Timeframe } from '@/src/services/unifiedMarketData';

const DAILY_TIMEFRAMES: Timeframe[] = ['4h', '1d'];
const ASSETS: AllSymbols[] = [
  'BTCUSDT',
  'ETHUSDT',
  'XRPUSDT',
  'SOLUSDT',
  'EUR/USD',
  'USD/JPY',
  'GBP/USD',
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily signal generation cron job with strategy engine...');

    const marketDataService = new UnifiedMarketDataService({
      alphaVantage: {
        apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
      },
    });

    const orchestrator = new StrategyOrchestrator(marketDataService, {
      runBacktestOnStartup: false,
      enableDailyStrategy: true,
      enableScalpingStrategy: false,
    });

    console.log('Generating daily signals...');
    const signals = await orchestrator.generateDailySignals(ASSETS, DAILY_TIMEFRAMES);

    const allSignals = [];
    const errors = [];

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
            metadata: signal.metadata || null,
          },
        });
        allSignals.push(created.id);
      } catch (error: any) {
        console.error(`Failed to save signal for ${signal.asset}:`, error.message);
        errors.push({
          asset: signal.asset,
          timeframe: signal.timeframe,
          error: error.message,
        });
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
