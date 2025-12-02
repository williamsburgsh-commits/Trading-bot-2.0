export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const asset = searchParams.get('asset');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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
