import { PrismaClient } from '@prisma/client';
import { Signal } from '../types';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async saveSignal(signal: Signal): Promise<Signal> {
    const existingSignal = await this.findDuplicateSignal(
      signal.asset,
      signal.timeframe,
      signal.signalType,
      signal.entryPrice
    );

    if (existingSignal) {
      console.log(
        `Duplicate signal detected for ${signal.asset} (${signal.signalType}). Skipping save.`
      );
      return existingSignal;
    }

    const savedSignal = await this.prisma.signal.create({
      data: {
        asset: signal.asset,
        timeframe: signal.timeframe,
        entryPrice: signal.entryPrice,
        takeProfit: signal.takeProfit,
        stopLoss: signal.stopLoss,
        status: signal.status || 'active',
        signalType: signal.signalType,
        metadata: signal.metadata || null,
      },
    });

    return savedSignal as Signal;
  }

  async findDuplicateSignal(
    asset: string,
    timeframe: string,
    signalType: string,
    entryPrice: number
  ): Promise<Signal | null> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const priceThreshold = 0.02;
    const minPrice = entryPrice * (1 - priceThreshold);
    const maxPrice = entryPrice * (1 + priceThreshold);

    const signal = await this.prisma.signal.findFirst({
      where: {
        asset,
        timeframe,
        signalType,
        entryPrice: {
          gte: minPrice,
          lte: maxPrice,
        },
        createdAt: {
          gte: fiveMinutesAgo,
        },
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return signal as Signal | null;
  }

  async getActiveSignals(asset?: string): Promise<Signal[]> {
    const signals = await this.prisma.signal.findMany({
      where: {
        status: 'active',
        ...(asset && { asset }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return signals as Signal[];
  }

  async updateSignalStatus(id: string, status: string): Promise<Signal> {
    const signal = await this.prisma.signal.update({
      where: { id },
      data: { status },
    });

    return signal as Signal;
  }

  async getSignalsByTimeRange(startDate: Date, endDate: Date): Promise<Signal[]> {
    const signals = await this.prisma.signal.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return signals as Signal[];
  }
}
