'use client';

import { Signal } from '@/lib/types';
import { cn, formatCurrency, formatTimeAgo } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SignalsTableProps {
  signals: Signal[];
  isLoading?: boolean;
}

export function SignalsTable({ signals, isLoading }: SignalsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading signals...</div>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No signals found</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Asset
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Signal Type
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Timeframe
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Entry
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Stop Loss
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              TP1 (40%)
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              TP2 (35%)
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              TP3 (25%)
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => {
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

            const statusColor = {
              active: 'bg-blue-500/10 text-blue-500',
              filled: 'bg-yellow-500/10 text-yellow-500',
              closed: 'bg-gray-500/10 text-gray-500',
            };

            const signalColor = isBuy
              ? 'text-green-500 bg-green-500/10'
              : 'text-red-500 bg-red-500/10';

            return (
              <tr key={signal.id} className="border-b border-border hover:bg-muted/50">
                <td className="h-12 px-4 align-middle font-medium">
                  {signal.asset}
                </td>
                <td className="h-12 px-4 align-middle">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                      signalColor
                    )}
                  >
                    {isBuy ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {signal.signalType}
                  </div>
                </td>
                <td className="h-12 px-4 align-middle">{signal.timeframe}</td>
                <td className="h-12 px-4 align-middle text-right font-medium">
                  {formatCurrency(signal.entryPrice)}
                </td>
                <td className="h-12 px-4 align-middle text-right text-red-500">
                  {formatCurrency(signal.stopLoss)}
                </td>
                <td className="h-12 px-4 align-middle text-right text-green-500">
                  {formatCurrency(tp1)}
                </td>
                <td className="h-12 px-4 align-middle text-right text-green-500">
                  {formatCurrency(tp2)}
                </td>
                <td className="h-12 px-4 align-middle text-right text-green-500">
                  {formatCurrency(tp3)}
                </td>
                <td className="h-12 px-4 align-middle">
                  <span
                    className={cn(
                      'inline-block rounded px-2 py-1 text-xs font-medium',
                      statusColor[signal.status as keyof typeof statusColor] ||
                        statusColor.active
                    )}
                  >
                    {signal.status}
                  </span>
                </td>
                <td className="h-12 px-4 align-middle text-muted-foreground text-xs">
                  {formatTimeAgo(signal.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
