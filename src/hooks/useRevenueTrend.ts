import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { RevenueTrend } from '@/types';

async function fetchRevenueTrend(): Promise<RevenueTrend[]> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch orders from last 30 days (aggregate by date from orders table)
  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, total, commission')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true }) as { data: any[] | null };

  const today = new Date(now.toISOString().split('T')[0]);
  const dateMap = new Map<string, { revenue: number; commission: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    dateMap.set(key, { revenue: 0, commission: 0 });
  }

  for (const order of orders ?? []) {
    const orderDate = order.created_at ? order.created_at.toString().split('T')[0] : '';
    if (dateMap.has(orderDate)) {
      const existing = dateMap.get(orderDate)!;
      existing.revenue += parseFloat(order.total as string) || 0;
      existing.commission += parseFloat(order.commission as string) || 0;
    }
  }

  return Array.from(dateMap.entries()).map(([date, values]) => ({
    date: date.slice(5),
    revenue: values.revenue,
    commission: values.commission,
  }));
}

export function useRevenueTrend() {
  return useQuery<RevenueTrend[]>({
    queryKey: ['revenue-trend'],
    queryFn: fetchRevenueTrend,
    refetchInterval: 60_000,
  });
}