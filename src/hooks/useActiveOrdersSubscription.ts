import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ActiveOrderEvent {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  status?: string;
}

export function useActiveOrdersSubscription() {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [lastEvent, setLastEvent] = useState<ActiveOrderEvent | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Fetch initial active count (orders not in terminal states)
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'accepted', 'preparing', 'ready', 'delivering'])
      .then(({ count }) => {
        if (count !== null) setActiveCount(count);
      });

    // Subscribe to real-time changes
    const channel = supabase
      .channel('active-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=in.(pending,accepted,preparing,ready,delivering)',
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const eventType = payload.eventType;
          const newRecord = payload.new as Record<string, unknown> | undefined;
          const oldRecord = payload.old as Record<string, unknown> | undefined;

          setLastEvent({
            id: String(newRecord?.id ?? oldRecord?.id ?? ''),
            type: eventType,
            status: newRecord?.status as string | undefined,
          });

          // Update count
          setActiveCount((prev) => {
            if (prev === null) return prev;
            if (eventType === 'INSERT') return prev + 1;
            if (eventType === 'DELETE') return Math.max(0, prev - 1);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { activeCount, lastEvent };
}