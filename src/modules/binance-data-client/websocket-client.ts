import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { KlineData } from '../../types';
import {
  BinanceSymbol,
  BinanceTimeframe,
  BinanceClientConfig,
  BinanceWebSocketMessage,
  KlineUpdateEvent,
  ConnectionStatusEvent,
  BinanceEventMap,
} from './types';
import { BinanceResponseValidator } from './validator';

export class BinanceWebSocketClient extends EventEmitter {
  private wsBaseUrl: string;
  private connections: Map<string, WebSocket>;
  private reconnectAttempts: Map<string, number>;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private latestKlines: Map<string, KlineData>;
  private isShuttingDown: boolean;

  constructor(config?: BinanceClientConfig) {
    super();
    this.wsBaseUrl = config?.wsBaseUrl || 'wss://stream.binance.com:9443';
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = config?.maxRetries || 5;
    this.reconnectDelay = config?.retryDelay || 5000;
    this.latestKlines = new Map();
    this.isShuttingDown = false;
  }

  subscribe(symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    const streamKey = this.getStreamKey(symbol, timeframe);
    
    if (this.connections.has(streamKey)) {
      console.log(`Already subscribed to ${streamKey}`);
      return;
    }

    this.connect(symbol, timeframe);
  }

  unsubscribe(symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    const streamKey = this.getStreamKey(symbol, timeframe);
    const ws = this.connections.get(streamKey);

    if (ws) {
      ws.close();
      this.connections.delete(streamKey);
      this.reconnectAttempts.delete(streamKey);
      this.latestKlines.delete(streamKey);
    }
  }

  subscribeMultiple(symbols: BinanceSymbol[], timeframes: BinanceTimeframe[]): void {
    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        this.subscribe(symbol, timeframe);
      }
    }
  }

  getLatestKline(symbol: BinanceSymbol, timeframe: BinanceTimeframe): KlineData | null {
    const streamKey = this.getStreamKey(symbol, timeframe);
    return this.latestKlines.get(streamKey) || null;
  }

  getAllLatestKlines(): Map<string, KlineData> {
    return new Map(this.latestKlines);
  }

  close(): void {
    this.isShuttingDown = true;
    
    for (const [streamKey, ws] of this.connections.entries()) {
      ws.close();
      this.connections.delete(streamKey);
      this.reconnectAttempts.delete(streamKey);
    }

    this.latestKlines.clear();
    this.removeAllListeners();
  }

  isConnected(symbol: BinanceSymbol, timeframe: BinanceTimeframe): boolean {
    const streamKey = this.getStreamKey(symbol, timeframe);
    const ws = this.connections.get(streamKey);
    return ws?.readyState === WebSocket.OPEN;
  }

  private connect(symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    const streamKey = this.getStreamKey(symbol, timeframe);
    const stream = `${symbol.toLowerCase()}@kline_${timeframe}`;
    const wsUrl = `${this.wsBaseUrl}/ws/${stream}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        this.handleOpen(streamKey, symbol, timeframe);
      });

      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data, symbol, timeframe, streamKey);
      });

      ws.on('error', (error: Error) => {
        this.handleError(error, streamKey);
      });

      ws.on('close', () => {
        this.handleClose(streamKey, symbol, timeframe);
      });

      this.connections.set(streamKey, ws);
    } catch (error) {
      this.emitError(new Error(`Failed to create WebSocket: ${error}`));
    }
  }

  private handleOpen(streamKey: string, symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    console.log(`WebSocket connected: ${streamKey}`);
    this.reconnectAttempts.set(streamKey, 0);

    const event: ConnectionStatusEvent = {
      status: 'connected',
      timestamp: Date.now(),
      message: `Connected to ${symbol} ${timeframe}`,
    };

    this.emit('connectionStatus', event);
  }

  private handleMessage(
    data: WebSocket.Data,
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    streamKey: string
  ): void {
    try {
      const message = JSON.parse(data.toString());

      if (!BinanceResponseValidator.validateWebSocketMessage(message)) {
        console.error('Invalid WebSocket message format:', message);
        return;
      }

      const kline = this.transformWebSocketKline(message);
      this.latestKlines.set(streamKey, kline);

      const event: KlineUpdateEvent = {
        symbol,
        timeframe,
        kline,
        isFinal: message.k.x,
      };

      this.emit('klineUpdate', event);
    } catch (error) {
      this.emitError(new Error(`Failed to parse WebSocket message: ${error}`));
    }
  }

  private handleError(error: Error, streamKey: string): void {
    console.error(`WebSocket error on ${streamKey}:`, error.message);
    this.emitError(error);
  }

  private handleClose(streamKey: string, symbol: BinanceSymbol, timeframe: BinanceTimeframe): void {
    console.log(`WebSocket closed: ${streamKey}`);
    this.connections.delete(streamKey);

    const event: ConnectionStatusEvent = {
      status: 'disconnected',
      timestamp: Date.now(),
      message: `Disconnected from ${symbol} ${timeframe}`,
    };

    this.emit('connectionStatus', event);

    if (!this.isShuttingDown) {
      this.attemptReconnect(symbol, timeframe, streamKey);
    }
  }

  private attemptReconnect(
    symbol: BinanceSymbol,
    timeframe: BinanceTimeframe,
    streamKey: string
  ): void {
    const attempts = this.reconnectAttempts.get(streamKey) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${streamKey}`);
      this.emitError(new Error(`Failed to reconnect to ${streamKey}`));
      return;
    }

    this.reconnectAttempts.set(streamKey, attempts + 1);

    const delay = this.reconnectDelay * Math.pow(2, attempts);
    console.log(`Reconnecting to ${streamKey} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);

    const event: ConnectionStatusEvent = {
      status: 'reconnecting',
      timestamp: Date.now(),
      message: `Reconnecting to ${symbol} ${timeframe}`,
    };

    this.emit('connectionStatus', event);

    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.connect(symbol, timeframe);
      }
    }, delay);
  }

  private transformWebSocketKline(message: BinanceWebSocketMessage): KlineData {
    const k = message.k;
    return {
      openTime: k.t,
      open: k.o,
      high: k.h,
      low: k.l,
      close: k.c,
      volume: k.v,
      closeTime: k.T,
      quoteVolume: k.q,
      trades: k.n,
      takerBuyBaseVolume: k.V,
      takerBuyQuoteVolume: k.Q,
    };
  }

  private getStreamKey(symbol: BinanceSymbol, timeframe: BinanceTimeframe): string {
    return `${symbol}:${timeframe}`;
  }

  private emitError(error: Error): void {
    this.emit('error', error);
  }

  on<K extends keyof BinanceEventMap>(
    event: K,
    listener: (arg: BinanceEventMap[K]) => void
  ): this {
    return super.on(event, listener);
  }

  once<K extends keyof BinanceEventMap>(
    event: K,
    listener: (arg: BinanceEventMap[K]) => void
  ): this {
    return super.once(event, listener);
  }

  emit<K extends keyof BinanceEventMap>(
    event: K,
    arg: BinanceEventMap[K]
  ): boolean {
    return super.emit(event, arg);
  }
}
