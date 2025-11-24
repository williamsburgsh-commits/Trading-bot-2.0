import 'dotenv/config';
import { DatabaseService } from './services/database';
import { AlertingService } from './services/alerting';
import { Signal } from './types';

async function createTestSignals() {
  const db = new DatabaseService();
  const alerting = new AlertingService();

  try {
    console.log('Connecting to database...');
    await db.connect();

    console.log('\nCreating test signals...\n');

    const testSignals: Signal[] = [
      {
        asset: 'BTCUSDT',
        timeframe: '15m',
        entryPrice: 45250.0,
        takeProfit: 46155.0,
        stopLoss: 44345.0,
        status: 'active',
        signalType: 'BUY',
        metadata: JSON.stringify({
          rsi: 28.5,
          macd: { macd: 0.0025, signal: 0.0018, histogram: 0.0007 },
          volumeRatio: 2.3,
          volatility: 450.25,
        }),
      },
      {
        asset: 'ETHUSDT',
        timeframe: '1h',
        entryPrice: 2485.5,
        takeProfit: 2535.21,
        stopLoss: 2435.79,
        status: 'active',
        signalType: 'BUY',
        metadata: JSON.stringify({
          rsi: 29.8,
          macd: { macd: 0.0032, signal: 0.0021, histogram: 0.0011 },
          volumeRatio: 1.85,
          volatility: 35.4,
        }),
      },
      {
        asset: 'BTCUSDT',
        timeframe: '1h',
        entryPrice: 46890.0,
        takeProfit: 45932.2,
        stopLoss: 47847.8,
        status: 'active',
        signalType: 'SELL',
        metadata: JSON.stringify({
          rsi: 73.2,
          macd: { macd: -0.0042, signal: -0.0028, histogram: -0.0014 },
          volumeRatio: 2.15,
          volatility: 520.8,
        }),
      },
    ];

    for (const signal of testSignals) {
      console.log(`Creating ${signal.signalType} signal for ${signal.asset}...`);
      const savedSignal = await db.saveSignal(signal);
      console.log(`Signal saved with ID: ${savedSignal.id}`);

      await alerting.sendAlert(savedSignal);
      console.log('Alert sent!\n');
    }

    console.log('Fetching all active signals from database...\n');
    const activeSignals = await db.getActiveSignals();
    console.log(`Total active signals: ${activeSignals.length}\n`);

    if (activeSignals.length > 0) {
      console.log('Active Signals Summary:');
      console.log('='.repeat(80));
      activeSignals.forEach((signal, index) => {
        console.log(`\n${index + 1}. ${signal.signalType} ${signal.asset} (${signal.timeframe})`);
        console.log(`   Entry: $${signal.entryPrice.toFixed(2)}`);
        console.log(`   TP: $${signal.takeProfit.toFixed(2)} | SL: $${signal.stopLoss.toFixed(2)}`);
        console.log(`   Status: ${signal.status}`);
        console.log(`   Created: ${signal.createdAt}`);
      });
      console.log('\n' + '='.repeat(80));
    }

    await db.disconnect();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    await db.disconnect();
    process.exit(1);
  }
}

createTestSignals();
