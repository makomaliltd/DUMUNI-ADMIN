import { cn } from '@/lib/utils';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ShoppingCart,
  MessageSquare,
  Wallet,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const activityIcons = {
  order: ShoppingCart,
  review: MessageSquare,
  withdrawal: Wallet,
  registration: AlertCircle,
} as const;

const activityColors = {
  order: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  review: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  withdrawal: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
  registration: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
} as const;

function formatTimeAgo(dateStr: string, locale: string, t: (key: string) => string): string {
  const now = Date.now();
  const time = new Date(dateStr).getTime();
  const diff = now - time;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('activity.justNow');
  if (minutes < 60) return `${minutes} ${t('activity.minutesAgo')}`;
  if (hours < 24) return `${hours} ${t('activity.hoursAgo')}`;
  if (days < 7) return `${days} ${t('activity.daysAgo')}`;
  return new Date(dateStr).toLocaleDateString(locale);
}

export function ActivityFeed() {
  const { t, lang } = useLanguage();

  const localeMap: Record<string, string> = { en: 'en-US', zh: 'zh-CN', fr: 'fr-FR' };
  const dateLocale = localeMap[lang] || 'en-US';

  const { data: activities, isLoading, error } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-red-500">{t('activity.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{t('activity.realtimeUpdate')}</span>
      </div>
      <div className="space-y-0.5">
        {activities?.map((activity) => {
          const Icon = activityIcons[activity.type] ?? AlertCircle;
          const colorClass = activityColors[activity.type] ?? 'bg-gray-50 text-gray-600';

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <div className={cn('rounded-lg p-1.5', colorClass)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{activity.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {activity.description}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatTimeAgo(activity.time, dateLocale, t)}
              </span>
            </div>
          );
        })}
      </div>
      {(!activities || activities.length === 0) && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('activity.noActivities')}</p>
      )}
    </div>
  );
}