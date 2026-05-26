/* ============================================================
   Obsidian Capital — TradePanel
   Right sidebar trading panel (320px). Includes ticker search,
   buy/sell toggle, shares input, live commission preview, and
   order execution with confirmation modal.
   ============================================================ */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  X,
  Minus,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { CommissionTier, OrderSide } from '@/types';
import { useTrading } from '@/contexts/TradingContext';
import { useAuth } from '@/contexts/AuthContext';
import { CommissionCalculator } from './CommissionCalculator';
import { OrderConfirmModal } from './OrderConfirmModal';

// ── Mock Stock Data ───────────────────────────────────────────

interface StockInfo {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePct: number;
}

const MOCK_STOCKS: StockInfo[] = [
  { ticker: 'AAPL', companyName: 'Apple Inc.', price: 189.84, change: 2.14, changePct: 1.14 },
  { ticker: 'MSFT', companyName: 'Microsoft Corp.', price: 418.32, change: 5.88, changePct: 1.43 },
  { ticker: 'NVDA', companyName: 'NVIDIA Corp.', price: 875.40, change: 22.10, changePct: 2.59 },
  { ticker: 'AMZN', companyName: 'Amazon.com Inc.', price: 198.72, change: -1.44, changePct: -0.72 },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.', price: 171.96, change: 1.08, changePct: 0.63 },
  { ticker: 'META', companyName: 'Meta Platforms', price: 571.28, change: -4.12, changePct: -0.72 },
  { ticker: 'TSLA', companyName: 'Tesla Inc.', price: 248.42, change: 8.32, changePct: 3.46 },
  { ticker: 'JPM', companyName: 'JPMorgan Chase', price: 224.58, change: 1.24, changePct: 0.55 },
  { ticker: 'V', companyName: 'Visa Inc.', price: 289.34, change: -0.88, changePct: -0.30 },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway B', price: 452.80, change: 2.08, changePct: 0.46 },
  { ticker: 'GLD', companyName: 'SPDR Gold Trust ETF', price: 238.40, change: 1.84, changePct: 0.78 },
  { ticker: 'SPY', companyName: 'SPDR S&P 500 ETF', price: 531.20, change: 3.44, changePct: 0.65 },
  { ticker: 'QQQ', companyName: 'Invesco QQQ Trust', price: 468.12, change: 6.28, changePct: 1.36 },
  { ticker: 'BRK.A', companyName: 'Berkshire Hathaway A', price: 677400.0, change: 2400.0, changePct: 0.36 },
  { ticker: 'UNH', companyName: 'UnitedHealth Group', price: 318.50, change: -2.80, changePct: -0.87 },
  { ticker: 'XOM', companyName: 'Exxon Mobil Corp.', price: 114.62, change: 0.98, changePct: 0.86 },
];

function findStock(ticker: string): StockInfo | undefined {
  return MOCK_STOCKS.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );
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

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function formatLargeCurrency(v: number): string {
  if (v >= 1_000_000) {
    return `$${(v / 1_000_000).toFixed(2)}M`;
  }
  if (v >= 1_000) {
    return `$${(v / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(v);
}

// ── Component ─────────────────────────────────────────────────

interface TradePanelProps {
  onClose?: () => void;
  className?: string;
}

export function TradePanel({ onClose, className = '' }: TradePanelProps) {
  const { user } = useAuth();
  const {
    selectedTicker,
    setSelectedTicker,
    submitOrder,
  } = useTrading();

  const tier: CommissionTier = user?.tier ?? 'standard';
  const buyingPower = user?.buyingPower ?? 0;

  // ── Local State ───────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeStock, setActiveStock] = useState<StockInfo | null>(null);
  const [side, setSide] = useState<OrderSide>('buy');
  const [sharesInput, setSharesInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Sync selectedTicker from context ─────────────────────

  useEffect(() => {
    if (selectedTicker) {
      const stock = findStock(selectedTicker);
      if (stock) {
        setActiveStock(stock);
        setSearchQuery('');
        setShowDropdown(false);
        setSharesInput('');
        setIsSuccess(false);
      }
    }
  }, [selectedTicker]);

  // ── Search ────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchStocks(searchQuery));
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
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

  // ── Shares helpers ────────────────────────────────────────

  const shares = Math.max(0, parseInt(sharesInput, 10) || 0);
  const price = activeStock?.price ?? 0;

  function incrementShares() {
    setSharesInput((prev) => String((parseInt(prev, 10) || 0) + 1));
  }

  function decrementShares() {
    setSharesInput((prev) => String(Math.max(0, (parseInt(prev, 10) || 0) - 1)));
  }

  function handleSharesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9]/g, '');
    setSharesInput(v);
  }

  // ── Select stock from dropdown ────────────────────────────

  function selectStock(stock: StockInfo) {
    setActiveStock(stock);
    setSelectedTicker(stock.ticker);
    setSearchQuery('');
    setShowDropdown(false);
    setSharesInput('');
    setIsSuccess(false);
  }

  // ── Execute order ─────────────────────────────────────────

  const canExecute = !!activeStock && shares > 0;

  async function handleConfirmOrder() {
    if (!activeStock) return;
    await submitOrder(
      {
        ticker: activeStock.ticker,
        side,
        orderType: 'market',
        shares,
      },
      tier
    );
    setShowModal(false);
    setIsSuccess(true);
    setSuccessMsg(
      `${side === 'buy' ? 'Bought' : 'Sold'} ${shares.toLocaleString()} share${shares !== 1 ? 's' : ''} of ${activeStock.ticker}`
    );
    setSharesInput('');
    setTimeout(() => setIsSuccess(false), 4000);
  }

  // ── Render ────────────────────────────────────────────────

  const isBuy = side === 'buy';

  return (
    <>
      <aside
        className={`flex flex-col h-full bg-surface border-l border-border ${className}`}
        style={{ width: 320 }}
        aria-label="Trade panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-serif font-semibold text-off-white tracking-wide">
            Trade
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors"
              aria-label="Close trade panel"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* ── Ticker Search ──────────────────────────── */}
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6560] pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder="Search ticker or company…"
                className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-sm font-sans text-off-white placeholder-[#6b6560] focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-surface-2 shadow-surface-lg z-20 overflow-hidden">
                {searchResults.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => selectStock(stock)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left"
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
                        {stock.change >= 0 ? '+' : ''}
                        {stock.changePct.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Selected Stock Info ────────────────────── */}
          {activeStock ? (
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-mono font-bold text-off-white">
                    {activeStock.ticker}
                  </p>
                  <p className="text-xs font-sans text-[#a09a8e] mt-0.5">
                    {activeStock.companyName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-mono font-semibold text-off-white">
                    {formatCurrency(activeStock.price)}
                  </p>
                  <div
                    className="flex items-center justify-end gap-1 mt-0.5"
                    style={{
                      color: activeStock.change >= 0 ? '#3d9e6e' : '#c0453a',
                    }}
                  >
                    {activeStock.change >= 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    <span className="text-xs font-sans">
                      {activeStock.change >= 0 ? '+' : ''}
                      {formatCurrency(activeStock.change)} (
                      {activeStock.change >= 0 ? '+' : ''}
                      {activeStock.changePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-sm font-sans text-[#6b6560]">
                Search for a stock to begin trading
              </p>
            </div>
          )}

          {/* ── Buy / Sell Toggle ──────────────────────── */}
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 gap-0.5">
            <button
              onClick={() => setSide('buy')}
              className="flex-1 h-9 rounded-md text-sm font-sans font-semibold transition-colors"
              style={
                isBuy
                  ? { backgroundColor: '#c9a84c', color: '#0a0a0a' }
                  : { backgroundColor: 'transparent', color: '#6b6560' }
              }
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className="flex-1 h-9 rounded-md text-sm font-sans font-semibold transition-colors"
              style={
                !isBuy
                  ? { backgroundColor: '#c0453a', color: '#f0ede8' }
                  : { backgroundColor: 'transparent', color: '#6b6560' }
              }
            >
              Sell
            </button>
          </div>

          {/* ── Order Type ────────────────────────────── */}
          <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-surface-2">
            <span className="text-xs font-sans text-[#a09a8e]">Order Type</span>
            <div className="flex items-center gap-1 text-xs font-sans text-[#a09a8e]">
              <span>Market Order</span>
              <ChevronDown size={12} className="opacity-50" />
            </div>
          </div>

          {/* ── Shares Input ──────────────────────────── */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#a09a8e] mb-1.5">
              Number of Shares
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementShares}
                disabled={shares <= 0}
                className="w-9 h-9 rounded-md border border-border bg-surface-2 flex items-center justify-center text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors disabled:opacity-30"
              >
                <Minus size={14} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={sharesInput}
                onChange={handleSharesChange}
                placeholder="0"
                className="flex-1 h-9 text-center rounded-md border border-border bg-surface-2 text-sm font-mono font-semibold text-off-white placeholder-[#4a4540] focus:outline-none focus:border-gold transition-colors"
              />
              <button
                onClick={incrementShares}
                className="w-9 h-9 rounded-md border border-border bg-surface-2 flex items-center justify-center text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* ── Commission Calculator ─────────────────── */}
          {activeStock && (
            <CommissionCalculator
              shares={shares}
              price={price}
              tier={tier}
              side={side}
              compact
            />
          )}

          {/* ── Success State ─────────────────────────── */}
          {isSuccess && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[#3d9e6e]/30 bg-[#3d9e6e]/10">
              <CheckCircle2 size={16} className="text-[#3d9e6e] shrink-0" />
              <p className="text-sm font-sans text-[#3d9e6e]">{successMsg}</p>
            </div>
          )}
        </div>

        {/* ── Footer: Buying Power + Execute ────────────── */}
        <div className="shrink-0 px-4 py-4 border-t border-border space-y-3">
          {/* Buying power */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-[#6b6560]">Buying Power</span>
            <span className="text-sm font-mono font-semibold text-[#a09a8e]">
              {formatLargeCurrency(buyingPower)}
            </span>
          </div>

          {/* Execute button */}
          <button
            onClick={() => setShowModal(true)}
            disabled={!canExecute}
            className="w-full h-11 rounded-lg text-sm font-sans font-bold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={
              canExecute
                ? {
                    backgroundColor: isBuy ? '#c9a84c' : '#c0453a',
                    color: isBuy ? '#0a0a0a' : '#f0ede8',
                  }
                : {
                    backgroundColor: '#1a1a1a',
                    color: '#4a4540',
                  }
            }
          >
            {!activeStock
              ? 'Select a Security'
              : shares === 0
              ? 'Enter Shares'
              : `${isBuy ? 'Buy' : 'Sell'} ${shares.toLocaleString()} Share${shares !== 1 ? 's' : ''}`}
          </button>
        </div>
      </aside>

      {/* ── Confirm Modal ─────────────────────────────────── */}
      {activeStock && (
        <OrderConfirmModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmOrder}
          ticker={activeStock.ticker}
          company={activeStock.companyName}
          side={side}
          shares={shares}
          price={price}
          tier={tier}
        />
      )}
    </>
  );
}

export default TradePanel;
