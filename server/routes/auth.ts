import { Router } from 'express';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const router = Router();

interface AdminProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'admin';
  createdAt: string;
}

/**
 * GET /api/auth/me
 *
 * Verifies the access token passed by the browser, then uses the service-role
 * key to read the real role from public.users. This bypasses RLS and avoids
 * the problem where even admins could not read their own public.users row
 * because of restrictive policies on that table.
 */
router.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  const accessToken = authHeader.slice('Bearer '.length).trim();
  if (!accessToken) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // 1. Verify the token and extract the user id.
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      res.status(401).json({ error: userError?.message || 'Invalid or expired token' });
      return;
    }

    const authUser = userData.user;

    // 2. Read the real role from public.users using service role (bypasses RLS).
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, phone, avatar_url, role, is_active, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load admin profile:', profileError);
      res.status(500).json({ error: 'Failed to load user profile' });
      return;
    }

    if (!profile || profile.role !== 'admin' || !profile.is_active) {
      res.status(403).json({ error: 'This account does not have admin access' });
      return;
    }

    const result: AdminProfile = {
      id: profile.id,
      email: profile.email,
      phone: profile.phone || null,
      fullName: profile.name || profile.email,
      avatarUrl: profile.avatar_url || null,
      role: 'admin',
      createdAt: profile.created_at,
    };

    res.json({ user: result });
  } catch (err) {
    console.error('Auth me endpoint error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Authentication check failed',
    });
  }
});

export default router;
