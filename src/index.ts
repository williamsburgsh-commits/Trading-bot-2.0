import 'dotenv/config';
import { DatabaseService } from './services/database';
import { SignalEngine } from './services/signalEngine';
import { AlertingService } from './services/alerting';
import { createOneSignalService } from '../lib/notifications/oneSignal';
import { config } from './config';

async function main() {
  const notificationService = createOneSignalService();
  const db = new DatabaseService(notificationService);
  const signalEngine = new SignalEngine();
  const alerting = new AlertingService();

  try {
    console.log('Connecting to database...');
    await db.connect();

    console.log('\nRunning one-time signal scan...\n');

    for (const asset of config.monitor.assets) {
      for (const timeframe of config.monitor.timeframes) {
        console.log(`Analyzing ${asset} on ${timeframe}...`);

        const signals = await signalEngine.generateSignals(asset, timeframe);

        for (const signal of signals) {
          const savedSignal = await db.saveSignal(signal);
          console.log(`Signal saved: ${savedSignal.id}`);
          await alerting.sendAlert(savedSignal);
        }
      }
    }

    console.log('\nFetching active signals...');
    const activeSignals = await db.getActiveSignals();
    console.log(`Total active signals: ${activeSignals.length}`);

    if (activeSignals.length > 0) {
      console.log('\nActive Signals:');
      activeSignals.forEach((signal) => {
        console.log(`  ${signal.signalType} ${signal.asset} @ ${signal.entryPrice}`);
      });
    }

    await db.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    await db.disconnect();
    process.exit(1);
  }
}

main();
