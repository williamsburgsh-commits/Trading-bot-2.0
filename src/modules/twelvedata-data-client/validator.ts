import { TwelveDataTimeSeriesResponse, TwelveDataErrorResponse } from './types';

export class TwelveDataResponseValidator {
  static isErrorResponse(data: unknown): data is TwelveDataErrorResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'status' in data &&
      'code' in data &&
      'message' in data &&
      (data as TwelveDataErrorResponse).status === 'error'
    );
  }

  static validateTimeSeriesResponse(data: unknown): TwelveDataTimeSeriesResponse {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid response: expected object');
    }

    if (this.isErrorResponse(data)) {
      throw new Error(`Twelve Data API error: ${data.message} (code: ${data.code})`);
    }

    const response = data as TwelveDataTimeSeriesResponse;

    if (!response.meta || typeof response.meta !== 'object') {
      throw new Error('Invalid response: missing meta object');
    }

    if (!Array.isArray(response.values)) {
      throw new Error('Invalid response: values must be an array');
    }

    if (!response.status || response.status !== 'ok') {
      throw new Error(`Invalid response status: ${response.status}`);
    }

    return response;
  }

  static validateCandle(candle: unknown): boolean {
    if (typeof candle !== 'object' || candle === null) {
      return false;
    }

    const c = candle as Record<string, unknown>;

    return (
      typeof c.datetime === 'string' &&
      typeof c.open === 'string' &&
      typeof c.high === 'string' &&
      typeof c.low === 'string' &&
      typeof c.close === 'string'
    );
  }
}
