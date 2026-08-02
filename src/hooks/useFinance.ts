import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Withdrawal, FinancialSetting, AuditLog } from '@/types';

const API = '/api/finance';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data as T;
}

// === Overview ===
export function useFinanceOverview() {
  return useQuery({
    queryKey: ['finance', 'overview'],
    queryFn: () => fetchJSON<{
      totalRevenue: number; monthRevenue: number; pendingWithdrawals: number;
      totalCommission: number; revenueByMonth: { month: string; revenue: number; commission: number }[];
      revenueByRestaurant: { name: string; revenue: number }[];
      commissionBreakdown: { name: string; value: number }[];
    }>(`${API}/overview`),
    refetchInterval: 60_000,
  });
}

// === Withdrawals ===
export function useWithdrawals(params: {
  page?: number; pageSize?: number; status?: string; type?: string;
  startDate?: string; endDate?: string;
} = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.status) qs.set('status', params.status);
  if (params.type) qs.set('type', params.type);
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  return useQuery({
    queryKey: ['withdrawals', params],
    queryFn: () => fetchJSON<{ data: Withdrawal[]; total: number }>(`${API}/withdrawals?${qs}`),
  });
}

export function useWithdrawalDetail(id: string) {
  return useQuery({
    queryKey: ['withdrawal', id],
    queryFn: () => fetchJSON<Withdrawal & { audit_logs: AuditLog[] }>(`${API}/withdrawals/${id}`),
    enabled: !!id,
  });
}

export function useUpdateWithdrawalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      fetchJSON(`${API}/withdrawals/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['withdrawals'] }); qc.invalidateQueries({ queryKey: ['finance'] }); },
  });
}

export function useBulkWithdrawalAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: string }) =>
      fetchJSON(`${API}/withdrawals/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['withdrawals'] }); qc.invalidateQueries({ queryKey: ['finance'] }); },
  });
}

// === Transactions ===
export function useTransactions(params: {
  page?: number; pageSize?: number; type?: string; userType?: string;
  startDate?: string; endDate?: string;
} = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.type) qs.set('type', params.type);
  if (params.userType) qs.set('userType', params.userType);
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => fetchJSON<{ data: Transaction[]; total: number }>(`/api/transactions?${qs}`),
  });
}

// Define Transaction type locally since it's in the existing types
interface Transaction {
  id: string; user_id?: string; type: string; amount: number;
  description: string; status: string; created_at: string;
}

// === Settings ===
export function useFinancialSettings() {
  return useQuery({
    queryKey: ['finance', 'settings'],
    queryFn: () => fetchJSON<FinancialSetting[]>(`${API}/settings`),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: { key: string; value: string }[]) =>
      fetchJSON(`${API}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'settings'] }),
  });
}

// === Reports ===
export function useFinanceReport(type: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['finance', 'report', type],
    queryFn: () => fetchJSON<{ data: unknown[]; summary: Record<string, number> }>(`${API}/reports?type=${type}`),
  });
}