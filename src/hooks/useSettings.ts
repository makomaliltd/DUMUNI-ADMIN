import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API = '/api/settings';

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'API error');
  return json;
}

// ======== Platform Settings ========

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api(`${API}`),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, string>) => api(`${API}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

// ======== Admin Roles ========

export function useAdminRoles() {
  return useQuery({
    queryKey: ['adminRoles'],
    queryFn: () => api(`${API}/admin-roles`),
  });
}

export function useCreateAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api(`${API}/admin-roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminRoles'] }),
  });
}

export function useUpdateAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api(`${API}/admin-roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminRoles'] }),
  });
}

export function useDeleteAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${API}/admin-roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminRoles'] }),
  });
}

// ======== Admin Users ========

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api(`${API}/admin-users`),
  });
}

export function useAddAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api(`${API}/admin-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api(`${API}/admin-users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

export function useRemoveAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${API}/admin-users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

// ======== Email Templates ========

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => api(`${API}/email-templates`),
  });
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api(`${API}/email-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailTemplates'] }),
  });
}

// ======== Activity Logs ========

export function useActivityLogs(page = 1, pageSize = 20, filters?: Record<string, string>) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  }
  return useQuery({
    queryKey: ['activityLogs', page, pageSize, filters],
    queryFn: () => api(`${API}/activity-logs?${params}`),
  });
}

export function useClearActivityLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`${API}/activity-logs`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activityLogs'] }),
  });
}

// ======== Profiles (for admin user selection) ========

export function useProfiles(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['profiles', search],
    queryFn: () => api(`${API}/profiles?${params}`),
    enabled: search !== undefined,
  });
}

// ======== Health Check ========

export function useHealthCheck() {
  return useQuery({
    queryKey: ['healthCheck'],
    queryFn: () => api(`${API}/health-check`),
    refetchInterval: 30000,
  });
}