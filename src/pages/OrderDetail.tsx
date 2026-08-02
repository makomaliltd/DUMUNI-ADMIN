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

export default function OrderDetail() {
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

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">加载中...</div>;
  if (!order) return <div className="py-12 text-center text-red-500">订单不存在</div>;

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
    { key: 'pending', label: '创建订单' },
    { key: 'accepted', label: '商家接单' },
    { key: 'preparing', label: '准备中' },
    { key: 'ready', label: '已备好' },
    { key: 'delivering', label: '配送中' },
    { key: 'delivered', label: '已送达' },
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
            <h1 className="text-2xl font-bold">订单 #{order.id.slice(0, 8)}</h1>
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
              <h3 className="text-sm font-semibold mb-3">顾客信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">姓名</span><span>{order.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">电话</span><span>{order.customer_phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">邮箱</span><span>{order.customer_email || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">地址</span><span className="text-right max-w-[200px]">{order.delivery_address || '-'}</span></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">餐厅信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">名称</span><span>{order.restaurant_name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">骑手</span><span>{order.driver_name || '未分配'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">骑手电话</span><span>{order.driver_phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">车辆</span><span>{order.driver_vehicle || '-'}</span></div>
              </div>
            </Card>
          </div>

          {/* Order Items */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">菜品清单</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">菜品</th>
                  <th className="pb-2 font-medium text-muted-foreground">数量</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">单价</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">小计</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">x{item.quantity}</td>
                    <td className="py-2 text-right">¥{Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-2 text-right">¥{Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Timeline */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4">订单时间线</h3>
            {isCancelled ? (
              <div className="space-y-3">
                {logs.map((log: any, i: number) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground mt-1.5" />
                      {i < logs.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div>
                      <p className="text-sm">{log.to_status === 'cancelled' ? `订单已取消` : ORDER_STATUS_LABELS[log.to_status as OrderStatus] || log.to_status}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
                      {log.note && <p className="text-xs text-muted-foreground mt-0.5">备注: {log.note}</p>}
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
                        {step.label}
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
            <h3 className="text-sm font-semibold mb-3">支付信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">小计</span><span>¥{Number(order.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">配送费</span><span>¥{Number(order.delivery_fee).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">平台佣金</span><span>¥{Number(order.commission).toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>总计</span><span className="text-orange-600">¥{Number(order.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">支付状态</span>
                <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'refunded' ? 'warning' : 'secondary'}>
                  {order.payment_status === 'paid' ? '已支付' : order.payment_status === 'pending' ? '待支付' : order.payment_status === 'refunded' ? '已退款' : order.payment_status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">操作</h3>
            <div className="space-y-3">
              {/* Status Update */}
              {validTransitions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">更新状态</label>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as OrderStatus)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="选择状态" /></SelectTrigger>
                      <SelectContent>
                        {validTransitions.map((s: string) => (
                          <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s as OrderStatus]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleStatusUpdate} disabled={!selectedStatus || updateStatus.isPending}>
                      确认
                    </Button>
                  </div>
                  <Input
                    placeholder="备注（可选）"
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              {/* Assign Driver */}
              {currentStatus === 'ready' && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">分配骑手</label>
                  <div className="flex gap-2">
                    <Select value={assignDriverId} onValueChange={setAssignDriverId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="选择骑手" /></SelectTrigger>
                      <SelectContent>
                        {drivers.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.vehicle_type})</SelectItem>
                        ))}
                        {drivers.length === 0 && <SelectItem value="__none__">暂无可用骑手</SelectItem>}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAssignDriver} disabled={!assignDriverId}>
                      <Truck className="h-3.5 w-3.5 mr-1" />分配
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCancelDialog(true)} disabled={currentStatus === 'delivered' || currentStatus === 'cancelled'}>
                  <XCircle className="h-4 w-4 mr-2" />取消订单
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowRefundDialog(true)} disabled={order.payment_status !== 'paid'}>
                  <RefreshCcw className="h-4 w-4 mr-2" />退款处理
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>取消订单</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">确定要取消此订单吗？此操作不可撤销。</p>
            <Textarea
              placeholder="取消原因"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>返回</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason}>确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>退款处理</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">退款金额: ¥{Number(order.amount).toFixed(2)}</p>
            <Textarea
              placeholder="退款原因"
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>返回</Button>
            <Button onClick={handleRefund} disabled={!refundReason}>确认退款</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}