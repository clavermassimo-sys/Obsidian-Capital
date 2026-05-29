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
import { io, Socket } from 'socket.io-client';
import type {
  Holding,
  Trade,
  WatchlistItem,
  OrderRequest,
  OrderPreview,
  CommissionTier,
} from '@/types/index';
import { portfolioApi, tradesApi } from '@/services/api';
import type { HoldingRaw, PlaceOrderParams } from '@/services/api';

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

// ── Helpers ───────────────────────────────────────────────────

function getStoredToken(): string {
  try {
    const stored = localStorage.getItem('oc_user');
    if (stored) return JSON.parse(stored).token || '';
  } catch { /* ignore */ }
  return '';
}

// ── Order update event shape from Socket.IO ───────────────────

interface OrderUpdateEvent {
  trade_id:      string;
  ibkr_order_id: string;
  ticker:        string;
  side:          string;
  qty:           number;
  price:         number | null;
  status:        string;
  commission:    number;
  total:         number;
  created_at:    string;
}

// ── Price update event shape from Socket.IO ───────────────────

interface PriceUpdateEntry {
  ticker:     string;
  price:      number;
  change:     number;
  change_pct: number;
}

interface PriceUpdateEvent {
  updates: PriceUpdateEntry[];
}

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
      // If API fails (unauthenticated/no IBKR connection), leave empty
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
          orderType:   o.type as Trade['orderType'],
          shares:      parseFloat(String(o.filled_qty ?? o.qty)) || 0,
          price:       parseFloat(String(o.filled_avg_price ?? 0)) || 0,
          commission:  o.commission ?? 0,
          total:       (parseFloat(String(o.filled_avg_price ?? 0)) || 0) * (parseFloat(String(o.filled_qty ?? 0)) || 0),
          timestamp:   o.submitted_at,
          status:      o.status as Trade['status'],
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

  // ── Socket.IO real-time updates ───────────────────────────

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const socket: Socket = io(
      import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001',
      {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      }
    );

    socket.on('connect', () => {
      // Authenticate so the server can place this socket in user:{userId} room
      socket.emit('auth', { token });
    });

    // Listen for order updates pushed by the server after trade execution
    socket.on('order:update', (event: OrderUpdateEvent) => {
      setTrades((prev) => {
        const existing = prev.find((t) => t.id === event.trade_id);
        if (existing) {
          // Update status of an already-tracked trade
          return prev.map((t) =>
            t.id === event.trade_id
              ? { ...t, status: event.status as Trade['status'] }
              : t
          );
        }
        // New trade from this session — prepend it
        const newTrade: Trade = {
          id:          event.trade_id,
          ticker:      event.ticker,
          companyName: event.ticker,
          type:        event.side.toLowerCase() as 'buy' | 'sell',
          orderType:   'market',
          shares:      event.qty,
          price:       event.price ?? 0,
          commission:  event.commission,
          total:       event.total,
          timestamp:   event.created_at,
          status:      event.status as Trade['status'],
        };
        return [newTrade, ...prev];
      });
    });

    // Listen for price updates to keep holdings current prices fresh
    socket.on('price:update', (event: PriceUpdateEvent) => {
      setHoldings((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const updated = prev.map((h) => {
          const tick = event.updates.find((u) => u.ticker === h.ticker);
          if (!tick) return h;
          changed = true;
          const marketValue  = parseFloat((h.shares * tick.price).toFixed(2));
          const returnDollar = parseFloat((marketValue - h.shares * h.avgCost).toFixed(2));
          const returnPct    = h.avgCost > 0 ? parseFloat(((returnDollar / (h.shares * h.avgCost)) * 100).toFixed(2)) : 0;
          return { ...h, currentPrice: tick.price, marketValue, returnDollar, returnPct };
        });
        return changed ? updated : prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
      const preview = await previewOrder(req, tier);

      // Map frontend orderType → Alpaca Broker order type
      const alpacaOrderType: Record<string, string> = {
        market:        'market',
        limit:         'limit',
        stop:          'stop',
        stop_limit:    'stop_limit',
        trailing_stop: 'trailing_stop',
      };

      // Build Alpaca-compatible order payload.
      // No conid needed — Alpaca uses ticker symbol directly.
      const orderPayload = {
        ticker:       req.ticker,
        company_name: preview.companyName || req.ticker,
        side:         req.side.toLowerCase() as 'buy' | 'sell',
        qty:          req.shares,
        orderType:    (alpacaOrderType[req.orderType] ?? 'market') as PlaceOrderParams['orderType'],
        tif:          'day' as const,
        ...(req.limitPrice !== undefined && { limitPrice: req.limitPrice }),
        ...(req.stopPrice  !== undefined && { stopPrice:  req.stopPrice  }),
        estimatedPrice: preview.estimatedPrice,
      };

      let orderResult: { data?: { trade_id?: string; order?: { id?: string; status?: string; filled_avg_price?: string } } } | null = null;
      try {
        orderResult = await tradesApi.placeOrder(orderPayload);
      } catch {
        // If API call fails, rethrow — we don't simulate real trades
        throw new Error('Order submission failed. Please ensure your brokerage account is active and try again.');
      }

      const brokerOrder = orderResult?.data?.order;
      const filledAvg   = brokerOrder?.filled_avg_price ? parseFloat(brokerOrder.filled_avg_price) : undefined;
      const price       = filledAvg ?? preview.estimatedPrice;

      const trade: Trade = {
        id:          orderResult?.data?.trade_id ?? `trd_${Date.now()}`,
        ticker:      req.ticker,
        companyName: preview.companyName,
        type:        req.side,
        orderType:   req.orderType,
        shares:      req.shares,
        price,
        commission:  preview.commissionAmount,
        total:       preview.total,
        timestamp:   new Date().toISOString(),
        status:      (brokerOrder?.status?.toLowerCase() as Trade['status']) ?? 'pending',
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
