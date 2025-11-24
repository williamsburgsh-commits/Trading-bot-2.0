import { FinnhubCandleResponse } from './types';

export class FinnhubResponseValidator {
  static validateCandleResponse(data: any): data is FinnhubCandleResponse {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (data.s === 'no_data') {
      return true;
    }

    if (data.s !== 'ok') {
      return false;
    }

    const requiredArrays = ['c', 'h', 'l', 'o', 't', 'v'];
    for (const key of requiredArrays) {
      if (!Array.isArray(data[key])) {
        return false;
      }
    }

    const length = data.t.length;
    for (const key of requiredArrays) {
      if (data[key].length !== length) {
        return false;
      }
    }

    return true;
  }

  static validateCandleData(response: FinnhubCandleResponse): boolean {
    if (response.s === 'no_data') {
      return true;
    }

    if (response.s !== 'ok') {
      return false;
    }

    for (let i = 0; i < response.t.length; i++) {
      const timestamp = response.t[i];
      const open = response.o[i];
      const high = response.h[i];
      const low = response.l[i];
      const close = response.c[i];
      const volume = response.v[i];

      if (
        typeof timestamp !== 'number' ||
        typeof open !== 'number' ||
        typeof high !== 'number' ||
        typeof low !== 'number' ||
        typeof close !== 'number' ||
        typeof volume !== 'number'
      ) {
        return false;
      }

      if (timestamp <= 0 || isNaN(timestamp)) {
        return false;
      }

      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
        return false;
      }

      if (high < low || high < open || high < close || low > open || low > close) {
        return false;
      }

      if (volume < 0) {
        return false;
      }
    }

    return true;
  }
}
