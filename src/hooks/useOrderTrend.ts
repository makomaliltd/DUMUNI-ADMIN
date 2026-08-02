import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { OrderTrend } from '@/types';

async function fetchOrderTrend(): Promise<OrderTrend[]> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: orders } = await supabase
    .from('orders')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true }) as { data: any[] | null };

  // Aggregate by date
  const dateMap = new Map<string, number>();
  const today = new Date(now.toISOString().split('T')[0]);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    dateMap.set(key, 0);
  }

  for (const order of orders ?? []) {
    const key = new Date(order.created_at).toISOString().split('T')[0];
    if (dateMap.has(key)) {
      dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
    }
  }

  return Array.from(dateMap.entries()).map(([date, count]) => ({
    date: date.slice(5), // "MM-DD"
    orders: count,
  }));
}

export function useOrderTrend() {
  return useQuery<OrderTrend[]>({
    queryKey: ['order-trend'],
    queryFn: fetchOrderTrend,
    refetchInterval: 60_000,
  });
}