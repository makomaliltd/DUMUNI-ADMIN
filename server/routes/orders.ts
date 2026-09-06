import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { enrichOrders } from './orders-map';

const router = Router();

// Statuts réels rencontrés dans `orders.status`. On garde la même grammaire que l'UI.
const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'cancelled', 'rejected', 'refused'];

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  rejected: [],
  refused: [],
  refunded: [],
};

// filtre payment_status -> liste de statuts `orders.status` correspondants
const PAYMENT_STATUS_MAP: Record<string, string[]> = {
  paid: ['delivered', 'completed'],
  refunded: ['cancelled', 'rejected', 'refused', 'refunded'],
  pending: ['pending', 'accepted', 'preparing', 'ready', 'delivering'],
};

// GET /api/orders — liste paginée + filtres
router.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const {
      page = '1', pageSize = '50',
      search, status, restaurant_id, driver_id,
      date_from, date_to, amount_min, amount_max,
      paymentStatus, sortBy = 'created_at', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
    const offset = (pageNum - 1) * size;

    let query: any = supabase.from('orders').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`id.ilike.%${search}%,notes.ilike.%${search}%,delivery_address.ilike.%${search}%`);
    }
    if (status) query = query.in('status', status.split(',').filter(Boolean));
    if (restaurant_id) query = query.eq('restaurant_id', restaurant_id);
    if (driver_id) query = query.eq('delivery_driver_id', driver_id);
    if (paymentStatus && PAYMENT_STATUS_MAP[paymentStatus]) {
      query = query.in('status', PAYMENT_STATUS_MAP[paymentStatus]);
    }
    if (date_from) query = query.gte('created_at', new Date(date_from).toISOString());
    if (date_to) query = query.lte('created_at', new Date(date_to + 'T23:59:59').toISOString());
    if (amount_min) query = query.gte('total', parseFloat(amount_min));
    if (amount_max) query = query.lte('total', parseFloat(amount_max));

    const sortField = sortBy === 'amount' ? 'total' : sortBy;
    const allowedSorts = ['created_at', 'total', 'status', 'updated_at', 'delivery_fee'];
    const sort = allowedSorts.includes(sortField) ? sortField : 'created_at';
    query = query.order(sort, { ascending: sortOrder === 'asc' });

    const { data, count, error } = await query.range(offset, offset + size - 1);
    if (error) throw error;

    const enriched = await enrichOrders(supabase, data || []);
    res.json({ success: true, data: enriched, total: count || 0, page: pageNum, pageSize: size });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/export — export CSV
router.get('/api/orders/export', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { status, date_from, date_to, paymentStatus } = req.query as Record<string, string>;

    let query = supabase.from('orders').select('*');
    if (status) query = query.in('status', status.split(','));
    if (paymentStatus && PAYMENT_STATUS_MAP[paymentStatus]) {
      query = query.in('status', PAYMENT_STATUS_MAP[paymentStatus]);
    }
    if (date_from) query = query.gte('created_at', new Date(date_from).toISOString());
    if (date_to) query = query.lte('created_at', new Date(date_to + 'T23:59:59').toISOString());
    query = query.order('created_at', { ascending: false }).limit(500);

    const { data, error } = await query;
    if (error) throw error;

    const rows = await enrichOrders(supabase, data || []);
    const headers = '订单ID,客户,餐厅,金额,状态,支付状态,配送费,佣金,下单时间\n';
    const body = rows
      .map((o: any) =>
        `${o.id},${o.customer_name},${o.restaurant_name || ''},${o.total},${o.status},${o.payment_status},${o.delivery_fee},${o.commission},${o.created_at}`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send('\uFEFF' + headers + body);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/available-drivers — conducteurs disponibles
router.get('/api/orders/available-drivers', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data: drivers, error } = await supabase
      .from('users')
      .select('id, name, phone, email')
      .eq('role', 'driver')
      .eq('is_active', true);

    if (error) throw error;

    const userIds = (drivers || []).map((d) => d.id);
    let profiles: any[] = [];
    if (userIds.length) {
      const pRes = await supabase.from('driver_profiles').select('*').in('user_id', userIds);
      profiles = pRes.data || [];
    }
    const profileByUser = new Map(profiles.map((p) => [p.user_id, p]));

    const result = (drivers || [])
      .map((d: any) => {
        const p = profileByUser.get(d.id);
        // On ne propose que des conducteurs validés et en ligne.
        if (!p || !p.is_approved || !p.is_available) return null;
        return {
          id: d.id,
          user_id: d.id,
          full_name: d.name,
          phone: d.phone || null,
          email: d.email,
          vehicle_type: p.vehicle_type || '',
          vehicle_plate: p.vehicle_plate || '',
          rating: '0',
          total_deliveries: p.completed_deliveries || 0,
          is_available: 'true',
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/orders/:id — détail commande
router.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) throw error;
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const [view] = await enrichOrders(supabase, [order]);
    res.json({ success: true, data: view || order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id/items — articles d'une commande
router.get('/api/orders/:id/items', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: items, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const menuIds = Array.from(new Set((items || []).map((i) => i.menu_id)));
    let menus: any[] = [];
    if (menuIds.length) {
      const m = await supabase.from('menus').select('id, name').in('id', menuIds);
      menus = m.data || [];
    }
    const menuById = new Map(menus.map((x) => [x.id, x]));

    const result = (items || []).map((i: any) => ({
      id: i.id,
      order_id: i.order_id,
      menu_id: i.menu_id,
      name: menuById.get(i.menu_id)?.name || '—',
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: Number(i.unit_price) * Number(i.quantity),
    }));

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id/status-logs — historique de statut (pas de table dédiée : vide)
router.get('/api/orders/:id/status-logs', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

// PUT /api/orders/:id/status — mise à jour de statut
router.put('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

    const { data: order } = await supabase.from('orders').select('status').eq('id', id).single();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const current = order.status || 'pending';
    const allowed = VALID_TRANSITIONS[current] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Cannot transition from ${current} to ${status}` });
    }

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'cancelled' || status === 'rejected') updates.refusal_reason = note || updates.refusal_reason;

    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Status updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/:id/assign-driver — affecter un conducteur
router.put('/api/orders/:id/assign-driver', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { driver_id } = req.body;

    if (!driver_id) return res.status(400).json({ success: false, error: 'driver_id required' });
    const { error } = await supabase
      .from('orders')
      .update({ delivery_driver_id: driver_id, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Driver assigned' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/:id/refund — remboursement
router.post('/api/orders/:id/refund', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        refusal_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Refund processed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/bulk-assign-driver
router.put('/api/orders/bulk-assign-driver', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { order_ids, driver_id } = req.body;
    if (!order_ids?.length) return res.status(400).json({ success: false, error: 'No orders selected' });
    if (!driver_id) return res.status(400).json({ success: false, error: 'driver_id required' });
    const { error } = await supabase
      .from('orders')
      .update({ delivery_driver_id: driver_id, updated_at: new Date().toISOString() })
      .in('id', order_ids);
    if (error) throw error;
    res.json({ success: true, message: `Assigned driver to ${order_ids.length} orders` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/bulk-status
router.put('/api/orders/bulk-status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { order_ids, status } = req.body;
    if (!order_ids?.length) return res.status(400).json({ success: false, error: 'No orders selected' });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', order_ids);
    if (error) throw error;
    res.json({ success: true, message: `Updated ${order_ids.length} orders to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/bulk — action groupée générique (assign_driver | update_status)
router.put('/api/orders/bulk', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { ids, action, value } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, error: 'No orders selected' });
    if (action === 'assign_driver') {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_driver_id: value, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    } else if (action === 'update_status') {
      const { error } = await supabase
        .from('orders')
        .update({ status: value, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    res.json({ success: true, message: `Bulk ${action} completed for ${ids.length} orders` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/bulk-action — compatibilité (utilisé par d'anciens flux)
router.post('/api/orders/bulk-action', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { order_ids, action, value } = req.body;
    if (!order_ids?.length) return res.status(400).json({ success: false, error: 'No orders selected' });

    if (action === 'assign_driver') {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_driver_id: value, updated_at: new Date().toISOString() })
        .in('id', order_ids);
      if (error) throw error;
    } else if (action === 'update_status') {
      const { error } = await supabase
        .from('orders')
        .update({ status: value, updated_at: new Date().toISOString() })
        .in('id', order_ids);
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
