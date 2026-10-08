import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api';

const API_BASE = '/api/conversations';

export type ConversationStatus = 'open' | 'closed';
export type SenderRole = 'buyer' | 'seller' | 'driver' | 'admin' | 'system';

export interface AdminConversation {
  id: string;
  order_id: string | null;
  topic: 'order' | 'cancellation' | 'delivery' | 'payment' | 'general';
  status: ConversationStatus;
  subject: string | null;
  is_flagged: boolean;
  flagged_reason: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  admin_unread_count: number;
  created_at: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  seller_name: string | null;
  seller_email: string | null;
  seller_phone: string | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  order_status: string | null;
  order_total: number | null;
  refusal_reason: string | null;
  message_count: number;
  quick_action_count: number;
  order?: Record<string, unknown> | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: SenderRole;
  body: string;
  message_type: 'text' | 'image' | 'system' | 'order_status';
  quick_action: string | null;
  attachment_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  sender_avatar_url?: string | null;
}

export interface ConversationFilters {
  status?: string;
  flagged?: boolean;
  q?: string;
  order_id?: string;
  limit?: number;
  offset?: number;
}

async function fetchApi<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(url), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errorMessage = body.error || body.message || errorMessage;
    } catch {
      // Réponse non JSON : on garde le message HTTP
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

// ======== Liste ========

export function useConversations(filters: ConversationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.flagged !== undefined) params.set('flagged', String(filters.flagged));
  if (filters.q) params.set('q', filters.q);
  if (filters.order_id) params.set('order_id', filters.order_id);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => fetchApi(`${API_BASE}?${params.toString()}`),
  });
}

// ======== Détail ========

export function useConversation(id?: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => fetchApi(`${API_BASE}/${id}`),
    select: (data: any) => data.data as AdminConversation,
    enabled: !!id,
  });
}

export function useConversationMessages(id?: string) {
  return useQuery({
    queryKey: ['conversationMessages', id],
    queryFn: () => fetchApi(`${API_BASE}/${id}/messages`),
    select: (data: any) => (data.data || []) as ConversationMessage[],
    enabled: !!id,
  });
}

// ======== Actions ========

export function useSendAdminMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message, sender_id }: { id: string; message: string; sender_id?: string }) =>
      fetchApi(`${API_BASE}/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, sender_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversationMessages'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`${API_BASE}/${id}/read`, { method: 'POST', body: '{}' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useFlagConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flagged, reason }: { id: string; flagged: boolean; reason?: string }) =>
      fetchApi(`${API_BASE}/${id}/flag`, {
        method: 'POST',
        body: JSON.stringify({ flagged, reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useSetConversationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ConversationStatus }) =>
      fetchApi(`${API_BASE}/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}
