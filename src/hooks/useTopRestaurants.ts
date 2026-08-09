import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { TopRestaurant } from '@/types';

async function fetchTopRestaurants(): Promise<TopRestaurant[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .limit(20) as { data: any[] | null };

  if (!restaurants?.length) return [];

  // Aggregate order counts and revenue per restaurant
  const restaurantStats = new Map<string, { totalOrders: number; totalRevenue: number }>();
  for (const r of restaurants) {
    restaurantStats.set(r.id, { totalOrders: 0, totalRevenue: 0 });
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('restaurant_id, total')
    .in('restaurant_id', restaurants.map((r) => r.id)) as { data: any[] | null };

  for (const order of orders ?? []) {
    const stats = restaurantStats.get(order.restaurant_id);
    if (stats) {
      stats.totalOrders += 1;
      stats.totalRevenue += parseFloat(order.total as string) || 0;
    }
  }

  return restaurants
    .map((r) => ({
      id: r.id,
      name: r.name,
      totalOrders: restaurantStats.get(r.id)?.totalOrders ?? 0,
      totalRevenue: restaurantStats.get(r.id)?.totalRevenue ?? 0,
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);
}

export function useTopRestaurants() {
  return useQuery<TopRestaurant[]>({
    queryKey: ['top-restaurants'],
    queryFn: fetchTopRestaurants,
    refetchInterval: 60_000,
  });
}