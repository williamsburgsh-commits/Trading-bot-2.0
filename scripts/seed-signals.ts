import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample signals...');

  const sampleSignals = [
    // Crypto signals
    {
      asset: 'BTCUSDT',
      timeframe: '15m',
      entryPrice: 42500,
      takeProfit: 43500,
      stopLoss: 42000,
      status: 'active',
      signalType: 'BUY',
      metadata: JSON.stringify({
        assetType: 'crypto',
        rsi: 45,
        macd: { macd: 0.5, signal: 0.3, histogram: 0.2 },
        volumeRatio: 1.8,
        volatility: 2.5,
      }),
    },
    {
      asset: 'ETHUSDT',
      timeframe: '1h',
      entryPrice: 2250,
      takeProfit: 2350,
      stopLoss: 2200,
      status: 'active',
      signalType: 'BUY',
      metadata: JSON.stringify({
        assetType: 'crypto',
        rsi: 38,
        macd: { macd: 1.2, signal: 0.8, histogram: 0.4 },
        volumeRatio: 2.1,
        volatility: 3.2,
      }),
    },
    {
      asset: 'XRPUSDT',
      timeframe: '4h',
      entryPrice: 0.62,
      takeProfit: 0.58,
      stopLoss: 0.64,
      status: 'filled',
      signalType: 'SELL',
      metadata: JSON.stringify({
        assetType: 'crypto',
        rsi: 68,
        macd: { macd: -0.3, signal: -0.1, histogram: -0.2 },
        volumeRatio: 1.6,
        volatility: 4.1,
      }),
    },
    {
      asset: 'SOLUSDT',
      timeframe: '1h',
      entryPrice: 98.5,
      takeProfit: 102.0,
      stopLoss: 96.0,
      status: 'active',
      signalType: 'BUY',
      metadata: JSON.stringify({
        assetType: 'crypto',
        rsi: 42,
        macd: { macd: 0.8, signal: 0.5, histogram: 0.3 },
        volumeRatio: 1.9,
        volatility: 5.2,
      }),
    },
    // Forex signals
    {
      asset: 'EUR/USD',
      timeframe: '15m',
      entryPrice: 1.0875,
      takeProfit: 1.0925,
      stopLoss: 1.0850,
      status: 'active',
      signalType: 'BUY',
      metadata: JSON.stringify({
        assetType: 'forex',
        rsi: 44,
        macd: { macd: 0.0002, signal: 0.0001, histogram: 0.0001 },
        volumeRatio: 1.5,
        volatility: 0.8,
      }),
    },
    {
      asset: 'GBP/USD',
      timeframe: '1h',
      entryPrice: 1.2650,
      takeProfit: 1.2600,
      stopLoss: 1.2680,
      status: 'closed',
      signalType: 'SELL',
      metadata: JSON.stringify({
        assetType: 'forex',
        rsi: 72,
        macd: { macd: -0.0003, signal: -0.0001, histogram: -0.0002 },
        volumeRatio: 1.7,
        volatility: 1.1,
        exitPrice: 1.2620,
      }),
    },
    {
      asset: 'USD/JPY',
      timeframe: '4h',
      entryPrice: 149.50,
      takeProfit: 151.00,
      stopLoss: 148.50,
      status: 'closed',
      signalType: 'BUY',
      metadata: JSON.stringify({
        assetType: 'forex',
        rsi: 35,
        macd: { macd: 0.05, signal: 0.03, histogram: 0.02 },
        volumeRatio: 1.4,
        volatility: 1.3,
        exitPrice: 150.80,
      }),
    },
  ];

  for (const signal of sampleSignals) {
    await prisma.signal.create({
      data: signal,
    });
  }

  console.log(`✅ Seeded ${sampleSignals.length} sample signals`);
  
  const count = await prisma.signal.count();
  console.log(`📊 Total signals in database: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
