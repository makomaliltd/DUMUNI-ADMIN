import { useLanguage } from '@/contexts/LanguageContext';

export default function Analytics() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h1>
        <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">{t('analytics.visitTrend')}</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground">{t('analytics.chartComingSoon')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">{t('analytics.dataOverview')}</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('analytics.todayVisits')}</span>
                <span className="text-sm font-semibold text-foreground">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('analytics.weeklyVisits')}</span>
                <span className="text-sm font-semibold text-foreground">8,567</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('analytics.monthlyVisits')}</span>
                <span className="text-sm font-semibold text-foreground">34,210</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('analytics.conversionRate')}</span>
                <span className="text-sm font-semibold text-foreground">3.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
