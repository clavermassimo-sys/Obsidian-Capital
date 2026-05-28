/* ============================================================
   Obsidian Capital Mobile — Axios API Client + Typed Helpers
   JWT stored in SecureStore, attached as Bearer token.
   ============================================================ */

import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Base URL ──────────────────────────────────────────────────
// Update to your machine's LAN IP when testing on a real device.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export const TOKEN_KEY = 'oc_jwt_token';

// ── Axios instance ────────────────────────────────────────────

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ───────────────────────────

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore unavailable — proceed without token
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => null);
    }
    return Promise.reject(error);
  },
);

export default api;

// ── Types ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'standard' | 'member' | 'private';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_started';
  buyingPower: number;
  portfolioValue: number;
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  tier?: 'standard' | 'member' | 'private';
  dob?: string;
  ssnLast4?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface QuoteResponse {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  volume: number;
  high52: number;
  low52: number;
}

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface BarsResponse {
  bars: Bar[];
}

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export interface IndicesResponse {
  indices: IndexQuote[];
}

export interface MoverEntry {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePct: number;
  volume?: number;
}

export interface MoversResponse {
  gainers: MoverEntry[];
  losers: MoverEntry[];
}

export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  publishedAt: string;
  symbols: string[];
}

export interface NewsResponse {
  news: NewsItem[];
}

export interface AssetResult {
  symbol: string;
  name: string;
  type: string;
}

export interface SearchResponse {
  assets: AssetResult[];
}

export interface HoldingRaw {
  symbol: string;
  qty: string | number;
  avg_entry_price: string | number;
  current_price: string | number;
  market_value: string | number;
  unrealized_pl: string | number;
  unrealized_plpc: string | number;
  asset_class?: string;
}

export interface HoldingsResponse {
  holdings: HoldingRaw[];
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: string | number;
  filled_qty: string | number;
  type: string;
  status: string;
  submitted_at: string;
  filled_at?: string;
  filled_avg_price?: string | number;
  limit_price?: string | number;
  stop_price?: string | number;
  commission?: number;
}

export interface OrdersResponse {
  orders: AlpacaOrder[];
}

export interface AccountData {
  buying_power: string | number;
  equity: string | number;
  cash: string | number;
  long_market_value?: string | number;
  last_equity?: string | number;
}

export interface AccountResponse {
  account: AccountData;
}

export interface PreviewParams {
  symbol: string;
  side: 'buy' | 'sell';
  qty?: number;
  notional?: number;
  type: string;
  limit_price?: number;
  stop_price?: number;
  time_in_force?: string;
}

export interface PlaceOrderParams extends PreviewParams {}

export interface PreviewResponse {
  symbol: string;
  side: string;
  qty: number;
  estimatedPrice: number;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  total: number;
  tier: string;
}

// ── Auth API ──────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<LoginResponse>('/auth/register', payload).then((r) => r.data),

  getMe: () =>
    api.get<{ user: User }>('/auth/me').then((r) => r.data),
};

// ── Market API ────────────────────────────────────────────────

export const marketApi = {
  getQuote: (symbol: string) =>
    api.get<QuoteResponse>(`/market/quote/${symbol}`).then((r) => r.data),

  getBars: (symbol: string, timeframe: string, limit: number) =>
    api
      .get<BarsResponse>(`/market/bars/${symbol}`, { params: { timeframe, limit } })
      .then((r) => r.data),

  getIndices: () =>
    api.get<IndicesResponse>('/market/indices').then((r) => r.data),

  getMovers: () =>
    api.get<MoversResponse>('/market/movers').then((r) => r.data),

  getNews: (limit = 10) =>
    api.get<NewsResponse>('/market/news', { params: { limit } }).then((r) => r.data),

  search: (q: string) =>
    api.get<SearchResponse>('/market/search', { params: { q } }).then((r) => r.data),
};

// ── Portfolio API ─────────────────────────────────────────────

export const portfolioApi = {
  getHoldings: () =>
    api.get<HoldingsResponse>('/portfolio/holdings').then((r) => r.data),

  getHistory: (period: string) =>
    api
      .get<HistoryResponse>('/portfolio/portfolio-history', { params: { period } })
      .then((r) => r.data),
};

// ── Trades API ────────────────────────────────────────────────

export const tradesApi = {
  getOrders: () =>
    api.get<OrdersResponse>('/trades/orders').then((r) => r.data),

  getAccount: () =>
    api.get<AccountResponse>('/trades/account').then((r) => r.data),

  previewOrder: (params: PreviewParams) =>
    api.post<PreviewResponse>('/trades/preview', params).then((r) => r.data),

  placeOrder: (params: PlaceOrderParams) =>
    api.post<{ order: AlpacaOrder }>('/trades/order', params).then((r) => r.data),
};
