import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// ======== Banners ========

router.get('/api/content/banners', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('banners').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, count, error } = await query
      .order('sort_order', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    res.json({ success: true, data: data || [], total: count || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/content/banners', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { title, description, image_url, link_url, discount_text, restaurant_id, status, start_date, end_date, sort_order } = req.body;
    const { data, error } = await supabase.from('banners').insert({
      title, description, image_url, link_url, discount_text, restaurant_id: restaurant_id || null,
      status: status || 'active', start_date, end_date, sort_order: sort_order || 0,
    }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/api/content/banners/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('banners').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/api/content/banners/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======== Promo Codes ========

router.get('/api/content/promo-codes', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('promo_codes').select('*', { count: 'exact' });
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    res.json({ success: true, data: data || [], total: count || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/content/promo-codes', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('promo_codes').insert(req.body).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/api/content/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('promo_codes').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/api/content/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('promo_codes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======== Categories ========

router.get('/api/content/categories', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/content/categories', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('categories').insert(req.body).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/api/content/categories/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/api/content/categories/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======== Notifications ========

router.get('/api/content/notifications', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const type = req.query.type as string;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('notifications').select('*', { count: 'exact' });
    if (type && type !== 'all') query = query.eq('type', type);

    const { data, count, error } = await query.order('sent_at', { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    res.json({ success: true, data: data || [], total: count || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/content/notifications', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { title, message, type, recipient_type, sent_count } = req.body;
    const { data, error } = await supabase.from('notifications').insert({
      title, message, type, recipient_type, sent_count: sent_count || 0, read_count: 0, status: 'sent', sent_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notification templates
router.get('/api/content/notification-templates', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('notification_templates').select('*').order('name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/api/content/notification-templates/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('notification_templates').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======== Email/SMS Settings ========

router.get('/api/content/email-settings', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('email_settings').select('*');
    if (error) throw error;
    const settings: Record<string, { value: string; description: string }> = {};
    for (const s of data || []) settings[s.key] = { value: s.value, description: s.description };
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/api/content/email-settings', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('email_settings').update({ value: value as string }).eq('key', key);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;