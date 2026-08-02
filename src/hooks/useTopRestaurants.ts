import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { TopRestaurant } from '@/types';

async function fetchTopRestaurants(): Promise<TopRestaurant[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, total_orders, total_revenue')
    .order('total_orders', { ascending: false })
    .limit(5) as { data: any[] | null };

  return (restaurants ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    totalOrders: r.total_orders,
    totalRevenue: parseFloat(r.total_revenue as string),
  }));
}

export function useTopRestaurants() {
  return useQuery<TopRestaurant[]>({
    queryKey: ['top-restaurants'],
    queryFn: fetchTopRestaurants,
    refetchInterval: 60_000,
  });
}