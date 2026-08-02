import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceOverview, useWithdrawals, useUpdateWithdrawalStatus, useBulkWithdrawalAction, useWithdrawalDetail } from '@/hooks/useFinance';
import type { Withdrawal } from '@/types';
import { useRestaurants } from '@/hooks/useRestaurants';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/ChartCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, TrendingUp, Clock, Percent, Eye, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#FF6B00', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

function formatFCFA(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA'; }

export default function FinancePage() {
  const [tab, setTab] = useState<'overview' | 'withdrawals' | 'transactions' | 'settings'>('overview');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const tabs = [
    { key: 'overview', label: t('finance.overview'), icon: TrendingUp },
    { key: 'withdrawals', label: t('finance.withdrawals'), icon: Clock },
    { key: 'transactions', label: t('finance.transactions'), icon: DollarSign },
    { key: 'settings', label: t('finance.settings'), icon: Percent },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <FinanceOverview />}
      {tab === 'withdrawals' && <WithdrawalsPage />}
      {tab === 'transactions' && <TransactionsPage />}
      {tab === 'settings' && <FinancialSettings />}
    </div>
  );
}

function FinanceOverview() {
  const { data: overview, isLoading } = useFinanceOverview();
  const { data: restaurants } = useRestaurants({ page: 1, pageSize: 50 });
  const { t } = useLanguage();

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#FF6B00] border-t-transparent rounded-full" /></div>;

  const stats = {
    totalRevenue: overview?.totalRevenue ?? 0,
    monthRevenue: overview?.monthRevenue ?? 0,
    pendingWithdrawals: overview?.pendingWithdrawals ?? 0,
    totalCommission: overview?.totalCommission ?? 0,
    revenueByMonth: overview?.revenueByMonth ?? [],
    revenueByRestaurant: overview?.revenueByRestaurant ?? [],
    commissionBreakdown: overview?.commissionBreakdown ?? [],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('finance.totalRevenue')} value={formatFCFA(stats.totalRevenue)} icon={DollarSign} trend={12.5} />
        <StatCard title={t('finance.monthRevenue')} value={formatFCFA(stats.monthRevenue)} icon={TrendingUp} trend={8.3} />
        <StatCard title={t('finance.pendingWithdrawals')} value={String(stats.pendingWithdrawals)} icon={Clock} />
        <StatCard title={t('finance.totalCommission')} value={formatFCFA(stats.totalCommission)} icon={Percent} trend={15.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('finance.revenueByMonth')} subtitle={t('common.last12Months')} className="col-span-1">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.revenueByMonth.length > 0 ? stats.revenueByMonth : mockRevenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} name="收入" dot={false} />
              <Line type="monotone" dataKey="commission" stroke="#22c55e" strokeWidth={2} name="佣金" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('finance.revenueByRestaurant')} subtitle={t('finance.byTotalRevenue')} className="col-span-1">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.revenueByRestaurant.length > 0 ? stats.revenueByRestaurant.slice(0, 10) : mockRevenueByRestaurant} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="revenue" fill="#FF6B00" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('finance.commissionBreakdown')} subtitle={t('finance.incomeSourceDistribution')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.commissionBreakdown.length > 0 ? stats.commissionBreakdown : mockCommissionBreakdown}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {(stats.commissionBreakdown.length > 0 ? stats.commissionBreakdown : mockCommissionBreakdown).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">{t('finance.quickActions')}</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start bg-[#FF6B00] hover:bg-[#e86000] text-white" onClick={() => window.location.href = '/finance?tab=withdrawals'}>
                <Clock className="h-4 w-4 mr-2" /> {t('finance.processWithdrawals')}
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/finance?tab=settings'}>
                <Percent className="h-4 w-4 mr-2" /> {t('finance.configureCommission')}
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/finance?tab=transactions'}>
                <Download className="h-4 w-4 mr-2" /> {t('finance.exportTransactions')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const mockRevenueByMonth = [
  { month: '8月', revenue: 45000, commission: 4500 }, { month: '9月', revenue: 52000, commission: 5200 },
  { month: '10月', revenue: 48000, commission: 4800 }, { month: '11月', revenue: 61000, commission: 6100 },
  { month: '12月', revenue: 58000, commission: 5800 }, { month: '1月', revenue: 63000, commission: 6300 },
  { month: '2月', revenue: 55000, commission: 5500 }, { month: '3月', revenue: 72000, commission: 7200 },
  { month: '4月', revenue: 68000, commission: 6800 }, { month: '5月', revenue: 75000, commission: 7500 },
  { month: '6月', revenue: 82000, commission: 8200 }, { month: '7月', revenue: 78000, commission: 7800 },
];

const mockRevenueByRestaurant = [
  { name: '川味轩', revenue: 45000 }, { name: '粤港茶餐厅', revenue: 38000 },
  { name: '味千拉面', revenue: 32000 }, { name: '鼎泰丰', revenue: 29000 },
  { name: '海底捞', revenue: 26000 }, { name: '外婆家', revenue: 23000 },
  { name: '西贝莜面村', revenue: 21000 }, { name: '太二酸菜鱼', revenue: 18000 },
  { name: '小龙坎火锅', revenue: 16000 }, { name: '奈雪的茶', revenue: 14000 },
];

const mockCommissionBreakdown = [
  { name: '订单佣金', value: 45000 }, { name: '配送费', value: 12000 },
  { name: '平台服务费', value: 8000 }, { name: '广告收入', value: 5000 },
  { name: '其他', value: 3000 },
];

function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionModal, setActionModal] = useState<{ id: string; action: string } | null>(null);

  const { data, isLoading } = useWithdrawals({ page, pageSize: 15, status: statusFilter || undefined, type: typeFilter || undefined });
  const updateStatus = useUpdateWithdrawalStatus();
  const bulkAction = useBulkWithdrawalAction();

  const handleAction = (id: string, action: string) => {
    if (action === 'rejected' && !rejectReason) { setActionModal({ id, action }); return; }
    updateStatus.mutate({ id, status: action, reason: rejectReason });
    setActionModal(null); setRejectReason('');
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) return;
    bulkAction.mutate({ ids: selectedIds, action });
    setSelectedIds([]);
  };

  const allSelected = (data?.data?.length || 0) > 0 && selectedIds.length === (data?.data?.length || 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="seller">商家</SelectItem>
            <SelectItem value="driver">骑手</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleBulkAction('approved')}>
              <CheckCircle className="h-4 w-4 mr-1" /> 批量通过 ({selectedIds.length})
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleBulkAction('rejected')}>
              <XCircle className="h-4 w-4 mr-1" /> 批量拒绝
            </Button>
          </div>
        )}
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> 导出</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={() => {
                      if (allSelected) setSelectedIds([]);
                      else setSelectedIds(data?.data?.map(d => d.id) || []);
                    }} />
                  </th>
                  <th className="text-left p-3 font-medium">申请人</th>
                  <th className="text-left p-3 font-medium">类型</th>
                  <th className="text-left p-3 font-medium">手机号</th>
                  <th className="text-right p-3 font-medium">金额</th>
                  <th className="text-center p-3 font-medium">状态</th>
                  <th className="text-left p-3 font-medium">申请时间</th>
                  <th className="text-center p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">加载中...</td></tr>
                ) : (!data?.data || data.data.length === 0) ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">暂无数据</td></tr>
                ) : data.data.map((w: Withdrawal) => (
                  <tr key={w.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3"><Checkbox checked={selectedIds.includes(w.id)} onCheckedChange={() => {
                      setSelectedIds(p => p.includes(w.id) ? p.filter(x => x !== w.id) : [...p, w.id]);
                    }} /></td>
                    <td className="p-3 font-medium">{w.user_name}</td>
                    <td className="p-3"><Badge variant="outline">{w.user_type === 'seller' ? '商家' : '骑手'}</Badge></td>
                    <td className="p-3">{w.phone_number}</td>
                    <td className="p-3 text-right font-mono">{formatFCFA(Number(w.amount))}</td>
                    <td className="p-3 text-center"><Badge variant={WITHDRAWAL_STATUS_COLORS[w.status] as 'warning' | 'info' | 'destructive' | 'success'}>{WITHDRAWAL_STATUS_LABELS[w.status]}</Badge></td>
                    <td className="p-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(detailId === w.id ? null : w.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data?.total && data.total > 15 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">共 {data.total} 条</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="flex items-center text-sm px-2">第 {page} 页</span>
            <Button variant="outline" size="sm" disabled={page * 15 >= (data.total || 0)} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Detail expand */}
      {detailId && <WithdrawalDetail id={detailId} onClose={() => setDetailId(null)} onAction={handleAction} />}

      {/* Reject reason modal */}
      <Dialog open={!!actionModal} onOpenChange={() => { setActionModal(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>拒绝原因</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Label>请输入拒绝原因</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="请填写拒绝原因..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionModal(null); setRejectReason(''); }}>取消</Button>
            <Button variant="destructive" onClick={() => actionModal && handleAction(actionModal.id, 'rejected')}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WithdrawalDetail({ id, onClose, onAction }: { id: string; onClose: () => void; onAction: (id: string, action: string) => void }) {
  const { data: detail, isLoading } = useWithdrawalDetail(id);

  if (isLoading) return <div className="text-center py-4">加载中...</div>;
  if (!detail) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">提现详情</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><span className="text-sm text-muted-foreground">申请人</span><p className="font-medium">{detail.user_name}</p></div>
          <div><span className="text-sm text-muted-foreground">类型</span><p className="font-medium">{detail.user_type === 'seller' ? '商家' : '骑手'}</p></div>
          <div><span className="text-sm text-muted-foreground">手机号</span><p className="font-medium">{detail.phone_number}</p></div>
          <div><span className="text-sm text-muted-foreground">金额</span><p className="font-medium text-[#FF6B00]">{formatFCFA(Number(detail.amount))}</p></div>
          <div><span className="text-sm text-muted-foreground">状态</span><p><Badge variant={WITHDRAWAL_STATUS_COLORS[detail.status] as any}>{WITHDRAWAL_STATUS_LABELS[detail.status]}</Badge></p></div>
          <div><span className="text-sm text-muted-foreground">申请时间</span><p className="font-medium">{new Date(detail.created_at).toLocaleString('zh-CN')}</p></div>
        </div>
        {detail.status === 'pending' && (
          <div className="flex gap-3">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onAction(detail.id, 'approved')}>
              <CheckCircle className="h-4 w-4 mr-1" /> 通过
            </Button>
            <Button variant="destructive" onClick={() => onAction(detail.id, 'rejected')}>
              <XCircle className="h-4 w-4 mr-1" /> 拒绝
            </Button>
          </div>
        )}
        {detail.status === 'approved' && (
          <Button className="bg-[#FF6B00] hover:bg-[#e86000] text-white" onClick={() => onAction(detail.id, 'completed')}>
            <CheckCircle className="h-4 w-4 mr-1" /> 标记为已完成
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionsPage() {
  // Simplified transaction listing
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>交易记录页面</p>
            <p className="text-sm mt-1">通过财务 API 获取完整交易历史</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialSettings() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="text-center">
            <Percent className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>财务设置页面</p>
            <p className="text-sm mt-1">配置佣金率、配送费、支付网关等</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: '待审核', approved: '已通过', rejected: '已拒绝', completed: '已完成',
};
const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  pending: 'warning', approved: 'info', rejected: 'destructive', completed: 'success',
};