import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();
const supabase = getSupabaseClient();

// ─── Sales Reports ───────────────────────────────────────────────

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ? String(endDate) : new Date().toISOString();

    // Total orders & revenue
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, amount, status, created_at')
      .gte('created_at', start)
      .lte('created_at', end);

    if (ordersErr) {
      return res.status(500).json({ success: false, error: ordersErr.message });
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.amount || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const statusCount: Record<string, number> = {};
    orders?.forEach(o => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    });

    // Orders over time (daily)
    const dailyMap: Record<string, { orders: number; revenue: number }> = {};
    orders?.forEach(o => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 };
      dailyMap[day].orders += 1;
      dailyMap[day].revenue += Number(o.amount || 0);
    });
    const ordersOverTime = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, orders: v.orders, revenue: v.revenue }));

    // Orders by hour
    const hourMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourMap[i] = 0;
    orders?.forEach(o => {
      const h = new Date(o.created_at).getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });
    const ordersByHour = Object.entries(hourMap).map(([hour, count]) => ({ hour: parseInt(hour), count }));

    // Orders by day of week
    const dowMap: Record<number, number> = {};
    orders?.forEach(o => {
      const dow = new Date(o.created_at).getDay();
      dowMap[dow] = (dowMap[dow] || 0) + 1;
    });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const ordersByDay = days.map((name, i) => ({ name, count: dowMap[i] || 0 }));

    // Top restaurants
    const { data: topRestaurants, error: topErr } = await supabase
      .from('restaurants')
      .select('id, name, total_orders, total_revenue, rating')
      .order('total_orders', { ascending: false })
      .limit(10);

    if (topErr) {
      return res.status(500).json({ success: false, error: topErr.message });
    }

    res.json({
      success: true,
      data: {
        metrics: { totalOrders, totalRevenue, avgOrderValue, statusCount },
        ordersOverTime,
        ordersByHour,
        ordersByDay,
        topRestaurants: topRestaurants || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── User Reports ────────────────────────────────────────────────

router.get('/users', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ? String(endDate) : new Date().toISOString();

    // New registrations over time
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, role, created_at, status')
      .gte('created_at', start)
      .lte('created_at', end);

    if (profilesErr) {
      return res.status(500).json({ success: false, error: profilesErr.message });
    }

    const totalUsers = profiles?.length || 0;

    // Registration trend
    const regMap: Record<string, number> = {};
    profiles?.forEach(p => {
      const day = new Date(p.created_at).toISOString().slice(0, 10);
      regMap[day] = (regMap[day] || 0) + 1;
    });
    const registrationTrend = Object.entries(regMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

    // Active users by role
    const roleCount: Record<string, number> = {};
    profiles?.forEach(p => {
      roleCount[p.role] = (roleCount[p.role] || 0) + 1;
    });

    // User growth (cumulative)
    let cumulative = 0;
    const userGrowth = registrationTrend.map(d => {
      cumulative += d.count;
      return { date: d.date, total: cumulative };
    });

    // 7-day retention rate (approximate)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentOrders, error: recentErr } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', sevenDaysAgo);

    if (recentErr) {
      return res.status(500).json({ success: false, error: recentErr.message });
    }

    const activeBuyers = new Set(recentOrders?.map(o => o.user_id)).size;
    const totalBuyers = profiles?.filter(p => p.role === 'buyer').length || 1;
    const retentionRate7d = Math.round((activeBuyers / totalBuyers) * 100);

    // Top buyers
    const { data: buyerOrders, error: buyerErr } = await supabase
      .from('orders')
      .select('user_id, amount');

    if (buyerErr) {
      return res.status(500).json({ success: false, error: buyerErr.message });
    }

    const buyerMap: Record<string, { count: number; total: number }> = {};
    buyerOrders?.forEach(o => {
      if (!o.user_id) return;
      if (!buyerMap[o.user_id]) buyerMap[o.user_id] = { count: 0, total: 0 };
      buyerMap[o.user_id].count += 1;
      buyerMap[o.user_id].total += Number(o.amount || 0);
    });

    const topBuyers = Object.entries(buyerMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([userId, stats]) => ({ user_id: userId, order_count: stats.count, total_spent: stats.total }));

    res.json({
      success: true,
      data: {
        metrics: { totalUsers, activeUsers: profiles?.filter(p => p.status === 'active').length || 0, retentionRate7d },
        registrationTrend,
        roleCount,
        userGrowth,
        topBuyers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Delivery Reports ────────────────────────────────────────────

router.get('/delivery', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ? String(endDate) : new Date().toISOString();

    // Delivery records
    const { data: deliveries, error: delErr } = await supabase
      .from('delivery_records')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);

    if (delErr) {
      return res.status(500).json({ success: false, error: delErr.message });
    }

    const totalDeliveries = deliveries?.length || 0;
    const completedDeliveries = deliveries?.filter(d => d.status === 'delivered').length || 0;
    const cancelledDeliveries = deliveries?.filter(d => d.status === 'cancelled').length || 0;
    const onTimeDeliveries = deliveries?.filter(d => d.status === 'delivered').length || 0;
    const onTimeRate = totalDeliveries > 0 ? Math.round((onTimeDeliveries / totalDeliveries) * 100) : 0;

    // Average delivery time (from completed deliveries with distance)
    const completed = deliveries?.filter(d => d.status === 'delivered' && d.distance) || [];
    const avgDeliveryTime = completed.length > 0
      ? Math.round(completed.reduce((sum, d) => sum + (d.distance || 0), 0) / completed.length)
      : 0;

    // Driver performance
    const driverMap: Record<string, { deliveries: number; completed: number; revenue: number }> = {};
    deliveries?.forEach(d => {
      if (!d.user_id) return;
      if (!driverMap[d.user_id]) driverMap[d.user_id] = { deliveries: 0, completed: 0, revenue: 0 };
      driverMap[d.user_id].deliveries += 1;
      if (d.status === 'delivered') driverMap[d.user_id].completed += 1;
      driverMap[d.user_id].revenue += Number(d.delivery_fee || 0);
    });

    const driverPerformance = await Promise.all(
      Object.entries(driverMap).map(async ([userId, stats]) => {
        const { data: driver } = await supabase.from('drivers').select('name').eq('id', userId).single();
        return {
          user_id: userId,
          name: driver?.name || 'Unknown',
          deliveries: stats.deliveries,
          completed: stats.completed,
          success_rate: stats.deliveries > 0 ? Math.round((stats.completed / stats.deliveries) * 100) : 0,
          revenue: stats.revenue,
        };
      })
    );

    res.json({
      success: true,
      data: {
        metrics: { totalDeliveries, completedDeliveries, cancelledDeliveries, onTimeRate, avgDeliveryTime },
        driverPerformance,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Financial Reports ───────────────────────────────────────────

router.get('/financial', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ? String(endDate) : new Date().toISOString();

    // Orders for revenue
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('amount, commission, created_at, restaurant_id')
      .gte('created_at', start)
      .lte('created_at', end);

    if (ordersErr) {
      return res.status(500).json({ success: false, error: ordersErr.message });
    }

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.amount || 0), 0) || 0;
    const totalCommission = orders?.reduce((sum, o) => sum + Number(o.commission || 0), 0) || 0;

    // Revenue by period (daily)
    const dailyMap: Record<string, number> = {};
    orders?.forEach(o => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + Number(o.amount || 0);
    });
    const revenueByPeriod = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue }));

    // Commission trend
    const commissionMap: Record<string, number> = {};
    orders?.forEach(o => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      commissionMap[day] = (commissionMap[day] || 0) + Number(o.commission || 0);
    });
    const commissionTrend = Object.entries(commissionMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, commission]) => ({ date, commission }));

    // Revenue by restaurant
    const restMap: Record<string, { revenue: number; commission: number }> = {};
    orders?.forEach(o => {
      if (!o.restaurant_id) return;
      if (!restMap[o.restaurant_id]) restMap[o.restaurant_id] = { revenue: 0, commission: 0 };
      restMap[o.restaurant_id].revenue += Number(o.amount || 0);
      restMap[o.restaurant_id].commission += Number(o.commission || 0);
    });

    const revenueByRestaurant = await Promise.all(
      Object.entries(restMap).slice(0, 10).map(async ([restId, stats]) => {
        const { data: rest } = await supabase.from('restaurants').select('name').eq('id', restId).single();
        return { restaurant_id: restId, name: rest?.name || 'Unknown', revenue: stats.revenue, commission: stats.commission };
      })
    );

    // Withdrawals
    const { data: withdrawals, error: wErr } = await supabase
      .from('withdrawals')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);

    if (wErr) {
      return res.status(500).json({ success: false, error: wErr.message });
    }

    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
    const wStatusCount: Record<string, number> = {};
    withdrawals?.forEach(w => {
      wStatusCount[w.status] = (wStatusCount[w.status] || 0) + 1;
    });

    // P&L summary
    const profitLoss = {
      totalRevenue,
      totalCommission,
      totalWithdrawals,
      netProfit: totalCommission - totalWithdrawals,
    };

    res.json({
      success: true,
      data: {
        metrics: { totalRevenue, totalCommission, totalWithdrawals, netProfit: profitLoss.netProfit },
        revenueByPeriod,
        commissionTrend,
        revenueByRestaurant,
        withdrawalStats: { total: totalWithdrawals, byStatus: wStatusCount },
        profitLoss,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Review Reports ──────────────────────────────────────────────

router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ? String(endDate) : new Date().toISOString();

    const { data: reviews, error: revErr } = await supabase
      .from('reviews')
      .select('*, restaurants(name)')
      .gte('created_at', start)
      .lte('created_at', end);

    if (revErr) {
      return res.status(500).json({ success: false, error: revErr.message });
    }

    const totalReviews = reviews?.length || 0;
    const avgRating = totalReviews > 0
      ? Math.round((reviews?.reduce((sum, r) => sum + Number(r.rating || 0), 0) || 0) / totalReviews * 10) / 10
      : 0;

    // Rating distribution
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews?.forEach(r => {
      const star = Math.round(Number(r.rating || 0));
      if (star >= 1 && star <= 5) ratingDist[star] += 1;
    });

    // Top rated restaurants
    const restMap: Record<string, { ratings: number[]; count: number }> = {};
    reviews?.forEach(r => {
      if (!r.restaurant_id) return;
      if (!restMap[r.restaurant_id]) restMap[r.restaurant_id] = { ratings: [], count: 0 };
      restMap[r.restaurant_id].ratings.push(Number(r.rating || 0));
      restMap[r.restaurant_id].count += 1;
    });

    const restRatings = await Promise.all(
      Object.entries(restMap).map(async ([restId, data]) => {
        const { data: rest } = await supabase.from('restaurants').select('name').eq('id', restId).single();
        const avg = data.ratings.length > 0 ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0;
        return { restaurant_id: restId, name: rest?.name || 'Unknown', avg_rating: Math.round(avg * 10) / 10, review_count: data.count };
      })
    );

    const topRated = [...restRatings].sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 10);
    const lowestRated = [...restRatings].sort((a, b) => a.avg_rating - b.avg_rating).slice(0, 10);

    res.json({
      success: true,
      data: {
        metrics: { totalReviews, avgRating },
        ratingDistribution: ratingDist,
        topRated,
        lowestRated,
        recentReviews: reviews?.slice(-10).reverse() || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Scheduled Reports ───────────────────────────────────────────

router.get('/scheduled', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/scheduled', async (req: Request, res: Response) => {
  try {
    const { name, type, frequency, recipients, format } = req.body;
    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert({ name, type, frequency, recipients: recipients || [], format: format || 'pdf' })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/scheduled/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
      .from('scheduled_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/scheduled/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;