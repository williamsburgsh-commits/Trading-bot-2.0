import { DatabaseService } from '../database';
import { PrismaClient } from '@prisma/client';
import { Signal } from '../../types';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      signal: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    databaseService = new DatabaseService();
    (databaseService as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSignal', () => {
    const mockSignal: Signal = {
      id: 'test-id',
      asset: 'BTCUSDT',
      timeframe: '1h',
      entryPrice: 50000,
      takeProfit: 52000,
      stopLoss: 48000,
      status: 'active',
      signalType: 'BUY',
      metadata: JSON.stringify({ rsi: 35 }),
      createdAt: new Date(),
    };

    it('saves a new signal when no duplicate exists', async () => {
      mockPrisma.signal.findFirst.mockResolvedValue(null);
      mockPrisma.signal.create.mockResolvedValue(mockSignal);

      const result = await databaseService.saveSignal(mockSignal);

      expect(mockPrisma.signal.create).toHaveBeenCalledWith({
        data: {
          asset: mockSignal.asset,
          timeframe: mockSignal.timeframe,
          entryPrice: mockSignal.entryPrice,
          takeProfit: mockSignal.takeProfit,
          stopLoss: mockSignal.stopLoss,
          status: mockSignal.status,
          signalType: mockSignal.signalType,
          metadata: mockSignal.metadata,
        },
      });

      expect(result).toEqual(mockSignal);
    });

    it('returns existing signal when duplicate found', async () => {
      mockPrisma.signal.findFirst.mockResolvedValue(mockSignal);

      const result = await databaseService.saveSignal(mockSignal);

      expect(mockPrisma.signal.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockSignal);
    });
  });

  describe('findDuplicateSignal', () => {
    it('finds duplicates within time and price thresholds', async () => {
      const mockDuplicate: Signal = {
        id: 'duplicate-id',
        asset: 'BTCUSDT',
        timeframe: '1h',
        entryPrice: 50100,
        takeProfit: 52000,
        stopLoss: 48000,
        status: 'active',
        signalType: 'BUY',
        metadata: undefined,
        createdAt: new Date(),
      };

      mockPrisma.signal.findFirst.mockResolvedValue(mockDuplicate);

      const result = await databaseService.findDuplicateSignal('BTCUSDT', '1h', 'BUY', 50000);

      expect(result).toEqual(mockDuplicate);
      expect(mockPrisma.signal.findFirst).toHaveBeenCalledWith({
        where: {
          asset: 'BTCUSDT',
          timeframe: '1h',
          signalType: 'BUY',
          entryPrice: {
            gte: expect.any(Number),
            lte: expect.any(Number),
          },
          createdAt: {
            gte: expect.any(Date),
          },
          status: 'active',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('returns null when no duplicate exists', async () => {
      mockPrisma.signal.findFirst.mockResolvedValue(null);

      const result = await databaseService.findDuplicateSignal('BTCUSDT', '1h', 'BUY', 50000);

      expect(result).toBeNull();
    });
  });

  describe('getActiveSignals', () => {
    it('retrieves all active signals', async () => {
      const mockSignals: Signal[] = [
        {
          id: '1',
          asset: 'BTCUSDT',
          timeframe: '1h',
          entryPrice: 50000,
          takeProfit: 52000,
          stopLoss: 48000,
          status: 'active',
          signalType: 'BUY',
          metadata: undefined,
          createdAt: new Date(),
        },
      ];

      mockPrisma.signal.findMany.mockResolvedValue(mockSignals);

      const result = await databaseService.getActiveSignals();

      expect(result).toEqual(mockSignals);
      expect(mockPrisma.signal.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('filters active signals by asset when provided', async () => {
      mockPrisma.signal.findMany.mockResolvedValue([]);

      await databaseService.getActiveSignals('ETHUSDT');

      expect(mockPrisma.signal.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          asset: 'ETHUSDT',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('updateSignalStatus', () => {
    it('updates the status of a signal', async () => {
      const updatedSignal: Signal = {
        id: 'test-id',
        asset: 'BTCUSDT',
        timeframe: '1h',
        entryPrice: 50000,
        takeProfit: 52000,
        stopLoss: 48000,
        status: 'closed',
        signalType: 'BUY',
        metadata: undefined,
        createdAt: new Date(),
      };

      mockPrisma.signal.update.mockResolvedValue(updatedSignal);

      const result = await databaseService.updateSignalStatus('test-id', 'closed');

      expect(result).toEqual(updatedSignal);
      expect(mockPrisma.signal.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { status: 'closed' },
      });
    });
  });
});
