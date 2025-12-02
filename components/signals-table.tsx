'use client';

import { Signal } from '@/lib/types';
import { cn, formatCurrency, formatTimeAgo } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { ConfidenceStars } from './confidence-stars';
import { Tooltip } from './ui/tooltip';

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
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Entry
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              TP
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              SL
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Timeframe
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Generated At
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => {
            const isBuy = signal.signalType === 'BUY';

            const signalColor = isBuy
              ? 'text-green-500 bg-green-500/10'
              : 'text-red-500 bg-red-500/10';

            const confidence = signal.confidence || 75;
            const backtestInfo = signal.metadata?.backtestWinRate
              ? `Backtest: ${signal.metadata.backtestWinRate.toFixed(1)}% win rate over ${signal.metadata.backtestTrades || 0} trades`
              : 'Confidence based on technical indicators';

            return (
              <tr key={signal.id} className="border-b border-border hover:bg-muted/50">
                <td className="h-12 px-4 align-middle font-medium">{signal.asset}</td>
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
                <td className="h-12 px-4 align-middle text-right font-medium">
                  {formatCurrency(signal.entryPrice)}
                </td>
                <td className="h-12 px-4 align-middle text-right text-green-500">
                  {formatCurrency(signal.takeProfit)}
                </td>
                <td className="h-12 px-4 align-middle text-right text-red-500">
                  {formatCurrency(signal.stopLoss)}
                </td>
                <td className="h-12 px-4 align-middle">{signal.timeframe}</td>
                <td className="h-12 px-4 align-middle text-muted-foreground text-xs">
                  {formatTimeAgo(signal.createdAt)}
                </td>
                <td className="h-12 px-4 align-middle">
                  <div className="flex items-center gap-2">
                    <ConfidenceStars confidence={confidence} />
                    <Tooltip content={backtestInfo}>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </Tooltip>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
