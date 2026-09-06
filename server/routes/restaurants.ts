import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { enrichOrders } from './orders-map';

const router = Router();

// ─── Helpers de correspondance ─────────────────────────────────────────────

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
}

// opening_hours (jsonb) -> chaîne affichable
function hoursToString(openingHours: unknown): string {
  if (!openingHours) return '';
  if (typeof openingHours === 'string') {
    try {
      return hoursToString(JSON.parse(openingHours));
    } catch {
      return openingHours;
    }
  }
  const o = openingHours as any;
  if (o && typeof o === 'object' && o.open && o.close) return `${o.open} - ${o.close}`;
  return '';
}

function mapRestaurant(r: any, owner: any, stats: any) {
  return {
    ...r,
    user_id: r.owner_id, // alias front
    owner_id: r.owner_id,
    verified: r.is_verified ? 'verified' : 'pending',
    is_open: r.is_open ? 'true' : 'false',
    hours: hoursToString(r.opening_hours),
    rating: r.rating != null ? Number(r.rating) : null,
    review_count: r.review_count || 0,
    delivery_fee: r.delivery_fee != null ? r.delivery_fee : null,
    min_order: r.min_order != null ? r.min_order : null,
    total_orders: stats?.orderCount || 0,
    total_revenue: String(stats?.revenue || 0),
    status: r.is_open ? 'active' : 'inactive',
    owner: owner || null,
    stats: stats ? { orderCount: stats.orderCount, reviewCount: stats.reviewCount || 0 } : undefined,
  };
}

// Calcule stats (commandes / CA / avis) pour une liste de restaurants
async function buildStats(supabase: any, restaurantIds: string[]) {
  const map = new Map<string, { orderCount: number; revenue: number; reviewCount: number }>();
  restaurantIds.forEach((id) => map.set(id, { orderCount: 0, revenue: 0, reviewCount: 0 }));

  if (!restaurantIds.length) return map;

  const { data: orders } = await supabase.from('orders').select('restaurant_id, total, status').in('restaurant_id', restaurantIds);
  for (const o of orders || []) {
    const s = map.get(o.restaurant_id);
    if (!s) continue;
    s.orderCount += 1;
    if (!['cancelled', 'rejected', 'refused', 'refunded'].includes(o.status)) {
      s.revenue += Number(o.total || 0);
    }
  }

  const { data: reviews } = await supabase.from('reviews').select('restaurant_id').in('restaurant_id', restaurantIds);
  for (const rv of reviews || []) {
    const s = map.get(rv.restaurant_id);
    if (s) s.reviewCount += 1;
  }
  return map;
}

async function fetchOwners(supabase: any, ownerIds: string[]) {
  const out = new Map<string, any>();
  if (!ownerIds.length) return out;
  const { data } = await supabase.from('users').select('id,name,email,phone,avatar_url').in('id', ownerIds);
  for (const u of data || []) {
    out.set(u.id, { id: u.id, full_name: u.name, email: u.email, phone: u.phone, avatar_url: u.avatar_url });
  }
  return out;
}

// enrichit des lignes restaurants brutes
async function enrich(supabase: any, rows: any[]) {
  if (!rows.length) return [];
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean)));
  const restIds = rows.map((r) => r.id);
  const [owners, stats] = await Promise.all([fetchOwners(supabase, ownerIds), buildStats(supabase, restIds)]);
  return rows.map((r) => mapRestaurant(r, owners.get(r.owner_id) || null, stats.get(r.id)));
}

// ─── GET /api/restaurants - liste (filtres / tri / pagination) ─────────────
router.get('/api/restaurants', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const verified = req.query.verified as string;
    const cuisine = req.query.cuisine as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    let query: any = supabase.from('restaurants').select('*', { count: 'exact' });
    if (verified === 'verified') query = query.eq('is_verified', true);
    else if (verified === 'pending') query = query.eq('is_verified', false);
    if (cuisine && cuisine !== 'all') query = query.eq('cuisine_type', cuisine);
    if (search) query = query.or(`name.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    const enriched = await enrich(supabase, data || []);
    const physical = ['name', 'rating', 'created_at', 'updated_at', 'delivery_fee', 'min_order', 'review_count'];
    if (physical.includes(sortBy)) {
      enriched.sort((a: any, b: any) => {
        const av = a[sortBy] ?? '';
        const bv = b[sortBy] ?? '';
        if (av < bv) return -1 * sortOrder;
        if (av > bv) return 1 * sortOrder;
        return 0;
      });
    } else {
      // tri dérivé (total_orders, total_revenue, verified, status…) fait en mémoire
      enriched.sort((a: any, b: any) => {
        const av = a[sortBy] ?? '';
        const bv = b[sortBy] ?? '';
        if (typeof av === 'string') { if (av.toLowerCase() < String(bv).toLowerCase()) return -1 * sortOrder; if (av.toLowerCase() > String(bv).toLowerCase()) return 1 * sortOrder; return 0; }
        if (av < bv) return -1 * sortOrder;
        if (av > bv) return 1 * sortOrder;
        return 0;
      });
    }

    const total = count || 0;
    const from = (page - 1) * pageSize;
    const dataRows = enriched.slice(from, from + pageSize);

    res.json({
      success: true,
      data: dataRows,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/geo — coordonnées GPS des restaurants pour la carte
router.get('/api/restaurants/geo', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('restaurants')
      .select('id,name,address,cuisine_type,phone,rating,is_open,is_verified,latitude,longitude,logo_url')
      .order('name', { ascending: true });
    if (error) throw error;

    const result = (data || []).map((r: any) => ({
      ...r,
      lat: r.latitude != null ? Number(r.latitude) : null,
      lng: r.longitude != null ? Number(r.longitude) : null,
      has_coords: r.latitude != null && r.longitude != null,
    }));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id
router.get('/api/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: restaurant, error } = await supabase.from('restaurants').select('*').eq('id', id).single();
    if (error) throw error;
    if (!restaurant) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const [view] = await enrich(supabase, [restaurant]);
    res.json({ success: true, data: view || restaurant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/restaurants/:id
router.put('/api/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body || {};

    const allowed = ['name', 'description', 'logo_url', 'banner_url', 'address', 'phone', 'cuisine_type', 'delivery_fee', 'min_order', 'avg_delivery_time', 'opening_hours', 'is_verified', 'latitude', 'longitude'];
    const filtered: Record<string, any> = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    if (updates.is_open !== undefined) filtered.is_open = toBool(updates.is_open);
    if (updates.hours !== undefined) filtered.opening_hours = typeof updates.hours === 'string' ? { text: updates.hours } : updates.hours;
    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('restaurants').update(filtered).eq('id', id).select().single();
    if (error) throw error;
    const [view] = await enrich(supabase, [data]);
    res.json({ success: true, data: view || data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/restaurants/:id/toggle-status
router.post('/api/restaurants/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: current } = await supabase.from('restaurants').select('is_open').eq('id', id).single();
    const next = !(current?.is_open ?? false);
    const { data, error } = await supabase
      .from('restaurants')
      .update({ is_open: next, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const [view] = await enrich(supabase, [data]);
    res.json({ success: true, data: view || data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Menu (table `menus`) ──────────────────────────────────────────────────

function mapMenuItem(m: any): any {
  return {
    ...m,
    is_available: m.is_available ? 'true' : 'false',
    is_popular: m.is_popular ? 'true' : 'false',
    price: m.price,
    sort_order: 0,
  };
}

function sanitizeMenuBody(body: any): Record<string, any> {
  const out: Record<string, any> = { ...body };
  if (out.is_available !== undefined) out.is_available = toBool(out.is_available);
  if (out.is_popular !== undefined) out.is_popular = toBool(out.is_popular);
  delete out.id;
  delete out.sort_order;
  delete out.created_at;
  delete out.updated_at;
  delete out.restaurant_id;
  return out;
}

// GET /api/restaurants/:id/menu
router.get('/api/restaurants/:id/menu', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('restaurant_id', id)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: (data || []).map(mapMenuItem) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/restaurants/:id/menu
router.post('/api/restaurants/:id/menu', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const item = { ...sanitizeMenuBody(req.body), restaurant_id: id, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('menus').insert(item).select().single();
    if (error) throw error;
    res.json({ success: true, data: mapMenuItem(data) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/menu/:id
router.put('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = { ...sanitizeMenuBody(req.body), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('menus').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data: mapMenuItem(data) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/menu/:id
router.delete('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { error } = await supabase.from('menus').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/orders
router.get('/api/restaurants/:id/orders', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;

    const enriched = await enrichOrders(supabase, data || []);
    res.json({
      success: true,
      data: enriched,
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/reviews
router.get('/api/restaurants/:id/reviews', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const buyerIds = Array.from(new Set((data || []).map((r) => r.buyer_id).filter(Boolean)));
    const userMap = new Map<string, any>();
    if (buyerIds.length) {
      const { data: users } = await supabase.from('users').select('id,name,email,phone,avatar_url').in('id', buyerIds);
      for (const u of users || []) userMap.set(u.id, u);
    }

    const result = (data || []).map((r: any) => {
      const u = userMap.get(r.buyer_id);
      return {
        ...r,
        customer_name: u?.name || '—',
        content: r.comment || '',
        status: 'approved',
      };
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/analytics
router.get('/api/restaurants/:id/analytics', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('created_at, total, status')
      .eq('restaurant_id', id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true });

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 };
    }

    let totalRevenue = 0;
    let completedOrders = 0;
    for (const order of recentOrders || []) {
      const key = new Date(order.created_at).toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].orders += 1;
        dailyMap[key].revenue += Number(order.total || 0);
      }
      if (['delivered', 'completed'].includes(order.status)) {
        totalRevenue += Number(order.total || 0);
        completedOrders += 1;
      }
    }

    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('restaurant_id', id);
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews || []) {
      const rating = Math.max(1, Math.min(5, r.rating || 0));
      ratingDist[rating as keyof typeof ratingDist] += 1;
    }

    res.json({
      success: true,
      data: {
        dailyData: Object.entries(dailyMap).map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders })),
        totalRevenue,
        completedOrders,
        ratingDistribution: Object.entries(ratingDist).map(([rating, count]) => ({ rating: parseInt(rating), count })),
        avgRating: allReviews?.length ? allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length : 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Vendeurs : dans la base réelle, un vendeur est un users(role='seller') ──
// associé à une ligne seller_profiles (is_approved = validation admin) et
// éventuellement à son restaurant. Il n'existe AUCUNE table "applications".
// Le statut "pending" correspond donc à un vendeur non encore validé
// (seller_profiles.is_approved = false/null).

async function fetchSellerContext(
  supabase: any,
  userIds: string[]
): Promise<{ profilesMap: Map<string, any>; restaurantsMap: Map<string, any> }> {
  const profilesMap = new Map<string, any>();
  const restaurantsMap = new Map<string, any>();
  if (!userIds.length) return { profilesMap, restaurantsMap };

  const { data: profiles } = await supabase.from('seller_profiles').select('*').in('user_id', userIds);
  for (const p of profiles || []) {
    if (!profilesMap.has(p.user_id)) profilesMap.set(p.user_id, p);
  }

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id,name,cuisine_type,address,banner_url,logo_url')
    .in('owner_id', userIds);
  for (const r of restaurants || []) {
    if (!restaurantsMap.has(r.owner_id)) restaurantsMap.set(r.owner_id, r);
  }
  return { profilesMap, restaurantsMap };
}

function mapSeller(user: any, profile: any, restaurant: any): any {
  const approved = profile?.is_approved === true;
  return {
    id: user.id, // id utilisateur = identifiant du vendeur
    user_id: user.id,
    owner_name: user.name,
    owner_email: user.email,
    owner_phone: user.phone,
    avatar_url: user.avatar_url,
    restaurant_id: restaurant?.id || profile?.restaurant_id || null,
    restaurant_name: restaurant?.name || null,
    cuisine_type: restaurant?.cuisine_type || null,
    address: restaurant?.address || null,
    license_url: profile?.business_license_url || null,
    status: approved ? 'approved' : 'pending',
    notes: null,
    approved_at: profile?.approved_at || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

// GET /api/seller-applications — liste des vendeurs
router.get('/api/seller-applications', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const status = req.query.status as string;

    const { data: users, error } = await supabase
      .from('users')
      .select('id,name,email,phone,avatar_url,created_at,updated_at')
      .eq('role', 'seller')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const { profilesMap, restaurantsMap } = await fetchSellerContext(supabase, (users || []).map((u) => u.id));

    let result = (users || []).map((u) => mapSeller(u, profilesMap.get(u.id), restaurantsMap.get(u.id)));
    if (status && status !== 'all') result = result.filter((r: any) => r.status === status);

    const total = result.length;
    const rows = result.slice((page - 1) * pageSize, page * pageSize);
    res.json({
      success: true,
      data: rows,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/seller-applications/:id — détail d'un vendeur (id = id utilisateur)
router.get('/api/seller-applications/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,phone,avatar_url,created_at,updated_at')
      .eq('id', id)
      .eq('role', 'seller')
      .single();
    if (error) throw error;
    if (!user) return res.status(404).json({ success: false, error: 'Seller not found' });

    const { profilesMap, restaurantsMap } = await fetchSellerContext(supabase, [user.id]);
    res.json({ success: true, data: mapSeller(user, profilesMap.get(user.id), restaurantsMap.get(user.id)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/seller-applications/:id — approuver / rejeter un vendeur (id = id utilisateur)
router.put('/api/seller-applications/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "approved" or "rejected"' });
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (userErr) throw userErr;
    if (!user) return res.status(404).json({ success: false, error: 'Seller not found' });

    if (status === 'approved') {
      // garantit que l'utilisateur est un vendeur
      if (user.role !== 'seller') {
        await supabase.from('users').update({ role: 'seller', verification_status: 'verified' }).eq('id', id);
      }
      const { data: existingProfile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', id)
        .maybeSingle();
      if (!existingProfile) {
        await supabase.from('seller_profiles').insert({
          id,
          user_id: id,
          balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          total_withdrawn: 0,
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('seller_profiles')
          .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: 'admin', updated_at: new Date().toISOString() })
          .eq('user_id', id);
      }
    } else {
      // rejected : désactive la validation vendeur
      await supabase
        .from('seller_profiles')
        .update({ is_approved: false, updated_at: new Date().toISOString() })
        .eq('user_id', id);
    }

    const { profilesMap, restaurantsMap } = await fetchSellerContext(supabase, [id]);
    res.json({ success: true, data: mapSeller(user, profilesMap.get(id), restaurantsMap.get(id)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
