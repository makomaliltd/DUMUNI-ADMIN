import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useOrderTrend } from '@/hooks/useOrderTrend';
import { useRevenueTrend } from '@/hooks/useRevenueTrend';
import { useTopRestaurants } from '@/hooks/useTopRestaurants';
import { useOrderStatusDistribution } from '@/hooks/useOrderStatusDistribution';
import { useActiveOrdersSubscription } from '@/hooks/useActiveOrdersSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/ChartCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orderTrend, isLoading: orderTrendLoading } = useOrderTrend();
  const { data: revenueTrend, isLoading: revenueTrendLoading } = useRevenueTrend();
  const { data: topRestaurants, isLoading: topRestaurantsLoading } = useTopRestaurants();
  const { data: statusDistribution, isLoading: statusLoading } = useOrderStatusDistribution();
  const { activeCount } = useActiveOrdersSubscription();
  const { t } = useLanguage();

  // ─── Tooltip formatters ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-primary">{payload[0].value} {t('dashboard.orders')}</p>
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revenueTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-emerald-600">{formatCurrency(payload[0].value as number)}</p>
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restaurantTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold">{payload[0].value} {t('dashboard.orders')}</p>
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const total = statusDistribution?.reduce((s, d) => s + d.value, 0) ?? 1;
    const pct = ((payload[0].value as number / total) * 100).toFixed(1);
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value} 单 ({pct}%)</p>
      </div>
    );
  };

  const activeOrders = activeCount ?? stats?.activeOrders ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.welcome')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总订单数"
          value={stats?.totalOrders ?? '—'}
          icon={ShoppingCart}
          trend={stats?.ordersTrend}
          trendLabel="较上月"
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <StatCard
          title="进行中订单"
          value={activeOrders}
          icon={TrendingUp}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <StatCard
          title="平台佣金"
          value={stats ? formatCurrency(stats.totalRevenue) : '—'}
          icon={DollarSign}
          trend={stats?.revenueTrend}
          trendLabel="较上月"
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <StatCard
          title="待审核"
          value={stats?.pendingVerifications ?? '—'}
          icon={ClipboardCheck}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Orders Trend */}
        <ChartCard title="订单趋势" subtitle="最近30天">
          {orderTrendLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={orderTooltipContent} />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Revenue Trend */}
        <ChartCard title="收入趋势" subtitle="最近30天">
          {revenueTrendLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={revenueTooltipContent} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top 5 Restaurants */}
        <ChartCard title="热门餐厅 Top 5" subtitle="按订单数排名">
          {topRestaurantsLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRestaurants}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={restaurantTooltipContent} />
                <Bar dataKey="totalOrders" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Order Status Distribution */}
        <ChartCard title="订单状态分布" subtitle="当前各状态占比">
          {statusLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={statusTooltipContent} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          {statusDistribution && (
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {statusDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Activity Feed - Full Width */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">实时活动</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">最新订单、评价与提现</p>
          </div>
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}