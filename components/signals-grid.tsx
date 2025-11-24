'use client';

import { Signal } from '@/lib/types';
import { SignalsCard } from './signals-card';

interface SignalsGridProps {
  signals: Signal[];
  isLoading?: boolean;
}

export function SignalsGrid({ signals, isLoading }: SignalsGridProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {signals.map((signal) => (
        <SignalsCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
