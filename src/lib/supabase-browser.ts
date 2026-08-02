import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  const url = (window as any).__SUPABASE_URL;
  const anonKey = (window as any).__SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  clientInstance = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
}

export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) return clientInstance;
  const client = initClient();
  if (!client) throw new Error('Supabase configuration not loaded');
  return client;
}

export function getSupabaseClientSafe(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  return initClient();
}

export const getSupabaseBrowserClient = getSupabaseClient;