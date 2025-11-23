import winston from 'winston';
import { LoggingConfig } from '../config';

const { combine, timestamp, printf, json, colorize, errors } = winston.format;

const prettyFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    if (metadata.error) {
      msg += `\n${metadata.error}`;
      delete metadata.error;
    }
    if (Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }
  }

  return msg;
});

export function createLogger(config: LoggingConfig) {
  const format =
    config.format === 'json'
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          colorize(),
          errors({ stack: true }),
          prettyFormat
        );

  return winston.createLogger({
    level: config.level,
    format,
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(timestamp(), json()),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: combine(timestamp(), json()),
      }),
    ],
  });
}

export type Logger = winston.Logger;
