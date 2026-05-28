/* ============================================================
   Obsidian Capital — Watchlist
   Real-time watchlist via Socket.IO + REST API for initial prices.
   ============================================================ */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Plus,
  X,
  Search,
  Eye,
  ArrowUp,
  ArrowDown,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import type { WatchlistItem } from '@/types';
import { useTrading } from '@/contexts/TradingContext';
import { marketApi } from '@/services/api';

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

// ── Price state for a ticker ──────────────────────────────────

interface LivePrice {
  price: number;
  change: number;
  changePct: number;
  volume: number;
}

// ── Sub-components ────────────────────────────────────────────

interface AddTickerModalProps {
  existingTickers: string[];
  onAdd: (item: WatchlistItem) => void;
  onClose: () => void;
}

function AddTickerModal({ existingTickers, onAdd, onClose }: AddTickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ symbol: string; name: string; type: string }>>([]);
  const [searching, setSearching] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await marketApi.searchAssets(query.trim());
        setResults(
          (data.assets ?? []).filter(
            (a) => !existingTickers.includes(a.symbol)
          ).slice(0, 8)
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query, existingTickers]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSelect(symbol: string, name: string) {
    try {
      const quote = await marketApi.getQuote(symbol);
      const item: WatchlistItem = {
        ticker: symbol,
        companyName: name,
        price: quote.price,
        change: quote.change,
        changePct: quote.changePct,
        volume: quote.volume,
        high52: quote.high52,
        low52: quote.low52,
      };
      onAdd(item);
    } catch {
      // Fallback with minimal data if quote fails
      onAdd({
        ticker: symbol,
        companyName: name,
        price: 0,
        change: 0,
        changePct: 0,
        volume: 0,
      });
    }
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-surface-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-base font-serif font-semibold text-off-white">
            Add to Watchlist
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6560] pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker or company…"
              className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-sm font-sans text-off-white placeholder-[#6b6560] focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Results */}
          {searching ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="rounded-lg border border-border bg-surface-2 overflow-hidden max-h-64 overflow-y-auto">
              {results.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => handleSelect(asset.symbol, asset.name)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-mono font-semibold text-off-white">
                      {asset.symbol}
                    </p>
                    <p className="text-xs font-sans text-[#a09a8e] truncate max-w-[180px]">
                      {asset.name}
                    </p>
                  </div>
                  <span className="text-xs font-sans text-[#6b6560] uppercase">
                    {asset.type}
                  </span>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <p className="text-sm font-sans text-center text-[#6b6560] py-4">
              No results for "{query}"
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

interface WatchlistProps {
  className?: string;
}

export function Watchlist({ className = '' }: WatchlistProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist, setSelectedTicker } =
    useTrading();

  // Map of ticker -> live price data
  const [livePrices, setLivePrices] = useState<Map<string, LivePrice>>(new Map());
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial prices for all watchlist tickers
  useEffect(() => {
    if (watchlist.length === 0) return;

    const tickers = watchlist.map((w) => w.ticker);
    Promise.all(
      tickers.map((symbol) =>
        marketApi.getQuote(symbol).then((q) => ({ symbol, q })).catch(() => null)
      )
    ).then((results) => {
      setLivePrices((prev) => {
        const next = new Map(prev);
        results.forEach((r) => {
          if (r) {
            next.set(r.symbol, {
              price: r.q.price,
              change: r.q.change,
              changePct: r.q.changePct,
              volume: r.q.volume,
            });
          }
        });
        return next;
      });
    });
  }, [watchlist.map((w) => w.ticker).join(',')]);

  // Socket.IO real-time price updates
  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Subscribe to all current watchlist tickers
      watchlist.forEach((w) => {
        socket.emit('subscribe:ticker', w.ticker);
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('price:update', (data: { symbol: string; price: number; change: number; changePct: number }) => {
      setLivePrices((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.symbol);
        next.set(data.symbol, {
          price: data.price,
          change: data.change,
          changePct: data.changePct,
          volume: existing?.volume ?? 0,
        });
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // When watchlist changes, subscribe new tickers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socketConnected) return;
    watchlist.forEach((w) => {
      socket.emit('subscribe:ticker', w.ticker);
    });
  }, [watchlist, socketConnected]);

  const handleAdd = useCallback(
    (item: WatchlistItem) => {
      addToWatchlist(item);
    },
    [addToWatchlist]
  );

  const handleRemove = useCallback(
    (ticker: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeFromWatchlist(ticker);
    },
    [removeFromWatchlist]
  );

  // Merge live prices with watchlist items
  const liveItems = watchlist.map((item) => {
    const live = livePrices.get(item.ticker);
    if (live) {
      return { ...item, price: live.price, change: live.change, changePct: live.changePct, volume: live.volume };
    }
    return item;
  });

  const existingTickers = watchlist.map((i) => i.ticker);

  return (
    <>
      <div
        className={`flex flex-col rounded-xl border border-border bg-surface overflow-hidden ${className}`}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-[#c9a84c]" />
            <h2 className="text-base font-serif font-semibold text-off-white">
              Watchlist
            </h2>
            {liveItems.length > 0 && (
              <span className="text-xs font-sans text-[#6b6560]">
                ({liveItems.length})
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-surface-2 text-xs font-sans font-medium text-[#a09a8e] hover:text-gold hover:border-gold/30 transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>

        {/* ── Column Headers ───────────────────────────────── */}
        {liveItems.length > 0 && (
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 border-b border-border bg-surface-2">
            <span className="text-2xs font-sans font-semibold uppercase tracking-wider text-[#4a4540]">
              Symbol
            </span>
            <span className="text-2xs font-sans font-semibold uppercase tracking-wider text-[#4a4540] text-right">
              Price
            </span>
            <span className="text-2xs font-sans font-semibold uppercase tracking-wider text-[#4a4540] text-right min-w-[64px]">
              Change
            </span>
          </div>
        )}

        {/* ── Rows ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {liveItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Eye size={36} className="text-[#2a2a2a] mb-3" />
              <p className="text-sm font-sans font-medium text-[#a09a8e]">
                Your watchlist is empty
              </p>
              <p className="text-xs font-sans text-[#6b6560] mt-1 mb-4">
                Add stocks to monitor prices and jump into trades.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 h-8 px-3 rounded-md border border-gold/30 bg-gold/5 text-xs font-sans font-semibold text-gold hover:bg-gold/10 transition-colors"
              >
                <Plus size={13} />
                Add your first stock
              </button>
            </div>
          ) : (
            liveItems.map((item, idx) => {
              const isPos = item.change >= 0;
              const changeColor = isPos ? '#3d9e6e' : '#c0453a';
              const isHovered = hoveredTicker === item.ticker;

              return (
                <div
                  key={item.ticker}
                  onClick={() => setSelectedTicker(item.ticker)}
                  onMouseEnter={() => setHoveredTicker(item.ticker)}
                  onMouseLeave={() => setHoveredTicker(null)}
                  className={`
                    relative grid grid-cols-[1fr_auto_auto] gap-x-4 items-center
                    px-4 py-3 cursor-pointer transition-colors
                    ${idx !== liveItems.length - 1 ? 'border-b border-border' : ''}
                    ${isHovered ? 'bg-surface-2' : 'hover:bg-surface-2'}
                  `}
                >
                  {/* Ticker + Company */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-off-white">
                        {item.ticker}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[#6b6560] truncate max-w-[120px] mt-0.5">
                      {item.companyName}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-off-white">
                      {item.price > 0 ? formatCurrency(item.price) : '—'}
                    </p>
                    <p className="text-2xs font-sans text-[#4a4540] mt-0.5">
                      Vol {formatVolume(item.volume)}
                    </p>
                  </div>

                  {/* Change */}
                  <div className="text-right min-w-[64px]">
                    <div
                      className="flex items-center justify-end gap-0.5 text-xs font-mono font-semibold"
                      style={{ color: changeColor }}
                    >
                      {isPos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                      {isPos ? '+' : ''}{item.changePct.toFixed(2)}%
                    </div>
                    <p
                      className="text-2xs font-mono mt-0.5"
                      style={{ color: changeColor }}
                    >
                      {isPos ? '+' : ''}{formatCurrency(item.change)}
                    </p>
                  </div>

                  {/* Remove button (hover) */}
                  {isHovered && (
                    <button
                      onClick={(e) => handleRemove(item.ticker, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#6b6560] hover:text-[#c0453a] hover:bg-surface-3 transition-colors"
                      aria-label={`Remove ${item.ticker} from watchlist`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer: live/reconnecting indicator ─────────── */}
        {liveItems.length > 0 && (
          <div className="px-4 py-2 border-t border-border flex items-center gap-1.5">
            {socketConnected ? (
              <>
                <Wifi size={12} className="text-[#3d9e6e]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3d9e6e] animate-pulse" />
                <span className="text-2xs font-sans font-semibold text-[#3d9e6e]">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-2xs font-sans font-semibold text-amber-400">RECONNECTING</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Add Ticker Modal ──────────────────────────────── */}
      {showAddModal && (
        <AddTickerModal
          existingTickers={existingTickers}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}

export default Watchlist;
