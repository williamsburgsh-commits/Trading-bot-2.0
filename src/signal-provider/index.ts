import 'dotenv/config';
import { loadConfig, ConfigurationError } from './config';
import { createLogger, Logger } from './utils/logger';
import { SignalProviderOrchestrator } from './orchestrator';

async function main() {
  let logger: Logger | undefined;

  try {
    const config = loadConfig();
    logger = createLogger(config.logging);

    logger.info('Starting Signal Provider Service', {
      timestamp: new Date().toISOString(),
    });

    const orchestrator = new SignalProviderOrchestrator({
      logger,
      config,
    });

    await orchestrator.start();

    process.on('SIGTERM', async () => {
      if (logger) {
        logger.info('SIGTERM received, shutting down gracefully');
      }
      await orchestrator.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      if (logger) {
        logger.info('SIGINT received, shutting down gracefully');
      }
      await orchestrator.stop();
      process.exit(0);
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('Configuration Error:', error.message);
      process.exit(1);
    }

    if (logger) {
      logger.error('Fatal error during startup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      console.error('Fatal error during startup:', error);
    }
    process.exit(1);
  }
}

main();
