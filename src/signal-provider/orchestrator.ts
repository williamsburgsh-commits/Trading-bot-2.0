import { Logger } from './utils/logger';
import { ServiceConfig } from './config';
import { createErrorHandler } from './utils/errors';

export interface Dependencies {
  logger: Logger;
  config: ServiceConfig;
}

export class SignalProviderOrchestrator {
  private logger: Logger;
  private config: ServiceConfig;
  private errorHandler: (error: Error) => void;
  private startTime: Date;

  constructor(dependencies: Dependencies) {
    this.logger = dependencies.logger;
    this.config = dependencies.config;
    this.errorHandler = createErrorHandler(this.logger);
    this.startTime = new Date();
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Initializing Signal Provider Service...', {
        service: 'SignalProviderOrchestrator',
        operation: 'start',
      });

      this.logger.info('Loading configuration...', {
        binanceUrl: this.config.binance.baseUrl,
        logLevel: this.config.logging.level,
        logFormat: this.config.logging.format,
        rateLimit: `${this.config.rateLimit.maxRequests} requests per ${this.config.rateLimit.perMinutes} minute(s)`,
      });

      this.logger.info('Signal Provider Service is ready', {
        service: 'SignalProviderOrchestrator',
        status: 'ready',
        startTime: this.startTime.toISOString(),
      });
    } catch (error) {
      this.errorHandler(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Shutting down Signal Provider Service...', {
        service: 'SignalProviderOrchestrator',
        operation: 'stop',
        uptime: Date.now() - this.startTime.getTime(),
      });

      this.logger.info('Signal Provider Service stopped gracefully', {
        service: 'SignalProviderOrchestrator',
        status: 'stopped',
      });
    } catch (error) {
      this.errorHandler(error as Error);
      throw error;
    }
  }

  getHealth() {
    return {
      status: 'healthy',
      uptime: Date.now() - this.startTime.getTime(),
      startTime: this.startTime,
    };
  }
}
