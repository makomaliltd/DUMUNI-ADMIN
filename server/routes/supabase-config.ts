import { Router } from 'express';
import { getSupabaseCredentials } from '../src/storage/database/supabase-client';

const router = Router();

router.get('/api/supabase-config', (_req, res) => {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    if (!url || !anonKey) {
      res.status(500).json({ error: 'Supabase credentials not configured' });
      return;
    }

    res.json({ url, anonKey });
  } catch (error) {
    console.error('Failed to get Supabase config:', error);
    res.status(500).json({ error: 'Failed to get Supabase config' });
  }
});

export default router;