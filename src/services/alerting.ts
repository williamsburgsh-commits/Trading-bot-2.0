import axios from 'axios';
import { config } from '../config';
import { Signal } from '../types';

export class AlertingService {
  async sendAlert(signal: Signal): Promise<void> {
    if (!config.alerts.enabled) {
      return;
    }

    const tasks: Promise<void>[] = [];

    if (config.alerts.console) {
      tasks.push(this.sendConsoleAlert(signal));
    }

    if (config.alerts.webhook?.enabled && config.alerts.webhook.url) {
      tasks.push(this.sendWebhookAlert(signal));
    }

    if (config.alerts.email?.enabled) {
      tasks.push(this.sendEmailAlert(signal));
    }

    await Promise.allSettled(tasks);
  }

  private async sendConsoleAlert(signal: Signal): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 NEW TRADING SIGNAL ALERT 🚨');
    console.log('='.repeat(60));
    console.log(`Signal Type: ${signal.signalType}`);
    console.log(`Asset: ${signal.asset}`);
    console.log(`Timeframe: ${signal.timeframe}`);
    console.log(`Entry Price: ${signal.entryPrice}`);
    console.log(`Take Profit: ${signal.takeProfit}`);
    console.log(`Stop Loss: ${signal.stopLoss}`);
    console.log(`Status: ${signal.status}`);

    if (signal.metadata) {
      try {
        const metadata = JSON.parse(signal.metadata);
        console.log('\nIndicators:');
        console.log(`  RSI: ${metadata.rsi?.toFixed(2) || 'N/A'}`);
        console.log(`  MACD: ${metadata.macd?.macd?.toFixed(4) || 'N/A'}`);
        console.log(`  Volume Ratio: ${metadata.volumeRatio?.toFixed(2) || 'N/A'}`);
        console.log(`  Volatility: ${metadata.volatility?.toFixed(2) || 'N/A'}`);
      } catch (e) {
        console.log(`Metadata: ${signal.metadata}`);
      }
    }

    console.log(`Created At: ${signal.createdAt || new Date()}`);
    console.log('='.repeat(60) + '\n');
  }

  private async sendWebhookAlert(signal: Signal): Promise<void> {
    try {
      const webhookUrl = config.alerts.webhook?.url;
      if (!webhookUrl) return;

      const payload = {
        type: 'TRADING_SIGNAL',
        signal: {
          type: signal.signalType,
          asset: signal.asset,
          timeframe: signal.timeframe,
          entryPrice: signal.entryPrice,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss,
          status: signal.status,
          metadata: signal.metadata ? JSON.parse(signal.metadata) : {},
          createdAt: signal.createdAt || new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      console.log(`Webhook alert sent for ${signal.asset}`);
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  private async sendEmailAlert(signal: Signal): Promise<void> {
    console.log(`Email alert would be sent for ${signal.asset} (email service not implemented)`);
  }

  async sendBatchAlert(signals: Signal[]): Promise<void> {
    if (!config.alerts.enabled || signals.length === 0) {
      return;
    }

    console.log(`\n📊 Batch Alert: ${signals.length} new signal(s) generated\n`);

    for (const signal of signals) {
      await this.sendAlert(signal);
    }
  }

  async sendErrorAlert(error: Error, context: string): Promise<void> {
    console.error(`\n❌ ERROR in ${context}:`);
    console.error(error.message);
    console.error(error.stack);
  }
}
