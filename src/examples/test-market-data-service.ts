import 'dotenv/config';
import { MarketDataService } from '../services/market-data-service';
import { config } from '../config';
import { ALL_SYMBOLS, ASSET_METADATA } from '../config/assets';
import { logger } from '../utils/logger';

async function testMarketDataService() {
  logger.info('=== Market Data Service Test ===\n');

  const service = new MarketDataService({
    binance: config.binance,
    twelvedata: {
      apiKey: config.twelvedata.apiKey,
      baseUrl: config.twelvedata.baseUrl,
      cacheTTL: config.twelvedata.cacheTTL,
      rateLimit: config.twelvedata.rateLimit,
    },
    enableMockFallback: config.marketData.enableMockFallback,
  });

  logger.info('Configuration:', {
    twelveDataEnabled: service.isTwelveDataEnabled(),
    mockFallbackEnabled: config.marketData.enableMockFallback,
    totalSymbols: service.getAllSymbols().length,
  });

  // Test crypto data (Binance)
  logger.info('\n--- Testing Crypto Data (Binance) ---');
  try {
    const cryptoSymbols = service.getSymbolsByType('crypto');
    logger.info(`Found ${cryptoSymbols.length} crypto symbols:`, cryptoSymbols);

    const btcData = await service.getKlines('BTCUSDT', '1h', 10);
    logger.info(`BTCUSDT 1h candles:`, {
      count: btcData.length,
      latest: btcData[btcData.length - 1]
        ? {
            time: new Date(btcData[btcData.length - 1].openTime).toISOString(),
            close: btcData[btcData.length - 1].close,
          }
        : null,
    });
  } catch (error) {
    logger.error('Crypto test failed:', error);
  }

  // Test forex data (Twelve Data)
  if (service.isTwelveDataEnabled()) {
    logger.info('\n--- Testing Forex Data (Twelve Data) ---');
    try {
      const forexSymbols = service.getSymbolsByType('forex');
      logger.info(`Found ${forexSymbols.length} forex symbols:`, forexSymbols);

      const eurData = await service.getKlines('EUR/USD', '1h', 10);
      logger.info(`EUR/USD 1h candles:`, {
        count: eurData.length,
        latest: eurData[eurData.length - 1]
          ? {
              time: new Date(eurData[eurData.length - 1].openTime).toISOString(),
              close: eurData[eurData.length - 1].close,
            }
          : null,
      });
    } catch (error) {
      logger.error('Forex test failed:', error);
    }

    // Test commodity data (Twelve Data)
    logger.info('\n--- Testing Commodity Data (Twelve Data) ---');
    try {
      const commoditySymbols = service.getSymbolsByType('commodity');
      logger.info(`Found ${commoditySymbols.length} commodity symbols:`, commoditySymbols);

      const goldData = await service.getKlines('XAU/USD', '1d', 10);
      logger.info(`XAU/USD 1d candles:`, {
        count: goldData.length,
        latest: goldData[goldData.length - 1]
          ? {
              time: new Date(goldData[goldData.length - 1].openTime).toISOString(),
              close: goldData[goldData.length - 1].close,
            }
          : null,
      });
    } catch (error) {
      logger.error('Commodity test failed:', error);
    }
  } else {
    logger.warn('\nTwelve Data not configured. Set TWELVEDATA_API_KEY to test forex/commodity data.');
  }

  // Test caching
  logger.info('\n--- Testing Cache Performance ---');
  const symbol = 'BTCUSDT';
  const timeframe = '15m';

  const start1 = Date.now();
  await service.getKlines(symbol, timeframe, 100);
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  await service.getKlines(symbol, timeframe, 100);
  const time2 = Date.now() - start2;

  logger.info(`First call (no cache): ${time1}ms`);
  logger.info(`Second call (cached): ${time2}ms`);
  logger.info(`Cache speedup: ${(time1 / time2).toFixed(2)}x`);

  // Test all asset metadata
  logger.info('\n--- Asset Metadata Summary ---');
  ALL_SYMBOLS.forEach((symbol) => {
    const metadata = ASSET_METADATA[symbol];
    logger.info(`${symbol}:`, {
      type: metadata.type,
      provider: metadata.provider,
      timeframes: metadata.supportedTimeframes.length,
    });
  });

  service.close();
  logger.info('\n=== Test Complete ===');
}

testMarketDataService().catch((error) => {
  logger.error('Test failed:', error);
  process.exit(1);
});
