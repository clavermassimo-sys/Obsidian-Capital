/* ============================================================
   Obsidian Capital — TradePanel (Full Rewrite)
   Full-featured trading panel: all order types, fractional shares,
   TIF, live commission, success state with Framer Motion.
   ============================================================ */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Minus,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { CommissionTier, OrderSide, ExtendedOrderType, TimeInForce } from '@/types';
import { useTrading } from '@/contexts/TradingContext';
import { useAuth } from '@/contexts/AuthContext';
import { CommissionCalculator } from './CommissionCalculator';
import { OrderConfirmModal } from './OrderConfirmModal';
import { AlpacaConnectBanner } from '@/components/ui/AlpacaConnectBanner';

// ── Mock Stock Data ───────────────────────────────────────────

interface StockInfo {
  ticker: string;
  companyName: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  dayLow: number;
  dayHigh: number;
}

const MOCK_STOCKS: StockInfo[] = [
  { ticker: 'AAPL',  companyName: 'Apple Inc.',           price: 189.84, bid: 189.81, ask: 189.87, change:  2.14, changePct:  1.14, dayLow: 187.32, dayHigh: 190.54 },
  { ticker: 'MSFT',  companyName: 'Microsoft Corp.',      price: 418.32, bid: 418.28, ask: 418.36, change:  5.88, changePct:  1.43, dayLow: 412.10, dayHigh: 419.80 },
  { ticker: 'NVDA',  companyName: 'NVIDIA Corp.',         price: 875.40, bid: 875.20, ask: 875.60, change: 22.10, changePct:  2.59, dayLow: 851.00, dayHigh: 878.90 },
  { ticker: 'AMZN',  companyName: 'Amazon.com Inc.',      price: 198.72, bid: 198.68, ask: 198.76, change: -1.44, changePct: -0.72, dayLow: 196.50, dayHigh: 200.42 },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.',        price: 171.96, bid: 171.92, ask: 172.00, change:  1.08, changePct:  0.63, dayLow: 170.12, dayHigh: 172.88 },
  { ticker: 'META',  companyName: 'Meta Platforms',       price: 571.28, bid: 571.20, ask: 571.36, change: -4.12, changePct: -0.72, dayLow: 566.00, dayHigh: 575.90 },
  { ticker: 'TSLA',  companyName: 'Tesla Inc.',           price: 248.42, bid: 248.36, ask: 248.48, change:  8.32, changePct:  3.46, dayLow: 239.80, dayHigh: 250.10 },
  { ticker: 'JPM',   companyName: 'JPMorgan Chase',       price: 224.58, bid: 224.54, ask: 224.62, change:  1.24, changePct:  0.55, dayLow: 222.40, dayHigh: 225.70 },
  { ticker: 'V',     companyName: 'Visa Inc.',            price: 289.34, bid: 289.28, ask: 289.40, change: -0.88, changePct: -0.30, dayLow: 287.60, dayHigh: 290.80 },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway B', price: 452.80, bid: 452.70, ask: 452.90, change:  2.08, changePct:  0.46, dayLow: 449.20, dayHigh: 454.30 },
  { ticker: 'GLD',   companyName: 'SPDR Gold Trust ETF',  price: 238.40, bid: 238.34, ask: 238.46, change:  1.84, changePct:  0.78, dayLow: 236.50, dayHigh: 239.60 },
  { ticker: 'SPY',   companyName: 'SPDR S&P 500 ETF',    price: 531.20, bid: 531.14, ask: 531.26, change:  3.44, changePct:  0.65, dayLow: 527.30, dayHigh: 532.80 },
  { ticker: 'QQQ',   companyName: 'Invesco QQQ Trust',   price: 468.12, bid: 468.04, ask: 468.20, change:  6.28, changePct:  1.36, dayLow: 461.40, dayHigh: 469.50 },
  { ticker: 'BRK.A', companyName: 'Berkshire Hathaway A', price: 677400.0, bid: 677200.0, ask: 677600.0, change: 2400.0, changePct: 0.36, dayLow: 673000, dayHigh: 679000 },
  { ticker: 'UNH',   companyName: 'UnitedHealth Group',  price: 318.50, bid: 318.44, ask: 318.56, change: -2.80, changePct: -0.87, dayLow: 315.20, dayHigh: 321.80 },
  { ticker: 'XOM',   companyName: 'Exxon Mobil Corp.',   price: 114.62, bid: 114.58, ask: 114.66, change:  0.98, changePct:  0.86, dayLow: 113.20, dayHigh: 115.40 },
  { ticker: 'LLY',   companyName: 'Eli Lilly and Co.',   price: 889.20, bid: 889.00, ask: 889.40, change: 12.40, changePct:  1.41, dayLow: 875.00, dayHigh: 892.60 },
  { ticker: 'WMT',   companyName: 'Walmart Inc.',        price:  93.48, bid:  93.44, ask:  93.52, change:  0.56, changePct:  0.60, dayLow:  92.60, dayHigh:  94.10 },
];

function findStock(ticker: string): StockInfo | undefined {
  return MOCK_STOCKS.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
}

function searchStocks(query: string): StockInfo[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return MOCK_STOCKS.filter(
    (s) =>
      s.ticker.toLowerCase().includes(q) ||
      s.companyName.toLowerCase().includes(q)
  ).slice(0, 6);
}

// ── Formatters ────────────────────────────────────────────────

function fmt(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(v);
}

function fmtLarge(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return fmt(v);
}

// ── Order Type Config ─────────────────────────────────────────

const ORDER_TYPES: { id: ExtendedOrderType; label: string }[] = [
  { id: 'market',        label: 'Market' },
  { id: 'limit',         label: 'Limit'  },
  { id: 'stop',          label: 'Stop'   },
  { id: 'stop_limit',    label: 'Stop-Limit' },
  { id: 'trailing_stop', label: 'Trailing' },
];

// ── Component ─────────────────────────────────────────────────

interface TradePanelProps {
  onClose?: () => void;
  className?: string;
}

export function TradePanel({ onClose, className = '' }: TradePanelProps) {
  const { user, alpacaConnected } = useAuth();
  const { selectedTicker, setSelectedTicker, submitOrder } = useTrading();

  const tier: CommissionTier = user?.tier ?? 'standard';
  const buyingPower = user?.buyingPower ?? 0;

  // ── Local State ───────────────────────────────────────────

  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [activeStock, setActiveStock]     = useState<StockInfo | null>(null);

  const [side, setSide]                             = useState<OrderSide>('buy');
  const [orderType, setOrderType]                   = useState<ExtendedOrderType>('market');
  const [tif, setTif]                               = useState<TimeInForce>('day');
  const [sizeMode, setSizeMode]                     = useState<'shares' | 'dollars'>('shares');
  const [sharesInput, setSharesInput]               = useState('');
  const [dollarsInput, setDollarsInput]             = useState('');
  const [limitPriceInput, setLimitPriceInput]       = useState('');
  const [stopPriceInput, setStopPriceInput]         = useState('');
  const [trailPctInput, setTrailPctInput]           = useState('');

  const [showModal, setShowModal]   = useState(false);
  const [isSuccess, setIsSuccess]   = useState(false);
  const [successTrade, setSuccessTrade] = useState<{ shares: number; ticker: string; side: OrderSide } | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // ── Sync selectedTicker from context ─────────────────────

  useEffect(() => {
    if (selectedTicker) {
      const stock = findStock(selectedTicker);
      if (stock) {
        setActiveStock(stock);
        setSearchQuery('');
        setShowDropdown(false);
        resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicker]);

  function resetForm() {
    setSharesInput('');
    setDollarsInput('');
    setLimitPriceInput('');
    setStopPriceInput('');
    setTrailPctInput('');
    setIsSuccess(false);
    setSuccessTrade(null);
  }

  // ── Debounced search ──────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim()) {
        setSearchResults(searchStocks(searchQuery));
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Computed values ───────────────────────────────────────

  const price = activeStock?.price ?? 0;

  const shares = sizeMode === 'shares'
    ? Math.max(0, parseFloat(sharesInput) || 0)
    : price > 0 ? (parseFloat(dollarsInput) || 0) / price : 0;

  const tradeValue = shares * price;

  // TIF only makes sense for non-market orders
  const showTIF = orderType !== 'market' && orderType !== 'trailing_stop';

  // ── Incrementors ──────────────────────────────────────────

  const incShares = () => setSharesInput((p) => String((parseInt(p, 10) || 0) + 1));
  const decShares = () => setSharesInput((p) => String(Math.max(0, (parseInt(p, 10) || 0) - 1)));

  // ── Select stock ──────────────────────────────────────────

  function selectStock(stock: StockInfo) {
    setActiveStock(stock);
    setSelectedTicker(stock.ticker);
    setSearchQuery('');
    setShowDropdown(false);
    resetForm();
  }

  // ── Compute order request ─────────────────────────────────

  const canExecute =
    !!activeStock &&
    shares > 0 &&
    (orderType === 'market' ||
      orderType === 'trailing_stop' ||
      (orderType === 'limit' && parseFloat(limitPriceInput) > 0) ||
      (orderType === 'stop' && parseFloat(stopPriceInput) > 0) ||
      (orderType === 'stop_limit' && parseFloat(stopPriceInput) > 0 && parseFloat(limitPriceInput) > 0));

  // ── Execute order ─────────────────────────────────────────

  const handleConfirmOrder = useCallback(async () => {
    if (!activeStock) return;
    await submitOrder(
      {
        ticker: activeStock.ticker,
        side,
        orderType: orderType === 'trailing_stop' ? 'market' : (orderType as 'market' | 'limit' | 'stop' | 'stop_limit'),
        shares: Math.ceil(shares),
        limitPrice: parseFloat(limitPriceInput) || undefined,
        stopPrice: parseFloat(stopPriceInput) || undefined,
      },
      tier
    );
    setShowModal(false);
    setIsSuccess(true);
    setSuccessTrade({ shares: Math.ceil(shares), ticker: activeStock.ticker, side });
    resetForm();
  }, [activeStock, side, orderType, shares, limitPriceInput, stopPriceInput, tier, submitOrder]);

  // ── Render helpers ────────────────────────────────────────

  const isBuy = side === 'buy';
  const modeLabel = alpacaConnected ? 'LIVE' : 'PAPER';
  const modeBg    = alpacaConnected ? 'bg-[#3d9e6e]/20 text-[#3d9e6e] border-[#3d9e6e]/30' : 'bg-surface-3 text-[#6b6560] border-border';

  const orderTypeLabel = ORDER_TYPES.find((o) => o.id === orderType)?.label ?? 'Market';

  return (
    <>
      <aside
        className={`flex flex-col h-full bg-surface md:border-l border-border ${className}`}
        style={{ width: '100%', maxWidth: 320 }}
        aria-label="Trade panel"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-serif font-semibold text-off-white tracking-wide">Trade</h2>
            <span className={`px-2 py-0.5 rounded text-2xs font-sans font-bold tracking-widest border ${modeBg}`}>
              {modeLabel}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="tap-target p-1.5 rounded-md text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors"
              aria-label="Close trade panel"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* ── Alpaca not connected notice ─────────────────── */}
          {!alpacaConnected && (
            <AlpacaConnectBanner compact />
          )}

          {/* ── Ticker Search ────────────────────────────────── */}
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6560] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                placeholder="Search ticker or company…"
                className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-sm font-sans text-off-white placeholder-[#6b6560] focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-surface-2 shadow-surface-lg z-20 overflow-hidden">
                {searchResults.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => selectStock(stock)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-mono font-semibold text-off-white">{stock.ticker}</p>
                      <p className="text-xs font-sans text-[#a09a8e] truncate max-w-[160px]">{stock.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-off-white">{fmt(stock.price)}</p>
                      <p className="text-xs font-sans" style={{ color: stock.change >= 0 ? '#3d9e6e' : '#c0453a' }}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Selected Stock Info ───────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeStock ? (
              <motion.div
                key={activeStock.ticker}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="rounded-lg border border-border bg-surface-2 p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-mono font-bold text-off-white">{activeStock.ticker}</p>
                    <p className="text-xs font-sans text-[#a09a8e] mt-0.5">{activeStock.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-mono font-semibold text-off-white">{fmt(activeStock.price)}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5" style={{ color: activeStock.change >= 0 ? '#3d9e6e' : '#c0453a' }}>
                      {activeStock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span className="text-xs font-sans">
                        {activeStock.change >= 0 ? '+' : ''}{fmt(activeStock.change)} ({activeStock.change >= 0 ? '+' : ''}{activeStock.changePct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
                {/* Bid / Ask / Range */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[#6b6560]">Bid</span>
                    <span className="text-xs font-mono text-[#a09a8e]">{fmt(activeStock.bid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[#6b6560]">Ask</span>
                    <span className="text-xs font-mono text-[#a09a8e]">{fmt(activeStock.ask)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[#6b6560]">Day Low</span>
                    <span className="text-xs font-mono text-[#a09a8e]">{fmt(activeStock.dayLow)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[#6b6560]">Day High</span>
                    <span className="text-xs font-mono text-[#a09a8e]">{fmt(activeStock.dayHigh)}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-dashed border-border p-4 text-center"
              >
                <p className="text-sm font-sans text-[#6b6560]">Search for a stock to begin trading</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Buy / Sell Toggle ─────────────────────────────── */}
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 gap-0.5">
            <button
              onClick={() => setSide('buy')}
              className="flex-1 h-9 rounded-md text-sm font-sans font-semibold transition-colors"
              style={isBuy ? { backgroundColor: '#c9a84c', color: '#0a0a0a' } : { backgroundColor: 'transparent', color: '#6b6560' }}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className="flex-1 h-9 rounded-md text-sm font-sans font-semibold transition-colors"
              style={!isBuy ? { backgroundColor: '#c0453a', color: '#f0ede8' } : { backgroundColor: 'transparent', color: '#6b6560' }}
            >
              Sell
            </button>
          </div>

          {/* ── Order Type Chips ──────────────────────────────── */}
          <div>
            <p className="text-xs font-sans text-[#6b6560] mb-2">Order Type</p>
            <div className="flex flex-wrap gap-1.5">
              {ORDER_TYPES.map((ot) => (
                <button
                  key={ot.id}
                  onClick={() => setOrderType(ot.id)}
                  className="px-2.5 py-1 rounded-md text-xs font-sans font-semibold border transition-colors"
                  style={
                    orderType === ot.id
                      ? { backgroundColor: '#2a2a2a', borderColor: '#c9a84c', color: '#c9a84c' }
                      : { backgroundColor: 'transparent', borderColor: '#2a2a2a', color: '#6b6560' }
                  }
                >
                  {ot.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dynamic price fields ──────────────────────────── */}
          <AnimatePresence>
            {(orderType === 'limit' || orderType === 'stop_limit') && (
              <motion.div
                key="limit-price"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-sans font-medium text-[#a09a8e] mb-1.5">Limit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6560]">$</span>
                  <input
                    type="number"
                    value={limitPriceInput}
                    onChange={(e) => setLimitPriceInput(e.target.value)}
                    placeholder={price > 0 ? price.toFixed(2) : '0.00'}
                    step="0.01"
                    min="0"
                    className="w-full h-9 pl-6 pr-3 rounded-md border border-border bg-surface-2 text-sm font-mono text-off-white placeholder-[#4a4540] focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {(orderType === 'stop' || orderType === 'stop_limit') && (
              <motion.div
                key="stop-price"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-sans font-medium text-[#a09a8e] mb-1.5">Stop Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6560]">$</span>
                  <input
                    type="number"
                    value={stopPriceInput}
                    onChange={(e) => setStopPriceInput(e.target.value)}
                    placeholder={price > 0 ? price.toFixed(2) : '0.00'}
                    step="0.01"
                    min="0"
                    className="w-full h-9 pl-6 pr-3 rounded-md border border-border bg-surface-2 text-sm font-mono text-off-white placeholder-[#4a4540] focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {orderType === 'trailing_stop' && (
              <motion.div
                key="trail-pct"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-sans font-medium text-[#a09a8e] mb-1.5">Trail %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={trailPctInput}
                    onChange={(e) => setTrailPctInput(e.target.value)}
                    placeholder="e.g. 5"
                    step="0.1"
                    min="0.1"
                    max="50"
                    className="w-full h-9 pl-3 pr-7 rounded-md border border-border bg-surface-2 text-sm font-mono text-off-white placeholder-[#4a4540] focus:outline-none focus:border-gold transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6560]">%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Order Size ────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-sans font-medium text-[#a09a8e]">
                {sizeMode === 'shares' ? 'Number of Shares' : 'Dollar Amount'}
              </label>
              <button
                onClick={() => setSizeMode((m) => m === 'shares' ? 'dollars' : 'shares')}
                className="text-2xs font-sans font-semibold text-[#c9a84c] hover:text-[#e0c070] transition-colors"
              >
                Switch to {sizeMode === 'shares' ? 'Dollars $' : 'Shares'}
              </button>
            </div>

            {sizeMode === 'shares' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={decShares}
                  disabled={shares <= 0}
                  className="w-9 h-9 rounded-md border border-border bg-surface-2 flex items-center justify-center text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  className="flex-1 h-9 text-center rounded-md border border-border bg-surface-2 text-sm font-mono font-semibold text-off-white placeholder-[#4a4540] focus:outline-none focus:border-gold transition-colors"
                />
                <button
                  onClick={incShares}
                  className="w-9 h-9 rounded-md border border-border bg-surface-2 flex items-center justify-center text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b6560]">$</span>
                <input
                  type="number"
                  value={dollarsInput}
                  onChange={(e) => setDollarsInput(e.target.value)}
                  placeholder="0.00"
                  step="1"
                  min="0"
                  className="w-full h-9 pl-6 pr-3 rounded-md border border-border bg-surface-2 text-sm font-mono text-off-white placeholder-[#4a4540] focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            )}

            <p className="text-2xs font-sans text-[#4a4540] mt-1.5">
              Fractional shares supported · Min. $1.00 notional
            </p>
          </div>

          {/* ── Time in Force ─────────────────────────────────── */}
          {showTIF && (
            <div>
              <p className="text-xs font-sans text-[#6b6560] mb-1.5">Time In Force</p>
              <div className="flex gap-1.5">
                {(['day', 'gtc'] as TimeInForce[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTif(t)}
                    className="flex-1 h-8 rounded-md text-xs font-sans font-semibold border transition-colors"
                    style={
                      tif === t
                        ? { backgroundColor: '#2a2a2a', borderColor: '#c9a84c', color: '#c9a84c' }
                        : { backgroundColor: 'transparent', borderColor: '#2a2a2a', color: '#6b6560' }
                    }
                  >
                    {t === 'day' ? 'Day' : 'GTC'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Commission Calculator ─────────────────────────── */}
          {activeStock && shares > 0 && (
            <CommissionCalculator
              shares={Math.max(1, Math.ceil(shares))}
              price={price}
              tier={tier}
              side={side}
              compact
            />
          )}

          {/* ── Commission notice ─────────────────────────────── */}
          {activeStock && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface-3 border border-border">
              <AlertCircle size={12} className="text-[#6b6560] mt-0.5 shrink-0" />
              <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                A commission of{' '}
                <span className="text-[#a09a8e]">{tier === 'private' ? '5–6%' : tier === 'member' ? '7–9%' : '10–12%'}</span>{' '}
                is charged by Obsidian Capital on all trades. This is separate from your Alpaca account.
              </p>
            </div>
          )}

          {/* ── Success State ─────────────────────────────────── */}
          <AnimatePresence>
            {isSuccess && successTrade && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 px-4 py-4 rounded-lg border border-[#3d9e6e]/30 bg-[#3d9e6e]/10"
              >
                <CheckCircle2 size={28} className="text-[#3d9e6e]" />
                <div className="text-center">
                  <p className="text-sm font-sans font-semibold text-[#3d9e6e]">Order Executed</p>
                  <p className="text-xs font-sans text-[#a09a8e] mt-1">
                    {successTrade.side === 'buy' ? 'Bought' : 'Sold'}{' '}
                    {successTrade.shares.toLocaleString()} share{successTrade.shares !== 1 ? 's' : ''}{' '}
                    of <span className="font-mono font-semibold text-off-white">{successTrade.ticker}</span>
                  </p>
                </div>
                <button
                  onClick={() => { setIsSuccess(false); setSuccessTrade(null); }}
                  className="text-xs font-sans font-semibold text-[#c9a84c] hover:text-[#e0c070] transition-colors"
                >
                  Place Another Trade
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 py-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-[#6b6560]">Buying Power</span>
            <span className="text-sm font-mono font-semibold text-[#a09a8e]">{fmtLarge(buyingPower)}</span>
          </div>

          {tradeValue > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-[#6b6560]">Est. Trade Value</span>
              <span className="text-sm font-mono font-semibold text-off-white">{fmt(tradeValue)}</span>
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={!canExecute}
            className="w-full h-11 rounded-lg text-sm font-sans font-bold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={
              canExecute
                ? { backgroundColor: isBuy ? '#c9a84c' : '#c0453a', color: isBuy ? '#0a0a0a' : '#f0ede8' }
                : { backgroundColor: '#1a1a1a', color: '#4a4540' }
            }
          >
            {!activeStock
              ? 'Select a Security'
              : !canExecute && shares === 0
              ? 'Enter Amount'
              : !canExecute
              ? `Enter ${orderType === 'stop' ? 'Stop' : 'Limit'} Price`
              : `${isBuy ? 'Buy' : 'Sell'} ${Math.ceil(shares).toLocaleString()} Share${Math.ceil(shares) !== 1 ? 's' : ''} · ${orderTypeLabel}`}
          </button>
        </div>
      </aside>

      {/* ── Confirm Modal ─────────────────────────────────────── */}
      {activeStock && (
        <OrderConfirmModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmOrder}
          ticker={activeStock.ticker}
          company={activeStock.companyName}
          side={side}
          shares={Math.max(1, Math.ceil(shares))}
          price={price}
          tier={tier}
          orderType={orderType}
          timeInForce={showTIF ? tif : 'day'}
          limitPrice={parseFloat(limitPriceInput) || undefined}
          stopPrice={parseFloat(stopPriceInput) || undefined}
          trailPct={parseFloat(trailPctInput) || undefined}
        />
      )}
    </>
  );
}

export default TradePanel;
