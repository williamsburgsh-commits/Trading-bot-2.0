import { BinanceDataClient } from '../modules/binance-data-client';

async function main() {
  console.log('=== Binance Data Client Example ===\n');

  const client = new BinanceDataClient({
    baseUrl: 'https://api.binance.com',
    wsBaseUrl: 'wss://stream.binance.com:9443',
    cacheTTL: 60000,
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    rateLimit: {
      maxRequests: 20,
      perMinutes: 1,
    },
  });

  console.log('1. Fetching recent klines for BTCUSDT (1h)...');
  try {
    const recentKlines = await client.getKlines('BTCUSDT', '1h', 10);
    console.log(`✓ Fetched ${recentKlines.length} klines`);
    console.log('Latest close price:', recentKlines[recentKlines.length - 1]?.close);
    console.log();
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.log();
  }

  console.log('2. Fetching historical data with time range...');
  try {
    const startTime = Date.now() - 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    const historical = await client.getHistoricalKlines(
      'ETHUSDT',
      '15m',
      startTime,
      endTime,
      50
    );
    console.log(`✓ Fetched ${historical.length} historical klines for ETHUSDT`);
    console.log();
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.log();
  }

  console.log('3. Bulk historical download for multiple days...');
  try {
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    const bulkData = await client.bulkHistoricalDownload(
      'XRPUSDT',
      '1h',
      startTime,
      endTime
    );
    console.log(`✓ Downloaded ${bulkData.length} klines for XRPUSDT (7 days)`);
    console.log();
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.log();
  }

  console.log('4. Testing cache...');
  try {
    const cache = client.getCache();
    console.log(`Cache size before: ${cache.size()}`);
    
    await client.getKlines('SOLUSDT', '5m', 20);
    console.log(`Cache size after fetch: ${cache.size()}`);
    
    await client.getKlines('SOLUSDT', '5m', 20);
    console.log(`Cache size after cached fetch: ${cache.size()}`);
    
    client.clearCache();
    console.log(`Cache size after clear: ${cache.size()}`);
    console.log();
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.log();
  }

  console.log('5. Setting up WebSocket real-time updates...');
  
  client.onKlineUpdate((event) => {
    console.log(
      `📊 ${event.symbol} ${event.timeframe} - Close: ${event.kline.close} ${
        event.isFinal ? '(Final)' : '(Updating)'
      }`
    );
  });

  client.onConnectionStatus((event) => {
    console.log(`🔌 Connection ${event.status}: ${event.message}`);
  });

  client.onError((error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  client.subscribeMultiple(
    ['BTCUSDT', 'ETHUSDT'],
    ['1h', '4h']
  );

  console.log('Subscribed to real-time updates for BTCUSDT and ETHUSDT (1h, 4h)');
  console.log('Listening for 30 seconds...\n');

  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log('\n6. Getting latest klines from WebSocket cache...');
  const btcKline = client.getLatestKline('BTCUSDT', '1h');
  const ethKline = client.getLatestKline('ETHUSDT', '4h');
  
  if (btcKline) {
    console.log(`BTCUSDT 1h latest close: ${btcKline.close}`);
  }
  
  if (ethKline) {
    console.log(`ETHUSDT 4h latest close: ${ethKline.close}`);
  }

  const allKlines = client.getAllLatestKlines();
  console.log(`Total streams cached: ${allKlines.size}`);
  console.log();

  console.log('7. Checking connection status...');
  console.log(`BTCUSDT 1h connected: ${client.isConnected('BTCUSDT', '1h')}`);
  console.log(`ETHUSDT 4h connected: ${client.isConnected('ETHUSDT', '4h')}`);
  console.log();

  console.log('Cleaning up...');
  client.close();
  console.log('✓ All connections closed');
  console.log('\n=== Example Complete ===');
}

main().catch(console.error);
