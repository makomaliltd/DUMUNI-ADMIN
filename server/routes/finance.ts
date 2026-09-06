import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// ─── Correspondances avec le schéma réel ───────────────────────────────────
// - "paiement effectué" ⇒ orders.status ∈ {delivered, completed}
// - retraits        : `withdrawal_requests` (user_id, user_type, amount, phone_number, status…)
// - transactions    : `wallet_transactions` (user_id / seller_id / driver_id, type, amount, status)
// - paramètres fin. : `platform_settings` (category = 'finance')
// - PAS de table `transactions`, `withdrawals`, `financial_settings`, `revenue_records`, `audit_logs`

const PAID_STATUSES = ['delivered', 'completed'];
const EXCLUDED_STATUSES = ['cancelled', 'rejected', 'refused', 'refunded'];

const db = () => getSupabaseClient();

async function fetchOrders() {
  const { data, error } = await db()
    .from('orders')
    .select('id,total,commission,delivery_fee,status,restaurant_id,created_at');
  if (error) throw error;
  return (data || []).filter((o: any) => !EXCLUDED_STATUSES.includes(o.status));
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/finance/overview
router.get('/api/finance/overview', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const orders = await fetchOrders();
    const paid = orders.filter((o: any) => PAID_STATUSES.includes(o.status));

    const sum = (rows: any[], field: string) => rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);

    const totalRevenue = sum(paid, 'total');
    const totalCommission = sum(paid, 'commission');
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = paid.filter((o: any) => new Date(o.created_at) >= monthStart);
    const monthRevenue = sum(monthOrders, 'total');

    // Retraits en attente
    const { data: withdrawals } = await db().from('withdrawal_requests').select('amount,status');
    const pendingRows = (withdrawals || []).filter((w: any) => w.status === 'pending');
    const pendingWithdrawals = pendingRows.reduce((s: number, w: any) => s + (Number(w.amount) || 0), 0);

    // Chiffre d'affaires sur 12 mois
    const revenueByMonth: Array<{ month: string; revenue: number; commission: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const rows = paid.filter((o: any) => {
        const cd = new Date(o.created_at);
        return cd >= start && cd <= end;
      });
      revenueByMonth.push({ month: monthKey(d), revenue: sum(rows, 'total'), commission: sum(rows, 'commission') });
    }

    // CA par restaurant
    const byRestaurant = new Map<string, { revenue: number; orders: number }>();
    paid.forEach((o: any) => {
      const cur = byRestaurant.get(o.restaurant_id) || { revenue: 0, orders: 0 };
      cur.revenue += Number(o.total) || 0;
      cur.orders += 1;
      byRestaurant.set(o.restaurant_id, cur);
    });
    const restaurantIds = Array.from(byRestaurant.keys());
    let names = new Map<string, string>();
    if (restaurantIds.length) {
      const { data: restaurants } = await db().from('restaurants').select('id,name').in('id', restaurantIds);
      names = new Map((restaurants || []).map((r: any) => [r.id, r.name]));
    }
    const revenueByRestaurant = Array.from(byRestaurant.entries())
      .map(([id, v]) => ({ name: names.get(id) || id, revenue: v.revenue, orders: v.orders }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const deliveryFees = sum(paid, 'delivery_fee');

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthRevenue,
        monthCommission: sum(monthOrders, 'commission'),
        pendingWithdrawals,
        pendingCount: pendingRows.length,
        totalCommission,
        revenueByMonth,
        revenueByRestaurant,
        commissionBreakdown: [
          { name: '平台佣金', value: totalCommission },
          { name: '商家收入', value: totalRevenue - totalCommission },
        ],
        incomeSourceDistribution: [
          { name: '佣金', value: totalCommission },
          { name: '配送费', value: deliveryFees },
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/withdrawals — enveloppe double { data: { data, total } }
router.get('/api/finance/withdrawals', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = (req.query.search as string || '').toLowerCase();

    let query: any = db().from('withdrawal_requests').select('*');
    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('user_type', type);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // jointure users pour le nom du demandeur
    const userIds = Array.from(new Set((data || []).map((w: any) => w.user_id).filter(Boolean)));
    const userMap = new Map<string, any>();
    if (userIds.length) {
      const { data: users } = await db().from('users').select('id,name,phone,email').in('id', userIds);
      (users || []).forEach((u: any) => userMap.set(u.id, u));
    }

    let rows = (data || []).map((w: any) => {
      const u = userMap.get(w.user_id);
      return {
        ...w,
        applicant_name: u?.name || w.user_id,
        user_name: u?.name || w.user_id,
        phone: w.phone_number || u?.phone || '',
        phone_number: w.phone_number || u?.phone || '',
        amount: Number(w.amount) || 0,
        user_type: w.user_type || 'seller',
      };
    });

    if (search) {
      rows = rows.filter((w: any) =>
        String(w.applicant_name || '').toLowerCase().includes(search) ||
        String(w.phone || '').toLowerCase().includes(search)
      );
    }

    const total = rows.length;
    const from = (page - 1) * pageSize;
    res.json({ success: true, data: { data: rows.slice(from, from + pageSize), total } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/finance/withdrawals/:id/status
router.put('/api/finance/withdrawals/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reject_reason, notes } = req.body;

    const updateData: any = { status, processed_by: 'admin' };
    if (status === 'rejected') updateData.admin_note = reject_reason || notes || '';
    if (notes !== undefined && status !== 'rejected') updateData.admin_note = notes;
    if (['approved', 'rejected', 'completed'].includes(status)) {
      updateData.processed_at = new Date().toISOString();
    }

    const { data, error } = await db().from('withdrawal_requests').update(updateData).eq('id', id).select().single();
    if (error) throw error;

    // Si validé : décrémenter le solde du portefeuille concerné
    if (status === 'completed' && data?.user_id) {
      const column = data.user_type === 'driver' ? 'driver_profiles' : 'seller_profiles';
      const { data: profile } = await db().from(column).select('balance,total_withdrawn').eq('user_id', data.user_id).maybeSingle();
      if (profile) {
        await db()
          .from(column)
          .update({
            balance: Math.max(0, Number(profile.balance || 0) - Number(data.amount || 0)),
            total_withdrawn: Number(profile.total_withdrawn || 0) + Number(data.amount || 0),
          })
          .eq('user_id', data.user_id);
      }
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/withdrawals/bulk-action
router.post('/api/finance/withdrawals/bulk-action', async (req: Request, res: Response) => {
  try {
    const { ids, action, reject_reason } = req.body;
    const status =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'complete' ? 'completed' : null;
    if (!status) return res.status(400).json({ success: false, error: 'Invalid action' });

    const updateData: any = { status, processed_by: 'admin', processed_at: new Date().toISOString() };
    if (status === 'rejected') updateData.admin_note = reject_reason || '';

    const { data, error } = await db().from('withdrawal_requests').update(updateData).in('id', ids).select();
    if (error) throw error;
    res.json({ success: true, data, affected: data?.length || 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/transactions — wallet_transactions
router.get('/api/finance/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const type = req.query.type as string;
    const userType = req.query.userType as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    let query: any = db().from('wallet_transactions').select('*', { count: 'exact' });
    if (type && type !== 'all') query = query.eq('type', type);
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate + 'T23:59:59');

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw error;

    const rows = (data || []).map((t: any) => {
      const ownerId = t.user_id || t.seller_id || t.driver_id;
      return {
        ...t,
        user_id: ownerId,
        user_type: t.driver_id ? 'driver' : 'seller',
        amount: Number(t.amount) || 0,
      };
    });

    // jointure noms + filtre par type d'utilisateur
    const ids = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
    const userMap = new Map<string, any>();
    if (ids.length) {
      const { data: users } = await db().from('users').select('id,name,phone,email').in('id', ids);
      (users || []).forEach((u: any) => userMap.set(u.id, u));
    }
    let result = rows.map((r: any) => ({ ...r, user_name: userMap.get(r.user_id)?.name || null }));
    if (userType && userType !== 'all') result = result.filter((r: any) => r.user_type === userType);

    res.json({ success: true, data: result, total: count || 0, page, pageSize });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/settings — platform_settings (category = finance)
router.get('/api/finance/settings', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db().from('platform_settings').select('*').eq('category', 'finance');
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
    const updates = (req.body.settings || req.body) as Record<string, string>;
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const { data: existing } = await db().from('platform_settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        const { data, error } = await db().from('platform_settings').update({ value: String(value), updated_at: new Date().toISOString() }).eq('key', key).select().single();
        if (error) throw error;
        results.push(data);
      } else {
        const { data, error } = await db()
          .from('platform_settings')
          .insert({ key, value: String(value), description: key, category: 'finance', updated_at: new Date().toISOString() })
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

// GET /api/finance/reports
router.get('/api/finance/reports', async (_req: Request, res: Response) => {
  try {
    const orders = await fetchOrders();
    const paid = orders.filter((o: any) => PAID_STATUSES.includes(o.status));

    // Revenu quotidien (30 jours)
    const daily: Array<{ date: string; revenue: number; commission: number; orderCount: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59);
      const rows = paid.filter((o: any) => {
        const cd = new Date(o.created_at);
        return cd >= dayStart && cd <= dayEnd;
      });
      daily.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: rows.reduce((s: number, r: any) => s + (Number(r.total) || 0), 0),
        commission: rows.reduce((s: number, r: any) => s + (Number(r.commission) || 0), 0),
        orderCount: rows.length,
      });
    }

    // Résumé des retraits
    const { data: withdrawals } = await db().from('withdrawal_requests').select('status, amount');
    const all = withdrawals || [];
    const wSum = (st: string) => all.filter((w: any) => w.status === st).reduce((s: number, w: any) => s + (Number(w.amount) || 0), 0);
    const withdrawalSummary = {
      pending: wSum('pending'),
      approved: wSum('approved'),
      completed: wSum('completed'),
      rejected: wSum('rejected'),
    };

    // Commissions par restaurant
    const byRestaurant = new Map<string, { commission: number; revenue: number; orders: number }>();
    paid.forEach((o: any) => {
      const cur = byRestaurant.get(o.restaurant_id) || { commission: 0, revenue: 0, orders: 0 };
      cur.commission += Number(o.commission) || 0;
      cur.revenue += Number(o.total) || 0;
      cur.orders += 1;
      byRestaurant.set(o.restaurant_id, cur);
    });
    const ids = Array.from(byRestaurant.keys());
    const nameMap = new Map<string, string>();
    if (ids.length) {
      const { data: restaurants } = await db().from('restaurants').select('id,name').in('id', ids);
      (restaurants || []).forEach((r: any) => nameMap.set(r.id, r.name));
    }
    const commissionByRestaurant = Array.from(byRestaurant.entries())
      .map(([id, v]) => ({ name: nameMap.get(id) || id, commission: v.commission, revenue: v.revenue, orders: v.orders }))
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 10);

    res.json({ success: true, data: { daily, withdrawalSummary, commissionByRestaurant } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
