import { Logger } from './logger';

export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string) {
    super(message, 429);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
  }
}

export class InternalError extends BaseError {
  constructor(message: string) {
    super(message, 500, false);
  }
}

export interface ErrorContext {
  operation?: string;
  service?: string;
  resource?: string;
  [key: string]: unknown;
}

export function handleError(error: Error, logger: Logger, context?: ErrorContext) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  };

  if (error instanceof BaseError) {
    if (error.isOperational) {
      logger.warn('Operational error occurred', errorInfo);
    } else {
      logger.error('Non-operational error occurred', errorInfo);
    }
  } else {
    logger.error('Unexpected error occurred', errorInfo);
  }
}

export function wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  logger: Logger,
  context?: ErrorContext
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, logger, context);
      throw error;
    }
  }) as T;
}

export function createErrorHandler(logger: Logger) {
  return (error: Error, context?: ErrorContext) => {
    handleError(error, logger, context);
  };
}
