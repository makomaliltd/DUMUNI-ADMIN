import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface UsersResponse {
  success: boolean;
  data: UserProfile[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface UsersFilters {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useUsers(filters: UsersFilters = {}) {
  const { page = 1, pageSize = 20, role, status, search, sortBy = 'created_at', sortOrder = 'desc' } = filters;

  return useQuery<UsersResponse>({
    queryKey: ['users', { page, pageSize, role, status, search, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (role && role !== 'all') params.set('role', role);
      if (status && status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    placeholderData: (prev) => prev,
  });
}

export interface UserDetail {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  stats: {
    totalOrders: number;
    totalTransactions: number;
    totalDeliveries: number;
    restaurant: Record<string, unknown> | null;
  };
}

export function useUser(id: string | undefined) {
  return useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch user');
      return json.data;
    },
    enabled: !!id,
  });
}

export function useUserOrders(userId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['user-orders', userId, page],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const res = await fetch(`/api/users/${userId}/orders?page=${page}&pageSize=10`);
      if (!res.ok) throw new Error('Failed to fetch user orders');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUserTransactions(userId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['user-transactions', userId, page],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const res = await fetch(`/api/users/${userId}/transactions?page=${page}&pageSize=10`);
      if (!res.ok) throw new Error('Failed to fetch user transactions');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUserDeliveries(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-deliveries', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const res = await fetch(`/api/users/${userId}/deliveries`);
      if (!res.ok) throw new Error('Failed to fetch user deliveries');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; full_name?: string; email?: string; phone?: string; role?: string; status?: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { full_name: string; email: string; phone?: string; password: string; role: string }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, action }: { userIds: string[]; action: 'suspend' | 'activate' }) => {
      const res = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, action }),
      });
      if (!res.ok) throw new Error('Failed to perform bulk action');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}