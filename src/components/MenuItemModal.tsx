import { useState, useEffect } from 'react';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useRestaurants';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  editItem: any | null;
}

const DEFAULT_CATEGORY = 'signature';

export default function MenuItemModal({ open, onOpenChange, restaurantId, editItem }: Props) {
  const { t } = useLanguage();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const isEditing = !!editItem;

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: DEFAULT_CATEGORY,
    is_available: 'true', is_popular: 'false',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        description: editItem.description || '',
        price: editItem.price || '',
        category: editItem.category || DEFAULT_CATEGORY,
        is_available: editItem.is_available || 'true',
        is_popular: editItem.is_popular || 'false',
      });
    } else {
      setForm({ name: '', description: '', price: '', category: DEFAULT_CATEGORY, is_available: 'true', is_popular: 'false' });
    }
  }, [editItem, open]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isEditing) {
        await updateItem.mutateAsync({ id: editItem.id, data: form });
      } else {
        await createItem.mutateAsync({ restaurantId, data: form });
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isPending = createItem.isPending || updateItem.isPending || loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('restaurantDetail.editMenuItem') : t('restaurantDetail.addMenuItemTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.itemName')} *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('restaurantDetail.itemNamePlaceholder')} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.description')}</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={t('restaurantDetail.descriptionPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.price')} *</label>
              <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="FCFA" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.category')}</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="signature">{t('restaurantDetail.categorySignature')}</option>
                <option value="main">{t('restaurantDetail.categoryMain')}</option>
                <option value="snack">{t('restaurantDetail.categorySnack')}</option>
                <option value="beverage">{t('restaurantDetail.categoryBeverage')}</option>
                <option value="dessert">{t('restaurantDetail.categoryDessert')}</option>
                <option value="soup">{t('restaurantDetail.categorySoup')}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4"
                checked={form.is_available === 'true'}
                onChange={e => setForm(f => ({ ...f, is_available: e.target.checked ? 'true' : 'false' }))}
              />
              {t('restaurantDetail.available')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4"
                checked={form.is_popular === 'true'}
                onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked ? 'true' : 'false' }))}
              />
              {t('restaurantDetail.popular')}
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={isPending || !form.name || !form.price}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isEditing ? t('restaurantDetail.saveChanges') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}