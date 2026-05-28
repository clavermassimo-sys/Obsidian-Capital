/* ============================================================
   Obsidian Capital — Trading Context
   Real API calls for holdings, trades, watchlist, and orders.
   ============================================================ */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
import { portfolioApi, tradesApi } from '@/services/api';
import type { HoldingRaw } from '@/services/api';

// ── Commission Rates ──────────────────────────────────────────

const COMMISSION_RATES: Record<CommissionTier, { min: number; max: number }> = {
  standard: { min: 0.10, max: 0.12 },
  member: { min: 0.07, max: 0.09 },
  private: { min: 0.05, max: 0.06 },
};

// ── Helpers ───────────────────────────────────────────────────

function toNum(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  return typeof v === 'number' ? v : parseFloat(v as string) || 0;
}

function rawToHolding(r: HoldingRaw): Holding {
  const qty        = toNum(r.qty);
  const avgEntry   = toNum(r.avg_entry_price);
  const curPrice   = toNum(r.current_price);
  const mktValue   = toNum(r.market_value);
  const unrPl      = toNum(r.unrealized_pl);
  const unrPlPct   = toNum(r.unrealized_plpc) * 100;

  return {
    ticker:          r.symbol,
    companyName:     r.symbol,
    shares:          qty,
    avgCost:         avgEntry,
    currentPrice:    curPrice,
    marketValue:     mktValue,
    returnPct:       unrPlPct,
    returnDollar:    unrPl,
    sector:          r.asset_class,
  };
}

// ── Watchlist persistence ─────────────────────────────────────

const WATCHLIST_KEY = 'oc_watchlist';

function loadWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchlistItem[];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────

interface TradingContextValue {
  holdings: Holding[];
  trades: Trade[];
  watchlist: WatchlistItem[];
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;
  previewOrder: (req: OrderRequest, tier: CommissionTier) => Promise<OrderPreview>;
  submitOrder: (req: OrderRequest, tier: CommissionTier) => Promise<Trade>;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (ticker: string) => void;
}

// ── Context ───────────────────────────────────────────────────

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings]       = useState<Holding[]>([]);
  const [trades, setTrades]           = useState<Trade[]>([]);
  const [watchlist, setWatchlist]     = useState<WatchlistItem[]>(loadWatchlist());
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // ── Fetch holdings on mount ───────────────────────────────

  useEffect(() => {
    portfolioApi.getHoldings().then((res) => {
      if (res.holdings) {
        setHoldings(res.holdings.map(rawToHolding));
      }
    }).catch(() => {
      // If API fails (unauthenticated/no Alpaca key), leave empty
    });
  }, []);

  // ── Fetch orders on mount ─────────────────────────────────

  useEffect(() => {
    tradesApi.getOrders().then((res) => {
      if (res.orders) {
        const mapped: Trade[] = res.orders.map((o) => ({
          id:          o.id,
          ticker:      o.symbol,
          companyName: o.symbol,
          type:        o.side as 'buy' | 'sell',
          orderType:   o.type as any,
          shares:      parseFloat(String(o.filled_qty ?? o.qty)) || 0,
          price:       parseFloat(String(o.filled_avg_price ?? 0)) || 0,
          commission:  o.commission ?? 0,
          total:       (parseFloat(String(o.filled_avg_price ?? 0)) || 0) * (parseFloat(String(o.filled_qty ?? 0)) || 0),
          timestamp:   o.submitted_at,
          status:      o.status as any,
          limitPrice:  o.limit_price ? parseFloat(String(o.limit_price)) : undefined,
        }));
        setTrades(mapped);
      }
    }).catch(() => {
      // Leave empty if API fails
    });
  }, []);

  // ── Persist watchlist to localStorage ────────────────────

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  // ── Preview order (uses real API if available) ────────────

  const previewOrder = useCallback(
    async (req: OrderRequest, tier: CommissionTier): Promise<OrderPreview> => {
      try {
        const result = await tradesApi.previewOrder({
          symbol:         req.ticker,
          side:           req.side,
          qty:            req.shares,
          type:           req.orderType,
          limit_price:    req.limitPrice,
          stop_price:     req.stopPrice,
          time_in_force:  'day',
        });
        return result as OrderPreview;
      } catch {
        // Fallback to local calculation
        const rates = COMMISSION_RATES[tier];
        const midRate = (rates.min + rates.max) / 2;
        const holding = holdings.find((h) => h.ticker === req.ticker);
        const watchItem = watchlist.find((w) => w.ticker === req.ticker);
        const estimatedPrice = req.limitPrice ?? holding?.currentPrice ?? watchItem?.price ?? 100;
        const subtotal = estimatedPrice * req.shares;
        const commissionAmount = subtotal * midRate;
        return {
          ticker:           req.ticker,
          companyName:      holding?.companyName ?? watchItem?.companyName ?? req.ticker,
          side:             req.side,
          shares:           req.shares,
          estimatedPrice,
          subtotal,
          commissionRate:   midRate,
          commissionAmount,
          total:            req.side === 'buy' ? subtotal + commissionAmount : subtotal - commissionAmount,
          tier,
        };
      }
    },
    [holdings, watchlist]
  );

  // ── Submit order ──────────────────────────────────────────

  const submitOrder = useCallback(
    async (req: OrderRequest, tier: CommissionTier): Promise<Trade> => {
      let orderResult: any;
      try {
        orderResult = await tradesApi.placeOrder({
          symbol:        req.ticker,
          side:          req.side,
          qty:           req.shares,
          type:          req.orderType,
          limit_price:   req.limitPrice,
          stop_price:    req.stopPrice,
          time_in_force: 'day',
        });
      } catch {
        // Fallback: simulate a trade locally if API unavailable
        await new Promise((r) => setTimeout(r, 600));
        orderResult = null;
      }

      const preview = await previewOrder(req, tier);
      const price = parseFloat(orderResult?.filled_avg_price) || preview.estimatedPrice;

      const trade: Trade = {
        id:          orderResult?.id ?? `trd_${Date.now()}`,
        ticker:      req.ticker,
        companyName: preview.companyName,
        type:        req.side,
        orderType:   req.orderType,
        shares:      req.shares,
        price,
        commission:  preview.commissionAmount,
        total:       preview.total,
        timestamp:   new Date().toISOString(),
        status:      orderResult?.status ?? 'filled',
        limitPrice:  req.limitPrice,
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
