import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const asset = searchParams.get('asset');
    const assetType = searchParams.get('assetType');
    const signalType = searchParams.get('signalType');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (asset) {
      where.asset = asset;
    }

    if (signalType) {
      where.signalType = signalType;
    }

    if (assetType) {
      where.metadata = {
        contains: `"assetType":"${assetType}"`,
      };
    }

    const signals = await prisma.signal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.signal.count({ where });

    // Calculate performance metrics
    const closedSignals = await prisma.signal.findMany({
      where: { status: 'closed' },
    });

    let winCount = 0;
    let lossCount = 0;
    let totalProfit = 0;

    closedSignals.forEach((signal) => {
      if (signal.metadata) {
        const meta = JSON.parse(signal.metadata);
        const profit =
          signal.signalType === 'BUY'
            ? meta.exitPrice - signal.entryPrice
            : signal.entryPrice - meta.exitPrice;
        totalProfit += profit;
        if (profit > 0) {
          winCount++;
        } else if (profit < 0) {
          lossCount++;
        }
      }
    });

    const winRate =
      closedSignals.length > 0 ? (winCount / closedSignals.length) * 100 : 0;
    const avgProfit =
      closedSignals.length > 0 ? totalProfit / closedSignals.length : 0;

    return NextResponse.json(
      {
        signals: signals.map((signal) => ({
          ...signal,
          metadata: signal.metadata ? JSON.parse(signal.metadata) : null,
        })),
        total,
        metrics: {
          winRate: Math.round(winRate * 100) / 100,
          avgProfit: Math.round(avgProfit * 10000) / 10000,
          totalSignals: signals.length,
          closedSignals: closedSignals.length,
          activeSignals: await prisma.signal.count({ where: { status: 'active' } }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
