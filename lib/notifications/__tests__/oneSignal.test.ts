import axios from 'axios';
import {
  OneSignalNotificationService,
  createOneSignalService,
  SignalNotification,
} from '../oneSignal';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OneSignalNotificationService', () => {
  let service: OneSignalNotificationService;
  const mockAppId = 'test-app-id';
  const mockRestApiKey = 'test-rest-api-key';

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      defaults: {} as any,
      interceptors: {} as any,
      getUri: jest.fn(),
      request: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      postForm: jest.fn(),
      putForm: jest.fn(),
      patchForm: jest.fn(),
    } as any);

    service = new OneSignalNotificationService({
      appId: mockAppId,
      restApiKey: mockRestApiKey,
      enabled: true,
    });
  });

  describe('sendSignalAlert', () => {
    const mockSignal: SignalNotification = {
      asset: 'BTCUSDT',
      signalType: 'BUY',
      entryPrice: 50000,
      takeProfit: 52000,
      stopLoss: 48000,
      timeframe: '1h',
      metadata: { rsi: 35, confidence: 0.85 },
    };

    it('should send notification successfully', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockResolvedValue({
        status: 200,
        data: { id: 'notification-id-123' },
      });

      const result = await service.sendSignalAlert(mockSignal);

      expect(result).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({
          app_id: mockAppId,
          headings: { en: '🔔 BUY Signal: BTCUSDT' },
          contents: expect.objectContaining({
            en: expect.stringContaining('BUY BTCUSDT @ 50000'),
          }),
          data: expect.objectContaining({
            type: 'trading_signal',
            asset: 'BTCUSDT',
            signalType: 'BUY',
          }),
          included_segments: ['Subscribed Users'],
        })
      );
    });

    it('should handle array takeProfit values', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockResolvedValue({
        status: 200,
        data: { id: 'notification-id-456' },
      });

      const signalWithMultipleTP: SignalNotification = {
        ...mockSignal,
        takeProfit: [51000, 52000, 53000],
      };

      const result = await service.sendSignalAlert(signalWithMultipleTP);

      expect(result).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({
          contents: expect.objectContaining({
            en: expect.stringContaining('TP1: 51000, TP2: 52000, TP3: 53000'),
          }),
        })
      );
    });

    it('should target specific user when userId provided', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockResolvedValue({
        status: 200,
        data: { id: 'notification-id-789' },
      });

      const userId = 'user-123';
      const result = await service.sendSignalAlert(mockSignal, userId);

      expect(result).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({
          include_external_user_ids: [userId],
        })
      );
    });

    it('should return false when service is disabled', async () => {
      const disabledService = new OneSignalNotificationService({
        appId: mockAppId,
        restApiKey: mockRestApiKey,
        enabled: false,
      });

      const result = await disabledService.sendSignalAlert(mockSignal);

      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockRejectedValue(new Error('Network error'));

      const result = await service.sendSignalAlert(mockSignal);

      expect(result).toBe(false);
    });

    it('should handle unsuccessful responses', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockResolvedValue({
        status: 400,
        data: { errors: ['Invalid request'] },
      });

      const result = await service.sendSignalAlert(mockSignal);

      expect(result).toBe(false);
    });

    it('should handle axios errors with response data', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      const axiosError = new Error('Request failed') as any;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 401,
        data: { error: 'Unauthorized' },
      };
      mockClient.post.mockRejectedValue(axiosError);

      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

      const result = await service.sendSignalAlert(mockSignal);

      expect(result).toBe(false);
    });
  });

  describe('sendToSegment', () => {
    it('should send segment notification successfully', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockResolvedValue({
        status: 200,
        data: { id: 'segment-notification-123' },
      });

      const result = await service.sendToSegment(
        'Premium Users',
        'Market Update',
        'Important market movement detected',
        { alertType: 'volatility' }
      );

      expect(result).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({
          app_id: mockAppId,
          headings: { en: 'Market Update' },
          contents: { en: 'Important market movement detected' },
          included_segments: ['Premium Users'],
          data: { alertType: 'volatility' },
        })
      );
    });

    it('should return false when disabled', async () => {
      const disabledService = new OneSignalNotificationService({
        appId: mockAppId,
        restApiKey: mockRestApiKey,
        enabled: false,
      });

      const result = await disabledService.sendToSegment('All Users', 'Test', 'Test message');

      expect(result).toBe(false);
    });

    it('should handle errors in segment notifications', async () => {
      const mockClient = (mockedAxios.create as jest.Mock).mock.results[0].value;
      mockClient.post.mockRejectedValue(new Error('API Error'));

      const result = await service.sendToSegment('Test', 'Test', 'Test');

      expect(result).toBe(false);
    });
  });

  describe('isEnabled and setEnabled', () => {
    it('should return enabled status', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should update enabled status', () => {
      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });
  });
});

describe('createOneSignalService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create service with valid configuration', () => {
    process.env.ONESIGNAL_APP_ID = 'test-app-id';
    process.env.ONESIGNAL_REST_API_KEY = 'test-api-key';

    const service = createOneSignalService();

    expect(service).not.toBeNull();
    expect(service?.isEnabled()).toBe(true);
  });

  it('should return null when app ID is missing', () => {
    delete process.env.ONESIGNAL_APP_ID;
    process.env.ONESIGNAL_REST_API_KEY = 'test-api-key';

    const service = createOneSignalService();

    expect(service).toBeNull();
  });

  it('should return null when REST API key is missing', () => {
    process.env.ONESIGNAL_APP_ID = 'test-app-id';
    delete process.env.ONESIGNAL_REST_API_KEY;

    const service = createOneSignalService();

    expect(service).toBeNull();
  });

  it('should respect ONESIGNAL_ENABLED environment variable', () => {
    process.env.ONESIGNAL_APP_ID = 'test-app-id';
    process.env.ONESIGNAL_REST_API_KEY = 'test-api-key';
    process.env.ONESIGNAL_ENABLED = 'false';

    const service = createOneSignalService();

    expect(service).not.toBeNull();
    expect(service?.isEnabled()).toBe(false);
  });
});
