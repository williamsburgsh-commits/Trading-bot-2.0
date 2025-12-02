export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { UnifiedMarketDataService } from '@/src/services/unifiedMarketData';
import { StrategyOrchestrator } from '@/src/services/StrategyOrchestrator';
import { prisma } from '@/lib/prisma';
import type { AllSymbols, Timeframe } from '@/src/services/unifiedMarketData';

const SCALPING_TIMEFRAMES: Timeframe[] = ['5m', '15m', '30m', '1h'];
const ASSETS: AllSymbols[] = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT'];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting scalping signal generation cron job with strategy engine...');

    const marketDataService = new UnifiedMarketDataService({
      alphaVantage: {
        apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
      },
    });

    const orchestrator = new StrategyOrchestrator(marketDataService, {
      runBacktestOnStartup: false,
      enableDailyStrategy: false,
      enableScalpingStrategy: true,
    });

    console.log('Generating scalping signals...');
    const signals = await orchestrator.generateScalpingSignals(ASSETS, SCALPING_TIMEFRAMES);

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
      type: 'scalping',
      assets: ASSETS.length,
      timeframes: SCALPING_TIMEFRAMES.length,
      signalsGenerated: allSignals.length,
      errors: errors.length,
    };

    console.log('Scalping cron job completed:', stats);

    return Response.json({
      success: true,
      stats,
      signalIds: allSignals,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Scalping cron job failed:', error);
    return Response.json(
      { error: 'Scalping cron job failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
