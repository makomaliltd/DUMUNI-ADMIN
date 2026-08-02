import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';
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

function mapSupabaseUser(sbUser: import('@supabase/supabase-js').User): User {
  const metadata = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    email: sbUser.email,
    phone: sbUser.phone,
    fullName: metadata.full_name || metadata.name || sbUser.email?.split('@')[0] || 'User',
    avatarUrl: metadata.avatar_url || null,
    role: (metadata.role || 'admin') as UserRole,
    createdAt: sbUser.created_at,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { config, isLoading: configLoading } = useSupabaseConfig();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getClient = useCallback((): SupabaseClient | null => {
    return getSupabaseBrowserClient();
  }, []);

  useEffect(() => {
    if (configLoading || !config) return;

    const initAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          setIsLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user);
          setUser(mappedUser);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session?.user) {
              setUser(mapSupabaseUser(session.user));
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

      if (data.session?.user) {
        setUser(mapSupabaseUser(data.session.user));
      }

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