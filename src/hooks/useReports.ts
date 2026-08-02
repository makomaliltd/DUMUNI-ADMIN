import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/reports';

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function putJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function del(url: string) {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Sales Report ────────────────────────────────────────────────

export function useSalesReport(startDate?: string, endDate?: string) {
  let url = `${API_BASE}/sales`;
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    url += '?' + params.toString();
  }
  return useQuery({
    queryKey: ['reports', 'sales', startDate, endDate],
    queryFn: () => fetchJSON(url).then(r => r.data),
  });
}

// ─── User Report ─────────────────────────────────────────────────

export function useUserReport() {
  return useQuery({
    queryKey: ['reports', 'users'],
    queryFn: () => fetchJSON(`${API_BASE}/users`).then(r => r.data),
  });
}

// ─── Delivery Report ─────────────────────────────────────────────

export function useDeliveryReport() {
  return useQuery({
    queryKey: ['reports', 'delivery'],
    queryFn: () => fetchJSON(`${API_BASE}/delivery`).then(r => r.data),
  });
}

// ─── Financial Report ────────────────────────────────────────────

export function useFinancialReport(startDate?: string, endDate?: string) {
  let url = `${API_BASE}/financial`;
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    url += '?' + params.toString();
  }
  return useQuery({
    queryKey: ['reports', 'financial', startDate, endDate],
    queryFn: () => fetchJSON(url).then(r => r.data),
  });
}

// ─── Review Report ───────────────────────────────────────────────

export function useReviewReport() {
  return useQuery({
    queryKey: ['reports', 'reviews'],
    queryFn: () => fetchJSON(`${API_BASE}/reviews`).then(r => r.data),
  });
}

// ─── Scheduled Reports ───────────────────────────────────────────

export function useScheduledReports() {
  return useQuery({
    queryKey: ['reports', 'scheduled'],
    queryFn: () => fetchJSON(`${API_BASE}/scheduled`).then(r => r.data),
  });
}

export function useCreateScheduledReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; frequency: string; recipients?: string[]; format?: string }) =>
      postJSON(`${API_BASE}/scheduled`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'scheduled'] }),
  });
}

export function useUpdateScheduledReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; type?: string; frequency?: string; recipients?: string[]; format?: string; is_active?: boolean }) =>
      putJSON(`${API_BASE}/scheduled/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'scheduled'] }),
  });
}

export function useDeleteScheduledReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`${API_BASE}/scheduled/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'scheduled'] }),
  });
}