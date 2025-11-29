import { AlphaVantageResponse, AlphaVantageTimeSeriesEntry } from './types';

export class AlphaVantageResponseValidator {
  static validateResponse(data: any): data is AlphaVantageResponse {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (data['Error Message']) {
      throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
    }

    if (data.Note) {
      throw new Error(`Alpha Vantage API Rate Limit: ${data.Note}`);
    }

    if (data.Information) {
      throw new Error(`Alpha Vantage API Information: ${data.Information}`);
    }

    if (!data['Meta Data'] || !data['Time Series FX (Intraday)']) {
      return false;
    }

    return true;
  }

  static validateTimeSeriesEntry(entry: any): entry is AlphaVantageTimeSeriesEntry {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const required = ['1. open', '2. high', '3. low', '4. close'];

    for (const field of required) {
      if (!(field in entry) || typeof entry[field] !== 'string') {
        return false;
      }
    }

    return true;
  }

  static validateTimeSeries(timeSeries: Record<string, any>): boolean {
    if (!timeSeries || typeof timeSeries !== 'object') {
      return false;
    }

    const entries = Object.values(timeSeries);
    if (entries.length === 0) {
      return false;
    }

    return entries.every((entry) => this.validateTimeSeriesEntry(entry));
  }
}
