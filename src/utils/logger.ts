import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

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

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    errors({ stack: true }),
    prettyFormat
  ),
  transports: [new winston.transports.Console()],
});
