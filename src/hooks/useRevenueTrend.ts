import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { RevenueTrend } from '@/types';

async function fetchRevenueTrend(): Promise<RevenueTrend[]> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: records } = await supabase
    .from('revenue_records')
    .select('date, amount, commission')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true }) as { data: any[] | null };

  const today = new Date(now.toISOString().split('T')[0]);
  const dateMap = new Map<string, { revenue: number; commission: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    dateMap.set(key, { revenue: 0, commission: 0 });
  }

  for (const record of records ?? []) {
    const key = typeof record.date === 'string' ? record.date : '';
    if (dateMap.has(key)) {
      const existing = dateMap.get(key)!;
      existing.revenue += parseFloat(record.amount as string);
      existing.commission += parseFloat(record.commission as string);
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