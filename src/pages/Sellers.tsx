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

export default function Sellers() {
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
      case 'pending': return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case 'approved': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">卖家入驻审核</h1>
          <p className="text-sm text-muted-foreground mt-1">审核商家入驻申请，管理入驻流程</p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">状态筛选：</span>
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={statusFilter === s ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                {s === 'all' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
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
          <CardTitle className="text-base font-semibold">入驻申请列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请人</TableHead>
                <TableHead>餐厅名称</TableHead>
                <TableHead>菜系</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>申请状态</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
                    暂无入驻申请
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
                        查看详情
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

      {/* Detail Modal */}
      <Dialog open={detailModal.open} onOpenChange={(open) => { if (!open) { setDetailModal({ open: false, application: null }); setReviewNotes(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-orange-500" />
              入驻申请详情
            </DialogTitle>
            <DialogDescription>查看申请信息并做出审核决定</DialogDescription>
          </DialogHeader>

          {detailModal.application && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">当前状态</span>
                {getStatusBadge(detailModal.application.status)}
              </div>

              {/* Owner Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />申请人信息
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
                    <span>{detailModal.application.owner_phone || '未填写'}</span>
                  </div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-500" />餐厅信息
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
                    <span>{detailModal.application.address || '未填写'}</span>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              {detailModal.application.status === 'pending' && (
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" />审核意见
                  </h4>
                  <Textarea
                    placeholder="填写审核备注（可选）..."
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
                      拒绝
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleReview(detailModal.application.id, 'approved')}
                      disabled={reviewApp.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      通过
                    </Button>
                  </div>
                </div>
              )}

              {detailModal.application.status !== 'pending' && detailModal.application.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">审核备注</p>
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