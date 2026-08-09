import { useEffect } from 'react';
import { getSupabaseClientSafe } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/toast';

export function useRealtimeOrderNotifications() {
  const { addToast } = useToast();

  useEffect(() => {
    const supabase = getSupabaseClientSafe();
    if (!supabase) return; // Supabase config not loaded yet
    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          const order = payload.new as Record<string, unknown>;
          addToast({
            title: '🆕 New Order',
            description: `Order #${String(order.id).slice(0, 8)} received — ${String(order.total || '?')} FCFA`,
            type: 'success',
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: any) => {
          const order = payload.new as Record<string, unknown>;
          addToast({
            title: '📦 Order Updated',
            description: `Order #${String(order.id).slice(0, 8)} → ${order.status}`,
            type: 'info',
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addToast]);
}