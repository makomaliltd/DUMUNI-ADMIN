import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

// Monté sous /api/conversations (chemins relatifs).
// Sources réelles : vue `v_conversations_admin`, tables `conversations` et `messages`.
const router = Router();
const db = () => getSupabaseClient();

const ADMIN_VIEW = 'v_conversations_admin';

const VALID_STATUSES = ['open', 'closed'];
const PREVIEW_MAX_LENGTH = 140;

// Champs texte sur lesquels porte la recherche libre `q`.
const SEARCH_FIELDS = ['buyer_email', 'seller_email', 'buyer_name', 'seller_name', 'order_id'];

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function toBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  const v = String(value).toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return null;
}

function previewOf(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_MAX_LENGTH ? `${flat.slice(0, PREVIEW_MAX_LENGTH - 1)}…` : flat;
}

// ─── GET /api/conversations — liste paginée + filtres ────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, flagged, q, order_id, limit, offset } = req.query as Record<string, string>;

    const size = toInt(limit, 50, 1, 100);
    const from = toInt(offset, 0, 0, 1000000);

    let query: any = db().from(ADMIN_VIEW).select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (order_id) query = query.eq('order_id', order_id);

    const flag = toBoolean(flagged);
    if (flag !== null) query = query.eq('is_flagged', flag);

    if (q) {
      const needle = String(q).trim();
      if (needle) {
        query = query.or(SEARCH_FIELDS.map((f) => `${f}.ilike.%${needle}%`).join(','));
      }
    }

    query = query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(from, from + size - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [], total: count || 0, limit: size, offset: from });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/conversations/:id — détail du fil + infos commande ─────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: conversation, error } = await db()
      .from(ADMIN_VIEW)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

    let order: any = null;
    if (conversation.order_id) {
      const o = await db()
        .from('orders')
        .select('id, status, total, subtotal, delivery_fee, commission, delivery_address, notes, refusal_reason, created_at, buyer_id, restaurant_id, delivery_driver_id')
        .eq('id', conversation.order_id)
        .maybeSingle();
      if (o.error) throw o.error;
      order = o.data || null;
    }

    res.json({ success: true, data: { ...conversation, order } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/conversations/:id/messages — messages du fil (chronologique) ───
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: messages, error } = await db()
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const rows = messages || [];
    const senderIds = Array.from(new Set(rows.map((m: any) => m.sender_id).filter(Boolean)));
    let users: any[] = [];
    if (senderIds.length) {
      const u = await db().from('users').select('id, name, email, avatar_url').in('id', senderIds);
      if (u.error) throw u.error;
      users = u.data || [];
    }
    const userById = new Map(users.map((x: any) => [x.id, x]));

    const enriched = rows.map((m: any) => {
      const sender = m.sender_id ? userById.get(m.sender_id) : undefined;
      return {
        ...m,
        sender_name: sender?.name ?? null,
        sender_email: sender?.email ?? null,
        sender_avatar_url: sender?.avatar_url ?? null,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/conversations/:id/messages — réponse de l'admin ───────────────
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, sender_id } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const now = new Date().toISOString();
    const body = String(message).trim();

    const { data: inserted, error } = await db()
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: sender_id || null,
        sender_role: 'admin',
        body,
        message_type: 'text',
        quick_action: null,
        attachment_url: null,
        is_read: true,
        read_at: now,
        created_at: now,
      })
      .select()
      .single();
    if (error) throw error;

    const { error: convError } = await db()
      .from('conversations')
      .update({
        last_message_at: now,
        last_message_preview: previewOf(body),
        admin_unread_count: 0,
        updated_at: now,
      })
      .eq('id', id);
    if (convError) throw convError;

    res.json({ success: true, data: inserted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/conversations/:id/read — remet admin_unread_count à 0 ─────────
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await db()
      .from('conversations')
      .update({ admin_unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Conversation marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/conversations/:id/flag — marquer / démarquer litige ───────────
router.post('/:id/flag', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body || {};

    const flag = toBoolean(flagged);
    if (flag === null) {
      return res.status(400).json({ success: false, error: 'flagged (boolean) is required' });
    }

    const { error } = await db()
      .from('conversations')
      .update({
        is_flagged: flag,
        flagged_reason: flag ? reason ?? null : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: flag ? 'Conversation flagged' : 'Conversation unflagged' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/conversations/:id/close — fermer / rouvrir le fil ─────────────
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }

    const { error } = await db()
      .from('conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: `Conversation ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
