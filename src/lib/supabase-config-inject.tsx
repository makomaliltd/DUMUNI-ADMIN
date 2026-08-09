import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiUrl } from '@/lib/api';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface SupabaseConfigContextType {
  config: SupabaseConfig | null;
  isLoading: boolean;
  error: string | null;
}

const SupabaseConfigContext = createContext<SupabaseConfigContextType>({
  config: null,
  isLoading: true,
  error: null,
});

export const SUPABASE_CONFIG_READY_EVENT = 'supabase-config-ready';

export function useSupabaseConfig() {
  return useContext(SupabaseConfigContext);
}

interface SupabaseConfigProviderProps {
  children: ReactNode;
}

function getEnvFallback(): SupabaseConfig | null {
  const url =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL ||
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_COZE_SUPABASE_URL ||
    (window as unknown as { __VITE_SUPABASE_URL__?: string }).__VITE_SUPABASE_URL__ ||
    '';
  const anonKey =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_COZE_SUPABASE_ANON_KEY ||
    (window as unknown as { __VITE_SUPABASE_ANON_KEY__?: string }).__VITE_SUPABASE_ANON_KEY__ ||
    '';
  if (url && anonKey) return { url, anonKey };
  return null;
}

export function SupabaseConfigProvider({ children }: SupabaseConfigProviderProps) {
  const [config, setConfig] = useState<SupabaseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const done = (cfg: SupabaseConfig | null, err?: string) => {
      if (cancelled) return;
      if (cfg) {
        setConfig(cfg);
        (window as unknown as { __SUPABASE_CONFIG__: SupabaseConfig }).__SUPABASE_CONFIG__ = cfg;
        (window as any).__SUPABASE_URL = cfg.url;
        (window as any).__SUPABASE_ANON_KEY = cfg.anonKey;
        window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_READY_EVENT, { detail: cfg }));
      }
      if (err) setError(err);
      setIsLoading(false);
    };

    const envCfg = getEnvFallback();
    if (envCfg) {
      done(envCfg);
      // Also attempt API refresh in background to stay consistent, but don't block UI
      fetch(apiUrl('/api/supabase-config'))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.url && data?.anonKey && !cancelled) {
            setConfig(data);
            (window as unknown as { __SUPABASE_CONFIG__: SupabaseConfig }).__SUPABASE_CONFIG__ = data;
            (window as any).__SUPABASE_URL = data.url;
            (window as any).__SUPABASE_ANON_KEY = data.anonKey;
          }
        })
        .catch(() => {
          /* ignore */
        });
      return;
    }

    fetch(apiUrl('/api/supabase-config'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.url && data.anonKey) done(data);
        else done(null, 'Invalid config response');
      })
      .catch((err) => {
        done(null, err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SupabaseConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </SupabaseConfigContext.Provider>
  );
}
