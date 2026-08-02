import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { DashboardStats } from '@/types';

async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseBrowserClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Total orders count
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // Active orders count
  const { count: activeOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Total revenue (sum of commission)
  const { data: revenueData } = await supabase
    .from('orders')
    .select('commission');

  const totalRevenue = ((revenueData as any[]) ?? []).reduce(
    (sum: number, row: any) => sum + parseFloat(row.commission as string),
    0
  );

  // Pending verifications (pending reviews + pending withdrawals)
  const { count: pendingReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: pendingWithdrawals } = await supabase
    .from('withdrawals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const pendingVerifications = (pendingReviews ?? 0) + (pendingWithdrawals ?? 0);

  // Order trend: compare last 30 days vs previous 30 days
  const { count: recentOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { count: previousOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  const ordersTrend = previousOrders && previousOrders > 0
    ? Math.round(((recentOrders! - previousOrders) / previousOrders) * 100)
    : 0;

  // Revenue trend: compare last 30 days vs previous 30 days
  const { data: recentRevenue } = await supabase
    .from('orders')
    .select('commission')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: previousRevenue } = await supabase
    .from('orders')
    .select('commission')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  const recentTotal = ((recentRevenue as any[]) ?? []).reduce(
    (sum: number, row: any) => sum + parseFloat(row.commission as string),
    0
  );
  const previousTotal = ((previousRevenue as any[]) ?? []).reduce(
    (sum: number, row: any) => sum + parseFloat(row.commission as string),
    0
  );

  const revenueTrend = previousTotal > 0
    ? Math.round(((recentTotal - previousTotal) / previousTotal) * 100)
    : 0;

  return {
    totalOrders: totalOrders ?? 0,
    activeOrders: activeOrders ?? 0,
    totalRevenue,
    pendingVerifications,
    ordersTrend,
    revenueTrend,
  };
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });
}