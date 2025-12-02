'use client';

import { Signal } from '@/lib/types';
import { cn, formatCurrency, formatTimeAgo } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';

interface SignalsCardProps {
  signal: Signal;
}

export function SignalsCard({ signal }: SignalsCardProps) {
  const isBuy = signal.signalType === 'BUY';
  const range = signal.takeProfit - signal.stopLoss;
  const thirdRange = range / 3;

  let tp1, tp2, tp3;
  if (isBuy) {
    tp1 = signal.entryPrice + thirdRange * 0.4;
    tp2 = signal.entryPrice + thirdRange * 0.75;
    tp3 = signal.takeProfit;
  } else {
    tp1 = signal.entryPrice - thirdRange * 0.4;
    tp2 = signal.entryPrice - thirdRange * 0.75;
    tp3 = signal.takeProfit;
  }

  const currentProfit = 0; // Would be calculated from current price vs entry
  const riskReward =
    Math.abs((signal.takeProfit - signal.entryPrice) / (signal.entryPrice - signal.stopLoss)) || 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-lg',
        isBuy ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              isBuy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            )}
          >
            {isBuy ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{signal.asset}</h3>
            <p className="text-xs text-muted-foreground">
              {signal.timeframe} • {signal.metadata?.assetType || 'unknown'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={cn(
              'inline-block px-3 py-1 rounded-full text-xs font-medium',
              signal.status === 'active'
                ? 'bg-blue-500/10 text-blue-500'
                : signal.status === 'filled'
                  ? 'bg-yellow-500/10 text-yellow-500'
                  : 'bg-gray-500/10 text-gray-500'
            )}
          >
            {signal.status}
          </span>
        </div>
      </div>

      {/* Price Levels */}
      <div className="bg-background/50 rounded p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entry</span>
          <span className="font-semibold">{formatCurrency(signal.entryPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-red-500">
          <span className="text-sm text-muted-foreground">Stop Loss</span>
          <span className="font-semibold">{formatCurrency(signal.stopLoss)}</span>
        </div>
        <div className="border-t border-border pt-2 mt-2">
          <div className="flex items-center justify-between text-green-500 text-sm">
            <span>TP1 (40%)</span>
            <span>{formatCurrency(tp1)}</span>
          </div>
          <div className="flex items-center justify-between text-green-500 text-sm">
            <span>TP2 (35%)</span>
            <span>{formatCurrency(tp2)}</span>
          </div>
          <div className="flex items-center justify-between text-green-500 text-sm font-semibold">
            <span>TP3 (25%)</span>
            <span>{formatCurrency(tp3)}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="bg-background/50 rounded p-2">
          <p className="text-muted-foreground text-xs">Risk/Reward</p>
          <p className="font-semibold">{riskReward.toFixed(2)}:1</p>
        </div>
        <div className="bg-background/50 rounded p-2">
          <p className="text-muted-foreground text-xs">Current P&L</p>
          <p
            className={cn('font-semibold', currentProfit >= 0 ? 'text-green-500' : 'text-red-500')}
          >
            {formatCurrency(currentProfit)}
          </p>
        </div>
      </div>

      {/* Indicators */}
      {signal.metadata && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          {signal.metadata.rsi && (
            <div className="bg-background/50 rounded p-2">
              <p className="text-muted-foreground">RSI</p>
              <p className="font-semibold">{signal.metadata.rsi.toFixed(2)}</p>
            </div>
          )}
          {signal.metadata.volumeRatio && (
            <div className="bg-background/50 rounded p-2">
              <p className="text-muted-foreground">Volume</p>
              <p className="font-semibold">{signal.metadata.volumeRatio.toFixed(2)}x</p>
            </div>
          )}
          {signal.metadata.volatility && (
            <div className="bg-background/50 rounded p-2">
              <p className="text-muted-foreground">Volatility</p>
              <p className="font-semibold">{(signal.metadata.volatility * 100).toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span>{formatTimeAgo(signal.createdAt)}</span>
        <span>
          {new Date(signal.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
