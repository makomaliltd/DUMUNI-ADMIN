import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalesReport, useUserReport, useDeliveryReport, useFinancialReport, useReviewReport, useScheduledReports, useCreateScheduledReport, useUpdateScheduledReport, useDeleteScheduledReport } from '@/hooks/useReports';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Sales Tab ───────────────────────────────────────────────────

function SalesTab() {
  const { t } = useLanguage();
  const [range, setRange] = useState(30);
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
  const { data, isLoading } = useSalesReport(startDate, endDate);

  const ranges = [
    { label: t('reports.today'), days: 0 },
    { label: t('reports.thisWeek'), days: 7 },
    { label: t('reports.thisMonth'), days: 30 },
    { label: t('reports.lastMonth'), days: 60 },
    { label: t('reports.all'), days: 365 },
  ];

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const metrics = data?.metrics;
  const charts = data?.charts;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {ranges.map(r => (
          <button
            key={r.days}
            onClick={() => setRange(r.days)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r.days ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.totalOrders')} value={metrics?.totalOrders || 0} />
        <StatCard label={t('reports.totalRevenue')} value={`${metrics?.totalRevenue?.toLocaleString() || 0} FCFA`} />
        <StatCard label={t('reports.avgOrderValue')} value={`${metrics?.avgOrderValue?.toLocaleString() || 0} FCFA`} />
        <StatCard label={t('reports.statusDistribution')} value={Object.keys(metrics?.statusCount || {}).length} sub={`${metrics?.totalOrders || 0} ${t('reports.ordersCount')}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.orderTrend')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts?.orderTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={2} dot={false} name={t('reports.totalOrders')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.revenueTrend')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts?.revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} FCFA`} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name={t('reports.revenue')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.hourlyDistribution')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts?.ordersByHour?.map((c: number, i: number) => ({ hour: `${i}:00`, count: c })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF6B00" radius={[4, 4, 0, 0]} name={t('reports.totalOrders')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.weeklyDistribution')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts?.ordersByDayOfWeek || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('reports.totalOrders')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.topRestaurants')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">{t('reports.restaurant')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.orderCount')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.revenue')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.rating')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.topRestaurants?.map((r: any, i: number) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="text-gray-400 w-5">{i + 1}.</span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                  </td>
                  <td className="text-right py-2.5 px-3 text-gray-700 dark:text-gray-300">{r.orderCount}</td>
                  <td className="text-right py-2.5 px-3 text-gray-700 dark:text-gray-300">{r.revenue?.toLocaleString()} FCFA</td>
                  <td className="text-right py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-yellow-500">⭐ {r.rating?.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────

function UsersTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useUserReport();

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.totalUsers')} value={data?.totalUsers || 0} />
        <StatCard label={t('reports.userGrowth')} value={`${data?.userGrowth?.length || 0} ${t('common.days')}`} sub={t('reports.daysWithNewUsers')} />
        <StatCard label={t('reports.roleDistribution')} value={Object.keys(data?.usersByRole || {}).length} sub={t('reports.roles')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.userGrowth')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="totalUsers" stroke="#FF6B00" strokeWidth={2} dot={false} name={t('reports.cumulativeUsers')} />
              <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={2} dot={false} name={t('reports.newUsers')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.roleDistribution')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={Object.entries(data?.usersByRole || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {Object.entries(data?.usersByRole || {}).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.topBuyers')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">{t('reports.user')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.orderCount')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.totalSpent')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.topBuyers?.map((b: any, i: number) => (
                <tr key={b.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="text-gray-400 w-5">{i + 1}.</span>
                    <span className="font-medium text-gray-900 dark:text-white">{b.name}</span>
                  </td>
                  <td className="text-right py-2.5 px-3 text-gray-700 dark:text-gray-300">{b.orderCount}</td>
                  <td className="text-right py-2.5 px-3 text-gray-700 dark:text-gray-300">{b.totalSpent?.toLocaleString()} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Tab ────────────────────────────────────────────────

function DeliveryTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useDeliveryReport();

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const s = data?.summary;

  const statusLabel = (status: string) => {
    if (status === 'active') return t('reports.online');
    if (status === 'busy') return t('reports.busy');
    return t('reports.offline');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.totalDeliveries')} value={s?.totalDeliveries || 0} />
        <StatCard label={t('reports.avgDeliveryTime')} value={`${s?.avgDeliveryTime || 0} ${t('reports.minutes')}`} />
        <StatCard label={t('reports.onTimeRate')} value={`${s?.onTimeRate || 0}%`} sub={`${s?.lateDeliveries || 0} ${t('reports.lateDeliveries')}`} />
        <StatCard label={t('reports.completedDeliveries')} value={s?.completedDeliveries || 0} sub={`${t('reports.cancelledDeliveries')} ${s?.cancelledDeliveries || 0}`} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.driverPerformance')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">{t('reports.driver')}</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">{t('reports.vehicle')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.orderCount')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.successRate')}</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('reports.rating')}</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.driverPerformance?.map((d: any) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{d.name}</td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">{d.vehicleType}</td>
                  <td className="text-right py-2.5 px-3 text-gray-700 dark:text-gray-300">{d.totalDeliveries}</td>
                  <td className="text-right py-2.5 px-3">
                    <span className={`${(d.successRate || 0) >= 90 ? 'text-green-500' : d.successRate >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {d.successRate}%
                    </span>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <span className="text-yellow-500">⭐ {d.rating?.toFixed(1)}</span>
                  </td>
                  <td className="text-center py-2.5 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      d.status === 'busy' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {statusLabel(d.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Financial Tab ───────────────────────────────────────────────

function FinancialTab() {
  const { t } = useLanguage();
  const [range, setRange] = useState(30);
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
  const { data, isLoading } = useFinancialReport(startDate, endDate);

  const ranges = [
    { label: t('reports.today'), days: 0 },
    { label: t('reports.thisWeek'), days: 7 },
    { label: t('reports.thisMonth'), days: 30 },
    { label: t('reports.lastMonth'), days: 60 },
    { label: t('reports.all'), days: 365 },
  ];

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {ranges.map(r => (
          <button key={r.days} onClick={() => setRange(r.days)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r.days ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.totalRevenue')} value={`${data?.profitLoss?.totalRevenue?.toLocaleString() || 0} FCFA`} />
        <StatCard label={t('reports.platformCommission')} value={`${data?.totalCommission?.toLocaleString() || 0} FCFA`} />
        <StatCard label={t('reports.totalWithdrawals')} value={`${data?.withdrawals?.total?.toLocaleString() || 0} FCFA`} />
        <StatCard label={t('reports.netProfit')} value={`${data?.profitLoss?.netProfit?.toLocaleString() || 0} FCFA`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.revenueTrend')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} FCFA`} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} dot={false} name={t('reports.revenue')} />
              <Line type="monotone" dataKey="commission" data={data?.commissionTrend || []} stroke="#22c55e" strokeWidth={2} dot={false} name={t('reports.platformCommission')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.topRestaurants')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.revenueByRestaurant || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} FCFA`} />
              <Bar dataKey="revenue" fill="#FF6B00" radius={[0, 4, 4, 0]} name={t('reports.revenue')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.withdrawalStatus')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={Object.entries(data?.withdrawals?.byStatus || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name }) => name}>
                {Object.entries(data?.withdrawals?.byStatus || {}).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} FCFA`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.withdrawalUserType')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={Object.entries(data?.withdrawals?.byUserType || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name }) => name}>
                {Object.entries(data?.withdrawals?.byUserType || {}).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} FCFA`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews Tab ─────────────────────────────────────────────────

function ReviewsTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useReviewReport();

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.totalReviews')} value={data?.summary?.totalReviews || 0} />
        <StatCard label={t('reports.avgRating')} value={`${data?.summary?.avgRating || 0} / 5`} />
        <StatCard label={t('reports.fiveStarRatio')} value={`${data?.ratingDistribution?.find((r: any) => r.stars === 5)?.percentage || 0}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.ratingDistribution')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.ratingDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="stars" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF6B00" radius={[4, 4, 0, 0]} name={t('reports.quantity')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.ratingTrend')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.ratingTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} dot={false} name={t('reports.avgRatingLabel')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.topRated')}</h3>
          <div className="space-y-2">
            {data?.topRated?.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <span className="text-sm text-gray-900 dark:text-white"><span className="text-gray-400 mr-2">{i + 1}.</span>{r.name}</span>
                <span className="text-sm text-yellow-500">⭐ {r.avgRating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.lowestRated')}</h3>
          <div className="space-y-2">
            {data?.lowestRated?.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <span className="text-sm text-gray-900 dark:text-white"><span className="text-gray-400 mr-2">{i + 1}.</span>{r.name}</span>
                <span className="text-sm text-red-500">⭐ {r.avgRating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('reports.latestReviews')}</h3>
        <div className="space-y-3">
          {data?.recentReviews?.map((r: any) => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <div className="text-yellow-400 text-sm shrink-0">{'⭐'.repeat(Math.round(r.rating))}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{r.restaurantName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{r.comment || t('reports.noComment')}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{r.createdAt?.split('T')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled Tab ───────────────────────────────────────────────

function ScheduledTab() {
  const { t } = useLanguage();
  const { data: reports, isLoading } = useScheduledReports();
  const createMutation = useCreateScheduledReport();
  const updateMutation = useUpdateScheduledReport();
  const deleteMutation = useDeleteScheduledReport();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'sales', frequency: 'weekly', recipients: '', format: 'pdf' });

  const reportTypes = [
    { value: 'sales', label: t('reports.sales') },
    { value: 'users', label: t('reports.users') },
    { value: 'delivery', label: t('reports.delivery') },
    { value: 'financial', label: t('reports.financial') },
    { value: 'reviews', label: t('reports.reviews') },
  ];

  const frequencies = [
    { value: 'daily', label: t('reports.daily') },
    { value: 'weekly', label: t('reports.weekly') },
    { value: 'monthly', label: t('reports.monthly') },
  ];

  const handleCreate = async () => {
    if (!form.name) return;
    await createMutation.mutateAsync({
      name: form.name,
      type: form.type,
      frequency: form.frequency,
      recipients: form.recipients.split(',').map(s => s.trim()).filter(Boolean),
      format: form.format as 'pdf' | 'csv',
    });
    setForm({ name: '', type: 'sales', frequency: 'weekly', recipients: '', format: 'pdf' });
    setShowForm(false);
  };

  const toggleActive = async (r: any) => {
    await updateMutation.mutateAsync({ id: r.id, is_active: !r.is_active });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('reports.confirmDelete'))) return;
    await deleteMutation.mutateAsync(id);
  };

  const reportTypeLabel = (type: string) => reportTypes.find(rt => rt.value === type)?.label ?? type;
  const frequencyLabel = (freq: string) => frequencies.find(f => f.value === freq)?.label ?? freq;

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('reports.scheduledList')}</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
          {showForm ? t('reports.cancel') : t('reports.newReport')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('reports.reportName')}</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Weekly Sales Report" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('reports.reportType')}</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {reportTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('reports.frequency')}</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('reports.format')}</label>
              <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="pdf">{t('reports.pdf')}</option>
                <option value="csv">{t('reports.csv')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('reports.recipients')}</label>
            <input type="text" value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="admin@dumuni.com, manager@dumuni.com" />
          </div>
          <button onClick={handleCreate} disabled={createMutation.isPending}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {createMutation.isPending ? t('reports.creating') : t('reports.createReport')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {reports?.map((r: any) => (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>{r.is_active ? t('reports.active') : t('reports.inactive')}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {reportTypeLabel(r.type)}
                · {frequencyLabel(r.frequency)}
                · {r.format?.toUpperCase()}
                · {t('reports.recipients').split('（')[0]}: {r.recipients?.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleActive(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  r.is_active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}>
                {r.is_active ? t('reports.disable') : t('reports.enable')}
              </button>
              <button onClick={() => handleDelete(r.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                {t('reports.delete')}
              </button>
            </div>
          </div>
        ))}
        {(!reports || reports.length === 0) && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">{t('reports.noScheduledReports')}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const COLORS = ['#FF6B00', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function ReportsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sales');

  const tabs = [
    { key: 'sales', label: t('reports.sales'), icon: '📊' },
    { key: 'users', label: t('reports.users'), icon: '👥' },
    { key: 'delivery', label: t('reports.delivery'), icon: '🚚' },
    { key: 'financial', label: t('reports.financial'), icon: '💰' },
    { key: 'reviews', label: t('reports.reviews'), icon: '⭐' },
    { key: 'scheduled', label: t('reports.scheduled'), icon: '⏰' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('reports.subtitle')}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && <SalesTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'delivery' && <DeliveryTab />}
      {activeTab === 'financial' && <FinancialTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'scheduled' && <ScheduledTab />}
    </div>
  );
}
