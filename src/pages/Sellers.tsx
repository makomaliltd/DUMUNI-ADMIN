import { useState } from 'react';
import { useSellerApplications, useReviewApplication } from '@/hooks/useRestaurants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, ChefHat, Store, FileText, MessageSquare,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Sellers() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModal, setDetailModal] = useState<{ open: boolean; application: any }>({ open: false, application: null });
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading } = useSellerApplications({ page, pageSize: 20, status: statusFilter });
  const reviewApp = useReviewApplication();

  const handleReview = async (id: string, status: string) => {
    await reviewApp.mutateAsync({ id, status, notes: reviewNotes });
    setDetailModal({ open: false, application: null });
    setReviewNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />{t('sellers.pending')}</Badge>;
      case 'approved': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />{t('sellers.approved')}</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('sellers.rejected')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('sellers.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('sellers.subtitle')}</p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{t('sellers.statusFilter')}</span>
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={statusFilter === s ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                {s === 'all' ? t('sellers.allStatus') : s === 'pending' ? t('sellers.pending') : s === 'approved' ? t('sellers.approved') : t('sellers.rejected')}
                {s === 'pending' && data?.pagination?.total && statusFilter === 'all' ? (
                  <span className="ml-1.5 text-xs opacity-70">({data.pagination.total})</span>
                ) : null}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-semibold">{t('sellers.applicationList')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('sellers.applicant')}</TableHead>
                <TableHead>{t('sellers.restaurantName')}</TableHead>
                <TableHead>{t('sellers.cuisine')}</TableHead>
                <TableHead>{t('sellers.phone')}</TableHead>
                <TableHead>{t('sellers.applicationStatus')}</TableHead>
                <TableHead>{t('sellers.applicationTime')}</TableHead>
                <TableHead className="text-right">{t('sellers.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {t('sellers.noSellers')}
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setDetailModal({ open: true, application: app })}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 bg-orange-100 text-orange-600 text-xs"
                          src={''}
                          alt={app.owner_name}
                          fallback={app.owner_name?.charAt(0) || '?'}
                        />
                        <div>
                          <p className="text-sm font-medium">{app.owner_name}</p>
                          <p className="text-xs text-muted-foreground">{app.owner_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{app.restaurant_name}</TableCell>
                    <TableCell><Badge variant="outline">{app.cuisine_type}</Badge></TableCell>
                    <TableCell className="text-sm">{app.owner_phone || '—'}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); setDetailModal({ open: true, application: app }); }}
                      >
                        {t('sellers.viewDetail')}
                      </Button>
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

      {/* Detail Modal */}
      <Dialog open={detailModal.open} onOpenChange={(open) => { if (!open) { setDetailModal({ open: false, application: null }); setReviewNotes(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-orange-500" />
              {t('sellers.applicationDetail')}
            </DialogTitle>
            <DialogDescription>{t('sellers.viewAndDecide')}</DialogDescription>
          </DialogHeader>

          {detailModal.application && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">{t('sellers.currentStatus')}</span>
                {getStatusBadge(detailModal.application.status)}
              </div>

              {/* Owner Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />{t('sellers.applicantInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{detailModal.application.owner_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{detailModal.application.owner_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{detailModal.application.owner_phone || t('sellers.notFilled')}</span>
                  </div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-500" />{t('sellers.restaurantInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Store className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{detailModal.application.restaurant_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ChefHat className="w-4 h-4 text-muted-foreground" />
                    <span>{detailModal.application.cuisine_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{detailModal.application.address || t('sellers.notFilled')}</span>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              {detailModal.application.status === 'pending' && (
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" />{t('sellers.reviewNotes')}
                  </h4>
                  <Textarea
                    placeholder={t('sellers.reviewNotesPlaceholder')}
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-3 justify-end">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleReview(detailModal.application.id, 'rejected')}
                      disabled={reviewApp.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t('sellers.reject')}
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleReview(detailModal.application.id, 'approved')}
                      disabled={reviewApp.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t('sellers.approve')}
                    </Button>
                  </div>
                </div>
              )}

              {detailModal.application.status !== 'pending' && detailModal.application.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('sellers.reviewRemark')}</p>
                  <p className="text-sm mt-1">{detailModal.application.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}