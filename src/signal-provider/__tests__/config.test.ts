import { loadConfig, ConfigurationError } from '../config';

describe('Signal Provider Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load config successfully without API keys', () => {
      delete process.env.BINANCE_API_KEY;
      delete process.env.BINANCE_API_SECRET;

      const config = loadConfig();

      expect(config.binance.apiKey).toBeUndefined();
      expect(config.binance.apiSecret).toBeUndefined();
      expect(config.binance.baseUrl).toBe('https://api.binance.com');
    });

    it('should load config with API keys if provided', () => {
      process.env.BINANCE_API_KEY = 'test-key';
      process.env.BINANCE_API_SECRET = 'test-secret';

      const config = loadConfig();

      expect(config.binance.apiKey).toBe('test-key');
      expect(config.binance.apiSecret).toBe('test-secret');
    });

    it('should set apiKey to undefined if empty string', () => {
      process.env.BINANCE_API_KEY = '';
      process.env.BINANCE_API_SECRET = '';

      const config = loadConfig();

      expect(config.binance.apiKey).toBeUndefined();
      expect(config.binance.apiSecret).toBeUndefined();
    });

    it('should use default rate limit of 1200 req/min', () => {
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_MINUTES;

      const config = loadConfig();

      expect(config.rateLimit.maxRequests).toBe(1200);
      expect(config.rateLimit.perMinutes).toBe(1);
    });

    it('should allow custom rate limits', () => {
      process.env.RATE_LIMIT_MAX = '500';
      process.env.RATE_LIMIT_MINUTES = '2';

      const config = loadConfig();

      expect(config.rateLimit.maxRequests).toBe(500);
      expect(config.rateLimit.perMinutes).toBe(2);
    });

    it('should throw ConfigurationError for invalid base URL', () => {
      process.env.BINANCE_API_URL = 'not-a-url';

      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow('BINANCE_API_URL must be a valid HTTP(S) URL');
    });

    it('should throw ConfigurationError for invalid rate limit', () => {
      process.env.RATE_LIMIT_MAX = '0';

      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow('RATE_LIMIT_MAX must be a positive number');
    });

    it('should throw ConfigurationError for invalid log level', () => {
      process.env.LOG_LEVEL = 'invalid';

      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow(/LOG_LEVEL must be one of:/);
    });

    it('should throw ConfigurationError for invalid log format', () => {
      process.env.LOG_FORMAT = 'invalid';

      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow(/LOG_FORMAT must be one of:/);
    });

    it('should use default values for all optional configs', () => {
      // Clear all env vars
      delete process.env.BINANCE_API_KEY;
      delete process.env.BINANCE_API_SECRET;
      delete process.env.BINANCE_API_URL;
      delete process.env.DATABASE_URL;
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_FORMAT;
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_MINUTES;

      const config = loadConfig();

      expect(config.binance.apiKey).toBeUndefined();
      expect(config.binance.apiSecret).toBeUndefined();
      expect(config.binance.baseUrl).toBe('https://api.binance.com');
      expect(config.database.url).toBe('file:./dev.db');
      expect(config.logging.level).toBe('info');
      expect(config.logging.format).toBe('pretty');
      expect(config.rateLimit.maxRequests).toBe(1200);
      expect(config.rateLimit.perMinutes).toBe(1);
    });
  });
});
