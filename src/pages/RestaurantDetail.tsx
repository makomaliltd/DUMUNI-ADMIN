import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useRestaurant, useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useRestaurantOrders, useRestaurantReviews, useRestaurantAnalytics, useToggleRestaurantStatus,
} from '@/hooks/useRestaurants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Store, Phone, MapPin, Clock, DollarSign, Star, ChefHat,
  Loader2, CheckCircle, XCircle, Plus, Pencil, Trash2, ShoppingCart, MessageSquare,
  TrendingUp, BarChart3, MoreHorizontal, Edit, RotateCcw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import EditRestaurantModal from '@/components/EditRestaurantModal';
import MenuItemModal from '@/components/MenuItemModal';

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: restaurantRes, isLoading } = useRestaurant(id);
  const { data: menuRes } = useMenuItems(id);
  const { data: ordersRes } = useRestaurantOrders(id, 1);
  const { data: reviewsRes } = useRestaurantReviews(id);
  const { data: analyticsRes } = useRestaurantAnalytics(id);
  const toggleStatus = useToggleRestaurantStatus();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editMenuItem, setEditMenuItem] = useState<any>(null);

  const restaurant = restaurantRes?.data;
  const menuItems = menuRes?.data || [];
  const orders = ordersRes?.data?.data || [];
  const reviews = reviewsRes?.data || [];
  const analytics = analyticsRes?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">餐厅未找到</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/restaurants')}>返回列表</Button>
      </div>
    );
  }

  const restaurantData = restaurant;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/restaurants')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-14 h-14 rounded-xl bg-orange-100 text-lg text-orange-600 font-bold"
            src={restaurantData.logo_url || undefined}
            alt={restaurantData.name}
            fallback={restaurantData.name?.charAt(0) || '餐'}
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{restaurantData.name}</h1>
              {restaurantData.verified === 'verified'
                ? <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />已验证</Badge>
                : <Badge variant="warning">待审核</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" />{restaurantData.cuisine_type}</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{restaurantData.rating || '0.0'}</span>
              <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" />{restaurantData.total_orders} 单</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => toggleStatus.mutate(id!)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {restaurantData.is_open === 'true' ? '打烊' : '营业'}
          </Button>
          <Button size="sm" onClick={() => setEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-1" />编辑
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">地址</p>
              <p className="text-sm font-medium truncate">{restaurantData.address || '未设置'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">联系电话</p>
              <p className="text-sm font-medium">{restaurantData.phone || '未设置'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">营业时间</p>
              <p className="text-sm font-medium">{restaurantData.hours || '未设置'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">配送费 / 起送价</p>
              <p className="text-sm font-medium">¥{restaurantData.delivery_fee || '0'} / ¥{restaurantData.min_order || '0'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
          {['info', 'menu', 'orders', 'reviews', 'analytics'].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 bg-transparent px-4 py-3 text-sm font-medium data-[state=active]:text-orange-600"
            >
              {tab === 'info' && '基本信息'}
              {tab === 'menu' && '菜单管理'}
              {tab === 'orders' && '订单记录'}
              {tab === 'reviews' && '用户评价'}
              {tab === 'analytics' && '经营分析'}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">餐厅资料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">餐厅名称</label>
                  <p className="text-sm font-medium">{restaurantData.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">菜系</label>
                  <p className="text-sm font-medium">{restaurantData.cuisine_type}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">描述</label>
                  <p className="text-sm">{restaurantData.description || '暂无描述'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">负责人</label>
                  <p className="text-sm font-medium">{restaurantData.owner?.full_name || '未分配'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">负责人邮箱</label>
                  <p className="text-sm">{restaurantData.owner?.email || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu" className="pt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">菜品列表</CardTitle>
              <Button size="sm" onClick={() => { setEditMenuItem(null); setMenuModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />添加菜品
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>菜品名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>推荐</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂未添加菜品
                      </TableCell>
                    </TableRow>
                  ) : (
                    menuItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                              <ChefHat className="w-5 h-5 text-orange-500" />
                            </div>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">¥{item.price}</TableCell>
                        <TableCell>
                          {item.is_available === 'true'
                            ? <Badge variant="success" className="bg-emerald-500">在售</Badge>
                            : <Badge variant="secondary">已下架</Badge>}
                        </TableCell>
                        <TableCell>
                          {item.is_popular === 'true'
                            ? <Badge variant="default" className="bg-amber-500">推荐</Badge>
                            : <span className="text-sm text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditMenuItem(item); setMenuModalOpen(true); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={async () => {
                              if (confirm('确定删除该菜品？')) {
                                // handled by mutation
                              }
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">订单记录</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无订单</TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs font-mono">{order.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{order.customer_name}</TableCell>
                        <TableCell className="text-sm font-medium">¥{order.amount}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'completed' ? 'success' : order.status === 'active' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'warning'}>
                            {order.status === 'completed' ? '已完成' : order.status === 'active' ? '进行中' : order.status === 'cancelled' ? '已取消' : '待处理'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">用户评价</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无评价</TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((review: any) => (
                      <TableRow key={review.id}>
                        <TableCell className="text-sm">{review.customer_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{review.content}</TableCell>
                        <TableCell>
                          <Badge variant={review.status === 'approved' ? 'success' : 'warning'}>
                            {review.status === 'approved' ? '已通过' : '待审核'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="pt-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">¥{analytics?.totalRevenue?.toFixed(0) || '0'}</p>
                <p className="text-xs text-muted-foreground mt-1">近30天收入</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{analytics?.completedOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">近30天订单</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{analytics?.avgRating?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-muted-foreground mt-1">平均评分</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">近30天收入趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: any) => [`¥${value}`, '收入']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">评分分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.ratingDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditRestaurantModal open={editModalOpen} onOpenChange={setEditModalOpen} restaurantId={id!} />
      <MenuItemModal
        open={menuModalOpen}
        onOpenChange={setMenuModalOpen}
        restaurantId={id!}
        editItem={editMenuItem}
      />
    </div>
  );
}