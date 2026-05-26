/* ============================================================
   Obsidian Capital — Watchlist
   Watchlist panel with real-time mock price updates, add/remove
   tickers, and click-to-trade integration.
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
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { WatchlistItem } from '@/types';
import { useTrading } from '@/contexts/TradingContext';

// ── Mock searchable universe ──────────────────────────────────

const SEARCH_UNIVERSE: WatchlistItem[] = [
  { ticker: 'AAPL',  companyName: 'Apple Inc.',              price: 189.84, change:  2.14,  changePct:  1.14, volume: 55_000_000 },
  { ticker: 'MSFT',  companyName: 'Microsoft Corp.',         price: 418.32, change:  5.88,  changePct:  1.43, volume: 22_000_000 },
  { ticker: 'NVDA',  companyName: 'NVIDIA Corp.',            price: 875.40, change: 22.10,  changePct:  2.59, volume: 48_000_000 },
  { ticker: 'AMZN',  companyName: 'Amazon.com Inc.',         price: 198.72, change: -1.44,  changePct: -0.72, volume: 34_000_000 },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.',           price: 171.96, change:  1.08,  changePct:  0.63, volume: 24_000_000 },
  { ticker: 'TSLA',  companyName: 'Tesla Inc.',              price: 248.42, change:  8.32,  changePct:  3.46, volume: 82_450_000 },
  { ticker: 'META',  companyName: 'Meta Platforms',          price: 571.28, change: -4.12,  changePct: -0.72, volume: 14_300_000 },
  { ticker: 'JPM',   companyName: 'JPMorgan Chase',          price: 224.58, change:  1.24,  changePct:  0.55, volume:  9_120_000 },
  { ticker: 'V',     companyName: 'Visa Inc.',               price: 289.34, change: -0.88,  changePct: -0.30, volume:  6_450_000 },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway B',   price: 452.80, change:  2.08,  changePct:  0.46, volume:  3_850_000 },
  { ticker: 'GLD',   companyName: 'SPDR Gold Trust ETF',    price: 238.40, change:  1.84,  changePct:  0.78, volume: 10_200_000 },
  { ticker: 'SPY',   companyName: 'SPDR S&P 500 ETF',       price: 531.20, change:  3.44,  changePct:  0.65, volume: 71_000_000 },
  { ticker: 'QQQ',   companyName: 'Invesco QQQ Trust',      price: 468.12, change:  6.28,  changePct:  1.36, volume: 42_000_000 },
  { ticker: 'XOM',   companyName: 'Exxon Mobil Corp.',      price: 114.62, change:  0.98,  changePct:  0.86, volume: 18_000_000 },
  { ticker: 'UNH',   companyName: 'UnitedHealth Group',     price: 318.50, change: -2.80,  changePct: -0.87, volume:  4_200_000 },
  { ticker: 'WMT',   companyName: 'Walmart Inc.',           price: 93.48,  change:  0.56,  changePct:  0.60, volume: 21_000_000 },
  { ticker: 'LLY',   companyName: 'Eli Lilly and Co.',      price: 889.20, change: 12.40,  changePct:  1.41, volume:  3_800_000 },
  { ticker: 'COST',  companyName: 'Costco Wholesale',       price: 928.14, change: -6.22,  changePct: -0.67, volume:  2_900_000 },
];

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(v: number, compact = false): string {
  if (compact && v >= 1000) {
    return `$${(v / 1000).toFixed(1)}K`;
  }
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

// Simulate a small price tick
function tickPrice(item: WatchlistItem): WatchlistItem {
  const maxTick = item.price * 0.003; // up to 0.3% per tick
  const delta = (Math.random() - 0.49) * maxTick;
  const newPrice = Math.max(0.01, item.price + delta);
  const newChange = item.change + delta;
  const basePrice = newPrice - newChange;
  const newChangePct = basePrice > 0 ? (newChange / basePrice) * 100 : 0;
  return {
    ...item,
    price: parseFloat(newPrice.toFixed(2)),
    change: parseFloat(newChange.toFixed(2)),
    changePct: parseFloat(newChangePct.toFixed(2)),
  };
}

// ── Sub-components ────────────────────────────────────────────

interface AddTickerModalProps {
  existingTickers: string[];
  onAdd: (item: WatchlistItem) => void;
  onClose: () => void;
}

function AddTickerModal({ existingTickers, onAdd, onClose }: AddTickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WatchlistItem[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    setResults(
      SEARCH_UNIVERSE.filter(
        (s) =>
          !existingTickers.includes(s.ticker) &&
          (s.ticker.toLowerCase().includes(q) ||
            s.companyName.toLowerCase().includes(q))
      ).slice(0, 8)
    );
  }, [query, existingTickers]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
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
          {results.length > 0 ? (
            <div className="rounded-lg border border-border bg-surface-2 overflow-hidden max-h-64 overflow-y-auto">
              {results.map((stock) => (
                <button
                  key={stock.ticker}
                  onClick={() => { onAdd(stock); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-mono font-semibold text-off-white">
                      {stock.ticker}
                    </p>
                    <p className="text-xs font-sans text-[#a09a8e] truncate max-w-[160px]">
                      {stock.companyName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-off-white">
                      {formatCurrency(stock.price)}
                    </p>
                    <p
                      className="text-xs font-sans"
                      style={{ color: stock.change >= 0 ? '#3d9e6e' : '#c0453a' }}
                    >
                      {stock.change >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </p>
                  </div>
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

  const [liveItems, setLiveItems] = useState<WatchlistItem[]>(watchlist);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);

  // Keep liveItems in sync when context watchlist changes
  useEffect(() => {
    setLiveItems((prev) => {
      // Merge: if already in liveItems keep live price, otherwise use context
      const prevMap = new Map(prev.map((i) => [i.ticker, i]));
      return watchlist.map((item) => prevMap.get(item.ticker) ?? item);
    });
  }, [watchlist]);

  // Simulate price ticks every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveItems((prev) => prev.map(tickPrice));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const existingTickers = liveItems.map((i) => i.ticker);

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
                      {formatCurrency(item.price)}
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

        {/* ── Footer: live indicator ───────────────────────── */}
        {liveItems.length > 0 && (
          <div className="px-4 py-2 border-t border-border flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3d9e6e] animate-pulse" />
            <span className="text-2xs font-sans text-[#4a4540]">
              Live prices · updates every 3s
            </span>
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
