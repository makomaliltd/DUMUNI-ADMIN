import { Router } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

// Roles réellement acceptés par la table public.users (contrainte CHECK).
const ALLOWED_ROLES = new Set(['admin', 'buyer', 'seller', 'driver', 'customer']);

// Colonnes triables sur la table public.users (blocage d'injection via ORDER BY).
const ORDERABLE_COLUMNS = new Set(['created_at', 'updated_at', 'email', 'phone', 'role', 'name', 'is_active']);

// Map frontend -> colonne réelle pour le tri.
const SORT_COLUMN_MAP: Record<string, string> = {
  full_name: 'name',
  name: 'name',
  status: 'is_active',
  created_at: 'created_at',
  email: 'email',
  phone: 'phone',
  role: 'role',
};

type UserRow = Record<string, unknown>;

/**
 * Convertit une ligne de la table `users` vers la forme attendue par le
 * frontend (full_name / status), tout en conservant les champs natifs
 * (name / is_active) pour ne pas casser les autres consommateurs.
 */
function mapUserRow(row: UserRow): UserRow {
  const isActive = row.is_active !== false;
  return {
    ...row,
    full_name: row.name ?? row.email ?? null,
    status: isActive ? 'active' : 'suspended',
  };
}

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
    const sortByRaw = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Filtres appliqués en SQL sur la vraie table `users`.
    const filters: { column: string; value: unknown }[] = [];

    if (role && role !== 'all' && ALLOWED_ROLES.has(role)) {
      filters.push({ column: 'role', value: role });
    }
    if (status && status !== 'all') {
      filters.push({ column: 'is_active', value: status === 'active' });
    }

    let query = supabase
      .from('users')
      .select('id, email, name, phone, role, avatar_url, is_active, language, verification_status, created_at, updated_at', { count: 'exact' });

    for (const f of filters) {
      query = query.eq(f.column, f.value);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const orderColumn = SORT_COLUMN_MAP[sortByRaw] || (ORDERABLE_COLUMNS.has(sortByRaw) ? sortByRaw : 'created_at');
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const rows = (data as UserRow[] | null) ?? [];
    res.json({
      success: true,
      data: rows.map(mapUserRow),
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

// Helper : compte des lignes liées sans faire échouer le détail si une
// table secondaire venait à manquer ou lever une erreur.
async function safeCount(table: string, column: string, value: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(column, value);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// GET /api/users/:id - Get user details
router.get('/api/users/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, name, phone, role, avatar_url, is_active, language, verification_status, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Statistiques basées sur les tables réelles.
    const [orderCount, deliveryCount, transactionCount, restaurant] = await Promise.all([
      safeCount('orders', 'buyer_id', id),
      safeCount('orders', 'delivery_driver_id', id),
      safeCount('wallet_transactions', 'user_id', id),
      (async () => {
        try {
          const r = await supabase.from('restaurants').select('*').eq('owner_id', id).maybeSingle();
          return r.error ? null : (r.data as UserRow | null);
        } catch {
          return null;
        }
      })(),
    ]);

    res.json({
      success: true,
      data: {
        ...mapUserRow(profile as UserRow),
        stats: {
          totalOrders: orderCount,
          totalDeliveries: deliveryCount,
          totalTransactions: transactionCount,
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
    const { full_name, name, email, phone, role, status } = req.body;

    const updateData: Record<string, unknown> = {};

    const displayName = name !== undefined ? name : full_name;
    if (displayName !== undefined) updateData.name = displayName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // Role restreint aux valeurs acceptées par la contrainte CHECK.
    if (role !== undefined) {
      if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ success: false, error: `Invalid role "${role}"` });
      }
      updateData.role = role;
    }

    if (status !== undefined) {
      updateData.is_active = status === 'active';
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: mapUserRow(data as UserRow) });
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

    // Normalise le rôle (editor/viewer ne sont pas des rôles de la plateforme).
    const normalizedRole = role && ALLOWED_ROLES.has(role) ? role : 'buyer';

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: normalizedRole },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Create public.users profile (table réellement utilisée par l'app).
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: full_name || email.split('@')[0],
        phone: phone || null,
        role: normalizedRole,
        is_active: true,
      })
      .select('*')
      .maybeSingle();

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    res.json({ success: true, data: mapUserRow(profile as UserRow) });
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

    const isActive = action !== 'suspend';

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .in('id', userIds)
      .select('*');

    if (error) throw error;

    res.json({ success: true, data: (data as UserRow[] | null)?.map(mapUserRow) ?? [], affected: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/api/users/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    // Delete public.users profile
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    // Delete auth user (best-effort)
    await supabase.auth.admin.deleteUser(id).catch(() => undefined);

    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id/orders - User's order history (buyer_id réel)
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
      .eq('buyer_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Le frontend lit `amount` : on l'alimente depuis `total`.
    const rows = ((data as UserRow[] | null) ?? []).map((o) => ({
      ...o,
      amount: o.total,
    }));

    res.json({
      success: true,
      data: rows,
      pagination: { page, pageSize, total: count || 0, totalPages: count ? Math.ceil(count / pageSize) : 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id/transactions - User's financial history (wallet_transactions réel)
router.get('/api/users/:id/transactions', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data ?? [],
      pagination: { page, pageSize, total: count || 0, totalPages: count ? Math.ceil(count / pageSize) : 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/users/:id/deliveries - Driver's delivery history
router.get('/api/users/:id/deliveries', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    // Livraisons réelles d'un livreur = commandes assignées au driver.
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_driver_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orders = (data as UserRow[] | null) ?? [];

    const items = orders.map((o) => {
      const st = String(o.status);
      const status =
        st === 'delivered' || st === 'completed'
          ? 'completed'
          : st === 'in_delivery' || st === 'delivering' || st === 'picked_up'
          ? 'in_transit'
          : 'assigned';
      return {
        id: o.id,
        order_id: o.id,
        status,
        delivery_fee: o.delivery_fee ?? 0,
        distance: 0,
        created_at: o.created_at,
      };
    });

    const stats = {
      total: items.length,
      completed: items.filter((i) => i.status === 'completed').length,
      assigned: items.filter((i) => i.status === 'assigned').length,
      inTransit: items.filter((i) => i.status === 'in_transit').length,
      totalFee: items.reduce((sum, i) => sum + parseFloat(String(i.delivery_fee) || '0'), 0),
    };

    res.json({ success: true, data: { items, stats } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
