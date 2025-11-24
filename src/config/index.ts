import dotenv from 'dotenv';
import { MonitorConfig, StrategyConfig, AlertConfig } from '../types';

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  binance: {
    baseUrl: process.env.BINANCE_API_URL || 'https://api.binance.com',
  },

  monitor: {
    interval: process.env.MONITOR_INTERVAL || '*/5 * * * *',
    assets: (process.env.ASSETS || 'BTCUSDT,ETHUSDT').split(','),
    timeframes: (process.env.TIMEFRAMES || '15m,1h').split(','),
    rateLimit: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '1200'),
      perMinutes: parseInt(process.env.RATE_LIMIT_MINUTES || '1'),
    },
  } as MonitorConfig,

  strategy: {
    rsiPeriod: parseInt(process.env.RSI_PERIOD || '14'),
    rsiOverbought: parseInt(process.env.RSI_OVERBOUGHT || '70'),
    rsiOversold: parseInt(process.env.RSI_OVERSOLD || '30'),
    macdFast: parseInt(process.env.MACD_FAST || '12'),
    macdSlow: parseInt(process.env.MACD_SLOW || '26'),
    macdSignal: parseInt(process.env.MACD_SIGNAL || '9'),
    volumeThreshold: parseFloat(process.env.VOLUME_THRESHOLD || '1.5'),
  } as StrategyConfig,

  alerts: {
    enabled: process.env.ALERTS_ENABLED !== 'false',
    console: process.env.ALERT_CONSOLE !== 'false',
    webhook: {
      url: process.env.WEBHOOK_URL || '',
      enabled: !!process.env.WEBHOOK_URL,
    },
    email: {
      from: process.env.EMAIL_FROM || '',
      to: process.env.EMAIL_TO || '',
      enabled: !!(process.env.EMAIL_FROM && process.env.EMAIL_TO),
    },
  } as AlertConfig,
};
