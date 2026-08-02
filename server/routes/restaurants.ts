import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// GET /api/restaurants - List restaurants
router.get('/api/restaurants', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const status = req.query.status as string;
    const verified = req.query.verified as string;
    const cuisine = req.query.cuisine as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    let query = supabase
      .from('restaurants')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (verified && verified !== 'all') query = query.eq('verified', verified);
    if (cuisine && cuisine !== 'all') query = query.eq('cuisine_type', cuisine);
    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    const validSortFields = ['name', 'total_orders', 'total_revenue', 'rating', 'created_at', 'status'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };

    const { data, count, error } = await query
      .order(field, order)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id - Restaurant detail
router.get('/api/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Get owner info
    let owner = null;
    if (restaurant.user_id) {
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url')
        .eq('id', restaurant.user_id)
        .single();
      owner = ownerData;
    }

    // Get stats
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', id);

    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', id);

    res.json({
      success: true,
      data: { ...restaurant, owner, stats: { orderCount, reviewCount } },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/restaurants/:id - Update restaurant
router.put('/api/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['name', 'description', 'logo_url', 'banner_url', 'address', 'phone', 'hours', 'cuisine_type', 'delivery_fee', 'min_order', 'is_open', 'status'];
    const filtered: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('restaurants')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/restaurants/:id/toggle-status - Toggle open/closed
router.post('/api/restaurants/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: current } = await supabase
      .from('restaurants')
      .select('is_open')
      .eq('id', id)
      .single();

    const newStatus = current?.is_open === 'true' ? 'false' : 'true';

    const { data, error } = await supabase
      .from('restaurants')
      .update({ is_open: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/menu - Menu items
router.get('/api/restaurants/:id/menu', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', id)
      .order('sort_order', { ascending: true })
      .order('category', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/restaurants/:id/menu - Add menu item
router.post('/api/restaurants/:id/menu', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const item = { ...req.body, restaurant_id: id };

    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/menu/:id - Update menu item
router.put('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/menu/:id - Delete menu item
router.delete('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/orders - Restaurant orders
router.get('/api/restaurants/:id/orders', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    res.json({
      success: true,
      data: data || [],
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/reviews - Restaurant reviews
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
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/restaurants/:id/analytics - Restaurant analytics
router.get('/api/restaurants/:id/analytics', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const { data: recentOrders, error: orderError } = await supabase
      .from('orders')
      .select('created_at, amount, status')
      .eq('restaurant_id', id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true });

    if (orderError) throw orderError;

    // Build daily revenue data
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { revenue: 0, orders: 0 };
    }

    let totalRevenue = 0;
    let completedOrders = 0;
    if (recentOrders) {
      for (const order of recentOrders) {
        const key = new Date(order.created_at).toISOString().split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].orders += 1;
          dailyMap[key].revenue += parseFloat(order.amount || '0');
        }
        if (order.status === 'completed') {
          totalRevenue += parseFloat(order.amount || '0');
          completedOrders += 1;
        }
      }
    }

    const dailyData = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    // Rating distribution
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('restaurant_id', id);

    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (allReviews) {
      for (const r of allReviews) {
        const rating = r.rating || 3;
        ratingDist[rating as keyof typeof ratingDist] += 1;
      }
    }

    res.json({
      success: true,
      data: {
        dailyData,
        totalRevenue,
        completedOrders,
        ratingDistribution: Object.entries(ratingDist).map(([rating, count]) => ({ rating: parseInt(rating), count })),
        avgRating: allReviews?.length
          ? allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length
          : 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Seller Applications ─────────────────────────────────────────

// GET /api/seller-applications - List applications
router.get('/api/seller-applications', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const status = req.query.status as string;

    let query = supabase
      .from('seller_applications')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    res.json({
      success: true,
      data: data || [],
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/seller-applications/:id - Application detail
router.get('/api/seller-applications/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!application) return res.status(404).json({ success: false, error: 'Application not found' });

    // Get applicant profile
    let applicant = null;
    if (application.user_id) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, created_at')
        .eq('id', application.user_id)
        .single();
      applicant = userData;
    }

    res.json({ success: true, data: { ...application, applicant } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/seller-applications/:id - Approve/reject
router.put('/api/seller-applications/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status, notes, reviewed_by } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "approved" or "rejected"' });
    }

    const updates: Record<string, any> = {
      status,
      notes: notes || null,
      reviewed_by: reviewed_by || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: application, error: appError } = await supabase
      .from('seller_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (appError) throw appError;

    // If approved, create restaurant
    if (status === 'approved') {
      const { error: restaurantError } = await supabase.from('restaurants').insert({
        user_id: application.user_id,
        name: application.restaurant_name,
        cuisine_type: application.cuisine_type,
        address: application.address,
        verified: 'verified',
        status: 'active',
      });
      if (restaurantError) throw restaurantError;

      // Update user role to seller
      if (application.user_id) {
        await supabase.from('profiles')
          .update({ role: 'seller', updated_at: new Date().toISOString() })
          .eq('id', application.user_id);
      }
    }

    res.json({ success: true, data: application });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;