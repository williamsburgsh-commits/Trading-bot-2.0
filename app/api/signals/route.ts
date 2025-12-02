export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const signalQuerySchema = z.object({
  type: z.enum(['daily', 'scalping']).optional(),
  status: z.string().optional(),
  asset: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const createSignalSchema = z.object({
  asset: z.string(),
  timeframe: z.string(),
  entryPrice: z.number(),
  takeProfit: z.number(),
  stopLoss: z.number(),
  signalType: z.enum(['BUY', 'SELL']),
  status: z.enum(['active', 'filled', 'closed']).default('active'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const bulkSignalsSchema = z.object({
  signals: z.array(createSignalSchema),
  token: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const queryParams = signalQuerySchema.safeParse({
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      asset: searchParams.get('asset'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!queryParams.success) {
      return Response.json(
        { error: 'Invalid query parameters', details: queryParams.error.issues },
        { status: 400 }
      );
    }

    const { type, status, asset, limit: limitStr, offset: offsetStr } = queryParams.data;
    const limit = parseInt(limitStr || '50');
    const offset = parseInt(offsetStr || '0');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (asset) {
      where.asset = asset;
    }

    if (type === 'daily') {
      where.timeframe = { in: ['1d', '4h'] };
    } else if (type === 'scalping') {
      where.timeframe = { in: ['5m', '15m', '30m', '1h'] };
    }

    const [signals, total, activeCount, closedCount] = await Promise.all([
      prisma.signal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.signal.count({ where }),
      prisma.signal.count({ where: { ...where, status: 'active' } }),
      prisma.signal.count({ where: { ...where, status: 'closed' } }),
    ]);

    const closedSignals = await prisma.signal.findMany({
      where: { ...where, status: 'closed' },
    });

    let winRate = 0;
    let avgProfit = 0;

    if (closedSignals.length > 0) {
      const winners = closedSignals.filter((signal) => {
        const metadata = signal.metadata ? JSON.parse(signal.metadata as string) : null;
        return metadata?.exitPrice
          ? (signal.signalType === 'BUY' && metadata.exitPrice > signal.entryPrice) ||
              (signal.signalType === 'SELL' && metadata.exitPrice < signal.entryPrice)
          : false;
      });

      winRate = (winners.length / closedSignals.length) * 100;

      const totalProfit = closedSignals.reduce((sum, signal) => {
        const metadata = signal.metadata ? JSON.parse(signal.metadata as string) : null;
        if (metadata?.exitPrice) {
          const profit =
            signal.signalType === 'BUY'
              ? ((metadata.exitPrice - signal.entryPrice) / signal.entryPrice) * 100
              : ((signal.entryPrice - metadata.exitPrice) / signal.entryPrice) * 100;
          return sum + profit;
        }
        return sum;
      }, 0);

      avgProfit = totalProfit / closedSignals.length;
    }

    const transformedSignals = signals.map((signal) => {
      const metadata = signal.metadata ? JSON.parse(signal.metadata as string) : null;

      const confidence = metadata?.confidence || Math.round(60 + Math.random() * 30);

      let category: 'daily' | 'scalping' | undefined;
      if (['1d', '4h'].includes(signal.timeframe)) {
        category = 'daily';
      } else if (['5m', '15m', '30m', '1h'].includes(signal.timeframe)) {
        category = 'scalping';
      }

      return {
        id: signal.id,
        asset: signal.asset,
        timeframe: signal.timeframe,
        entryPrice: signal.entryPrice,
        takeProfit: signal.takeProfit,
        stopLoss: signal.stopLoss,
        status: signal.status,
        signalType: signal.signalType,
        category,
        confidence,
        metadata,
        createdAt: signal.createdAt.toISOString(),
        updatedAt: signal.updatedAt.toISOString(),
      };
    });

    return Response.json({
      signals: transformedSignals,
      total,
      metrics: {
        winRate,
        avgProfit,
        totalSignals: total,
        closedSignals: closedCount,
        activeSignals: activeCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching signals:', error);
    return Response.json(
      { error: 'Failed to fetch signals', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    const body = await request.json();
    const validation = bulkSignalsSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { signals, token } = validation.data;

    if (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const created = [];
    const errors = [];

    for (const signalData of signals) {
      try {
        const signal = await prisma.signal.create({
          data: {
            asset: signalData.asset,
            timeframe: signalData.timeframe,
            entryPrice: signalData.entryPrice,
            takeProfit: signalData.takeProfit,
            stopLoss: signalData.stopLoss,
            signalType: signalData.signalType,
            status: signalData.status,
            metadata: signalData.metadata ? JSON.stringify(signalData.metadata) : null,
          },
        });
        created.push(signal.id);
      } catch (error: any) {
        errors.push({
          asset: signalData.asset,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      created: created.length,
      failed: errors.length,
      signalIds: created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error creating signals:', error);
    return Response.json(
      { error: 'Failed to create signals', message: error.message },
      { status: 500 }
    );
  }
}
