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
import { useLanguage } from '@/contexts/LanguageContext';
import EditRestaurantModal from '@/components/EditRestaurantModal';

const cuisines = ['全部', '川菜', '粤菜', '日料', '西餐', '湘菜', '鲁菜', '火锅', '烧烤', '面食', '甜品'];

export default function Restaurants() {
  const { t } = useLanguage();
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
      case 'verified': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />{t('restaurants.verified')}</Badge>;
      case 'pending': return <Badge variant="warning"><Loader2 className="w-3 h-3 mr-1" />{t('restaurants.pending')}</Badge>;
      default: return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />{t('restaurants.unverified')}</Badge>;
    }
  };

  const getStatusBadge = (open: string) => {
    return open === 'true'
      ? <Badge variant="success" className="bg-emerald-500">{t('restaurants.open')}</Badge>
      : <Badge variant="secondary">{t('restaurants.closed')}</Badge>;
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
          <h1 className="text-2xl font-bold text-foreground">{t('restaurants.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('restaurants.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('restaurants.searchPlaceholder')}
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
              <option value="all">{t('restaurants.allStatus')}</option>
              <option value="verified">{t('restaurants.verified')}</option>
              <option value="pending">{t('restaurants.pending')}</option>
            </select>
            <select
              value={cuisine}
              onChange={e => { setCuisine(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
            >
              {cuisines.map(c => (
                <option key={c} value={c === '全部' ? 'all' : c}>{c === '全部' ? t('common.all') : c}</option>
              ))}
            </select>
            <Button onClick={handleSearch} size="sm">{t('common.search')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-semibold">{t('restaurants.restaurantList')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="name">{t('restaurants.name')}</SortHeader>
                <TableHead>{t('restaurants.owner')}</TableHead>
                <TableHead>{t('restaurants.category')}</TableHead>
                <TableHead>{t('restaurants.verificationStatus')}</TableHead>
                <TableHead>{t('restaurants.businessStatus')}</TableHead>
                <SortHeader field="rating">{t('restaurants.rating')}</SortHeader>
                <SortHeader field="total_orders">{t('restaurants.orderCount')}</SortHeader>
                <TableHead className="text-right">{t('restaurants.actions')}</TableHead>
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
                    {t('restaurants.noRestaurants')}
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
                          title={restaurant.is_open === 'true' ? t('restaurants.closeShop') : t('restaurants.openShop')}
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
            {t('common.total')} {data.pagination.total} {t('common.items')}, {t('common.page')} {page}/{data.pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />{t('common.previous')}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= (data.pagination.totalPages || 1)} onClick={() => setPage(p => p + 1)}>
              {t('common.next')}<ChevronRight className="w-4 h-4 ml-1" />
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