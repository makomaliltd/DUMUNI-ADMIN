import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const { isLoading: configLoading, error: configError } = useSupabaseConfig();
  const { t } = useLanguage();
  const location = useLocation();

  if (isLoading || configLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold mb-2 text-destructive">Configuration Error</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Could not load Supabase configuration. Please ensure the following environment variables are set on your deployment platform:
          </p>
          <div className="text-left text-xs font-mono bg-background border rounded p-3 space-y-1 mb-4">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_ANON_KEY</div>
            <div className="text-muted-foreground text-[10px] mt-2">(or COZE_SUPABASE_URL / COZE_SUPABASE_ANON_KEY)</div>
          </div>
          <p className="text-xs text-muted-foreground">Error: {configError}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
