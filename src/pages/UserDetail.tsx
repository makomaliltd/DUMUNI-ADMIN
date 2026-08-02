import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Shield, Truck, Store, CreditCard, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useUserOrders, useUserTransactions, useUserDeliveries, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useState } from 'react';
import { EditUserModal } from '@/components/EditUserModal';

const roleLabels: Record<string, string> = {
  admin: '管理员', editor: '编辑', viewer: '访客',
  buyer: '买家', seller: '商家', driver: '骑手',
};
const roleColors: Record<string, string> = {
  admin: 'destructive', editor: 'info', viewer: 'secondary',
  buyer: 'default', seller: 'success', driver: 'warning',
};
const statusColors: Record<string, string> = {
  active: 'success', suspended: 'destructive',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useUser(id);
  const [editOpen, setEditOpen] = useState(false);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">用户不存在或加载失败</p>
        <Button variant="outline" onClick={() => navigate('/users')}>返回用户列表</Button>
      </div>
    );
  }

  const handleSuspendToggle = async () => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await updateUser.mutateAsync({ id: user.id, status: newStatus });
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除此用户吗？此操作不可撤销。')) return;
    await deleteUser.mutateAsync(user.id);
    navigate('/users');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.full_name || '未命名用户'}</h1>
          <p className="text-sm text-muted-foreground">用户详情与信息管理</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {(user.full_name || user.email)[0]?.toUpperCase() || '?'}
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{user.full_name || '未命名'}</h2>
                  <Badge variant={roleColors[user.role] as 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info' | 'outline'}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  <Badge variant={statusColors[user.status] as 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info' | 'outline'}>
                    {user.status === 'active' ? '正常' : '停用'}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                  {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />注册于 {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>编辑</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSuspendToggle}
                disabled={updateUser.isPending}
              >
                {user.status === 'active' ? '停用' : '启用'}
              </Button>
              <Button variant="outline" size="sm">重置密码</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteUser.isPending}>
                删除
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总订单</p>
              <p className="text-xl font-bold">{user.stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CreditCard className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">交易记录</p>
              <p className="text-xl font-bold">{user.stats.totalTransactions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
              <Truck className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">配送次数</p>
              <p className="text-xl font-bold">{user.stats.totalDeliveries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Store className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">关联餐厅</p>
              <p className="text-xl font-bold">{user.stats.restaurant ? 1 : 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> 概览
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-1">
                <Activity className="h-4 w-4" /> 订单
              </TabsTrigger>
              <TabsTrigger value="restaurant" className="flex items-center gap-1">
                <Store className="h-4 w-4" /> 餐厅
              </TabsTrigger>
              <TabsTrigger value="deliveries" className="flex items-center gap-1">
                <Truck className="h-4 w-4" /> 配送
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" /> 财务
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">基本信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">用户 ID</span>
                      <span className="text-sm font-mono">{user.id.slice(0, 8)}...</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">邮箱</span>
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">手机</span>
                      <span className="text-sm">{user.phone || '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">角色</span>
                      <Badge variant={roleColors[user.role] as 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info' | 'outline'}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">状态</span>
                      <Badge variant={statusColors[user.status] as 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info' | 'outline'}>
                        {user.status === 'active' ? '正常' : '停用'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">注册时间</span>
                      <span className="text-sm">{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">账户状态</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">账户余额</span>
                      <span className="text-sm font-medium">¥0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">本月订单</span>
                      <span className="text-sm font-medium">{user.stats.totalOrders}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">本月收入</span>
                      <span className="text-sm font-medium text-emerald-500">+¥0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">最近活跃</span>
                      <span className="text-sm">{formatDate(user.updated_at || user.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="pt-4">
              <UserOrdersList userId={user.id} />
            </TabsContent>

            <TabsContent value="restaurant" className="pt-4">
              {user.stats.restaurant ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">关联餐厅信息</h3>
                  <p className="text-sm text-muted-foreground">
                    餐厅名称：{(user.stats.restaurant as { name?: string }).name || '-'}
                  </p>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">该用户未关联餐厅</p>
              )}
            </TabsContent>

            <TabsContent value="deliveries" className="pt-4">
              <UserDeliveriesList userId={user.id} />
            </TabsContent>

            <TabsContent value="transactions" className="pt-4">
              <UserTransactionsList userId={user.id} />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      <EditUserModal
        open={editOpen}
        onOpenChange={setEditOpen}
        user={{
          id: user.id,
          email: user.email,
          full_name: user.full_name || '',
          phone: user.phone || '',
          avatar_url: user.avatar_url || '',
          role: user.role as 'admin' | 'editor' | 'viewer',
          status: user.status,
          created_at: user.created_at,
          updated_at: user.updated_at || null,
        }}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function UserOrdersList({ userId }: { userId: string }) {
  const { data, isLoading } = useUserOrders(userId, 1);

  if (isLoading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const orders = data?.data || [];
  if (orders.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">暂无订单记录</p>;

  return (
    <div className="space-y-2">
      {orders.map((order: Record<string, unknown>) => (
        <div key={order.id as string} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">订单 #{String(order.id).slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at as string).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">¥{String(order.amount)}</p>
            <Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'warning'}>
              {(order.status as string) === 'completed' ? '已完成' : (order.status as string) === 'cancelled' ? '已取消' : '进行中'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserTransactionsList({ userId }: { userId: string }) {
  const { data, isLoading } = useUserTransactions(userId, 1);

  if (isLoading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const txns = data?.data || [];
  if (txns.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">暂无交易记录</p>;

  return (
    <div className="space-y-2">
      {txns.map((txn: Record<string, unknown>) => (
        <div key={txn.id as string} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{txn.description as string}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(txn.created_at as string).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${(txn.type as string) === 'withdrawal' ? 'text-destructive' : 'text-emerald-500'}`}>
              {(txn.type as string) === 'withdrawal' ? '-' : '+'}¥{String(txn.amount)}
            </p>
            <Badge variant={txn.status === 'completed' ? 'success' : 'warning'}>
              {txn.status === 'completed' ? '已完成' : '待处理'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserDeliveriesList({ userId }: { userId: string }) {
  const { data, isLoading } = useUserDeliveries(userId);

  if (isLoading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const records = data?.data?.items || [];
  if (records.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">暂无配送记录</p>;

  return (
    <div className="space-y-2">
      {records.map((record: Record<string, unknown>) => (
        <div key={record.id as string} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">配送单 #{String(record.id).slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">
              距离 {record.distance as string}km · 费用 ¥{record.delivery_fee as string}
            </p>
          </div>
          <Badge variant={record.status === 'completed' ? 'success' : record.status === 'in_transit' ? 'info' : 'warning'}>
            {record.status === 'completed' ? '已完成' : record.status === 'in_transit' ? '配送中' : '已分配'}
          </Badge>
        </div>
      ))}
    </div>
  );
}