import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { UnifiedMarketDataService } from './services/unifiedMarketData';
import { UnifiedSignalEngine } from './services/unifiedSignalEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Unified Signal Generation Test ===\n');

  const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!alphaVantageApiKey) {
    console.warn('⚠️  ALPHA_VANTAGE_API_KEY not set. Forex signals will be skipped.');
    console.warn('   To include forex signals, set ALPHA_VANTAGE_API_KEY in your .env file.\n');
  }

  const marketDataService = new UnifiedMarketDataService({
    binance: {
      rateLimit: { maxRequests: 1200, perMinutes: 1 },
    },
    alphaVantage: alphaVantageApiKey ? {
      apiKey: alphaVantageApiKey,
      rateLimit: { maxRequests: 5, perMinutes: 1 },
    } : undefined,
  });

  const signalEngine = new UnifiedSignalEngine(marketDataService, {
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    volumeThreshold: 1.5,
  });

  console.log('Configured Assets:');
  console.log('  Crypto:', marketDataService.getCryptoSymbols().join(', '));
  if (marketDataService.isAlphaVantageEnabled()) {
    console.log('  Forex:', marketDataService.getForexSymbols().join(', '));
  }
  console.log('');

  const timeframes: ('5m' | '15m' | '1h' | '4h')[] = ['15m', '1h', '4h'];
  
  console.log(`Generating signals for timeframes: ${timeframes.join(', ')}\n`);

  const allSignals = await signalEngine.generateAllSignals(timeframes);

  console.log(`\n✅ Generated ${allSignals.length} signal(s)\n`);

  if (allSignals.length > 0) {
    console.log('Storing signals in database...');
    
    for (const signal of allSignals) {
      await prisma.signal.create({
        data: {
          asset: signal.asset,
          timeframe: signal.timeframe,
          entryPrice: signal.entryPrice,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss,
          status: signal.status,
          signalType: signal.signalType,
          metadata: signal.metadata,
        },
      });
      
      const metadata = signal.metadata ? JSON.parse(signal.metadata) : {};
      console.log(`  [${metadata.assetType?.toUpperCase() || 'CRYPTO'}] ${signal.signalType} ${signal.asset} @ ${signal.entryPrice.toFixed(5)}`);
      console.log(`    TP: ${signal.takeProfit.toFixed(5)} | SL: ${signal.stopLoss.toFixed(5)}`);
      console.log(`    RSI: ${metadata.rsi?.toFixed(2)} | Volume Ratio: ${metadata.volumeRatio?.toFixed(2)}\n`);
    }
    
    console.log('✅ All signals stored successfully');
  } else {
    console.log('ℹ️  No signals generated. Market conditions may not meet criteria.');
  }

  const allStoredSignals = await prisma.signal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`\n📊 Recent signals in database (last 20):`);
  const cryptoCount = allStoredSignals.filter(s => {
    const meta = s.metadata ? JSON.parse(s.metadata) : {};
    return !meta.assetType || meta.assetType === 'crypto';
  }).length;
  const forexCount = allStoredSignals.filter(s => {
    const meta = s.metadata ? JSON.parse(s.metadata) : {};
    return meta.assetType === 'forex';
  }).length;
  
  console.log(`  Total: ${allStoredSignals.length} | Crypto: ${cryptoCount} | Forex: ${forexCount}\n`);

  marketDataService.close();
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
