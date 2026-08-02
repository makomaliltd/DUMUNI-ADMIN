import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Download, MoreHorizontal, ChevronLeft, ChevronRight, Check, X, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUsers, useBulkAction, type UserProfile } from '@/hooks/useUsers';
import { EditUserModal } from '@/components/EditUserModal';
import { CreateUserModal } from '@/components/CreateUserModal';

const roleLabels: Record<string, string> = {
  admin: '管理员', editor: '编辑', viewer: '访客',
  buyer: '买家', seller: '商家', driver: '骑手',
};
const roleColors: Record<string, 'destructive' | 'info' | 'secondary' | 'default' | 'success' | 'warning'> = {
  admin: 'destructive', editor: 'info', viewer: 'secondary',
  buyer: 'default', seller: 'success', driver: 'warning',
};
const statusColors: Record<string, 'success' | 'destructive'> = {
  active: 'success', suspended: 'destructive',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useUsers({
    page, pageSize: 20, role: roleFilter, status: statusFilter,
    search, sortBy, sortOrder,
  });
  const bulkAction = useBulkAction();

  const users = data?.data || [];
  const pagination = data?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 };

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
    setSelectedIds(new Set());
  }, [searchInput]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'activate') => {
    if (selectedIds.size === 0) return;
    await bulkAction.mutateAsync({ userIds: Array.from(selectedIds), action });
    setSelectedIds(new Set());
  };

  const handleExportCSV = () => {
    const headers = ['姓名', '邮箱', '手机号', '角色', '状态', '注册时间'];
    const rows = users.map(u => [
      u.full_name || '', u.email, u.phone || '',
      roleLabels[u.role] || u.role,
      u.status === 'active' ? '正常' : '停用',
      formatDate(u.created_at),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return <span className="ml-1 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">用户管理</h1>
          <p className="text-sm text-muted-foreground">管理系统用户与权限</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />新建用户
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、邮箱、手机号..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="editor">编辑</SelectItem>
                <SelectItem value="viewer">访客</SelectItem>
                <SelectItem value="buyer">买家</SelectItem>
                <SelectItem value="seller">商家</SelectItem>
                <SelectItem value="driver">骑手</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="suspended">停用</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={handleSearch}>搜索</Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">已选 {selectedIds.size} 项</span>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
            <Check className="mr-1 h-3.5 w-3.5" />批量启用
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')}>
            <X className="mr-1 h-3.5 w-3.5" />批量停用
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-3.5 w-3.5" />导出 CSV
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            用户列表
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              共 {pagination.total} 人
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-destructive">加载失败，请刷新重试</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">暂无用户数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedIds.size === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                      姓名 <SortIcon column="full_name" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                      邮箱 <SortIcon column="email" />
                    </TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                      角色 <SortIcon column="role" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                      状态 <SortIcon column="status" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                      注册时间 <SortIcon column="created_at" />
                    </TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={selectedIds.has(user.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link to={`/users/${user.id}`} className="flex items-center gap-2 hover:text-primary">
                          <Avatar className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(user.full_name || user.email)[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <span className="font-medium">{user.full_name || '未命名'}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role] || 'secondary'}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[user.status] || 'secondary'}>
                          {user.status === 'active' ? '正常' : '停用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(user.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditUser(user); setEditOpen(true); }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); setSelectedIds(new Set()); }}
            >
              <ChevronLeft className="h-4 w-4" />上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => { setPage(page + 1); setSelectedIds(new Set()); }}
            >
              下一页<ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditUserModal open={editOpen} onOpenChange={setEditOpen} user={editUser} />
      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}