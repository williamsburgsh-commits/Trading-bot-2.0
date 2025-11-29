import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Validate database connection
    if (!prisma) {
      return Response.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const asset = searchParams.get('asset');
    const assetType = searchParams.get('assetType');
    const signalType = searchParams.get('signalType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause for filtering
    const where: any = {};
    if (status) where.status = status;
    if (asset) where.asset = asset;
    if (signalType) where.signalType = signalType;

    // Fetch signals with pagination
    const signals = await prisma.signal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Parse metadata and filter by assetType if specified
    const parsedSignals = signals
      .map((signal) => {
        try {
          const metadata = signal.metadata ? JSON.parse(signal.metadata) : null;
          return {
            ...signal,
            metadata,
          };
        } catch (e) {
          return {
            ...signal,
            metadata: null,
          };
        }
      })
      .filter((signal) => {
        if (assetType && signal.metadata?.assetType !== assetType) {
          return false;
        }
        return true;
      });

    // Calculate total count
    const total = await prisma.signal.count({ where });

    // Calculate metrics
    const allSignals = await prisma.signal.findMany();
    const parsedAllSignals = allSignals.map((signal) => {
      try {
        const metadata = signal.metadata ? JSON.parse(signal.metadata) : null;
        return { ...signal, metadata };
      } catch (e) {
        return { ...signal, metadata: null };
      }
    });

    const activeSignals = parsedAllSignals.filter(
      (s) => s.status === 'active'
    ).length;
    const closedSignals = parsedAllSignals.filter(
      (s) => s.status === 'closed'
    ).length;
    const totalSignals = parsedAllSignals.length;

    // Calculate win rate and average profit for closed signals
    const closedSignalsWithProfit = parsedAllSignals
      .filter((s) => s.status === 'closed' && s.metadata?.exitPrice)
      .map((s) => {
        const isBuy = s.signalType === 'BUY';
        const exitPrice = s.metadata?.exitPrice || 0;
        const entryPrice = s.entryPrice;
        const profit = isBuy
          ? ((exitPrice - entryPrice) / entryPrice) * 100
          : ((entryPrice - exitPrice) / entryPrice) * 100;
        return {
          ...s,
          profit,
          isWin: profit > 0,
        };
      });

    const winCount = closedSignalsWithProfit.filter((s) => s.isWin).length;
    const winRate =
      closedSignalsWithProfit.length > 0
        ? (winCount / closedSignalsWithProfit.length) * 100
        : 0;
    const avgProfit =
      closedSignalsWithProfit.length > 0
        ? closedSignalsWithProfit.reduce((sum, s) => sum + s.profit, 0) /
          closedSignalsWithProfit.length
        : 0;

    return Response.json({
      signals: parsedSignals,
      total,
      metrics: {
        winRate: Number(winRate.toFixed(2)),
        avgProfit: Number(avgProfit.toFixed(2)),
        totalSignals,
        closedSignals,
        activeSignals,
      },
    });
  } catch (error) {
    console.error('Failed to fetch signals:', error);
    return Response.json(
      { error: 'Failed to fetch signals', details: String(error) },
      { status: 500 }
    );
  }
}
