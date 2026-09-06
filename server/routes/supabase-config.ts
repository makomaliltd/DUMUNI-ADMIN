import { Router } from 'express';
import { getSupabaseCredentials } from '../src/storage/database/supabase-client';

const router = Router();

router.get('/api/supabase-config', (_req, res) => {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    if (!url || !anonKey) {
      const missing = [!url ? 'COZE_SUPABASE_URL' : null, !anonKey ? 'COZE_SUPABASE_ANON_KEY' : null]
        .filter(Boolean)
        .join(', ');
      console.error('[supabase-config] Missing environment variables:', missing);
      res.status(500).json({
        error: `Supabase credentials not configured on the server. Missing: ${missing}. ` +
          'Set them as environment variables (e.g. Vercel → Settings → Environment Variables) and redeploy.',
      });
      return;
    }

    res.json({ url, anonKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to get Supabase config:', message);
    res.status(500).json({ error: `Failed to get Supabase config: ${message}` });
  }
});

export default router;