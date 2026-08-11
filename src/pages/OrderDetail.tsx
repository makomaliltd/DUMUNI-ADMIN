import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useOrderItems, useOrderStatusLogs, useUpdateOrderStatus, useAssignDriver, useRefundOrder, useAvailableDrivers } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Truck, XCircle, RefreshCcw, CheckCircle2, Circle } from 'lucide-react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OrderDetail() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: orderData, isLoading } = useOrder(id || '');
  const { data: itemsData } = useOrderItems(id || '');
  const { data: logsData } = useOrderStatusLogs(id || '');
  const { data: driversData } = useAvailableDrivers();
  const updateStatus = useUpdateOrderStatus();
  const assignDriver = useAssignDriver();
  const refundOrder = useRefundOrder();

  const order = orderData?.data;
  const items = itemsData?.data || [];
  const logs = logsData?.data || [];
  const drivers = driversData?.data || [];

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [assignDriverId, setAssignDriverId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">{t('orderDetail.loading')}</div>;
  if (!order) return <div className="py-12 text-center text-red-500">{t('orderDetail.notFound')}</div>;

  const currentStatus = order.status as OrderStatus;
  const validTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    await updateStatus.mutateAsync({ id: order.id, status: selectedStatus as OrderStatus });
    setSelectedStatus('');
    setStatusNote('');
  };

  const handleAssignDriver = async () => {
    if (!assignDriverId) return;
    await assignDriver.mutateAsync({ orderId: order.id, driverId: assignDriverId });
    setAssignDriverId('');
  };

  const handleCancel = async () => {
    await updateStatus.mutateAsync({ id: order.id, status: 'cancelled' });
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const handleRefund = async () => {
    await refundOrder.mutateAsync({ id: order.id, reason: refundReason });
    setShowRefundDialog(false);
    setRefundReason('');
  };

  const timelineSteps = [
    { key: 'pending', labelKey: 'orderDetail.timeline.created' },
    { key: 'accepted', labelKey: 'orderDetail.timeline.accepted' },
    { key: 'preparing', labelKey: 'orderDetail.timeline.preparing' },
    { key: 'ready', labelKey: 'orderDetail.timeline.ready' },
    { key: 'delivering', labelKey: 'orderDetail.timeline.delivering' },
    { key: 'delivered', labelKey: 'orderDetail.timeline.delivered' },
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'rejected';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t('orderDetail.title')} #{order.id.slice(0, 8)}</h1>
            <Badge variant={ORDER_STATUS_COLORS[currentStatus] as 'default' | 'secondary' | 'destructive' | 'outline'}>
              {ORDER_STATUS_LABELS[currentStatus]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.created_at).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="col-span-2 space-y-6">
          {/* Customer & Restaurant */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">{t('orderDetail.customerInfo')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.customerName')}</span><span>{order.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.customerPhone')}</span><span>{order.customer_phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.customerEmail')}</span><span>{order.customer_email || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.customerAddress')}</span><span className="text-right max-w-[200px]">{order.delivery_address || '-'}</span></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">{t('orderDetail.restaurantInfo')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.restaurantName')}</span><span>{order.restaurant_name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.driverName')}</span><span>{order.driver_name || t('orderDetail.unassigned')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.driverPhone')}</span><span>{order.driver_phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.vehicle')}</span><span>{order.driver_vehicle || '-'}</span></div>
              </div>
            </Card>
          </div>

          {/* Order Items */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t('orderDetail.orderItems')}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">{t('orderDetail.menuItem')}</th>
                  <th className="pb-2 font-medium text-muted-foreground">{t('orderDetail.quantity')}</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">{t('orderDetail.unitPrice')}</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">{t('orderDetail.subtotalCol')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">x{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(item.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Timeline */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4">{t('orderDetail.orderTimeline')}</h3>
            {isCancelled ? (
              <div className="space-y-3">
                {logs.map((log: any, i: number) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground mt-1.5" />
                      {i < logs.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div>
                      <p className="text-sm">{log.to_status === 'cancelled' ? t('orderDetail.orderCancelled') : ORDER_STATUS_LABELS[log.to_status as OrderStatus] || log.to_status}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
                      {log.note && <p className="text-xs text-muted-foreground mt-0.5">{t('orderDetail.note')}: {log.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start justify-between">
                {timelineSteps.map((step, i) => {
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const log = logs.find((l: any) => l.to_status === step.key);
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        isCurrent ? 'bg-orange-500 text-white' :
                        isActive ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isActive && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> :
                         isCurrent ? <Circle className="h-4 w-4" /> :
                         <span className="text-xs">{i + 1}</span>}
                      </div>
                      <p className={`text-xs mt-2 text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                        {t(step.labelKey)}
                      </p>
                      {log && (
                        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {i < timelineSteps.length - 1 && (
                        <div className={`absolute top-4 left-[60%] w-[80%] h-0.5 -z-0 ${
                          i < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Payment & Actions */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t('orderDetail.paymentInfo')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.subtotal')}</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.deliveryFee')}</span><span>{formatCurrency(Number(order.delivery_fee))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('orderDetail.platformCommission')}</span><span>{formatCurrency(Number(order.commission))}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>{t('orderDetail.total')}</span><span className="text-orange-600">{formatCurrency(Number(order.amount))}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">{t('orderDetail.paymentStatus')}</span>
                <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'refunded' ? 'warning' : 'secondary'}>
                  {order.payment_status === 'paid' ? t('orderDetail.paid') : order.payment_status === 'pending' ? t('orderDetail.paymentPending') : order.payment_status === 'refunded' ? t('orderDetail.refunded') : order.payment_status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t('orderDetail.actions')}</h3>
            <div className="space-y-3">
              {/* Status Update */}
              {validTransitions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">{t('orderDetail.updateStatus')}</label>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as OrderStatus)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder={t('orderDetail.selectStatus')} /></SelectTrigger>
                      <SelectContent>
                        {validTransitions.map((s: string) => (
                          <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s as OrderStatus]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleStatusUpdate} disabled={!selectedStatus || updateStatus.isPending}>
                      {t('common.confirm')}
                    </Button>
                  </div>
                  <Input
                    placeholder={t('orderDetail.noteOptional')}
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              {/* Assign Driver */}
              {currentStatus === 'ready' && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">{t('orderDetail.assignDriver')}</label>
                  <div className="flex gap-2">
                    <Select value={assignDriverId} onValueChange={setAssignDriverId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder={t('orderDetail.selectDriver')} /></SelectTrigger>
                      <SelectContent>
                        {drivers.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.vehicle_type})</SelectItem>
                        ))}
                        {drivers.length === 0 && <SelectItem value="__none__">{t('orderDetail.noDriversAvailable')}</SelectItem>}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAssignDriver} disabled={!assignDriverId}>
                      <Truck className="h-3.5 w-3.5 mr-1" />{t('orderDetail.assign')}
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCancelDialog(true)} disabled={currentStatus === 'delivered' || currentStatus === 'cancelled'}>
                  <XCircle className="h-4 w-4 mr-2" />{t('orderDetail.cancelOrder')}
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowRefundDialog(true)} disabled={order.payment_status !== 'paid'}>
                  <RefreshCcw className="h-4 w-4 mr-2" />{t('orderDetail.refund')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('orderDetail.cancelOrder')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('orderDetail.confirmCancel')}</p>
            <Textarea
              placeholder={t('orderDetail.cancelReason')}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>{t('common.back')}</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason}>{t('orderDetail.confirmCancelAction')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('orderDetail.refund')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('orderDetail.refundAmount')}: {formatCurrency(Number(order.amount))}</p>
            <Textarea
              placeholder={t('orderDetail.refundReason')}
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>{t('common.back')}</Button>
            <Button onClick={handleRefund} disabled={!refundReason}>{t('orderDetail.confirmRefund')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}