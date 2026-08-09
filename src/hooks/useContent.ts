import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api';

const API_BASE = '/api/content';

async function fetchApi(url: string, options?: RequestInit) {
  const res = await fetch(apiUrl(url), options);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

// ======== Banners ========

export function useBanners(page = 1, pageSize = 10, status?: string, search?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['banners', page, pageSize, status, search],
    queryFn: () => fetchApi(`${API_BASE}/banners?${params}`),
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchApi(`${API_BASE}/banners`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => fetchApi(`${API_BASE}/banners/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`${API_BASE}/banners/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

// ======== Promo Codes ========

export function usePromoCodes(page = 1, pageSize = 10, status?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status && status !== 'all') params.set('status', status);
  return useQuery({
    queryKey: ['promoCodes', page, pageSize, status],
    queryFn: () => fetchApi(`${API_BASE}/promo-codes?${params}`),
  });
}

export function useCreatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchApi(`${API_BASE}/promo-codes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promoCodes'] }),
  });
}

export function useUpdatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => fetchApi(`${API_BASE}/promo-codes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promoCodes'] }),
  });
}

export function useDeletePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`${API_BASE}/promo-codes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promoCodes'] }),
  });
}

// ======== Categories ========

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchApi(`${API_BASE}/categories`),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchApi(`${API_BASE}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => fetchApi(`${API_BASE}/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`${API_BASE}/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ======== Notifications ========

export function useNotifications(page = 1, pageSize = 10, type?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (type && type !== 'all') params.set('type', type);
  return useQuery({
    queryKey: ['notifications', page, pageSize, type],
    queryFn: () => fetchApi(`${API_BASE}/notifications?${params}`),
  });
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchApi(`${API_BASE}/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: () => fetchApi(`${API_BASE}/notification-templates`),
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => fetchApi(`${API_BASE}/notification-templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificationTemplates'] }),
  });
}

// ======== Email/SMS Settings ========

export function useEmailSettings() {
  return useQuery({
    queryKey: ['emailSettings'],
    queryFn: () => fetchApi(`${API_BASE}/email-settings`),
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchApi(`${API_BASE}/email-settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailSettings'] }),
  });
}