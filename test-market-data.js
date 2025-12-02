const { UnifiedMarketDataService } = require('./dist/services/unifiedMarketData');

async function testMarketData() {
  try {
    console.log('🔄 Testing market data service...');
    
    const marketDataService = new UnifiedMarketDataService();
    
    // Test fetching BTC/USDT data from Binance
    console.log('\n📊 Fetching BTC/USDT data from Binance...');
    const btcData = await marketDataService.getCryptoData('BTC/USDT', '1h', 100);
    console.log(`✅ Successfully fetched ${btcData.length} candles for BTC/USDT`);
    console.log('Latest candle:', btcData[btcData.length - 1]);
    
    // Test fetching EUR/USD data from Alpha Vantage
    console.log('\n📊 Fetching EUR/USD data from Alpha Vantage...');
    const eurUsdData = await marketDataService.getForexData('EUR/USD', '60min', 100);
    console.log(`✅ Successfully fetched ${eurUsdData.length} candles for EUR/USD`);
    console.log('Latest candle:', eurUsdData[eurUsdData.length - 1]);
    
    marketDataService.close();
    console.log('\n✅ Market data test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing market data:', error);
    process.exit(1);
  }
}

testMarketData();
