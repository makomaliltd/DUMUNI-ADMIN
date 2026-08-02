import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// GET /api/orders — list with filters, pagination, search
router.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const {
      page = '1', pageSize = '50',
      search, status, restaurant_id, driver_id,
      date_from, date_to, amount_min, amount_max,
      payment_status, sortBy = 'created_at', sortOrder = 'desc'
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
    const offset = (pageNum - 1) * size;

    let query: any = supabase.from('orders').select('*', { count: 'exact' });

    // Search by order ID
    if (search) {
      query = query.or(`id.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    // Filters
    if (status) query = query.in('status', status.split(','));
    if (restaurant_id) query = query.eq('restaurant_id', restaurant_id);
    if (driver_id) query = query.eq('driver_id', driver_id);
    if (payment_status) query = query.eq('payment_status', payment_status);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    if (amount_min) query = query.gte('amount', parseFloat(amount_min));
    if (amount_max) query = query.lte('amount', parseFloat(amount_max));

    // Sort
    const allowedSorts = ['created_at', 'amount', 'status', 'updated_at'];
    const sort = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.order(sort, { ascending: order });

    const { data, count, error } = await query.range(offset, offset + size - 1);
    if (error) throw error;

    res.json({ success: true, data: data || [], total: count || 0, page: pageNum, pageSize: size });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/export — CSV export
router.get('/api/orders/export', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { status, date_from, date_to } = req.query as Record<string, string>;

    let query = supabase.from('orders').select('*');
    if (status) query = query.in('status', status.split(','));
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    query = query.order('created_at', { ascending: false }).limit(500);

    const { data, error } = await query;
    if (error) throw error;

    const headers = '订单ID,客户,餐厅,金额,状态,支付状态,配送费,佣金,下单时间\n';
    const rows = (data || []).map((o: any) =>
      `${o.id},${o.customer_name},${o.restaurant_id},${o.amount},${o.status},${o.payment_status},${o.delivery_fee},${o.commission},${o.created_at}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send('\uFEFF' + headers + rows);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/available-drivers — list available drivers
router.get('/api/orders/available-drivers', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name, phone, vehicle_type, is_available, rating, total_deliveries')
      .eq('status', 'approved')
      .eq('is_available', 'true')
      .order('total_deliveries', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/orders/:id — order detail
router.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) throw error;
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Get restaurant info
    const { data: restaurant } = await supabase.from('restaurants').select('id, name, phone, address').eq('id', order.restaurant_id).single();

    // Get driver info
    let driver = null;
    if (order.driver_id) {
      const { data: d } = await supabase.from('drivers').select('id, full_name, phone, vehicle_type, vehicle_plate, rating').eq('id', order.driver_id).single();
      driver = d;
    }

    // Get items
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id).order('created_at');

    // Get status logs
    const { data: statusLogs } = await supabase.from('order_status_logs').select('*').eq('order_id', id).order('created_at', { ascending: true });

    res.json({ success: true, data: { ...order, restaurant, driver, items: items || [], status_logs: statusLogs || [] } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/:id/status — update order status
router.put('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status, note } = req.body;

    const validTransitions: Record<string, string[]> = {
      pending: ['accepted', 'cancelled', 'rejected'],
      accepted: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivering', 'cancelled'],
      delivering: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
      rejected: [],
    };

    const { data: order } = await supabase.from('orders').select('status').eq('id', id).single();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Cannot transition from ${order.status} to ${status}` });
    }

    const { error: updateError } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) throw updateError;

    // Log status change
    await supabase.from('order_status_logs').insert({
      order_id: id, from_status: order.status, to_status: status,
      changed_by: 'admin', note: note || `订单状态从 ${order.status} 更新为 ${status}`,
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Status updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/:id/assign-driver — assign driver
router.put('/api/orders/:id/assign-driver', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { driver_id } = req.body;

    const { error } = await supabase.from('orders').update({ driver_id, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;

    await supabase.from('order_status_logs').insert({
      order_id: id, from_status: null, to_status: 'assigned',
      changed_by: 'admin', note: '已分配骑手',
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Driver assigned' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/:id/refund — process refund
router.post('/api/orders/:id/refund', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { reason } = req.body;

    const { error } = await supabase.from('orders').update({
      status: 'cancelled', payment_status: 'refunded', updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;

    await supabase.from('order_status_logs').insert({
      order_id: id, from_status: 'delivered', to_status: 'cancelled',
      changed_by: 'admin', note: reason || '已退款',
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Refund processed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/bulk-action — bulk assign/update status
router.post('/api/orders/bulk-action', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { order_ids, action, value } = req.body;

    if (!order_ids?.length) return res.status(400).json({ success: false, error: 'No orders selected' });

    if (action === 'assign_driver') {
      const { error } = await supabase.from('orders').update({ driver_id: value, updated_at: new Date().toISOString() }).in('id', order_ids);
      if (error) throw error;
    } else if (action === 'update_status') {
      const { error } = await supabase.from('orders').update({ status: value, updated_at: new Date().toISOString() }).in('id', order_ids);
      if (error) throw error;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    res.json({ success: true, message: `Bulk ${action} completed for ${order_ids.length} orders` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;