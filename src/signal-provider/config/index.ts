import 'dotenv/config';

export interface BinanceConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl: string;
}

export interface AlphaVantageConfig {
  apiKey?: string;
  baseUrl: string;
  rateLimit: {
    maxRequests: number;
    perMinutes: number;
  };
}

export interface DatabaseConfig {
  url: string;
}

export interface LoggingConfig {
  level: string;
  format: 'json' | 'pretty';
}

export interface RateLimitConfig {
  maxRequests: number;
  perMinutes: number;
}

export interface ServiceConfig {
  binance: BinanceConfig;
  alphaVantage: AlphaVantageConfig;
  database: DatabaseConfig;
  logging: LoggingConfig;
  rateLimit: RateLimitConfig;
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function validateConfig(config: ServiceConfig): void {
  if (!config.binance.baseUrl.startsWith('http')) {
    throw new ConfigurationError('BINANCE_API_URL must be a valid HTTP(S) URL');
  }

  if (!config.alphaVantage.baseUrl.startsWith('http')) {
    throw new ConfigurationError('ALPHA_VANTAGE_API_URL must be a valid HTTP(S) URL');
  }

  if (config.alphaVantage.rateLimit.maxRequests <= 0) {
    throw new ConfigurationError('ALPHA_VANTAGE_RATE_LIMIT_MAX must be a positive number');
  }

  if (config.alphaVantage.rateLimit.perMinutes <= 0) {
    throw new ConfigurationError('ALPHA_VANTAGE_RATE_LIMIT_MINUTES must be a positive number');
  }

  if (config.rateLimit.maxRequests <= 0) {
    throw new ConfigurationError('RATE_LIMIT_MAX must be a positive number');
  }

  if (config.rateLimit.perMinutes <= 0) {
    throw new ConfigurationError('RATE_LIMIT_MINUTES must be a positive number');
  }

  const validLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  if (!validLogLevels.includes(config.logging.level)) {
    throw new ConfigurationError(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }

  const validLogFormats = ['json', 'pretty'];
  if (!validLogFormats.includes(config.logging.format)) {
    throw new ConfigurationError(`LOG_FORMAT must be one of: ${validLogFormats.join(', ')}`);
  }
}

export function loadConfig(): ServiceConfig {
  const apiKey = getOptionalEnv('BINANCE_API_KEY', '');
  const apiSecret = getOptionalEnv('BINANCE_API_SECRET', '');
  const alphaVantageApiKey = getOptionalEnv('ALPHA_VANTAGE_API_KEY', '');

  const config: ServiceConfig = {
    binance: {
      apiKey: apiKey || undefined,
      apiSecret: apiSecret || undefined,
      baseUrl: getOptionalEnv('BINANCE_API_URL', 'https://api.binance.com'),
    },
    alphaVantage: {
      apiKey: alphaVantageApiKey || undefined,
      baseUrl: getOptionalEnv('ALPHA_VANTAGE_API_URL', 'https://www.alphavantage.co'),
      rateLimit: {
        maxRequests: parseInt(getOptionalEnv('ALPHA_VANTAGE_RATE_LIMIT_MAX', '5')),
        perMinutes: parseInt(getOptionalEnv('ALPHA_VANTAGE_RATE_LIMIT_MINUTES', '1')),
      },
    },
    database: {
      url: getOptionalEnv('DATABASE_URL', 'file:./dev.db'),
    },
    logging: {
      level: getOptionalEnv('LOG_LEVEL', 'info'),
      format: getOptionalEnv('LOG_FORMAT', 'pretty') as 'json' | 'pretty',
    },
    rateLimit: {
      maxRequests: parseInt(getOptionalEnv('RATE_LIMIT_MAX', '1200')),
      perMinutes: parseInt(getOptionalEnv('RATE_LIMIT_MINUTES', '1')),
    },
  };

  validateConfig(config);

  return config;
}

export { ConfigurationError };
