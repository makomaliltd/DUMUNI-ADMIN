import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { apiUrl } from '@/lib/api';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface BackendMeResponse {
  user: User;
}

/** Error code returned by login() when the account is not an admin */
export const AUTH_NOT_ADMIN = 'AUTH_NOT_ADMIN';

async function fetchAdminProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(apiUrl('/api/auth/me'), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 403) return null;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const { user } = (await res.json()) as BackendMeResponse;
    return user;
  } catch (err) {
    console.error('Failed to load admin profile:', err);
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { config, isLoading: configLoading } = useSupabaseConfig();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (configLoading) return;
    if (!config) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          setIsLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          const profile = await fetchAdminProfile(session.access_token);
          setUser(profile);
          if (!profile) {
            await supabase.auth.signOut().catch(() => {});
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, nextSession) => {
            if (nextSession?.access_token) {
              fetchAdminProfile(nextSession.access_token).then((profile) => {
                setUser(profile);
                if (!profile) {
                  supabase.auth.signOut().catch(() => {});
                }
              });
            } else {
              setUser(null);
            }
            setIsLoading(false);
          }
        );

        setIsLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [config, configLoading]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return { error: '认证服务未就绪，请稍后刷新页面重试' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.session?.access_token) {
        return { error: '登录失败，请重试' };
      }

      const profile = await fetchAdminProfile(data.session.access_token);
      if (!profile) {
        await supabase.auth.signOut().catch(() => {});
        return { error: AUTH_NOT_ADMIN };
      }
      setUser(profile);

      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : '登录失败，请重试' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || configLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
