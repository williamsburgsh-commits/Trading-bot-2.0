'use client';

import { formatPercent, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percent' | 'number' | 'none';
}

export function MetricsCard({
  label,
  value,
  trend = 'neutral',
  format = 'number',
}: MetricsCardProps) {
  let formattedValue: string;

  if (typeof value === 'string') {
    formattedValue = value;
  } else if (format === 'currency') {
    formattedValue = formatCurrency(value);
  } else if (format === 'percent') {
    formattedValue = formatPercent(value);
  } else if (format === 'number') {
    formattedValue = value.toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
  } else {
    formattedValue = String(value);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{formattedValue}</p>
        </div>
        <div
          className={
            trend === 'up'
              ? 'text-green-500'
              : trend === 'down'
                ? 'text-red-500'
                : 'text-muted-foreground'
          }
        >
          {trend === 'up' ? (
            <TrendingUp className="h-6 w-6" />
          ) : trend === 'down' ? (
            <TrendingDown className="h-6 w-6" />
          ) : (
            <div className="h-6 w-6" />
          )}
        </div>
      </div>
    </div>
  );
}
