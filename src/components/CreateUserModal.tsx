import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateUser } from '@/hooks/useUsers';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const createUser = useCreateUser();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = '请输入姓名';
    if (!form.email.trim()) errs.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = '邮箱格式不正确';
    if (!form.password) errs.password = '请输入密码';
    else if (form.password.length < 6) errs.password = '密码至少6位';
    if (form.password !== form.confirmPassword) errs.confirmPassword = '两次密码不一致';
    if (form.phone && !/^1\d{10}$/.test(form.phone)) errs.phone = '手机号格式不正确';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleClose() {
    setForm({ full_name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'viewer' });
    setErrors({});
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await createUser.mutateAsync({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      });
      handleClose();
    } catch {
      setErrors({ submit: '创建失败，请重试' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建用户</DialogTitle>
          <DialogDescription>添加新的管理员或运营人员</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="create-name">姓名</Label>
            <Input
              id="create-name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="请输入姓名"
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-email">邮箱</Label>
            <Input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="请输入邮箱"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-phone">手机号（可选）</Label>
            <Input
              id="create-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入手机号"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-password">密码</Label>
              <Input
                id="create-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="至少6位"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-confirm">确认密码</Label>
              <Input
                id="create-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="再次输入密码"
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>角色</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="editor">编辑</SelectItem>
                <SelectItem value="viewer">访客</SelectItem>
                <SelectItem value="buyer">买家</SelectItem>
                <SelectItem value="seller">商家</SelectItem>
                <SelectItem value="driver">骑手</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive">{errors.submit}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}