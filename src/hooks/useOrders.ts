import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/orders';

export interface OrderFilters {
  status?: string | string[];
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  restaurant_id?: string;
  driver_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export function useOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters.restaurant_id) params.set('restaurant_id', filters.restaurant_id);
  if (filters.driver_id) params.set('driver_id', filters.driver_id);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.amount_min) params.set('amount_min', String(filters.amount_min));
  if (filters.amount_max) params.set('amount_max', String(filters.amount_max));

  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    select: (data) => data.data,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json();
    },
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      return res.json();
    },
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['order', id] });
      const previous = queryClient.getQueryData(['order', id]);
      queryClient.setQueryData(['order', id], (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, status } };
      });
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['order', id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      const res = await fetch(`${API_BASE}/${orderId}/assign-driver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId }),
      });
      if (!res.ok) throw new Error('Failed to assign driver');
      return res.json();
    },
    onMutate: async ({ orderId, driverId }) => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      const previous = queryClient.getQueryData(['order', orderId]);
      queryClient.setQueryData(['order', orderId], (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, driver_id: driverId } };
      });
      return { previous };
    },
    onError: (_err, { orderId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['order', orderId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useBulkUpdateOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await fetch(`${API_BASE}/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error('Failed to bulk update orders');
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Custom hook to subscribe to real-time order changes (formerly subscribeToOrders)
export function subscribeToOrders(callback: (payload: any) => void) {
  try {
    const supabase = (window as any).__supabase;
    if (!supabase) return () => {};
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        callback(payload);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  } catch {
    return () => {};
  }
}

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/items`);
      if (!res.ok) throw new Error('Failed to fetch order items');
      return res.json();
    },
    select: (data) => data.data,
    enabled: !!orderId,
  });
}

export function useOrderStatusLogs(orderId: string) {
  return useQuery({
    queryKey: ['order-status-logs', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/status-logs`);
      if (!res.ok) throw new Error('Failed to fetch status logs');
      return res.json();
    },
    select: (data) => data.data,
    enabled: !!orderId,
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await fetch(`/api/orders/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to refund order');
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      const res = await fetch('/api/orders/available-drivers');
      if (!res.ok) throw new Error('Failed to fetch available drivers');
      return res.json();
    },
    select: (data) => data.data,
  });
}

export function useBulkAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderIds, driverId }: { orderIds: string[]; driverId: string }) => {
      const res = await fetch('/api/orders/bulk-assign-driver', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds, driver_id: driverId }),
      });
      if (!res.ok) throw new Error('Failed to bulk assign driver');
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: string }) => {
      const res = await fetch('/api/orders/bulk-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds, status }),
      });
      if (!res.ok) throw new Error('Failed to bulk update status');
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useExportOrders() {
  return useMutation({
    mutationFn: async (filters: OrderFilters) => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      const res = await fetch(`${API_BASE}/export?${params}`);
      if (!res.ok) throw new Error('Failed to export orders');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
}