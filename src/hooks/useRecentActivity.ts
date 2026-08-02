import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { ActivityItem } from '@/types';

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const supabase = getSupabaseBrowserClient();
  const activities: ActivityItem[] = [];

  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, customer_name, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10) as { data: any[] | null };

  for (const order of recentOrders ?? []) {
    activities.push({
      id: `order-${order.id}`,
      type: 'order',
      title: `新订单 #${order.id.slice(0, 8)}`,
      description: `${order.customer_name} · ¥${order.amount}`,
      time: order.created_at,
      status: order.status,
    });
  }

  // Recent reviews (pending)
  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, content, created_at, restaurant:restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(5) as { data: any[] | null };

  for (const review of recentReviews ?? []) {
    const restaurant = Array.isArray(review.restaurant)
      ? review.restaurant[0]
      : review.restaurant;
    activities.push({
      id: `review-${review.id}`,
      type: 'review',
      title: `新评价 (${review.rating}⭐)`,
      description: `${review.customer_name} · ${(restaurant as { name: string })?.name ?? '未知餐厅'}`,
      time: review.created_at,
    });
  }

  // Recent withdrawals
  const { data: recentWithdrawals } = await supabase
    .from('withdrawals')
    .select('id, user_name, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5) as { data: any[] | null };

  for (const w of recentWithdrawals ?? []) {
    activities.push({
      id: `withdrawal-${w.id}`,
      type: 'withdrawal',
      title: '提现申请',
      description: `${w.user_name} · ¥${w.amount}`,
      time: w.created_at,
      status: w.status,
    });
  }

  // Sort by time (most recent first) and limit to 15
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return activities.slice(0, 15);
}

export function useRecentActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 30_000,
  });
}