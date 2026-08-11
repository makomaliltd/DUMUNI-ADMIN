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
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const statusOptions = [
  { value: 'all', labelKey: 'orders.allStatus' },
  { value: 'pending', labelKey: 'orders.pending' },
  { value: 'accepted', labelKey: 'orders.accepted' },
  { value: 'preparing', labelKey: 'orders.preparing' },
  { value: 'ready', labelKey: 'orders.ready' },
  { value: 'delivering', labelKey: 'orders.delivering' },
  { value: 'delivered', labelKey: 'orders.delivered' },
  { value: 'cancelled', labelKey: 'orders.cancelled' },
  { value: 'rejected', labelKey: 'orders.rejected' },
];

const paymentOptions = [
  { value: 'all', labelKey: 'orders.allPayment' },
  { value: 'pending', labelKey: 'orders.paymentPending' },
  { value: 'paid', labelKey: 'orders.paid' },
  { value: 'refunded', labelKey: 'orders.refunded' },
];

export default function Orders() {
  const { t } = useLanguage();
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
    const headers = t('orders.csvHeaders').split(',');
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
          <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('orders.totalOrders').replace('{total}', String(total))}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? t('orders.soundOn') : t('orders.soundOff')}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />{t('orders.refresh')}
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />{t('orders.exportCSV')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('orders.searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={v => { setPaymentStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {paymentOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {t('orders.moreFilters')}
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('orders.dateFrom')}</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('orders.dateTo')}</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('orders.amountMin')}</label>
              <Input type="number" placeholder="0" value={amountMin} onChange={e => setAmountMin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('orders.amountMax')}</label>
              <Input type="number" placeholder="9999" value={amountMax} onChange={e => setAmountMax(e.target.value)} />
            </div>
          </div>
        )}
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <span className="text-sm font-medium">{t('orders.selected').replace('{count}', String(selectedIds.size))}</span>
          <Button size="sm" variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <Truck className="h-3.5 w-3.5 mr-1.5" />{t('orders.assignDriver')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setStatusDialogOpen(true)}>
            {t('orders.bulkUpdateStatus')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>{t('orders.deselectAll')}</Button>
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
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.orderId')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.customer')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.restaurant')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.driver')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  <button onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }} className="hover:text-foreground">
                    {t('orders.total')} {sortBy === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.status')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.payment')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  <button onClick={() => { setSortBy('created_at'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }} className="hover:text-foreground">
                    {t('orders.createdAt')} {sortBy === 'created_at' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </button>
                </th>
                <th className="w-20 px-4 py-3 text-xs font-medium text-muted-foreground">{t('orders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">{t('orders.loading')}</td></tr>
              ) : error ? (
                <tr><td colSpan={10} className="text-center py-12 text-red-500">{t('orders.loadError')}</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">{t('orders.noOrders')}</td></tr>
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
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(Number(order.amount))}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_COLORS[order.status as OrderStatus] as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.payment_status === 'paid' ? t('orders.paid') : order.payment_status === 'pending' ? t('orders.paymentPending') : order.payment_status === 'refunded' ? t('orders.refunded') : order.payment_status}</td>
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
          <span className="text-sm text-muted-foreground">{t('orders.pageInfo').replace('{page}', String(page)).replace('{totalPages}', String(totalPages))}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{t('orders.previous')}</Button>
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
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{t('orders.next')}</Button>
          </div>
        </div>
      )}

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('orders.bulkAssignDriver')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('orders.assignDriverFor').replace('{count}', String(selectedIds.size))}</p>
            <Select value={bulkDriverId} onValueChange={setBulkDriverId}>
              <SelectTrigger><SelectValue placeholder={t('orders.selectDriver')} /></SelectTrigger>
              <SelectContent>
                {driversData?.data?.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name} - {d.phone} ({d.vehicle_type})</SelectItem>
                )) || <SelectItem value="__none__">{t('orders.noDriversAvailable')}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleBulkAssign} disabled={!bulkDriverId}>{t('orders.confirmAssign')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('orders.bulkUpdateStatus')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('orders.updateStatusFor').replace('{count}', String(selectedIds.size))}</p>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.filter(o => o.value !== 'all').map(o => (
                  <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleBulkStatus}>{t('orders.confirmUpdate')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}