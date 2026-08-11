import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinanceDashboard, useWithdrawals, useProcessWithdrawal, useFinanceTransactions } from '@/hooks/useFinance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#FF6B00', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useFinanceDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label={t('finance.totalRevenue')} value={formatCurrency(data?.totalRevenue)} />
        <StatCard label={t('finance.monthRevenue')} value={formatCurrency(data?.monthRevenue)} />
        <StatCard label={t('finance.pendingWithdrawals')} value={formatCurrency(data?.pendingWithdrawals)} />
        <StatCard label={t('finance.totalCommission')} value={formatCurrency(data?.totalCommission)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('finance.revenueByMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance.revenueByRestaurant')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.revenueByRestaurant || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v: any) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#FF6B00" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('finance.commissionBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.commissionBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {(data?.commissionBreakdown || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance.incomeSourceDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.incomeSourceDistribution || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.incomeSourceDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('finance.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline">{t('finance.processWithdrawals')}</Button>
          <Button variant="outline">{t('finance.configureCommission')}</Button>
          <Button variant="outline">{t('finance.exportTransactions')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WithdrawalsTab() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useWithdrawals({ status: status === 'all' ? undefined : status, type: type === 'all' ? undefined : type, page });
  const processMutation = useProcessWithdrawal();

  const handleApprove = async (id: string) => {
    await processMutation.mutateAsync({ id, action: 'approve' });
  };

  const handleReject = async () => {
    if (!selectedId || !rejectReason.trim()) return;
    await processMutation.mutateAsync({ id: selectedId, action: 'reject', reason: rejectReason });
    setSelectedId(null);
    setRejectReason('');
  };

  const handleComplete = async (id: string) => {
    await processMutation.mutateAsync({ id, action: 'complete' });
  };

  const withdrawals = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('finance.allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finance.allStatus')}</SelectItem>
            <SelectItem value="pending">{t('finance.pending')}</SelectItem>
            <SelectItem value="approved">{t('finance.approved')}</SelectItem>
            <SelectItem value="rejected">{t('finance.rejected')}</SelectItem>
            <SelectItem value="completed">{t('finance.completed')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('finance.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finance.allTypes')}</SelectItem>
            <SelectItem value="seller">{t('finance.seller')}</SelectItem>
            <SelectItem value="driver">{t('finance.driver')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button variant="outline">{t('finance.bulkApprove')}</Button>
        <Button variant="outline">{t('finance.bulkReject')}</Button>
        <Button variant="outline">{t('finance.export')}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
      ) : (
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('finance.applicant')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('finance.type')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('finance.phone')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('finance.amount')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('finance.status')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('finance.applyTime')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w: any) => (
                <tr key={w.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{w.applicant_name || w.user_id}</td>
                  <td className="px-4 py-3 capitalize">{w.user_type}</td>
                  <td className="px-4 py-3">{w.phone || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(w.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      w.status === 'completed' ? 'bg-green-100 text-green-700' :
                      w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {t(`common.${w.status}`) || w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {w.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(w.id)}>{t('finance.approve')}</Button>
                          <Button size="sm" variant="destructive" onClick={() => setSelectedId(w.id)}>{t('finance.reject')}</Button>
                        </>
                      )}
                      {w.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleComplete(w.id)}>{t('finance.markCompleted')}</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span>{t('finance.totalItems')} {data?.total || 0}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t('common.previous')}</Button>
            <span className="flex items-center px-2">{t('finance.page')} {page} {t('common.of')} {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t('common.next')}</Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finance.withdrawalDetail')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">{t('finance.rejectReason')}</label>
              <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t('finance.enterRejectReason')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedId(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>{t('finance.confirmReject')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionsTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useFinanceTransactions();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.transactionRecords')}</CardTitle>
          <CardDescription>{t('finance.transactionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('common.date')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('common.type')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('common.name')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('finance.amount')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.transactions || []).map((tx: any) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 capitalize">{tx.type}</td>
                      <td className="px-4 py-3">{tx.description || '-'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">{t('common.completed')}</span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.transactions || data.transactions.length === 0) && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.financialSettings')}</CardTitle>
          <CardDescription>{t('finance.settingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('finance.settingsDesc')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinancePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('nav.finance')}</h1>
        <p className="text-muted-foreground">{t('finance.overview')}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('finance.overview')}</TabsTrigger>
          <TabsTrigger value="withdrawals">{t('finance.withdrawals')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('finance.transactions')}</TabsTrigger>
          <TabsTrigger value="settings">{t('finance.settings')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
