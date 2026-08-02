import { useState, useEffect } from 'react';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useRestaurants';
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

export default function MenuItemModal({ open, onOpenChange, restaurantId, editItem }: Props) {
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const isEditing = !!editItem;

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '招牌菜',
    is_available: 'true', is_popular: 'false',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        description: editItem.description || '',
        price: editItem.price || '',
        category: editItem.category || '招牌菜',
        is_available: editItem.is_available || 'true',
        is_popular: editItem.is_popular || 'false',
      });
    } else {
      setForm({ name: '', description: '', price: '', category: '招牌菜', is_available: 'true', is_popular: 'false' });
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
          <DialogTitle>{isEditing ? '编辑菜品' : '添加菜品'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">菜品名称 *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：招牌红烧肉" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">描述</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="菜品描述..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">价格 *</label>
              <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="FCFA" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">分类</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="招牌菜">招牌菜</option>
                <option value="主食">主食</option>
                <option value="小吃">小吃</option>
                <option value="饮品">饮品</option>
                <option value="甜品">甜品</option>
                <option value="汤品">汤品</option>
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
              在售
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4"
                checked={form.is_popular === 'true'}
                onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked ? 'true' : 'false' }))}
              />
              推荐菜品
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={isPending || !form.name || !form.price}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isEditing ? '保存修改' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}