/* ============================================================
   Obsidian Capital — Axios API Instance + Typed API helpers
   Centralized HTTP client with JWT auth and 401 handling
   ============================================================ */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: attach JWT token ─────────────────────

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('oc_user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Malformed storage — ignore
    }
  }
  return config;
});

// ── Response Interceptor: handle 401 by clearing auth ────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Types ─────────────────────────────────────────────────────

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
  t: string; // ISO timestamp
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

export interface IBKROrder {
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

/** Alpaca Broker order shape (same fields as IBKROrder for compatibility) */
export type AlpacaOrder = IBKROrder;

export interface OrdersResponse {
  orders: IBKROrder[];
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

export interface PlaceOrderParams {
  ticker: string;
  company_name?: string;
  side: 'buy' | 'sell';
  qty: number;
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  tif?: 'day' | 'gtc' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  trailPct?: number;
  estimatedPrice?: number;
}

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

  getNews: (symbols?: string, limit = 10) =>
    api
      .get<NewsResponse>('/market/news', { params: { symbols, limit } })
      .then((r) => r.data),

  searchAssets: (q: string) =>
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

  /** Returns the Alpaca Broker account summary (buying power, equity, etc.) */
  getAccount: () =>
    api.get<{ success: boolean; data: IBKRAccountResponse }>('/trades/account').then((r) => r.data.data),

  previewOrder: (params: PreviewParams) =>
    api.post('/trades/preview', params).then((r) => r.data),

  placeOrder: (params: PlaceOrderParams) =>
    api.post('/trades/order', params).then((r) => r.data),
};

// ── Broker account data shape (Alpaca) ────────────────────────

export interface IBKRAccountData {
  /** Alpaca internal account ID */
  id?:             string;
  accountId?:      string;
  accountType?:    string;
  accountNumber?:  string;
  status?:         string;
  currency:        string;
  buying_power:    number;
  equity:          number;
  cash:            number;
  net_liquidation?: number;
  portfolio_value?: number;
  long_market_value?: number;
  unrealized_pnl?: number;
  realized_pnl?:   number;
}

export interface IBKRAccountResponse {
  account:          IBKRAccountData | null;
  /** @deprecated Use alpaca_connected */
  ibkr_connected?:  boolean;
  alpaca_connected?: boolean;
  paper_mode?:      boolean;
}

// ── Broker API (Alpaca) ───────────────────────────────────────

export const brokerApi = {
  /** Fetch the Alpaca Broker account summary */
  getAccount: () =>
    api.get<{ success: boolean; data: IBKRAccountResponse }>('/trades/account').then((r) => r.data),

  /** Get paper/live mode status */
  getMode: () =>
    api.get<{ success: boolean; data: { paper_mode: boolean; connected: boolean; mode_label: string } }>('/trades/mode').then((r) => r.data),
};

/**
 * @deprecated Use brokerApi instead.
 * Kept for backwards compatibility with components that import ibkrApi.
 */
export const ibkrApi = {
  /** @deprecated No-op. Alpaca uses programmatic account creation — no OAuth URL. */
  getAuthUrl: () =>
    Promise.resolve({ success: false, data: { url: '', state: '' } }),

  /** Fetch the connected broker account summary */
  getAccount: () =>
    api.get<{ success: boolean; data: IBKRAccountResponse }>('/trades/account').then((r) => r.data),

  /** @deprecated Alpaca accounts cannot be disconnected via OAuth. */
  disconnect: () =>
    Promise.resolve({ success: false, message: 'Use brokerApi instead.' }),

  getMode: () =>
    api.get<{ success: boolean; data: { paper_mode: boolean; connected: boolean } }>('/trades/mode')
      .then((r) => ({ paperMode: r.data.data.paper_mode })),

  setMode: (_paperMode: boolean) =>
    Promise.resolve({ success: false }),
};
