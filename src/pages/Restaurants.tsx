import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurants, useToggleRestaurantStatus } from '@/hooks/useRestaurants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Search, Store, ChevronLeft, ChevronRight, Eye, RotateCcw,
  CheckCircle, XCircle, Loader2, Star, ChefHat, ArrowUpDown,
} from 'lucide-react';
import EditRestaurantModal from '@/components/EditRestaurantModal';

const cuisines = ['全部', '川菜', '粤菜', '日料', '西餐', '湘菜', '鲁菜', '火锅', '烧烤', '面食', '甜品'];

export default function Restaurants() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [verified, setVerified] = useState('all');
  const [cuisine, setCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editModal, setEditModal] = useState<{ open: boolean; restaurantId: string }>({ open: false, restaurantId: '' });

  const { data, isLoading } = useRestaurants({ page, pageSize: 20, search, verified, cuisine, sortBy, sortOrder });
  const toggleStatus = useToggleRestaurantStatus();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getVerifiedBadge = (v: string) => {
    switch (v) {
      case 'verified': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />已验证</Badge>;
      case 'pending': return <Badge variant="warning"><Loader2 className="w-3 h-3 mr-1" />待审核</Badge>;
      default: return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />未认证</Badge>;
    }
  };

  const getStatusBadge = (open: string) => {
    return open === 'true'
      ? <Badge variant="success" className="bg-emerald-500">营业中</Badge>
      : <Badge variant="secondary">已休息</Badge>;
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead>
      <button onClick={() => handleSort(field)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">餐厅管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理平台所有入驻餐厅与商家信息</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索餐厅名称..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <select
              value={verified}
              onChange={e => { setVerified(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
            >
              <option value="all">全部状态</option>
              <option value="verified">已验证</option>
              <option value="pending">待审核</option>
            </select>
            <select
              value={cuisine}
              onChange={e => { setCuisine(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
            >
              {cuisines.map(c => (
                <option key={c} value={c === '全部' ? 'all' : c}>{c}</option>
              ))}
            </select>
            <Button onClick={handleSearch} size="sm">搜索</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-semibold">餐厅列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="name">餐厅名称</SortHeader>
                <TableHead>负责人</TableHead>
                <TableHead>菜系</TableHead>
                <TableHead>认证状态</TableHead>
                <TableHead>营业状态</TableHead>
                <SortHeader field="rating">评分</SortHeader>
                <SortHeader field="total_orders">订单数</SortHeader>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无餐厅数据
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((restaurant) => (
                  <TableRow key={restaurant.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 font-semibold"
                          src={restaurant.logo_url || undefined}
                          alt={restaurant.name}
                          fallback={restaurant.name?.charAt(0) || '餐'}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{restaurant.name}</p>
                          <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{restaurant.owner?.full_name || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <ChefHat className="w-3 h-3" />
                        {restaurant.cuisine_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getVerifiedBadge(restaurant.verified)}</TableCell>
                    <TableCell>{getStatusBadge(restaurant.is_open)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{restaurant.rating || '0.0'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{restaurant.total_orders}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8"
                          onClick={(e) => { e.stopPropagation(); navigate(`/restaurants/${restaurant.id}`); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8"
                          onClick={(e) => { e.stopPropagation(); toggleStatus.mutate(restaurant.id); }}
                          title={restaurant.is_open === 'true' ? '打烊' : '营业'}
                        >
                          <RotateCcw className="w-4 h-4" />
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

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.pagination.total} 条，第 {page}/{data.pagination.totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />上一页
            </Button>
            <Button variant="outline" size="sm" disabled={page >= (data.pagination.totalPages || 1)} onClick={() => setPage(p => p + 1)}>
              下一页<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <EditRestaurantModal
        open={editModal.open}
        onOpenChange={(open) => setEditModal({ open, restaurantId: '' })}
        restaurantId={editModal.restaurantId}
      />
    </div>
  );
}