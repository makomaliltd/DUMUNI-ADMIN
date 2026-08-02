import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupabaseConfigProvider } from '@/lib/supabase-config-inject';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastProvider } from '@/components/ui/toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRealtimeOrderNotifications } from '@/hooks/useRealtimeNotification';

// Lazy loaded pages
const LoginPage = lazy(() => import('@/pages/Login').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const AnalyticsPage = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.AnalyticsPage })));
const ContentPage = lazy(() => import('@/pages/Content'));
const OrdersPage = lazy(() => import('@/pages/Orders'));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetail'));
const FinancePage = lazy(() => import('@/pages/Finance'));
const ReportsPage = lazy(() => import('@/pages/Reports'));
const RestaurantsPage = lazy(() => import('@/pages/Restaurants'));
const RestaurantDetailPage = lazy(() => import('@/pages/RestaurantDetail'));
const SellersPage = lazy(() => import('@/pages/Sellers'));
const DriversPage = lazy(() => import('@/pages/Drivers'));
const DriverDetailPage = lazy(() => import('@/pages/DriverDetail'));
const DriverTrackingPage = lazy(() => import('@/pages/DriverTracking'));
const DriversApplicationsPage = lazy(() => import('@/pages/DriversApplications'));
const UsersPage = lazy(() => import('@/pages/Users').then((m) => ({ default: m.UsersPage })));
const UserDetailPage = lazy(() => import('@/pages/UserDetail').then((m) => ({ default: m.UserDetailPage })));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes cache
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  useRealtimeOrderNotifications();
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageLoading />}>
          <LoginPage />
        </Suspense>
      } />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Suspense fallback={<PageLoading />}><DashboardPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<PageLoading />}><AnalyticsPage /></Suspense>} />
        <Route path="content" element={<Suspense fallback={<PageLoading />}><ContentPage /></Suspense>} />
        <Route path="orders" element={<Suspense fallback={<PageLoading />}><OrdersPage /></Suspense>} />
        <Route path="orders/:id" element={<Suspense fallback={<PageLoading />}><OrderDetailPage /></Suspense>} />
        <Route path="finance" element={<Suspense fallback={<PageLoading />}><FinancePage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoading />}><ReportsPage /></Suspense>} />
        <Route path="restaurants" element={<Suspense fallback={<PageLoading />}><RestaurantsPage /></Suspense>} />
        <Route path="restaurants/:id" element={<Suspense fallback={<PageLoading />}><RestaurantDetailPage /></Suspense>} />
        <Route path="sellers" element={<Suspense fallback={<PageLoading />}><SellersPage /></Suspense>} />
        <Route path="drivers" element={<Suspense fallback={<PageLoading />}><DriversPage /></Suspense>} />
        <Route path="drivers/applications" element={<Suspense fallback={<PageLoading />}><DriversApplicationsPage /></Suspense>} />
        <Route path="drivers/tracking" element={<Suspense fallback={<PageLoading />}><DriverTrackingPage /></Suspense>} />
        <Route path="drivers/:id" element={<Suspense fallback={<PageLoading />}><DriverDetailPage /></Suspense>} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Suspense fallback={<PageLoading />}><UsersPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute roles={['admin']}>
              <Suspense fallback={<PageLoading />}><UserDetailPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['admin', 'editor']}>
              <Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Suspense fallback={<PageLoading />}><NotFoundPage /></Suspense>} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseConfigProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
            <ToastProvider>
              <NotificationProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </NotificationProvider>
            </ToastProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </SupabaseConfigProvider>
    </QueryClientProvider>
  );
}