export interface User {
  id: string;
  email: string | undefined;
  phone: string | undefined;
  fullName: string | undefined;
  avatarUrl: string | undefined;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SidebarNavItem {
  titleKey: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  children?: SidebarNavItem[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Dashboard Types ───────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  pendingVerifications: number;
  ordersTrend: number;
  revenueTrend: number;
}

export interface OrderTrend {
  date: string;
  orders: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  commission: number;
}

export interface TopRestaurant {
  id: string;
  name: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface OrderStatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'registration' | 'withdrawal' | 'review';
  title: string;
  description: string;
  time: string;
  icon?: string;
  status?: string;
}

// ─── Order Types ─────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Order {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  driver_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  amount: number;
  commission: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  items_count: number;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string | null;
  restaurant_name?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_vehicle?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  note: string | null;
  created_at: string;
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待处理',
  accepted: '已接单',
  preparing: '准备中',
  ready: '已备好',
  delivering: '配送中',
  delivered: '已送达',
  cancelled: '已取消',
  rejected: '已拒绝',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'warning',
  accepted: 'info',
  preparing: 'info',
  ready: 'info',
  delivering: 'secondary',
  delivered: 'success',
  cancelled: 'destructive',
  rejected: 'destructive',
};

// ===== Financial Types =====

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type UserType = 'seller' | 'driver';

export interface Withdrawal {
  id: string;
  user_id?: string | null;
  user_name: string;
  user_type: UserType;
  phone_number: string;
  amount: number;
  status: WithdrawalStatus;
  notes?: string | null;
  reject_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface FinancialSetting {
  key: string;
  value: string;
  description: string;
  updated_at?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  details?: string | null;
  created_at: string;
}

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成',
};

export const WITHDRAWAL_STATUS_COLORS: Record<WithdrawalStatus, string> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'destructive',
  completed: 'success',
};