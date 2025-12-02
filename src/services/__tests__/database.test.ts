import { DatabaseService } from '../database';
import { OneSignalNotificationService } from '../../../lib/notifications/oneSignal';
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
  let mockNotificationService: jest.Mocked<OneSignalNotificationService>;

  beforeEach(() => {
    mockPrisma = new PrismaClient();

    mockNotificationService = {
      sendSignalAlert: jest.fn().mockResolvedValue(true),
      sendToSegment: jest.fn().mockResolvedValue(true),
      isEnabled: jest.fn().mockReturnValue(true),
      setEnabled: jest.fn(),
    } as any;

    databaseService = new DatabaseService(mockNotificationService);
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

    it('should save signal and send notification', async () => {
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

      expect(mockNotificationService.sendSignalAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 'BTCUSDT',
          signalType: 'BUY',
          entryPrice: 50000,
          takeProfit: 52000,
          stopLoss: 48000,
          timeframe: '1h',
        })
      );

      expect(result).toEqual(mockSignal);
    });

    it('should not send notification when service is disabled', async () => {
      mockNotificationService.isEnabled.mockReturnValue(false);
      mockPrisma.signal.findFirst.mockResolvedValue(null);
      mockPrisma.signal.create.mockResolvedValue(mockSignal);

      await databaseService.saveSignal(mockSignal);

      expect(mockNotificationService.sendSignalAlert).not.toHaveBeenCalled();
    });

    it('should not send notification when service is null', async () => {
      const serviceWithoutNotifications = new DatabaseService(null);
      (serviceWithoutNotifications as any).prisma = mockPrisma;

      mockPrisma.signal.findFirst.mockResolvedValue(null);
      mockPrisma.signal.create.mockResolvedValue(mockSignal);

      await serviceWithoutNotifications.saveSignal(mockSignal);

      expect(mockNotificationService.sendSignalAlert).not.toHaveBeenCalled();
    });

    it('should not send notification for duplicate signals', async () => {
      mockPrisma.signal.findFirst.mockResolvedValue(mockSignal);

      const result = await databaseService.saveSignal(mockSignal);

      expect(mockPrisma.signal.create).not.toHaveBeenCalled();
      expect(mockNotificationService.sendSignalAlert).not.toHaveBeenCalled();
      expect(result).toEqual(mockSignal);
    });

    it('should handle notification errors gracefully', async () => {
      mockPrisma.signal.findFirst.mockResolvedValue(null);
      mockPrisma.signal.create.mockResolvedValue(mockSignal);
      mockNotificationService.sendSignalAlert.mockRejectedValue(new Error('Notification failed'));

      const result = await databaseService.saveSignal(mockSignal);

      expect(result).toEqual(mockSignal);
    });

    it('should parse metadata when sending notifications', async () => {
      const signalWithMetadata = {
        ...mockSignal,
        metadata: JSON.stringify({ rsi: 35, confidence: 0.85 }),
      };

      mockPrisma.signal.findFirst.mockResolvedValue(null);
      mockPrisma.signal.create.mockResolvedValue(signalWithMetadata);

      await databaseService.saveSignal(signalWithMetadata);

      expect(mockNotificationService.sendSignalAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { rsi: 35, confidence: 0.85 },
        })
      );
    });

    it('should handle null metadata', async () => {
      const signalWithoutMetadata = { ...mockSignal, metadata: undefined };

      mockPrisma.signal.findFirst.mockResolvedValue(null);
      mockPrisma.signal.create.mockResolvedValue(signalWithoutMetadata);

      await databaseService.saveSignal(signalWithoutMetadata);

      expect(mockNotificationService.sendSignalAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: undefined,
        })
      );
    });
  });

  describe('findDuplicateSignal', () => {
    it('should find duplicate signals within time and price threshold', async () => {
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

    it('should return null when no duplicate found', async () => {
      mockPrisma.signal.findFirst.mockResolvedValue(null);

      const result = await databaseService.findDuplicateSignal('BTCUSDT', '1h', 'BUY', 50000);

      expect(result).toBeNull();
    });
  });

  describe('getActiveSignals', () => {
    it('should retrieve all active signals', async () => {
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

    it('should filter active signals by asset', async () => {
      const mockSignals: Signal[] = [];
      mockPrisma.signal.findMany.mockResolvedValue(mockSignals);

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
    it('should update signal status', async () => {
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
