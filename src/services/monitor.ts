import * as cron from 'node-cron';
import { DatabaseService } from './database';
import { SignalEngine } from './signalEngine';
import { AlertingService } from './alerting';
import { createOneSignalService } from '../../lib/notifications/oneSignal';
import { config } from '../config';
import { Signal } from '../types';

export class MonitorService {
  private db: DatabaseService;
  private signalEngine: SignalEngine;
  private alerting: AlertingService;
  private isRunning: boolean = false;
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    const notificationService = createOneSignalService();
    this.db = new DatabaseService(notificationService);
    this.signalEngine = new SignalEngine();
    this.alerting = new AlertingService();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Monitor Service...');
    await this.db.connect();
    console.log('Database connected');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Monitor Service...');

    if (this.task) {
      this.task.stop();
    }

    await this.db.disconnect();
    console.log('Monitor Service stopped');
  }

  async scan(): Promise<void> {
    if (this.isRunning) {
      console.log('Scan already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`\n${'*'.repeat(60)}`);
      console.log(`Starting market scan at ${new Date().toISOString()}`);
      console.log(`Assets: ${config.monitor.assets.join(', ')}`);
      console.log(`Timeframes: ${config.monitor.timeframes.join(', ')}`);
      console.log(`${'*'.repeat(60)}\n`);

      const allSignals: Signal[] = [];

      for (const asset of config.monitor.assets) {
        for (const timeframe of config.monitor.timeframes) {
          try {
            const signals = await this.signalEngine.generateSignals(asset, timeframe);

            for (const signal of signals) {
              const savedSignal = await this.db.saveSignal(signal);

              if (
                savedSignal.createdAt &&
                new Date(savedSignal.createdAt).getTime() > startTime - 1000
              ) {
                allSignals.push(savedSignal);
                await this.alerting.sendAlert(savedSignal);
              }
            }
          } catch (error) {
            const err = error as Error;
            console.error(`Error processing ${asset} ${timeframe}:`, err.message);
            await this.alerting.sendErrorAlert(err, `${asset} ${timeframe} scan`);
          }

          await this.sleep(500);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\nScan completed in ${duration}s`);
      console.log(`New signals found: ${allSignals.length}`);

      if (allSignals.length > 0) {
        console.log('\nNew signals summary:');
        allSignals.forEach((signal) => {
          console.log(`  - ${signal.signalType} ${signal.asset} @ ${signal.entryPrice}`);
        });
      }

      console.log(`${'*'.repeat(60)}\n`);
    } catch (error) {
      const err = error as Error;
      console.error('Critical error during scan:', err);
      await this.alerting.sendErrorAlert(err, 'Market scan');
    } finally {
      this.isRunning = false;
    }
  }

  start(): void {
    console.log(`\nStarting monitor with schedule: ${config.monitor.interval}`);
    console.log('Press Ctrl+C to stop\n');

    if (!cron.validate(config.monitor.interval)) {
      throw new Error(`Invalid cron expression: ${config.monitor.interval}`);
    }

    this.task = cron.schedule(config.monitor.interval, async () => {
      await this.scan();
    });

    console.log('Monitor started successfully');
    console.log('Running initial scan...\n');
    this.scan();
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Monitor stopped');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    activeSignals: number;
    config: any;
  }> {
    const activeSignals = await this.db.getActiveSignals();

    return {
      isRunning: this.isRunning,
      activeSignals: activeSignals.length,
      config: {
        interval: config.monitor.interval,
        assets: config.monitor.assets,
        timeframes: config.monitor.timeframes,
      },
    };
  }
}
