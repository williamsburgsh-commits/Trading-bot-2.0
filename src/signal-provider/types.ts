export type {
  BinanceConfig,
  DatabaseConfig,
  LoggingConfig,
  RateLimitConfig,
  ServiceConfig,
} from './config';
export type { Logger } from './utils/logger';
export type { IMarketDataClient, IStorageClient } from './clients';
export type { Indicator, IndicatorSnapshot, IIndicatorService } from './indicators';
export type { Signal, ISignalGenerator, ISignalValidator } from './signals';
export type { ISignalRepository, IStorageService } from './storage';
export type {
  HealthStatus,
  ServiceStatus,
  IHealthMonitor,
  Metrics,
  IMetricsCollector,
} from './monitoring';
export type { ErrorContext } from './utils/errors';

export {
  BaseError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  InternalError,
  handleError,
  wrapAsync,
  createErrorHandler,
} from './utils/errors';

export { ConfigurationError, loadConfig } from './config';
export { createLogger } from './utils/logger';
export { SignalProviderOrchestrator } from './orchestrator';
