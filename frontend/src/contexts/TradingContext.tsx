/* ============================================================
   Obsidian Capital — Trading Context
   ============================================================ */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Holding,
  Trade,
  WatchlistItem,
  OrderRequest,
  OrderPreview,
  CommissionTier,
} from '@/types/index';

// ── Commission Rates ──────────────────────────────────────────

const COMMISSION_RATES: Record<CommissionTier, { min: number; max: number }> = {
  standard: { min: 0.10, max: 0.12 },
  member: { min: 0.07, max: 0.09 },
  private: { min: 0.05, max: 0.06 },
};

// ── Mock Data ─────────────────────────────────────────────────

const MOCK_HOLDINGS: Holding[] = [
  {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    shares: 150,
    avgCost: 172.5,
    currentPrice: 189.84,
    marketValue: 28476,
    returnPct: 10.05,
    returnDollar: 2601,
    sector: 'Technology',
    portfolioWeight: 15.4,
  },
  {
    ticker: 'MSFT',
    companyName: 'Microsoft Corp.',
    shares: 80,
    avgCost: 380.0,
    currentPrice: 418.32,
    marketValue: 33465.6,
    returnPct: 10.08,
    returnDollar: 3065.6,
    sector: 'Technology',
    portfolioWeight: 18.1,
  },
  {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corp.',
    shares: 60,
    avgCost: 520.0,
    currentPrice: 875.4,
    marketValue: 52524,
    returnPct: 68.35,
    returnDollar: 21324,
    sector: 'Semiconductors',
    portfolioWeight: 28.5,
  },
  {
    ticker: 'AMZN',
    companyName: 'Amazon.com Inc.',
    shares: 120,
    avgCost: 155.0,
    currentPrice: 198.72,
    marketValue: 23846.4,
    returnPct: 28.21,
    returnDollar: 5246.4,
    sector: 'Consumer Discretionary',
    portfolioWeight: 12.9,
  },
  {
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    shares: 90,
    avgCost: 145.0,
    currentPrice: 171.96,
    marketValue: 15476.4,
    returnPct: 18.59,
    returnDollar: 2426.4,
    sector: 'Technology',
    portfolioWeight: 8.4,
  },
];

const MOCK_TRADES: Trade[] = [
  {
    id: 'trd_001',
    ticker: 'NVDA',
    companyName: 'NVIDIA Corp.',
    type: 'buy',
    orderType: 'market',
    shares: 20,
    price: 875.4,
    commission: 875.4,
    total: 18383.4,
    timestamp: '2026-05-24T14:32:00Z',
    status: 'filled',
  },
  {
    id: 'trd_002',
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    type: 'sell',
    orderType: 'limit',
    shares: 25,
    price: 189.84,
    commission: 142.38,
    total: 4603.62,
    timestamp: '2026-05-23T10:15:00Z',
    status: 'filled',
    limitPrice: 188.0,
  },
];

const MOCK_WATCHLIST: WatchlistItem[] = [
  { ticker: 'TSLA', companyName: 'Tesla Inc.', price: 248.42, change: 8.32, changePct: 3.46, volume: 82450000, high52: 299.29, low52: 138.8, marketCap: 793_000_000_000 },
  { ticker: 'META', companyName: 'Meta Platforms', price: 571.28, change: -4.12, changePct: -0.72, volume: 14300000, high52: 602.95, low52: 310.66, marketCap: 1_450_000_000_000 },
  { ticker: 'JPM', companyName: 'JPMorgan Chase', price: 224.58, change: 1.24, changePct: 0.55, volume: 9120000, high52: 263.16, low52: 183.1, peRatio: 12.4 },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway B', price: 452.8, change: 2.08, changePct: 0.46, volume: 3850000, high52: 478.55, low52: 348.71 },
  { ticker: 'V', companyName: 'Visa Inc.', price: 289.34, change: -0.88, changePct: -0.30, volume: 6450000, high52: 310.0, low52: 241.0, peRatio: 31.2 },
  { ticker: 'GLD', companyName: 'SPDR Gold Trust ETF', price: 238.4, change: 1.84, changePct: 0.78, volume: 10200000 },
];

// ── Types ─────────────────────────────────────────────────────

interface TradingContextValue {
  holdings: Holding[];
  trades: Trade[];
  watchlist: WatchlistItem[];
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;
  previewOrder: (req: OrderRequest, tier: CommissionTier) => OrderPreview;
  submitOrder: (req: OrderRequest, tier: CommissionTier) => Promise<Trade>;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (ticker: string) => void;
}

// ── Context ───────────────────────────────────────────────────

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(MOCK_HOLDINGS);
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(MOCK_WATCHLIST);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const previewOrder = useCallback(
    (req: OrderRequest, tier: CommissionTier): OrderPreview => {
      const rates = COMMISSION_RATES[tier];
      const midRate = (rates.min + rates.max) / 2;
      const holding = holdings.find((h) => h.ticker === req.ticker);
      const watchItem = watchlist.find((w) => w.ticker === req.ticker);
      const estimatedPrice = req.limitPrice ?? holding?.currentPrice ?? watchItem?.price ?? 100;
      const subtotal = estimatedPrice * req.shares;
      const commissionAmount = subtotal * midRate;
      return {
        ticker: req.ticker,
        companyName: holding?.companyName ?? watchItem?.companyName ?? req.ticker,
        side: req.side,
        shares: req.shares,
        estimatedPrice,
        subtotal,
        commissionRate: midRate,
        commissionAmount,
        total: req.side === 'buy' ? subtotal + commissionAmount : subtotal - commissionAmount,
        tier,
      };
    },
    [holdings, watchlist]
  );

  const submitOrder = useCallback(
    async (req: OrderRequest, tier: CommissionTier): Promise<Trade> => {
      await new Promise((r) => setTimeout(r, 600));
      const preview = previewOrder(req, tier);
      const trade: Trade = {
        id: `trd_${Date.now()}`,
        ticker: req.ticker,
        companyName: preview.companyName,
        type: req.side,
        orderType: req.orderType,
        shares: req.shares,
        price: preview.estimatedPrice,
        commission: preview.commissionAmount,
        total: preview.total,
        timestamp: new Date().toISOString(),
        status: 'filled',
        limitPrice: req.limitPrice,
      };
      setTrades((prev) => [trade, ...prev]);
      return trade;
    },
    [previewOrder]
  );

  const addToWatchlist = useCallback((item: WatchlistItem) => {
    setWatchlist((prev) =>
      prev.some((w) => w.ticker === item.ticker) ? prev : [...prev, item]
    );
  }, []);

  const removeFromWatchlist = useCallback((ticker: string) => {
    setWatchlist((prev) => prev.filter((w) => w.ticker !== ticker));
  }, []);

  return (
    <TradingContext.Provider
      value={{
        holdings,
        trades,
        watchlist,
        selectedTicker,
        setSelectedTicker,
        previewOrder,
        submitOrder,
        addToWatchlist,
        removeFromWatchlist,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading(): TradingContextValue {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used within <TradingProvider>');
  return ctx;
}
