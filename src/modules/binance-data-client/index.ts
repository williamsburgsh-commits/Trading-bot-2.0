import { BinanceRestClient } from './rest-client';
import { BinanceWebSocketClient } from './websocket-client';
import { BinanceCache } from './cache';
import {
  BinanceSymbol,
  BinanceTimeframe,
  BinanceClientConfig,
  KlineUpdateEvent,
  ConnectionStatusEvent,
  BinanceEventMap,
} from './types';

export class BinanceDataClient {
  private restClient: BinanceRestClient;
  private wsClient: BinanceWebSocketClient;

  constructor(config?: BinanceClientConfig) {
    this.restClient = new BinanceRestClient(config);
    this.wsClient = new BinanceWebSocketClient(config);
  }

  async getKlines(symbol: BinanceSymbol, timeframe: BinanceTimeframe, limit: number = 500) {
    return this.restClient.getKlines(symbol, timeframe, limit);
  }

  async getHistoricalKlines(
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    startTime: number,
    endTime?: number,
    limit: number = 1000
  ) {
    return this.restClient.getHistoricalKlines(symbol, timeframe, startTime, endTime, limit);
  }

  async bulkHistoricalDownload(
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    startTime: number,
    endTime: number
  ) {
    return this.restClient.bulkHistoricalDownload(symbol, timeframe, startTime, endTime);
  }

  subscribeRealtime(symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    this.wsClient.subscribe(symbol, timeframe);
  }

  unsubscribeRealtime(symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    this.wsClient.unsubscribe(symbol, timeframe);
  }

  subscribeMultiple(symbols: BinanceSymbol[], timeframes: BinanceTimeframe[]): void {
    this.wsClient.subscribeMultiple(symbols, timeframes);
  }

  getLatestKline(symbol: BinanceSymbol, timeframe: BinanceTimeframe) {
    return this.wsClient.getLatestKline(symbol, timeframe);
  }

  getAllLatestKlines() {
    return this.wsClient.getAllLatestKlines();
  }

  isConnected(symbol: BinanceSymbol, timeframe: BinanceTimeframe): boolean {
    return this.wsClient.isConnected(symbol, timeframe);
  }

  onKlineUpdate(callback: (event: KlineUpdateEvent) => void): void {
    this.wsClient.on('klineUpdate', callback);
  }

  onConnectionStatus(callback: (event: ConnectionStatusEvent) => void): void {
    this.wsClient.on('connectionStatus', callback);
  }

  onError(callback: (error: Error) => void): void {
    this.wsClient.on('error', callback);
  }

  getCache(): BinanceCache {
    return this.restClient.getCache();
  }

  clearCache(): void {
    this.restClient.clearCache();
  }

  close(): void {
    this.wsClient.close();
  }
}

export * from './types';
export { BinanceRestClient } from './rest-client';
export { BinanceWebSocketClient } from './websocket-client';
export { BinanceCache } from './cache';
export { BinanceResponseValidator } from './validator';
