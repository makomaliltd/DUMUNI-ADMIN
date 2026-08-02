import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();
const supabase = getSupabaseClient();

// GET /api/finance/overview - Financial overview stats
router.get('/api/finance/overview', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ data: totalRevenue }, { data: monthRevenue }, { data: pendingWithdrawals },
      { data: totalCommission }, { data: revenueByMonth }, { data: revenueByRestaurant }] = await Promise.all([
      supabase.from('orders').select('amount').eq('payment_status', 'paid'),
      supabase.from('orders').select('amount, commission').gte('created_at', monthStart).eq('payment_status', 'paid'),
      supabase.from('withdrawals').select('amount').eq('status', 'pending'),
      supabase.from('orders').select('commission').eq('payment_status', 'paid'),
      supabase.from('revenue_records').select('date, amount, commission').order('date', { ascending: true }).limit(12),
      supabase.from('restaurants').select('name, total_revenue, total_orders').order('total_revenue', { ascending: false }).limit(10),
    ]);

    const total = (totalRevenue || []).reduce((sum: number, r: any) => sum + (parseFloat(r.amount) || 0), 0);
    const monthTotal = (monthRevenue || []).reduce((sum: number, r: any) => sum + (parseFloat(r.amount) || 0), 0);
    const monthComm = (monthRevenue || []).reduce((sum: number, r: any) => sum + (parseFloat(r.commission) || 0), 0);
    const pendingTotal = (pendingWithdrawals || []).reduce((sum: number, r: any) => sum + (parseFloat(r.amount) || 0), 0);
    const commTotal = (totalCommission || []).reduce((sum: number, r: any) => sum + (parseFloat(r.commission) || 0), 0);

    // Generate monthly revenue data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthStart2 = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
      const { data: monthData } = await supabase
        .from('orders')
        .select('amount, commission')
        .gte('created_at', monthStart2)
        .lte('created_at', monthEnd)
        .eq('payment_status', 'paid');
      const rev = (monthData || []).reduce((s: number, r: any) => s + (parseFloat(r.amount) || 0), 0);
      const comm = (monthData || []).reduce((s: number, r: any) => s + (parseFloat(r.commission) || 0), 0);
      monthlyData.push({ month: monthStr, revenue: rev, commission: comm });
    }

    // Revenue by restaurant
    const topRestaurants = (revenueByRestaurant || []).map((r: any) => ({
      name: r.name,
      revenue: parseFloat(r.total_revenue) || 0,
      orders: r.total_orders || 0,
    }));

    res.json({
      success: true,
      data: {
        totalRevenue: total,
        monthRevenue: monthTotal,
        monthCommission: monthComm,
        pendingWithdrawals: pendingTotal,
        pendingCount: (pendingWithdrawals || []).length,
        totalCommission: commTotal,
        monthlyRevenue: monthlyData,
        topRestaurants,
        commissionBreakdown: [
          { name: '平台佣金', value: commTotal },
          { name: '商家收入', value: total - commTotal },
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/withdrawals
router.get('/api/finance/withdrawals', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = req.query.search as string;

    let query = supabase.from('withdrawals').select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('user_type', type);
    if (search) {
      query = query.or(`user_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ success: true, data, total: count, page, pageSize });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/finance/withdrawals/:id/status
router.put('/api/finance/withdrawals/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reject_reason, notes } = req.body;

    const updateData: any = { status };
    if (status === 'rejected') updateData.reject_reason = reject_reason || '';
    if (status === 'approved' || status === 'rejected' || status === 'completed') {
      updateData.reviewed_by = 'admin';
      updateData.reviewed_at = new Date().toISOString();
    }
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase.from('withdrawals').update(updateData).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      action: `withdrawal_${status}`,
      entity_type: 'withdrawal',
      entity_id: id,
      performed_by: 'admin',
      details: JSON.stringify({ status, reject_reason, notes }),
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/withdrawals/bulk-action
router.post('/api/finance/withdrawals/bulk-action', async (req: Request, res: Response) => {
  try {
    const { ids, action, reject_reason } = req.body;
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'complete' ? 'completed' : null;
    if (!status) return res.status(400).json({ success: false, error: 'Invalid action' });

    const updateData: any = { status, reviewed_by: 'admin', reviewed_at: new Date().toISOString() };
    if (status === 'rejected') updateData.reject_reason = reject_reason || '';

    const { data, error } = await supabase.from('withdrawals').update(updateData).in('id', ids).select();
    if (error) throw error;

    for (const id of ids) {
      await supabase.from('audit_logs').insert({
        action: `withdrawal_${status}`,
        entity_type: 'withdrawal',
        entity_id: id,
        performed_by: 'admin',
        details: JSON.stringify({ status, reject_reason, bulk: true }),
      });
    }

    res.json({ success: true, data, affected: data?.length || 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/transactions
router.get('/api/finance/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const type = req.query.type as string;
    const userType = req.query.userType as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    let query = supabase.from('transactions').select('*', { count: 'exact' });

    if (type && type !== 'all') query = query.eq('type', type);
    if (userType && userType !== 'all') {
      // Join with profiles to filter by role
    }
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate + 'T23:59:59Z');

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ success: true, data, total: count, page, pageSize });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/settings
router.get('/api/finance/settings', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('financial_settings').select('*').order('key');
    if (error) throw error;
    const settings: Record<string, { value: string; description: string }> = {};
    (data || []).forEach((s: any) => { settings[s.key] = { value: s.value, description: s.description }; });
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/finance/settings
router.put('/api/finance/settings', async (req: Request, res: Response) => {
  try {
    const updates = req.body.settings as Record<string, string>;
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const { data, error } = await supabase.from('financial_settings').update({ value }).eq('key', key).select().single();
      if (error) throw error;
      results.push(data);
    }
    await supabase.from('audit_logs').insert({
      action: 'settings_updated',
      entity_type: 'settings',
      entity_id: 'global',
      performed_by: 'admin',
      details: JSON.stringify({ updatedKeys: Object.keys(updates) }),
    });
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/reports
router.get('/api/finance/reports', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'monthly';
    const now = new Date();

    // Daily revenue (last 30 days)
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = d.toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
      const { data } = await supabase
        .from('orders')
        .select('amount, commission')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .eq('payment_status', 'paid');
      const rev = (data || []).reduce((s: number, r: any) => s + (parseFloat(r.amount) || 0), 0);
      const comm = (data || []).reduce((s: number, r: any) => s + (parseFloat(r.commission) || 0), 0);
      dailyData.push({
        date: d.toISOString().split('T')[0],
        revenue: rev,
        commission: comm,
        orderCount: data?.length || 0,
      });
    }

    // Withdrawal summary
    const { data: withdrawals } = await supabase.from('withdrawals').select('status, amount');
    const withdrawalSummary = {
      pending: (withdrawals || []).filter((w: any) => w.status === 'pending').reduce((s: number, w: any) => s + (parseFloat(w.amount) || 0), 0),
      approved: (withdrawals || []).filter((w: any) => w.status === 'approved').reduce((s: number, w: any) => s + (parseFloat(w.amount) || 0), 0),
      completed: (withdrawals || []).filter((w: any) => w.status === 'completed').reduce((s: number, w: any) => s + (parseFloat(w.amount) || 0), 0),
      rejected: (withdrawals || []).filter((w: any) => w.status === 'rejected').reduce((s: number, w: any) => s + (parseFloat(w.amount) || 0), 0),
    };

    // Commission by restaurant
    const { data: restaurants } = await supabase.from('restaurants').select('name, total_revenue, total_orders').order('total_revenue', { ascending: false }).limit(10);
    const commissionByRestaurant = (restaurants || []).map((r: any) => ({
      name: r.name,
      commission: (parseFloat(r.total_revenue) || 0) * 0.1,
      revenue: parseFloat(r.total_revenue) || 0,
      orders: r.total_orders || 0,
    }));

    res.json({
      success: true,
      data: {
        daily: dailyData,
        withdrawalSummary,
        commissionByRestaurant,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;