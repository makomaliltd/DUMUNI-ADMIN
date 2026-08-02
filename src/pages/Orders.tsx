import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders, useAvailableDrivers, useBulkAssignDriver, useBulkUpdateStatus, subscribeToOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Download, Eye, Search, Truck, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderStatus, type Order } from '@/types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'accepted', label: '已接单' },
  { value: 'preparing', label: '准备中' },
  { value: 'ready', label: '已备好' },
  { value: 'delivering', label: '配送中' },
  { value: 'delivered', label: '已送达' },
  { value: 'cancelled', label: '已取消' },
  { value: 'rejected', label: '已拒绝' },
];

const paymentOptions = [
  { value: 'all', label: '全部支付' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'refunded', label: '已退款' },
];

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [restaurantId, setRestaurantId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('accepted');
  const [bulkDriverId, setBulkDriverId] = useState('');

  const filters = {
    page,
    pageSize: 50,
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
    restaurantId: restaurantId !== 'all' ? restaurantId : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    amountMin: amountMin ? Number(amountMin) : undefined,
    amountMax: amountMax ? Number(amountMax) : undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, error } = useOrders(filters);
  const { data: driversData } = useAvailableDrivers();
  const bulkAssign = useBulkAssignDriver();
  const bulkStatusMut = useBulkUpdateStatus();

  const orders = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToOrders((payload) => {
      if (soundEnabled && payload.eventType === 'INSERT') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { /* ignored */ });
        } catch { /* audio not available */ }
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });
    return unsub;
  }, [soundEnabled, queryClient]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o: any) => o.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkDriverId || selectedIds.size === 0) return;
    await bulkAssign.mutateAsync({ orderIds: Array.from(selectedIds), driverId: bulkDriverId });
    setSelectedIds(new Set());
    setAssignDialogOpen(false);
  };

  const handleBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    await bulkStatusMut.mutateAsync({ orderIds: Array.from(selectedIds), status: bulkStatus });
    setSelectedIds(new Set());
    setStatusDialogOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['订单ID', '顾客', '餐厅', '骑手', '金额', '状态', '支付状态', '下单时间'];
    const rows = orders.map((o: any) => [
      o.id.slice(0, 8), o.customer_name, o.restaurant_name || '', o.driver_name || '',
      o.amount, ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status, o.payment_status,
      new Date(o.created_at).toLocaleString('zh-CN'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">订单管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 条订单</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? '关闭新订单提示音' : '开启新订单提示音'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />刷新
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />导出 CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索订单 ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={v => { setPaymentStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {paymentOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            更多筛选
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">最低金额</label>
              <Input type="number" placeholder="0" value={amountMin} onChange={e => setAmountMin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">最高金额</label>
              <Input type="number" placeholder="9999" value={amountMax} onChange={e => setAmountMax(e.target.value)} />
            </div>
          </div>
        )}
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <span className="text-sm font-medium">已选 {selectedIds.size} 条</span>
          <Button size="sm" variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <Truck className="h-3.5 w-3.5 mr-1.5" />分配骑手
          </Button>
          <Button size="sm" variant="outline" onClick={() => setStatusDialogOpen(true)}>
            批量更新状态
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">订单 ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">顾客</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">餐厅</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">骑手</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  <button onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }} className="hover:text-foreground">
                    金额 {sortBy === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">支付</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  <button onClick={() => { setSortBy('created_at'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }} className="hover:text-foreground">
                    时间 {sortBy === 'created_at' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </button>
                </th>
                <th className="w-20 px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">加载中...</td></tr>
              ) : error ? (
                <tr><td colSpan={10} className="text-center py-12 text-red-500">加载失败</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">暂无订单</td></tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.customer_name}</td>
                    <td className="px-4 py-3 text-sm">{order.restaurant_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{order.driver_name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium">¥{Number(order.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_COLORS[order.status as OrderStatus] as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.payment_status === 'paid' ? '已支付' : order.payment_status === 'pending' ? '待支付' : order.payment_status}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/orders/${order.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</Button>
          </div>
        </div>
      )}

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>批量分配骑手</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">为 {selectedIds.size} 条订单分配骑手</p>
            <Select value={bulkDriverId} onValueChange={setBulkDriverId}>
              <SelectTrigger><SelectValue placeholder="选择骑手" /></SelectTrigger>
              <SelectContent>
                {driversData?.data?.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name} - {d.phone} ({d.vehicle_type})</SelectItem>
                )) || <SelectItem value="__none__">暂无可用骑手</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>取消</Button>
            <Button onClick={handleBulkAssign} disabled={!bulkDriverId}>确认分配</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>批量更新状态</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">更新 {selectedIds.size} 条订单的状态</p>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.filter(o => o.value !== 'all').map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>取消</Button>
            <Button onClick={handleBulkStatus}>确认更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}