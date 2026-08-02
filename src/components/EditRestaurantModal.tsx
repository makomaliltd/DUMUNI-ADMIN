import { useState, useEffect } from 'react';
import { useRestaurant, useUpdateRestaurant } from '@/hooks/useRestaurants';
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
}

export default function EditRestaurantModal({ open, onOpenChange, restaurantId }: Props) {
  const { data: restaurantRes, isLoading } = useRestaurant(restaurantId);
  const updateRestaurant = useUpdateRestaurant();
  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', hours: '',
    cuisine_type: '', delivery_fee: '', min_order: '',
  });

  useEffect(() => {
    if (restaurantRes?.data) {
      const r = restaurantRes.data;
      setForm({
        name: r.name || '',
        description: r.description || '',
        address: r.address || '',
        phone: r.phone || '',
        hours: r.hours || '',
        cuisine_type: r.cuisine_type || '',
        delivery_fee: r.delivery_fee || '',
        min_order: r.min_order || '',
      });
    }
  }, [restaurantRes?.data]);

  const handleSubmit = async () => {
    await updateRestaurant.mutateAsync({ id: restaurantId, data: form });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑餐厅信息</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">餐厅名称</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">描述</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">地址</label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">联系电话</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">营业时间</label>
                <Input value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">菜系</label>
                <Input value={form.cuisine_type} onChange={e => setForm(f => ({ ...f, cuisine_type: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">配送费</label>
                <Input value={form.delivery_fee} onChange={e => setForm(f => ({ ...f, delivery_fee: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">起送价</label>
                <Input value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={updateRestaurant.isPending}>
            {updateRestaurant.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}