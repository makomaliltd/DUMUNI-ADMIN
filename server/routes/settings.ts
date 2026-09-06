import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// ─── Correspondances avec le schéma réel ───────────────────────────────────
// - Paramètres plateforme : `platform_settings` (key, value, description, category)
// - Rôles admin           : `admin_roles` (user_id, role_name, permissions jsonb)
// - Utilisateurs admin    : `users` + `admin_roles`
// - Journaux d'activité / modèles d'e-mail : AUCUNE table → réponses vides
const db = () => getSupabaseClient();

// ═══════════════ Platform settings ═══════════════

router.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db().from('platform_settings').select('key,value,description,category');
    if (error) throw error;
    const out: Record<string, string> = {};
    (data || []).forEach((s: any) => { out[s.key] = s.value; });
    res.json({ success: true, data: out });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const updates = (req.body || {}) as Record<string, string>;
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const { data: existing } = await db().from('platform_settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        const { data, error } = await db()
          .from('platform_settings')
          .update({ value: String(value), updated_at: new Date().toISOString() })
          .eq('key', key)
          .select()
          .single();
        if (error) throw error;
        results.push(data);
      } else {
        const { data, error } = await db()
          .from('platform_settings')
          .insert({ key, value: String(value), description: key, category: 'platform', updated_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        results.push(data);
      }
    }
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Admin roles ═══════════════

router.get('/api/settings/admin-roles', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db().from('admin_roles').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const ids = Array.from(new Set((data || []).map((r: any) => r.user_id).filter(Boolean)));
    const userMap = new Map<string, any>();
    if (ids.length) {
      const { data: users } = await db().from('users').select('id,name,email,phone').in('id', ids);
      (users || []).forEach((u: any) => userMap.set(u.id, u));
    }
    const rows = (data || []).map((r: any) => ({
      ...r,
      user_name: userMap.get(r.user_id)?.name || null,
      email: userMap.get(r.user_id)?.email || null,
    }));
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/settings/admin-roles', async (req: Request, res: Response) => {
  try {
    const { user_id, role_name, permissions } = req.body || {};
    if (!role_name) return res.status(400).json({ success: false, error: 'role_name is required' });
    const { data, error } = await db()
      .from('admin_roles')
      .insert({ user_id: user_id || null, role_name, permissions: permissions || {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings/admin-roles/:id', async (req: Request, res: Response) => {
  try {
    const { role_name, permissions, user_id } = req.body || {};
    const update: any = { updated_at: new Date().toISOString() };
    if (role_name !== undefined) update.role_name = role_name;
    if (permissions !== undefined) update.permissions = permissions;
    if (user_id !== undefined) update.user_id = user_id;
    const { data, error } = await db().from('admin_roles').update(update).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/settings/admin-roles/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await db().from('admin_roles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Admin users (users + admin_roles) ═══════════════

router.get('/api/settings/admin-users', async (_req: Request, res: Response) => {
  try {
    const { data: roles, error } = await db().from('admin_roles').select('*');
    if (error) throw error;
    const ids = Array.from(new Set((roles || []).map((r: any) => r.user_id).filter(Boolean)));
    const userMap = new Map<string, any>();
    if (ids.length) {
      const { data: users } = await db().from('users').select('id,name,email,phone,avatar_url,is_active,created_at').in('id', ids);
      (users || []).forEach((u: any) => userMap.set(u.id, u));
    }
    const rows = (roles || []).map((r: any) => {
      const u = userMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        role_id: r.id,
        name: u?.name || null,
        full_name: u?.name || null,
        email: u?.email || null,
        phone: u?.phone || null,
        avatar_url: u?.avatar_url || null,
        role: r.role_name,
        role_name: r.role_name,
        permissions: r.permissions,
        is_active: u?.is_active ?? true,
        created_at: r.created_at,
      };
    });
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/settings/admin-users', async (req: Request, res: Response) => {
  try {
    const { user_id, email, role, role_name, permissions, name } = req.body || {};

    let uid = user_id;
    if (!uid && email) {
      const { data: users } = await db().from('users').select('id').eq('email', email).limit(1);
      uid = users?.[0]?.id;
    }
    if (!uid && !name) {
      return res.status(400).json({ success: false, error: 'user_id, email or name is required' });
    }
    if (!uid) {
      const { data: users } = await db().from('users').select('id').ilike('name', `%${name}%`).limit(1);
      uid = users?.[0]?.id;
    }
    if (!uid) return res.status(404).json({ success: false, error: 'User not found' });

    const { data, error } = await db()
      .from('admin_roles')
      .insert({
        user_id: uid,
        role_name: role || role_name || 'admin',
        permissions: permissions || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings/admin-users/:id', async (req: Request, res: Response) => {
  try {
    const { role, role_name, permissions } = req.body || {};
    const update: any = { updated_at: new Date().toISOString() };
    if (role_name || role) update.role_name = role_name || role;
    if (permissions !== undefined) update.permissions = permissions;
    const { data, error } = await db().from('admin_roles').update(update).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/settings/admin-users/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await db().from('admin_roles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Email templates (aucune table) ═══════════════

router.get('/api/settings/email-templates', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});
router.put('/api/settings/email-templates/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

// ═══════════════ Activity logs (aucune table) ═══════════════

router.get('/api/settings/activity-logs', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], total: 0, pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
});
router.delete('/api/settings/activity-logs', async (_req: Request, res: Response) => {
  res.json({ success: true });
});

// ═══════════════ Profiles (recherche d'utilisateurs) ═══════════════

router.get('/api/settings/profiles', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    let query: any = db().from('users').select('id,name,email,phone,avatar_url,role,created_at');
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    const rows = (data || []).map((u: any) => ({ ...u, full_name: u.name }));
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════ Health check ═══════════════

router.get('/api/settings/health-check', async (_req: Request, res: Response) => {
  try {
    const started = Date.now();
    const { error } = await db().from('users').select('id').limit(1);
    res.json({
      success: true,
      data: {
        status: error ? 'error' : 'ok',
        database: error ? 'disconnected' : 'connected',
        responseTime: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
