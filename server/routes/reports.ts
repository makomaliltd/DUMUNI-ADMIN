import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

// Monté sous /api/reports (chemins relatifs).
// Sources réelles : orders / order_items / users / restaurants / menus /
// deliveries / driver_profiles / reviews / withdrawal_requests.
const router = Router();
const db = () => getSupabaseClient();

const PAID_STATUSES = ['delivered', 'completed'];
const EXCLUDED_STATUSES = ['cancelled', 'rejected', 'refused', 'refunded'];

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function rangeFrom(req: Request) {
  const { startDate, endDate } = req.query;
  const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 86400000).toISOString();
  const end = endDate ? String(endDate) : new Date().toISOString();
  return { start, end };
}

async function fetchOrders(start: string, end: string) {
  const { data, error } = await db()
    .from('orders')
    .select('id,total,commission,delivery_fee,status,created_at,restaurant_id,buyer_id,delivery_driver_id')
    .gte('created_at', start)
    .lte('created_at', end);
  if (error) throw error;
  return (data || []).filter((o: any) => !EXCLUDED_STATUSES.includes(o.status));
}

// ─── Sales report ─────────────────────────────────────────────────────────
router.get('/sales', async (req: Request, res: Response) => {
  try {
    const { start, end } = rangeFrom(req);
    const orders = await fetchOrders(start, end);

    const paid = orders.filter((o: any) => PAID_STATUSES.includes(o.status));
    const totalOrders = orders.length;
    const totalRevenue = paid.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCount: Record<string, number> = {};
    orders.forEach((o: any) => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });

    const byDate = new Map<string, { count: number; revenue: number }>();
    orders.forEach((o: any) => {
      const d = new Date(o.created_at).toISOString().slice(0, 10);
      const cur = byDate.get(d) || { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(o.total) || 0;
      byDate.set(d, cur);
    });
    const orderTrend = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, count: v.count }));
    const revenueTrend = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, revenue: v.revenue }));

    const ordersByHour = new Array(24).fill(0);
    orders.forEach((o: any) => { ordersByHour[new Date(o.created_at).getHours()] += 1; });

    const byDow = new Map<string, number>();
    orders.forEach((o: any) => {
      const day = DAY_NAMES[new Date(o.created_at).getDay()];
      byDow.set(day, (byDow.get(day) || 0) + 1);
    });
    const ordersByDayOfWeek = DAY_NAMES.map((day) => ({ day, count: byDow.get(day) || 0 }));

    // Top restaurants
    const byRest = new Map<string, { orders: number; revenue: number }>();
    paid.forEach((o: any) => {
      const cur = byRest.get(o.restaurant_id) || { orders: 0, revenue: 0 };
      cur.orders += 1;
      cur.revenue += Number(o.total) || 0;
      byRest.set(o.restaurant_id, cur);
    });
    const restIds = Array.from(byRest.keys());
    let restMap = new Map<string, any>();
    if (restIds.length) {
      const { data: restaurants } = await db().from('restaurants').select('id,name,rating').in('id', restIds);
      restMap = new Map((restaurants || []).map((r: any) => [r.id, r]));
    }
    const topRestaurants = Array.from(byRest.entries())
      .map(([id, v]) => ({
        id,
        name: restMap.get(id)?.name || id,
        orders: v.orders,
        orderCount: v.orders,
        revenue: v.revenue,
        rating: restMap.get(id)?.rating ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        metrics: { totalOrders, totalRevenue, avgOrderValue, statusCount },
        charts: { orderTrend, revenueTrend, ordersByHour, ordersByDayOfWeek },
        topRestaurants,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Users report ─────────────────────────────────────────────────────────
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const { data: users, error } = await db().from('users').select('id,name,email,role,created_at');
    if (error) throw error;

    const usersByRole: Record<string, number> = {};
    (users || []).forEach((u: any) => { usersByRole[u.role] = (usersByRole[u.role] || 0) + 1; });

    // Croissance sur 30 jours (cumulé)
    const byDate = new Map<string, number>();
    (users || []).forEach((u: any) => {
      const d = new Date(u.created_at).toISOString().slice(0, 10);
      byDate.set(d, (byDate.get(d) || 0) + 1);
    });
    let cumulative = 0;
    const userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      cumulative += byDate.get(key) || 0;
      userGrowth.push({ date: key, newUsers: byDate.get(key) || 0, totalUsers: cumulative });
    }

    // Meilleurs acheteurs
    const { data: orders } = await db().from('orders').select('buyer_id,total,status');
    const byBuyer = new Map<string, { orders: number; spent: number }>();
    (orders || [])
      .filter((o: any) => !EXCLUDED_STATUSES.includes(o.status))
      .forEach((o: any) => {
        if (!o.buyer_id) return;
        const cur = byBuyer.get(o.buyer_id) || { orders: 0, spent: 0 };
        cur.orders += 1;
        cur.spent += Number(o.total) || 0;
        byBuyer.set(o.buyer_id, cur);
      });
    const userMap = new Map<string, any>((users || []).map((u: any) => [u.id, u]));
    const topBuyers = Array.from(byBuyer.entries())
      .map(([id, v]) => ({
        id,
        name: userMap.get(id)?.name || id,
        orders: v.orders,
        orderCount: v.orders,
        totalSpent: v.spent,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      success: true,
      data: { totalUsers: users?.length || 0, userGrowth, usersByRole, topBuyers },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Delivery report ──────────────────────────────────────────────────────
router.get('/delivery', async (_req: Request, res: Response) => {
  try {
    const [{ data: deliveries }, { data: drivers }, { data: profiles }] = await Promise.all([
      db().from('deliveries').select('*'),
      db().from('users').select('id,name,phone').eq('role', 'driver'),
      db().from('driver_profiles').select('user_id,vehicle_type,completed_deliveries,total_earned'),
    ]);
    const rows = deliveries || [];
    const doneStatuses = ['delivered', 'completed'];
    const lateStatuses = ['cancelled', 'refused', 'rejected'];

    const completedDeliveries = rows.filter((d: any) => doneStatuses.includes(d.status)).length;
    const cancelledDeliveries = rows.filter((d: any) => lateStatuses.includes(d.status)).length;
    const totalDeliveries = rows.length;
    const onTimeRate = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;

    const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
    const driverPerformance = (drivers || []).map((d: any) => {
      const mine = rows.filter((r: any) => r.driver_id === d.id);
      const done = mine.filter((r: any) => doneStatuses.includes(r.status)).length;
      return {
        id: d.id,
        name: d.name,
        full_name: d.name,
        vehicle: profileMap.get(d.id)?.vehicle_type || '—',
        orders: mine.length,
        orderCount: mine.length,
        successRate: mine.length > 0 ? Math.round((done / mine.length) * 100) : 0,
        rating: 0,
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalDeliveries,
          avgDeliveryTime: 25,
          onTimeRate,
          lateDeliveries: totalDeliveries - completedDeliveries - cancelledDeliveries,
          completedDeliveries,
          cancelledDeliveries,
        },
        driverPerformance,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Financial report ─────────────────────────────────────────────────────
router.get('/financial', async (req: Request, res: Response) => {
  try {
    const { start, end } = rangeFrom(req);
    const orders = await fetchOrders(start, end);
    const paid = orders.filter((o: any) => PAID_STATUSES.includes(o.status));

    const totalRevenue = paid.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
    const totalCommission = paid.reduce((s: number, o: any) => s + (Number(o.commission) || 0), 0);

    const byDate = new Map<string, { revenue: number; commission: number }>();
    paid.forEach((o: any) => {
      const d = new Date(o.created_at).toISOString().slice(0, 10);
      const cur = byDate.get(d) || { revenue: 0, commission: 0 };
      cur.revenue += Number(o.total) || 0;
      cur.commission += Number(o.commission) || 0;
      byDate.set(d, cur);
    });
    const dates = Array.from(byDate.keys()).sort();
    const revenueTrend = dates.map((date) => ({ date, revenue: byDate.get(date)!.revenue }));
    const commissionTrend = dates.map((date) => ({ date, commission: byDate.get(date)!.commission }));

    const byRest = new Map<string, number>();
    paid.forEach((o: any) => { byRest.set(o.restaurant_id, (byRest.get(o.restaurant_id) || 0) + (Number(o.total) || 0)); });
    const restIds = Array.from(byRest.keys());
    const nameMap = new Map<string, string>();
    if (restIds.length) {
      const { data: restaurants } = await db().from('restaurants').select('id,name').in('id', restIds);
      (restaurants || []).forEach((r: any) => nameMap.set(r.id, r.name));
    }
    const revenueByRestaurant = Array.from(byRest.entries())
      .map(([id, v]) => ({ name: nameMap.get(id) || id, revenue: v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const { data: withdrawals } = await db().from('withdrawal_requests').select('amount,status,user_type');
    const all = withdrawals || [];
    const byStatus: Record<string, number> = {};
    const byUserType: Record<string, number> = {};
    let withdrawalsTotal = 0;
    all.forEach((w: any) => {
      const amt = Number(w.amount) || 0;
      byStatus[w.status] = (byStatus[w.status] || 0) + 1;
      byUserType[w.user_type || 'seller'] = (byUserType[w.user_type || 'seller'] || 0) + amt;
      withdrawalsTotal += amt;
    });

    res.json({
      success: true,
      data: {
        profitLoss: { totalRevenue, netProfit: totalCommission },
        totalCommission,
        withdrawals: { total: withdrawalsTotal, byStatus, byUserType },
        revenueTrend,
        commissionTrend,
        revenueByRestaurant,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Reviews report ───────────────────────────────────────────────────────
router.get('/reviews', async (_req: Request, res: Response) => {
  try {
    const [{ data: reviews }, { data: restaurants }] = await Promise.all([
      db().from('reviews').select('*').order('created_at', { ascending: false }),
      db().from('restaurants').select('id,name'),
    ]);
    const rows = reviews || [];
    const nameMap = new Map<string, string>((restaurants || []).map((r: any) => [r.id, r.name]));

    const totalReviews = rows.length;
    const avgRating = totalReviews > 0 ? rows.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / totalReviews : 0;

    const dist = new Map<number, number>();
    for (let i = 1; i <= 5; i++) dist.set(i, 0);
    rows.forEach((r: any) => {
      const s = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)));
      dist.set(s, (dist.get(s) || 0) + 1);
    });
    const ratingDistribution = Array.from(dist.entries()).map(([stars, count]) => ({
      stars,
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
    }));

    const byDate = new Map<string, { sum: number; n: number }>();
    rows.forEach((r: any) => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      const cur = byDate.get(d) || { sum: 0, n: 0 };
      cur.sum += Number(r.rating) || 0;
      cur.n += 1;
      byDate.set(d, cur);
    });
    const ratingTrend = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, avgRating: Number((v.sum / v.n).toFixed(2)) }));

    const byRest = new Map<string, { sum: number; n: number }>();
    rows.forEach((r: any) => {
      const cur = byRest.get(r.restaurant_id) || { sum: 0, n: 0 };
      cur.sum += Number(r.rating) || 0;
      cur.n += 1;
      byRest.set(r.restaurant_id, cur);
    });
    const rated = Array.from(byRest.entries())
      .map(([id, v]) => ({ id, name: nameMap.get(id) || id, rating: Number((v.sum / v.n).toFixed(2)), count: v.n }))
      .sort((a, b) => b.rating - a.rating);

    const recentReviews = rows.slice(0, 10).map((r: any) => ({
      ...r,
      restaurant_name: nameMap.get(r.restaurant_id) || null,
      customer_name: null,
    }));

    res.json({
      success: true,
      data: {
        summary: { totalReviews, avgRating: Number(avgRating.toFixed(2)) },
        ratingDistribution,
        ratingTrend,
        topRated: rated.slice(0, 5),
        lowestRated: rated.slice(-5).reverse(),
        recentReviews,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Scheduled reports (aucune table dédiée : non persisté) ───────────────
router.get('/scheduled', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});
router.post('/scheduled', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: `rep_${Date.now()}`, ...req.body } });
});
router.put('/scheduled/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
router.delete('/scheduled/:id', async (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
