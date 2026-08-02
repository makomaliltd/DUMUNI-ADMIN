import { Router } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// GET /api/users - List users with pagination, filters, search
router.get('/api/users', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id - Get user details
router.get('/api/users/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Fetch related counts
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: deliveryCount } = await supabase
      .from('delivery_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    res.json({
      success: true,
      data: {
        ...profile,
        stats: {
          totalOrders: orderCount || 0,
          totalTransactions: transactionCount || 0,
          totalDeliveries: deliveryCount || 0,
          restaurant: restaurant || null,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// PUT /api/users/:id - Update user
router.put('/api/users/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { full_name, email, phone, role, status } = req.body;

    const updateData: Record<string, unknown> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST /api/users - Create user
router.post('/api/users', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { full_name, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role || 'viewer' },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: full_name || email.split('@')[0],
        phone: phone || null,
        role: role || 'viewer',
        status: 'active',
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST /api/users/bulk-action - Bulk suspend/activate
router.post('/api/users/bulk-action', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required' });
    }

    const status = action === 'suspend' ? 'suspended' : 'active';

    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', userIds)
      .select();

    if (error) throw error;

    res.json({ success: true, data, affected: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/api/users/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    // Delete auth user
    await supabase.auth.admin.deleteUser(id);

    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id/orders - User's order history
router.get('/api/users/:id/orders', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: { page, pageSize, total: count || 0, totalPages: count ? Math.ceil(count / pageSize) : 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id/transactions - User's financial history
router.get('/api/users/:id/transactions', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: { page, pageSize, total: count || 0, totalPages: count ? Math.ceil(count / pageSize) : 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id/deliveries - Driver's delivery stats
router.get('/api/users/:id/deliveries', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stats = {
      total: data.length,
      completed: data.filter(d => d.status === 'completed').length,
      assigned: data.filter(d => d.status === 'assigned').length,
      inTransit: data.filter(d => d.status === 'in_transit').length,
      totalFee: data.reduce((sum, d) => sum + parseFloat(d.delivery_fee || '0'), 0),
    };

    res.json({ success: true, data: { items: data, stats } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;