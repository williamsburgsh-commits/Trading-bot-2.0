import { BinanceKlineResponse, BinanceWebSocketMessage } from './types';

export class BinanceResponseValidator {
  static validateKlineResponse(data: any): data is BinanceKlineResponse[] {
    if (!Array.isArray(data)) {
      return false;
    }

    for (const kline of data) {
      if (!this.isValidKlineArray(kline)) {
        return false;
      }
    }

    return true;
  }

  static validateKlineArray(data: any): BinanceKlineResponse | null {
    if (!this.isValidKlineArray(data)) {
      return null;
    }

    return {
      openTime: data[0],
      open: data[1],
      high: data[2],
      low: data[3],
      close: data[4],
      volume: data[5],
      closeTime: data[6],
      quoteVolume: data[7],
      trades: data[8],
      takerBuyBaseVolume: data[9],
      takerBuyQuoteVolume: data[10],
    };
  }

  static validateWebSocketMessage(data: any): data is BinanceWebSocketMessage {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (data.e !== 'kline' || typeof data.E !== 'number' || typeof data.s !== 'string') {
      return false;
    }

    const kline = data.k;
    if (!kline || typeof kline !== 'object') {
      return false;
    }

    return (
      typeof kline.t === 'number' &&
      typeof kline.T === 'number' &&
      typeof kline.s === 'string' &&
      typeof kline.i === 'string' &&
      typeof kline.o === 'string' &&
      typeof kline.c === 'string' &&
      typeof kline.h === 'string' &&
      typeof kline.l === 'string' &&
      typeof kline.v === 'string' &&
      typeof kline.x === 'boolean'
    );
  }

  private static isValidKlineArray(kline: any): boolean {
    if (!Array.isArray(kline) || kline.length < 11) {
      return false;
    }

    const openTime = kline[0];
    const open = kline[1];
    const high = kline[2];
    const low = kline[3];
    const close = kline[4];
    const volume = kline[5];
    const closeTime = kline[6];

    if (typeof openTime !== 'number' || typeof closeTime !== 'number') {
      return false;
    }

    if (
      typeof open !== 'string' ||
      typeof high !== 'string' ||
      typeof low !== 'string' ||
      typeof close !== 'string' ||
      typeof volume !== 'string'
    ) {
      return false;
    }

    const openNum = parseFloat(open);
    const highNum = parseFloat(high);
    const lowNum = parseFloat(low);
    const closeNum = parseFloat(close);
    const volumeNum = parseFloat(volume);

    if (isNaN(openNum) || isNaN(highNum) || isNaN(lowNum) || isNaN(closeNum) || isNaN(volumeNum)) {
      return false;
    }

    if (
      highNum < lowNum ||
      highNum < openNum ||
      highNum < closeNum ||
      lowNum > openNum ||
      lowNum > closeNum
    ) {
      return false;
    }

    return true;
  }
}
