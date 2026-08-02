import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  iconClassName,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  isPositive && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
                  isNegative && 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            iconClassName ?? 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}