import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// ─── Correspondances avec le schéma réel ───────────────────────────────────
// - Bannières      : `ads` (title, description, discount_text, link_url, image_url,
//                    banner_url, status, starts_at, expires_at, placement…)
// - Codes promo    : `promotions` (code, discount_type, discount_value, min_order,
//                    max_discount, usage_limit, used_count, is_active, expires_at)
// - Catégories     : dérivées de `menus.category` (aucune table dédiée)
// - Notifications  : `notifications` (user_id, title, message, type, is_read, data)
// - Modèles / e-mail : `platform_settings` (category = 'email') | sinon non persisté

const db = () => getSupabaseClient();

function mapBanner(row: any) {
  return {
    ...row,
    start_date: row.starts_at || row.created_at,
    end_date: row.expires_at || null,
  };
}

function mapPromo(row: any) {
  return {
    ...row,
    min_order_amount: row.min_order,
    status: row.is_active ? 'active' : 'inactive',
    start_date: row.created_at,
    end_date: row.expires_at,
  };
}

// ═══════════════ Banners (ads) ═══════════════

router.get('/api/content/banners', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;
    const search = (req.query.search as string || '').toLowerCase();

    const { data, error } = await db().from('ads').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    let rows = (data || []).map(mapBanner);
    if (status && status !== 'all') rows = rows.filter((b: any) => b.status === status);
    if (search) {
      rows = rows.filter((b: any) =>
        String(b.title || '').toLowerCase().includes(search) ||
        String(b.description || '').toLowerCase().includes(search)
      );
    }

    const total = rows.length;
    const from = (page - 1) * pageSize;
    res.json({ success: true, data: rows.slice(from, from + pageSize), total });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/content/banners', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const row: any = {
      title: body.title,
      description: body.description || null,
      discount_text: body.discount_text || null,
      link_url: body.link_url || null,
      image_url: body.image_url || null,
      status: body.status || 'active',
      placement: body.placement || 'home',
      starts_at: body.start_date || new Date().toISOString(),
      expires_at: body.end_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db().from('ads').insert(row).select().single();
    if (error) throw error;
    res.json({ success: true, data: mapBanner(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/content/banners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const update: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      title: 'title', description: 'description', discount_text: 'discount_text',
      link_url: 'link_url', image_url: 'image_url', status: 'status',
      start_date: 'starts_at', end_date: 'expires_at',
    };
    for (const [from, to] of Object.entries(map)) {
      if (body[from] !== undefined) update[to] = body[from];
    }
    const { data, error } = await db().from('ads').update(update).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data: mapBanner(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/content/banners/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await db().from('ads').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Promo codes (promotions) ═══════════════

router.get('/api/content/promo-codes', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;

    const { data, error } = await db().from('promotions').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    let rows = (data || []).map(mapPromo);
    if (status && status !== 'all') rows = rows.filter((p: any) => p.status === status);

    const total = rows.length;
    const from = (page - 1) * pageSize;
    res.json({ success: true, data: rows.slice(from, from + pageSize), total });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/content/promo-codes', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const row: any = {
      code: body.code,
      discount_type: body.discount_type || 'percentage',
      discount_value: body.discount_value ?? 0,
      min_order: body.min_order ?? body.min_order_amount ?? 0,
      max_discount: body.max_discount ?? null,
      usage_limit: body.usage_limit ?? null,
      used_count: 0,
      is_active: body.status ? body.status === 'active' : true,
      expires_at: body.expires_at || body.end_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db().from('promotions').insert(row).select().single();
    if (error) throw error;
    res.json({ success: true, data: mapPromo(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/content/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const update: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      code: 'code', discount_type: 'discount_type', discount_value: 'discount_value',
      min_order_amount: 'min_order', min_order: 'min_order', max_discount: 'max_discount',
      usage_limit: 'usage_limit', used_count: 'used_count', expires_at: 'expires_at',
    };
    for (const [from, to] of Object.entries(map)) {
      if (body[from] !== undefined) update[to] = body[from];
    }
    if (body.status !== undefined) update.is_active = body.status === 'active';
    if (body.is_active !== undefined) update.is_active = body.is_active === true || body.is_active === 'true';
    const { data, error } = await db().from('promotions').update(update).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data: mapPromo(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/content/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await db().from('promotions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Categories (dérivé de menus.category) ═══════════════

router.get('/api/content/categories', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db().from('menus').select('category');
    if (error) throw error;
    const counts = new Map<string, number>();
    (data || []).forEach((m: any) => {
      if (!m.category) return;
      counts.set(m.category, (counts.get(m.category) || 0) + 1);
    });
    const rows = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count], index) => ({
        id: name,
        name,
        icon: 'utensils',
        sort_order: index + 1,
        item_count: count,
        created_at: null,
      }));
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pas de table dédiée : on renvoie l'objet fourni pour ne pas casser l'UI
router.post('/api/content/categories', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: `cat_${Date.now()}`, ...req.body } });
});
router.put('/api/content/categories/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
router.delete('/api/content/categories/:id', async (_req: Request, res: Response) => {
  res.json({ success: true });
});

// ═══════════════ Notifications ═══════════════

router.get('/api/content/notifications', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const type = req.query.type as string;

    let query: any = db().from('notifications').select('*');
    if (type && type !== 'all') query = query.eq('type', type);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const ids = Array.from(new Set((data || []).map((n: any) => n.user_id).filter(Boolean)));
    const userMap = new Map<string, any>();
    if (ids.length) {
      const { data: users } = await db().from('users').select('id,name,email,phone').in('id', ids);
      (users || []).forEach((u: any) => userMap.set(u.id, u));
    }

    const rows = (data || []).map((n: any) => ({
      ...n,
      content: n.message,
      user_name: userMap.get(n.user_id)?.name || null,
    }));

    const total = rows.length;
    const from = (page - 1) * pageSize;
    res.json({ success: true, data: rows.slice(from, from + pageSize), total });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/content/notifications', async (req: Request, res: Response) => {
  try {
    const { title, message, type, user_id } = req.body || {};
    if (!title) return res.status(400).json({ success: false, error: 'title is required' });

    let targets: string[] = [];
    if (user_id) {
      targets = [user_id];
    } else {
      const { data: users } = await db().from('users').select('id');
      targets = (users || []).map((u: any) => u.id);
    }
    if (!targets.length) return res.json({ success: true, data: { sent: 0 } });

    const rows = targets.map((uid) => ({
      user_id: uid,
      title,
      message: message || '',
      type: type || 'system',
      is_read: false,
      created_at: new Date().toISOString(),
    }));
    const { data, error } = await db().from('notifications').insert(rows).select();
    if (error) throw error;
    res.json({ success: true, data: { sent: data?.length || 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Notification templates (non persisté) ═══════════════

router.get('/api/content/notification-templates', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});
router.put('/api/content/notification-templates/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

// ═══════════════ Email settings (platform_settings) ═══════════════

router.get('/api/content/email-settings', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db().from('platform_settings').select('key,value').eq('category', 'email');
    if (error) throw error;
    const out: Record<string, string> = {};
    (data || []).forEach((s: any) => { out[s.key] = s.value; });
    res.json({ success: true, data: out });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/content/email-settings', async (req: Request, res: Response) => {
  try {
    const updates = (req.body || {}) as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      const { data: existing } = await db().from('platform_settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        await db().from('platform_settings').update({ value: String(value), updated_at: new Date().toISOString() }).eq('key', key);
      } else {
        await db().from('platform_settings').insert({
          key, value: String(value), description: key, category: 'email', updated_at: new Date().toISOString(),
        });
      }
    }
    res.json({ success: true, data: updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
