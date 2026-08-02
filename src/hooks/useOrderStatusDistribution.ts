import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { OrderStatusDistribution } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  active: '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  active: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

async function fetchOrderStatusDistribution(): Promise<OrderStatusDistribution[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('status') as { data: any[] | null };

  const statusCount = new Map<string, number>();
  for (const order of orders ?? []) {
    statusCount.set(order.status, (statusCount.get(order.status) ?? 0) + 1);
  }

  return Array.from(statusCount.entries()).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    color: STATUS_COLORS[status] ?? '#6B7280',
  }));
}

export function useOrderStatusDistribution() {
  return useQuery<OrderStatusDistribution[]>({
    queryKey: ['order-status-distribution'],
    queryFn: fetchOrderStatusDistribution,
    refetchInterval: 30_000,
  });
}