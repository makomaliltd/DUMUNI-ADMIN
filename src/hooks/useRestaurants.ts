import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/types';
import { apiUrl } from '@/lib/api';

export interface Restaurant {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  cuisine_type: string | null;
  delivery_fee: string | null;
  min_order: string | null;
  rating: string | null;
  review_count: number;
  is_open: string;
  verified: string;
  total_orders: number;
  total_revenue: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  owner?: { id: string; full_name: string; email: string; phone: string; avatar_url: string | null } | null;
  stats?: { orderCount: number; reviewCount: number };
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: string;
  category: string | null;
  image_url: string | null;
  is_available: string;
  is_popular: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface SellerApplication {
  id: string;
  user_id: string | null;
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  restaurant_name: string;
  cuisine_type: string | null;
  address: string | null;
  license_url: string | null;
  id_url: string | null;
  status: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
  applicant?: { id: string; full_name: string; email: string; phone: string; avatar_url: string | null; created_at: string } | null;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ─── Restaurants ───────────────────────────────────────────────

export function useRestaurants(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  verified?: string;
  cuisine?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.verified && params.verified !== 'all') searchParams.set('verified', params.verified);
  if (params.cuisine && params.cuisine !== 'all') searchParams.set('cuisine', params.cuisine);
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  return useQuery<PaginatedResponse<Restaurant>>({
    queryKey: ['restaurants', params],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/restaurants?${searchParams}`));
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      return res.json();
    },
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery<ApiResponse<Restaurant & { owner: Restaurant['owner']; stats: { orderCount: number; reviewCount: number } }>>({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/restaurants/${id}`));
      if (!res.ok) throw new Error('Failed to fetch restaurant');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Restaurant> }) => {
      const res = await fetch(apiUrl(`/api/restaurants/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update restaurant');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
}

export function useToggleRestaurantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/restaurants/${id}/toggle-status`), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
}

// ─── Menu Items ────────────────────────────────────────────────

export function useMenuItems(restaurantId: string | undefined) {
  return useQuery<ApiResponse<MenuItem[]>>({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/restaurants/${restaurantId}/menu`));
      if (!res.ok) throw new Error('Failed to fetch menu items');
      return res.json();
    },
    enabled: !!restaurantId,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, data }: { restaurantId: string; data: Partial<MenuItem> }) => {
      const res = await fetch(apiUrl(`/api/restaurants/${restaurantId}/menu`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create menu item');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.restaurantId] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MenuItem> }) => {
      const res = await fetch(apiUrl(`/api/menu/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update menu item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/menu/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete menu item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

// ─── Restaurant Orders ─────────────────────────────────────────

export function useRestaurantOrders(restaurantId: string | undefined, page: number = 1) {
  return useQuery({
    queryKey: ['restaurant-orders', restaurantId, page],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/restaurants/${restaurantId}/orders?page=${page}`));
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!restaurantId,
  });
}

// ─── Restaurant Reviews ────────────────────────────────────────

export function useRestaurantReviews(restaurantId: string | undefined) {
  return useQuery<ApiResponse<any[]>>({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/restaurants/${restaurantId}/reviews`));
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!restaurantId,
  });
}

// ─── Restaurant Analytics ──────────────────────────────────────

export function useRestaurantAnalytics(restaurantId: string | undefined) {
  return useQuery<ApiResponse<{
    dailyData: { date: string; revenue: number; orders: number }[];
    totalRevenue: number;
    completedOrders: number;
    ratingDistribution: { rating: number; count: number }[];
    avgRating: number;
  }>>({
    queryKey: ['restaurant-analytics', restaurantId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/restaurants/${restaurantId}/analytics`));
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: !!restaurantId,
  });
}

// ─── Seller Applications ───────────────────────────────────────

export function useSellerApplications(params: { page?: number; pageSize?: number; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);

  return useQuery<PaginatedResponse<SellerApplication>>({
    queryKey: ['seller-applications', params],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/seller-applications?${searchParams}`));
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
  });
}

export function useSellerApplication(id: string | undefined) {
  return useQuery<ApiResponse<SellerApplication>>({
    queryKey: ['seller-application', id],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/seller-applications/${id}`));
      if (!res.ok) throw new Error('Failed to fetch application');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch(apiUrl(`/api/seller-applications/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to review application');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-applications'] });
      queryClient.invalidateQueries({ queryKey: ['seller-application'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}