'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function RiskDisclaimer() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'relative bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6',
        'dark:bg-amber-500/5 dark:border-amber-500/10'
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
            Risk Disclaimer
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Trading cryptocurrencies and forex carries substantial risk of loss. Past performance
            does not guarantee future results. Only trade with capital you can afford to lose. These
            signals are for informational purposes only and should not be considered financial
            advice.
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
          aria-label="Dismiss disclaimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
