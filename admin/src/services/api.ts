import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const ADMIN_TOKEN_KEY = 'oc_admin_token';

export const getAdminToken = () => sessionStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token: string) => sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => sessionStorage.removeItem(ADMIN_TOKEN_KEY);
export const isAdminAuthenticated = () => !!getAdminToken();

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      clearAdminToken();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ── Types ──────────────────────────────────────────────────────

export interface TierStats {
  count: number;
  approved: number;
  pending: number;
  rejected: number;
  total_buying_power: number;
}

export interface AdminStats {
  users: {
    total: number;
    by_tier: { standard: TierStats; member: TierStats; private: TierStats };
    kyc_pipeline: { pending: number; approved: number; rejected: number };
  };
  trades: {
    total: number;
    buy_orders: number;
    sell_orders: number;
    total_volume: number;
    total_commission_revenue: number;
    avg_order_size: number;
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
  recent_signups: Array<{ date: string; new_users: number }>;
  commission_rates: { standard: string; member: string; private: string };
  as_of: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  tier: 'standard' | 'member' | 'private';
  kyc_status: 'pending' | 'approved' | 'rejected';
  buying_power: number;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  holdings_count: number;
  trades_count: number;
  commission_generated: number;
}

export interface UsersPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AdminTrade {
  id: string;
  ticker: string;
  company_name: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  commission: number;
  total: number;
  status: string;
  order_type: string;
  created_at: string;
  user_name: string;
  user_email: string;
  user_tier: 'standard' | 'member' | 'private';
}

export interface RevenueHistoricalPoint {
  month: string;
  commission_revenue: number;
  trade_count: number;
  total_volume: number;
}

export interface RevenueProjectionPoint {
  month: string;
  projected_users: number;
  projected_trades: number;
  projected_revenue: number;
  growth_assumption: string;
}

export interface TierBreakdown {
  active_users: number;
  commission_revenue: number;
  avg_commission_per_trade: number;
  trade_count: number;
  commission_display: string;
}

export interface RevenueData {
  historical: RevenueHistoricalPoint[];
  current_period: {
    active_users: number;
    trades_last_30d: number;
    avg_commission_per_trade: number;
    monthly_run_rate: number;
  };
  tier_breakdown: Record<string, TierBreakdown>;
  projections: RevenueProjectionPoint[];
  assumptions: {
    growth_rate: string;
    commission_rates: { standard: string; member: string; private: string };
  };
  as_of: string;
}

// ── API methods ────────────────────────────────────────────────

export const adminAuthApi = {
  login: (code: string) =>
    api.post<{ success: boolean; data: { token: string } }>('/admin/auth', { code }).then((r) => r.data),
};

export const adminApi = {
  getStats: () =>
    api.get<{ success: boolean; data: AdminStats }>('/admin/stats').then((r) => r.data.data),

  getUsers: (params?: { page?: number; limit?: number; tier?: string; search?: string; kyc_status?: string }) =>
    api.get<{ success: boolean; data: { users: AdminUser[]; pagination: UsersPagination } }>('/admin/users', { params }).then((r) => r.data.data),

  getTrades: (params?: { page?: number; limit?: number; ticker?: string; type?: string; tier?: string }) =>
    api.get<{ success: boolean; data: { trades: AdminTrade[]; pagination: UsersPagination } }>('/admin/trades', { params }).then((r) => r.data.data),

  getRevenue: () =>
    api.get<{ success: boolean; data: RevenueData }>('/admin/revenue-projection').then((r) => r.data.data),
};

export default api;
