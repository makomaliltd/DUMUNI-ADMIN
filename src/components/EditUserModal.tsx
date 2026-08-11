import { useState, useEffect } from 'react';
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
import { useUpdateUser, type UserProfile } from '@/hooks/useUsers';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const { t } = useLanguage();
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        status: user.status,
      });
      setErrors({});
    }
  }, [user]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = t('users.nameRequired');
    if (!form.email.trim()) errs.email = t('users.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('users.emailInvalid');
    if (form.phone && !/^\+?[1-9]\d{6,14}$/.test(form.phone)) errs.phone = t('users.phoneInvalid');
    if (!form.role) errs.role = t('users.roleRequired');
    if (!form.status) errs.status = t('users.statusRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !user) return;
    try {
      await updateUser.mutateAsync({
        id: user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        status: form.status,
      });
      onOpenChange(false);
    } catch {
      setErrors({ submit: t('users.updateFailed') });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('users.editUser')}</DialogTitle>
          <DialogDescription>{t('users.editUserDesc')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">{t('users.fullName')}</Label>
            <Input
              id="edit-name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder={t('users.enterName')}
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-email">{t('users.email')}</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('users.enterEmail')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-phone">{t('users.phone')}</Label>
            <Input
              id="edit-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t('users.enterPhone')}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="grid gap-2">
              <Label>{t('users.status')}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('users.active')}</SelectItem>
                  <SelectItem value="suspended">{t('users.suspended')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive">{errors.submit}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('users.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={updateUser.isPending}>
            {updateUser.isPending ? t('users.saving') : t('users.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}