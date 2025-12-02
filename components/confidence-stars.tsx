import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceStarsProps {
  confidence: number;
  className?: string;
}

export function ConfidenceStars({ confidence, className }: ConfidenceStarsProps) {
  const stars = Math.round(confidence / 20);

  return (
    <div className={cn('flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= stars
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
          )}
        />
      ))}
    </div>
  );
}
