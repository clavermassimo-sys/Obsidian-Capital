/* ============================================================
   Obsidian Capital — TypeScript Type Definitions
   ============================================================ */

// ── Enums / Union Types ───────────────────────────────────────

export type CommissionTier = 'standard' | 'member' | 'private';

export type OrderSide = 'buy' | 'sell';

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'not_started';

export type TradeStatus = 'pending' | 'filled' | 'cancelled' | 'partial';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

// ── User / Auth ───────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  /** Membership tier determines commission rate */
  tier: CommissionTier;
  kycStatus: KycStatus;
  /** Available cash for trading (USD) */
  buyingPower: number;
  /** Total market value of all holdings */
  portfolioValue: number;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** Optional profile picture URL */
  avatarUrl?: string;
  /** Phone number (E.164 format) */
  phone?: string;
  /** Whether the user has a linked Interactive Brokers account */
  ibkrConnected?: boolean;
  /** IBKR account ID (e.g. U1234567) */
  ibkrAccountId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ── Portfolio ─────────────────────────────────────────────────

export interface Holding {
  ticker: string;
  companyName: string;
  /** Number of shares owned */
  shares: number;
  /** Average cost basis per share */
  avgCost: number;
  /** Most recent market price */
  currentPrice: number;
  /** shares × currentPrice */
  marketValue: number;
  /** Percentage return ((currentPrice - avgCost) / avgCost) × 100 */
  returnPct: number;
  /** Dollar return (currentPrice - avgCost) × shares */
  returnDollar: number;
  /** Sector classification */
  sector?: string;
  /** Percentage of total portfolio */
  portfolioWeight?: number;
}

export interface PortfolioSnapshot {
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;
  /** Total portfolio value in USD */
  value: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPct: number;
  buyingPower: number;
  dayChange: number;
  dayChangePct: number;
}

// ── Trading ───────────────────────────────────────────────────

export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  type: OrderSide;
  orderType?: OrderType;
  shares: number;
  /** Execution price per share */
  price: number;
  /** Commission paid in USD */
  commission: number;
  /** Total cost/proceeds including commission */
  total: number;
  /** ISO 8601 timestamp of execution */
  timestamp: string;
  status: TradeStatus;
  /** For limit/stop orders — the requested price */
  limitPrice?: number;
  /** Notes or reason */
  notes?: string;
}

export interface OrderRequest {
  ticker: string;
  side: OrderSide;
  orderType: OrderType;
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
}

export interface OrderPreview {
  ticker: string;
  companyName: string;
  side: OrderSide;
  shares: number;
  estimatedPrice: number;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  total: number;
  tier: CommissionTier;
}

// ── Market Data ───────────────────────────────────────────────

export interface WatchlistItem {
  ticker: string;
  companyName: string;
  /** Current/last price */
  price: number;
  /** Absolute price change today */
  change: number;
  /** Percentage change today */
  changePct: number;
  /** Today's volume */
  volume: number;
  /** 52-week high */
  high52?: number;
  /** 52-week low */
  low52?: number;
  /** Market capitalization */
  marketCap?: number;
  /** P/E ratio */
  peRatio?: number;
}

export interface MarketIndex {
  name: string;
  /** Ticker symbol (e.g. "SPX", "IXIC", "DJI") */
  symbol?: string;
  value: number;
  /** Absolute point change */
  change: number;
  /** Percentage change */
  changePct: number;
}

export interface Candle {
  /** Unix timestamp in seconds (or ISO string) */
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  ticker: string;
  companyName: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  /** ISO 8601 timestamp of last update */
  timestamp: string;
}

// ── Commission ────────────────────────────────────────────────

export interface CommissionBreakdown {
  tier: CommissionTier;
  rate: number;
  amount: number;
  subtotal: number;
  total: number;
}

export interface CommissionRateConfig {
  min: number;
  max: number;
  /** Human-readable display string e.g. "7–9%" */
  display: string;
}

// ── API Responses ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode: number;
}

// ── UI / Misc ─────────────────────────────────────────────────

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'trade_filled' | 'price_alert' | 'account' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ── Alpaca ────────────────────────────────────────────────────

export interface AlpacaAccount {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  equity: number;
  lastEquity: number;
  longMarketValue: number;
  patternDayTrader: boolean;
  tradingBlocked: boolean;
  paperMode: boolean;
}

// ── Subscription / Billing ────────────────────────────────────

export interface Subscription {
  tier: 'standard' | 'member' | 'private';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodEnd?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  /** Monthly amount in dollars */
  monthlyAmount?: number;
}

export interface CommissionRecord {
  id: string;
  tradeId: string;
  ticker: string;
  tradeValue: number;
  commissionRate: number;
  commissionAmount: number;
  paymentStatus: 'pending' | 'charged' | 'failed' | 'waived';
  createdAt: string;
}

// ── Extended Order Types ──────────────────────────────────────

export type ExtendedOrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok';

export interface ExtendedOrderRequest {
  ticker: string;
  side: 'buy' | 'sell';
  qty?: number;
  /** Dollar amount for fractional shares */
  notional?: number;
  orderType: ExtendedOrderType;
  timeInForce?: TimeInForce;
  limitPrice?: number;
  stopPrice?: number;
  trailPercent?: number;
}

export interface CommissionSavings {
  vs_standard: number;
  upgrade_to_member: number;
  upgrade_to_private: number;
}

export interface ExtendedCommissionBreakdown {
  subtotal: number;
  rate: number;
  rateDisplay: string;
  amount: number;
  total: number;
  tier: CommissionTier;
  savings: CommissionSavings;
}

export interface PriceAlert {
  id: string;
  ticker: string;
  companyName: string;
  targetPrice: number;
  direction: 'above' | 'below';
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}
