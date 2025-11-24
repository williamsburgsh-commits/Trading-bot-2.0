import 'dotenv/config';
import { MonitorService } from './services/monitor';

const monitor = new MonitorService();

async function main() {
  try {
    await monitor.initialize();

    monitor.start();

    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await monitor.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await monitor.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    await monitor.shutdown();
    process.exit(1);
  }
}

main();
