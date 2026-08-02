import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// ======== Platform Settings (Key-Value) ========

router.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('platform_settings').select('*');
    if (error) throw error;
    const settings: Record<string, string> = {};
    (data || []).forEach((s: any) => { settings[s.key] = s.value; });
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const updates = req.body;
    const results: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      const { data, error } = await supabase.from('platform_settings').upsert(
        { key, value: String(value), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      ).select();
      if (error) throw error;
      results.push(data);
    }
    // Log the action
    await supabase.from('activity_logs').insert({
      action: 'settings_update',
      entity_type: 'settings',
      details: { updated_keys: Object.keys(updates) },
    });
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== Admin Roles ========

router.get('/api/settings/admin-roles', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('admin_roles').select('*').order('role_name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/settings/admin-roles', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { name, description, permissions } = req.body;
    const { data, error } = await supabase.from('admin_roles').insert({
      name, description, permissions: permissions || {},
    }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings/admin-roles/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { name, description, permissions } = req.body;
    const { data, error } = await supabase.from('admin_roles').update({
      name, description, permissions, updated_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/settings/admin-roles/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('admin_roles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== Admin Users ========

router.get('/api/settings/admin-users', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    // Fetch admin users
    const { data: adminUsers, error: usersError } = await supabase
      .from('admin_users')
      .select('*, admin_roles!role_id(name, description, permissions)')
      .order('created_at', { ascending: false });
    if (usersError) throw usersError;

    // Fetch profiles separately for each admin user
    const userIds = (adminUsers || []).filter((u: any) => u.user_id).map((u: any) => u.user_id);
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);
      profiles = profileData || [];
    }

    // Merge profiles into admin users
    const enriched = (adminUsers || []).map((au: any) => ({
      ...au,
      profiles: profiles.find((p: any) => p.id === au.user_id) || null,
    }));

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/settings/admin-users', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { user_id, role_id } = req.body;
    const { data, error } = await supabase.from('admin_users').insert({
      user_id, role_id, is_active: true,
    }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings/admin-users/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { role_id, is_active } = req.body;
    const { data, error } = await supabase.from('admin_users').update({
      role_id, is_active, updated_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/settings/admin-users/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('admin_users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== Email Templates ========

router.get('/api/settings/email-templates', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('email_templates').select('*').order('name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/settings/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { subject, body, variables } = req.body;
    const { data, error } = await supabase.from('email_templates').update({
      subject, body, variables, updated_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== Activity Logs ========

router.get('/api/settings/activity-logs', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const adminId = req.query.admin_id as string;
    const action = req.query.action as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    let query = supabase.from('activity_logs').select('*', { count: 'exact' });
    if (adminId) query = query.eq('admin_id', adminId);
    if (action) query = query.eq('action', action);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    res.json({ success: true, data: data || [], total: count || 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/settings/activity-logs', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('activity_logs').delete().lt('created_at', new Date(Date.now() - 90*86400000).toISOString());
    if (error) throw error;
    res.json({ success: true, message: 'Old logs cleaned up' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== Profiles (for admin user selection) ========

router.get('/api/settings/profiles', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const search = req.query.search as string;
    let query = supabase.from('profiles').select('id, full_name, email, role').neq('role', 'admin');
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error } = await query.limit(20);
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== Health Check / Maintenance ========

router.get('/api/settings/health-check', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const start = Date.now();
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    const dbLatency = Date.now() - start;
    res.json({
      success: true,
      data: {
        status: error ? 'degraded' : 'healthy',
        database: error ? 'error' : 'connected',
        db_latency_ms: dbLatency,
        server_uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;