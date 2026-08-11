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
import { useLanguage } from '@/contexts/LanguageContext';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const { t } = useLanguage();
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
    if (!form.full_name.trim()) errs.full_name = t('users.nameRequired');
    if (!form.email.trim()) errs.email = t('users.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('users.emailInvalid');
    if (!form.password) errs.password = t('users.enterPassword');
    else if (form.password.length < 6) errs.password = t('users.passwordMinLength');
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('users.passwordMismatch');
    if (form.phone && !/^\+?[1-9]\d{6,14}$/.test(form.phone)) errs.phone = t('users.phoneInvalid');
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
      setErrors({ submit: t('users.createFailed') });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('users.createUser')}</DialogTitle>
          <DialogDescription>{t('users.createUserDesc')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="create-name">{t('users.fullName')}</Label>
            <Input
              id="create-name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder={t('users.enterName')}
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-email">{t('users.email')}</Label>
            <Input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('users.enterEmail')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-phone">{t('users.phoneOptional')}</Label>
            <Input
              id="create-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t('users.enterPhone')}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-password">{t('users.password')}</Label>
              <Input
                id="create-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('users.passwordPlaceholder')}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-confirm">{t('users.confirmPassword')}</Label>
              <Input
                id="create-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder={t('users.confirmPasswordPlaceholder')}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t('users.role')}</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('users.admin')}</SelectItem>
                <SelectItem value="editor">{t('users.editor')}</SelectItem>
                <SelectItem value="viewer">{t('users.viewer')}</SelectItem>
                <SelectItem value="buyer">{t('users.buyer')}</SelectItem>
                <SelectItem value="seller">{t('users.seller')}</SelectItem>
                <SelectItem value="driver">{t('users.driver')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive">{errors.submit}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('users.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending ? t('users.creating') : t('users.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}