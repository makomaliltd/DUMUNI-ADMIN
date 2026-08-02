import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );
}