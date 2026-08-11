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
import { useLanguage } from '@/contexts/LanguageContext';
import EditRestaurantModal from '@/components/EditRestaurantModal';
import MenuItemModal from '@/components/MenuItemModal';
import { formatCurrency } from '@/lib/utils';

export default function RestaurantDetail() {
  const { t } = useLanguage();
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
        <p className="text-muted-foreground text-lg">{t('restaurantDetail.notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/restaurants')}>{t('restaurantDetail.backToRestaurants')}</Button>
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
                ? <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />{t('restaurants.verified')}</Badge>
                : <Badge variant="warning">{t('restaurants.pending')}</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" />{restaurantData.cuisine_type}</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{restaurantData.rating || '0.0'}</span>
              <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" />{restaurantData.total_orders}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => toggleStatus.mutate(id!)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {restaurantData.is_open === 'true' ? t('restaurants.closeShop') : t('restaurants.openShop')}
          </Button>
          <Button size="sm" onClick={() => setEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-1" />{t('common.edit')}
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
              <p className="text-xs text-muted-foreground">{t('restaurantDetail.address')}</p>
              <p className="text-sm font-medium truncate">{restaurantData.address || t('restaurantDetail.notSet')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('restaurantDetail.phone')}</p>
              <p className="text-sm font-medium">{restaurantData.phone || t('restaurantDetail.notSet')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('restaurantDetail.hours')}</p>
              <p className="text-sm font-medium">{restaurantData.hours || t('restaurantDetail.notSet')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('restaurantDetail.deliveryFeeMinOrder')}</p>
              <p className="text-sm font-medium">{formatCurrency(restaurantData.delivery_fee || 0)} / {formatCurrency(restaurantData.min_order || 0)}</p>
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
              {tab === 'info' && t('restaurantDetail.basicInfo')}
              {tab === 'menu' && t('restaurantDetail.menuManagement')}
              {tab === 'orders' && t('restaurantDetail.orderRecords')}
              {tab === 'reviews' && t('restaurantDetail.customerReviews')}
              {tab === 'analytics' && t('restaurantDetail.businessAnalytics')}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('restaurantDetail.restaurantProfile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">{t('restaurants.name')}</label>
                  <p className="text-sm font-medium">{restaurantData.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('restaurants.category')}</label>
                  <p className="text-sm font-medium">{restaurantData.cuisine_type}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">{t('restaurantDetail.description')}</label>
                  <p className="text-sm">{restaurantData.description || t('restaurantDetail.noDescription')}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('restaurants.owner')}</label>
                  <p className="text-sm font-medium">{restaurantData.owner?.full_name || t('restaurantDetail.notAssigned')}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('restaurantDetail.ownerEmail')}</label>
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
              <CardTitle className="text-base">{t('restaurantDetail.menuItems')}</CardTitle>
              <Button size="sm" onClick={() => { setEditMenuItem(null); setMenuModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />{t('restaurantDetail.addMenuItem')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('restaurantDetail.itemName')}</TableHead>
                    <TableHead>{t('restaurantDetail.category')}</TableHead>
                    <TableHead>{t('restaurantDetail.price')}</TableHead>
                    <TableHead>{t('restaurantDetail.status')}</TableHead>
                    <TableHead>{t('restaurantDetail.recommended')}</TableHead>
                    <TableHead className="text-right">{t('restaurants.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('restaurantDetail.noMenuItems')}
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
                        <TableCell className="text-sm font-medium">{formatCurrency(item.price)}</TableCell>
                        <TableCell>
                          {item.is_available === 'true'
                            ? <Badge variant="success" className="bg-emerald-500">{t('restaurantDetail.available')}</Badge>
                            : <Badge variant="secondary">{t('restaurantDetail.unavailable')}</Badge>}
                        </TableCell>
                        <TableCell>
                          {item.is_popular === 'true'
                            ? <Badge variant="default" className="bg-amber-500">{t('restaurantDetail.recommended')}</Badge>
                            : <span className="text-sm text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditMenuItem(item); setMenuModalOpen(true); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={async () => {
                              if (confirm(t('restaurantDetail.confirmDeleteItem'))) {
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
              <CardTitle className="text-base">{t('restaurantDetail.orderRecords')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('restaurantDetail.orderId')}</TableHead>
                    <TableHead>{t('restaurantDetail.customer')}</TableHead>
                    <TableHead>{t('restaurantDetail.amount')}</TableHead>
                    <TableHead>{t('restaurantDetail.status')}</TableHead>
                    <TableHead>{t('restaurantDetail.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('restaurantDetail.noOrders')}</TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs font-mono">{order.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{order.customer_name}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(order.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'completed' ? 'success' : order.status === 'active' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'warning'}>
                            {order.status === 'completed' ? t('restaurantDetail.completed') : order.status === 'active' ? t('restaurantDetail.inProgress') : order.status === 'cancelled' ? t('restaurantDetail.cancelled') : t('common.pending')}
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
              <CardTitle className="text-base">{t('restaurantDetail.customerReviews')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('restaurantDetail.user')}</TableHead>
                    <TableHead>{t('restaurantDetail.rating')}</TableHead>
                    <TableHead>{t('restaurantDetail.content')}</TableHead>
                    <TableHead>{t('restaurantDetail.status')}</TableHead>
                    <TableHead>{t('restaurantDetail.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('restaurantDetail.noReviews')}</TableCell>
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
                            {review.status === 'approved' ? t('restaurantDetail.approved') : t('restaurants.pending')}
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
                <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('restaurantDetail.last30DaysRevenue')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{analytics?.completedOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('restaurantDetail.last30DaysOrders')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{analytics?.avgRating?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('restaurantDetail.avgRating')}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{t('restaurantDetail.revenueTrend30Days')}</CardTitle>
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
                      formatter={(value: any) => [formatCurrency(value as number), t('restaurantDetail.revenue')]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('restaurantDetail.ratingDistribution')}</CardTitle>
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