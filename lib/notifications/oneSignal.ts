import axios, { AxiosInstance } from 'axios';

export interface SignalNotification {
  asset: string;
  signalType: 'BUY' | 'SELL';
  entryPrice: number;
  takeProfit: number | number[];
  stopLoss: number;
  timeframe: string;
  metadata?: Record<string, unknown>;
}

export interface OneSignalConfig {
  appId: string;
  restApiKey: string;
  enabled?: boolean;
}

export class OneSignalNotificationService {
  private client: AxiosInstance;
  private appId: string;
  private enabled: boolean;

  constructor(config: OneSignalConfig) {
    this.appId = config.appId;
    this.enabled = config.enabled ?? true;

    this.client = axios.create({
      baseURL: 'https://onesignal.com/api/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${config.restApiKey}`,
      },
      timeout: 10000,
    });
  }

  async sendSignalAlert(signal: SignalNotification, userId?: string): Promise<boolean> {
    if (!this.enabled) {
      console.log('OneSignal notifications disabled, skipping alert');
      return false;
    }

    try {
      const takeProfitText = Array.isArray(signal.takeProfit)
        ? signal.takeProfit.map((tp, i) => `TP${i + 1}: ${tp}`).join(', ')
        : `TP: ${signal.takeProfit}`;

      const notification = {
        app_id: this.appId,
        headings: {
          en: `🔔 ${signal.signalType} Signal: ${signal.asset}`,
        },
        contents: {
          en: `${signal.signalType} ${signal.asset} @ ${signal.entryPrice}\n${takeProfitText}\nSL: ${signal.stopLoss}\nTimeframe: ${signal.timeframe}`,
        },
        data: {
          type: 'trading_signal',
          asset: signal.asset,
          signalType: signal.signalType,
          entryPrice: signal.entryPrice,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss,
          timeframe: signal.timeframe,
          metadata: signal.metadata,
        },
        ...(userId
          ? { include_external_user_ids: [userId] }
          : { included_segments: ['Subscribed Users'] }),
      };

      const response = await this.client.post('/notifications', notification);

      if (response.status === 200 && response.data.id) {
        console.log(`OneSignal notification sent: ${response.data.id} for ${signal.asset}`);
        return true;
      }

      console.warn('OneSignal notification failed:', response.data);
      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('OneSignal API error:', error.response?.data || error.message);
      } else {
        console.error('OneSignal notification error:', error);
      }
      return false;
    }
  }

  async sendToSegment(
    segment: string,
    heading: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.enabled) {
      console.log('OneSignal notifications disabled, skipping segment notification');
      return false;
    }

    try {
      const notification = {
        app_id: this.appId,
        headings: { en: heading },
        contents: { en: message },
        included_segments: [segment],
        data: data || {},
      };

      const response = await this.client.post('/notifications', notification);

      if (response.status === 200 && response.data.id) {
        console.log(`OneSignal segment notification sent: ${response.data.id}`);
        return true;
      }

      console.warn('OneSignal segment notification failed:', response.data);
      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('OneSignal segment API error:', error.response?.data || error.message);
      } else {
        console.error('OneSignal segment notification error:', error);
      }
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export function createOneSignalService(): OneSignalNotificationService | null {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    console.warn(
      'OneSignal configuration missing (ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY). Notifications disabled.'
    );
    return null;
  }

  return new OneSignalNotificationService({
    appId,
    restApiKey,
    enabled: process.env.ONESIGNAL_ENABLED !== 'false',
  });
}
