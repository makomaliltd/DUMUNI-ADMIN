import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { formatCurrency } from '@/lib/utils';
import type { ActivityItem } from '@/types';

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const supabase = getSupabaseBrowserClient();
  const activities: ActivityItem[] = [];

  // Recent orders — join with users for customer name
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, buyer:users(name), total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10) as { data: any[] | null };

  for (const order of recentOrders ?? []) {
    const buyer = Array.isArray(order.buyer) ? order.buyer[0] : order.buyer;
    const customerName = (buyer as { name?: string })?.name || 'Unknown';
    activities.push({
      id: `order-${order.id}`,
      type: 'order',
      title: `New order #${order.id.slice(0, 8)}`,
      description: `${customerName} · ${formatCurrency(order.total as number)}`,
      time: order.created_at,
      status: order.status,
    });
  }

  // Recent reviews — join with users for reviewer name, and restaurants
  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('id, buyer:users(name), rating, comment, created_at, restaurant:restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(5) as { data: any[] | null };

  for (const review of recentReviews ?? []) {
    const buyer = Array.isArray(review.buyer) ? review.buyer[0] : review.buyer;
    const restaurant = Array.isArray(review.restaurant) ? review.restaurant[0] : review.restaurant;
    const reviewerName = (buyer as { name?: string })?.name || 'Unknown';
    activities.push({
      id: `review-${review.id}`,
      type: 'review',
      title: `New review (${review.rating}⭐)`,
      description: `${reviewerName} · ${(restaurant as { name: string })?.name ?? 'Unknown restaurant'}`,
      time: review.created_at,
    });
  }

  // Recent withdrawals — join with users for user name
  const { data: recentWithdrawals } = await supabase
    .from('withdrawal_requests')
    .select('id, user:users(name), amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5) as { data: any[] | null };

  for (const w of recentWithdrawals ?? []) {
    const usr = Array.isArray(w.user) ? w.user[0] : w.user;
    const userName = (usr as { name?: string })?.name || 'Unknown';
    activities.push({
      id: `withdrawal-${w.id}`,
      type: 'withdrawal',
      title: 'Withdrawal request',
      description: `${userName} · ${formatCurrency(w.amount as number)}`,
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