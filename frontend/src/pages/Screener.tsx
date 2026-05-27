/* ============================================================
   Obsidian Capital — Stock Screener Page
   ============================================================ */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  BookmarkPlus,
} from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';

// ── Types ─────────────────────────────────────────────────────

type SortKey = 'ticker' | 'company' | 'sector' | 'price' | 'changePct' | 'marketCap' | 'pe' | 'volume';
type SortDir = 'asc' | 'desc';
type MarketCapFilter = 'any' | 'small' | 'mid' | 'large' | 'mega';

interface Stock {
  ticker:    string;
  company:   string;
  sector:    string;
  price:     number;
  changePct: number;
  marketCap: number; // in billions
  pe:        number | null;
  volume:    number; // in millions
}

interface Filters {
  sectors:   Set<string>;
  marketCap: MarketCapFilter;
  peMin:     string;
  peMax:     string;
  priceMin:  string;
  priceMax:  string;
  volumeMin: string;
}

// ── Mock Stock Universe (25 stocks) ───────────────────────────

const MOCK_STOCKS: Stock[] = [
  { ticker: 'AAPL',  company: 'Apple Inc',           sector: 'Technology',              price: 178.50, changePct:  1.24, marketCap: 2940, pe: 28.4, volume: 62.3 },
  { ticker: 'MSFT',  company: 'Microsoft Corp',       sector: 'Technology',              price: 415.20, changePct:  0.87, marketCap: 3080, pe: 35.2, volume: 21.1 },
  { ticker: 'GOOGL', company: 'Google (Alphabet)',    sector: 'Technology',              price: 172.30, changePct:  1.56, marketCap: 2180, pe: 24.8, volume: 18.9 },
  { ticker: 'AMZN',  company: 'Amazon.com',           sector: 'Consumer Discretionary',  price: 198.40, changePct:  2.31, marketCap: 2090, pe: 43.1, volume: 35.7 },
  { ticker: 'NVDA',  company: 'NVIDIA Corp',          sector: 'Technology',              price: 875.60, changePct:  3.42, marketCap: 2150, pe: 65.3, volume: 45.8 },
  { ticker: 'META',  company: 'Meta Platforms',       sector: 'Communication Services',  price: 521.30, changePct:  1.87, marketCap: 1350, pe: 26.7, volume: 14.2 },
  { ticker: 'TSLA',  company: 'Tesla Inc',            sector: 'Consumer Discretionary',  price: 248.90, changePct: -1.23, marketCap:  790, pe: 68.4, volume: 88.2 },
  { ticker: 'UNH',   company: 'UnitedHealth Grp',     sector: 'Healthcare',              price: 582.40, changePct: -0.45, marketCap:  540, pe: 22.1, volume:  3.4 },
  { ticker: 'JNJ',   company: 'Johnson & Johnson',    sector: 'Healthcare',              price: 158.30, changePct:  0.23, marketCap:  381, pe: 15.8, volume:  7.2 },
  { ticker: 'V',     company: 'Visa Inc',             sector: 'Finance',                 price: 282.10, changePct:  0.67, marketCap:  576, pe: 30.4, volume:  7.1 },
  { ticker: 'MA',    company: 'Mastercard',           sector: 'Finance',                 price: 472.80, changePct:  0.89, marketCap:  436, pe: 35.7, volume:  3.2 },
  { ticker: 'JPM',   company: 'JPMorgan Chase',       sector: 'Finance',                 price: 215.40, changePct: -0.34, marketCap:  614, pe: 12.4, volume: 10.8 },
  { ticker: 'BAC',   company: 'Bank of America',      sector: 'Finance',                 price:  38.70, changePct: -0.52, marketCap:  305, pe: 11.3, volume: 42.6 },
  { ticker: 'XOM',   company: 'Exxon Mobil',          sector: 'Energy',                  price: 110.20, changePct:  1.12, marketCap:  440, pe: 14.2, volume: 16.3 },
  { ticker: 'CVX',   company: 'Chevron Corp',         sector: 'Energy',                  price: 153.80, changePct:  0.78, marketCap:  280, pe: 13.8, volume:  9.7 },
  { ticker: 'PFE',   company: 'Pfizer Inc',           sector: 'Healthcare',              price:  27.40, changePct: -0.89, marketCap:  155, pe:  8.9, volume: 54.3 },
  { ticker: 'HD',    company: 'Home Depot',           sector: 'Consumer Discretionary',  price: 368.90, changePct:  0.56, marketCap:  366, pe: 22.4, volume:  3.8 },
  { ticker: 'WMT',   company: 'Walmart Inc',          sector: 'Consumer Staples',        price:  72.30, changePct:  0.34, marketCap:  580, pe: 29.1, volume: 16.7 },
  { ticker: 'PEP',   company: 'PepsiCo Inc',          sector: 'Consumer Staples',        price: 172.40, changePct: -0.23, marketCap:  237, pe: 24.3, volume:  5.4 },
  { ticker: 'KO',    company: 'Coca-Cola Co',         sector: 'Consumer Staples',        price:  62.80, changePct:  0.45, marketCap:  271, pe: 23.7, volume:  9.8 },
  { ticker: 'DIS',   company: 'Walt Disney Co',       sector: 'Communication Services',  price: 112.30, changePct: -0.67, marketCap:  206, pe: 42.3, volume: 12.1 },
  { ticker: 'NFLX',  company: 'Netflix Inc',          sector: 'Communication Services',  price: 712.40, changePct:  2.14, marketCap:  306, pe: 44.7, volume:  4.1 },
  { ticker: 'INTC',  company: 'Intel Corp',           sector: 'Technology',              price:  32.10, changePct: -1.45, marketCap:  136, pe: 18.2, volume: 41.3 },
  { ticker: 'AMD',   company: 'Advanced Micro',       sector: 'Technology',              price: 164.80, changePct:  2.87, marketCap:  267, pe: 38.9, volume: 42.7 },
];

const ALL_SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Energy',
  'Consumer Discretionary',
  'Consumer Staples',
  'Communication Services',
  'Industrials',
];

const MARKET_CAP_OPTIONS: { id: MarketCapFilter; label: string }[] = [
  { id: 'any',   label: 'Any' },
  { id: 'small', label: 'Small (<$2B)' },
  { id: 'mid',   label: 'Mid ($2–10B)' },
  { id: 'large', label: 'Large ($10–100B)' },
  { id: 'mega',  label: 'Mega (>$100B)' },
];

const SAVED_SCREENS_INITIAL = [
  {
    name: 'Tech Large Cap',
    filters: { sectors: new Set(['Technology']), marketCap: 'mega' as MarketCapFilter, peMin: '', peMax: '', priceMin: '', priceMax: '', volumeMin: '' },
  },
  {
    name: 'Value Plays',
    filters: { sectors: new Set<string>(), marketCap: 'any' as MarketCapFilter, peMin: '', peMax: '20', priceMin: '', priceMax: '', volumeMin: '' },
  },
];

const DEFAULT_FILTERS: Filters = {
  sectors:   new Set<string>(),
  marketCap: 'any',
  peMin:     '',
  peMax:     '',
  priceMin:  '',
  priceMax:  '',
  volumeMin: '',
};

function cloneFilters(f: Filters): Filters {
  return { ...f, sectors: new Set(f.sectors) };
}

// Market cap in billions
function matchesMarketCap(capBillions: number, filter: MarketCapFilter): boolean {
  switch (filter) {
    case 'any':   return true;
    case 'small': return capBillions < 2;
    case 'mid':   return capBillions >= 2    && capBillions < 10;
    case 'large': return capBillions >= 10   && capBillions < 100;
    case 'mega':  return capBillions >= 100;
  }
}

function fmtMarketCap(billions: number): string {
  if (billions >= 1000) return `$${(billions / 1000).toFixed(2)}T`;
  return `$${billions.toFixed(0)}B`;
}

// ── Column Header ─────────────────────────────────────────────

interface ColHeaderProps {
  col:     SortKey;
  label:   string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort:  (k: SortKey) => void;
  align?:  'left' | 'right';
}

function ColHeader({ col, label, sortKey, sortDir, onSort, align = 'left' }: ColHeaderProps) {
  const active = sortKey === col;
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors ${
        active ? 'text-gold' : 'text-off-white/40 hover:text-off-white/70'
      } ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc'
            ? <ChevronUp size={12} className="text-gold" />
            : <ChevronDown size={12} className="text-gold" />
        ) : (
          <ChevronDown size={12} className="opacity-30" />
        )}
      </span>
    </th>
  );
}

// ── Screener Page ─────────────────────────────────────────────

export default function Screener() {
  const { setSelectedTicker } = useTrading();

  const [draftFilters,   setDraftFilters]   = useState<Filters>(cloneFilters(DEFAULT_FILTERS));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(cloneFilters(DEFAULT_FILTERS));

  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [savedScreens, setSavedScreens] = useState(SAVED_SCREENS_INITIAL);

  // "Save Screen" inline form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormName, setSaveFormName] = useState('');

  // Row-click toast
  const [toast, setToast] = useState<string | null>(null);

  // ── Filter logic ────────────────────────────────────────────

  const filteredStocks = useMemo(() => {
    return MOCK_STOCKS.filter((s) => {
      if (appliedFilters.sectors.size > 0 && !appliedFilters.sectors.has(s.sector)) return false;
      if (!matchesMarketCap(s.marketCap, appliedFilters.marketCap)) return false;
      if (appliedFilters.peMin !== '') {
        const min = parseFloat(appliedFilters.peMin);
        if (!isNaN(min) && (s.pe === null || s.pe < min)) return false;
      }
      if (appliedFilters.peMax !== '') {
        const max = parseFloat(appliedFilters.peMax);
        if (!isNaN(max) && (s.pe === null || s.pe > max)) return false;
      }
      if (appliedFilters.priceMin !== '') {
        const min = parseFloat(appliedFilters.priceMin);
        if (!isNaN(min) && s.price < min) return false;
      }
      if (appliedFilters.priceMax !== '') {
        const max = parseFloat(appliedFilters.priceMax);
        if (!isNaN(max) && s.price > max) return false;
      }
      if (appliedFilters.volumeMin !== '') {
        const min = parseFloat(appliedFilters.volumeMin);
        if (!isNaN(min) && s.volume < min) return false;
      }
      return true;
    });
  }, [appliedFilters]);

  // ── Sort logic ──────────────────────────────────────────────

  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;
      switch (sortKey) {
        case 'ticker':    aVal = a.ticker;    bVal = b.ticker;    break;
        case 'company':   aVal = a.company;   bVal = b.company;   break;
        case 'sector':    aVal = a.sector;    bVal = b.sector;    break;
        case 'price':     aVal = a.price;     bVal = b.price;     break;
        case 'changePct': aVal = a.changePct; bVal = b.changePct; break;
        case 'marketCap': aVal = a.marketCap; bVal = b.marketCap; break;
        case 'pe':        aVal = a.pe;        bVal = b.pe;        break;
        case 'volume':    aVal = a.volume;    bVal = b.volume;    break;
        default: return 0;
      }
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredStocks, sortKey, sortDir]);

  // ── Handlers ────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleSector = (sector: string) => {
    setDraftFilters((prev) => {
      const next = new Set(prev.sectors);
      if (next.has(sector)) next.delete(sector); else next.add(sector);
      return { ...prev, sectors: next };
    });
  };

  const applyFilters = () => {
    setAppliedFilters(cloneFilters(draftFilters));
  };

  const resetFilters = () => {
    const empty = cloneFilters(DEFAULT_FILTERS);
    setDraftFilters(empty);
    setAppliedFilters(cloneFilters(DEFAULT_FILTERS));
  };

  const handleRowClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setToast(`Loaded ${ticker}`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSaveScreen = () => {
    const name = saveFormName.trim();
    if (!name) return;
    setSavedScreens((prev) => [
      ...prev,
      { name, filters: cloneFilters(appliedFilters) },
    ]);
    setSaveFormName('');
    setShowSaveForm(false);
  };

  const handleLoadScreen = (name: string) => {
    const screen = savedScreens.find((s) => s.name === name);
    if (!screen) return;
    const f = cloneFilters(screen.filters);
    setDraftFilters(f);
    setAppliedFilters(cloneFilters(screen.filters));
  };

  const activeFilterCount =
    appliedFilters.sectors.size +
    (appliedFilters.marketCap !== 'any' ? 1 : 0) +
    (appliedFilters.peMin !== '' || appliedFilters.peMax !== '' ? 1 : 0) +
    (appliedFilters.priceMin !== '' || appliedFilters.priceMax !== '' ? 1 : 0) +
    (appliedFilters.volumeMin !== '' ? 1 : 0);

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-surface-2 border border-gold/40 rounded-lg text-sm text-gold font-medium shadow-gold-md animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 py-8">

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-off-white mb-1">Stock Screener</h1>
          <p className="text-sm text-off-white/40">Filter and discover opportunities across the market</p>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Filter Sidebar ──────────────────────────────── */}
          <aside className="w-72 flex-shrink-0 bg-surface-2 border border-border rounded-xl p-5 space-y-6 sticky top-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gold" />
                <h2 className="text-sm font-semibold text-off-white">Filters</h2>
              </div>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-gold/20 text-gold rounded text-xs font-semibold">
                  {activeFilterCount} active
                </span>
              )}
            </div>

            {/* Sectors */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                Sector
              </label>
              <div className="space-y-2">
                {ALL_SECTORS.map((sector) => {
                  const checked = draftFilters.sectors.has(sector);
                  return (
                    <label key={sector} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleSector(sector)}>
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          checked ? 'bg-gold border-gold' : 'border-border bg-surface-3 group-hover:border-gold/40'
                        }`}
                      >
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs transition-colors ${checked ? 'text-off-white' : 'text-off-white/50 group-hover:text-off-white/80'}`}>
                        {sector}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Market Cap */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                Market Cap
              </label>
              <div className="space-y-2">
                {MARKET_CAP_OPTIONS.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setDraftFilters((p) => ({ ...p, marketCap: id }))}>
                    <div
                      className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                        draftFilters.marketCap === id ? 'border-gold' : 'border-border bg-surface-3 group-hover:border-gold/40'
                      }`}
                    >
                      {draftFilters.marketCap === id && <div className="w-2 h-2 rounded-full bg-gold" />}
                    </div>
                    <span className={`text-xs transition-colors ${draftFilters.marketCap === id ? 'text-off-white' : 'text-off-white/50 group-hover:text-off-white/80'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* P/E Range */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                P/E Range
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-2xs text-off-white/30 mb-1">Min</div>
                  <input
                    type="number" min={0} placeholder="0"
                    value={draftFilters.peMin}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, peMin: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-2xs text-off-white/30 mb-1">Max</div>
                  <input
                    type="number" min={0} placeholder="∞"
                    value={draftFilters.peMax}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, peMax: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                Price Range
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-2xs text-off-white/30 mb-1">Min $</div>
                  <input
                    type="number" min={0} placeholder="0"
                    value={draftFilters.priceMin}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, priceMin: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-2xs text-off-white/30 mb-1">Max $</div>
                  <input
                    type="number" min={0} placeholder="∞"
                    value={draftFilters.priceMax}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, priceMax: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Min Volume */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                Min Volume (M)
              </label>
              <input
                type="number" min={0} placeholder="e.g. 10"
                value={draftFilters.volumeMin}
                onChange={(e) => setDraftFilters((p) => ({ ...p, volumeMin: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={applyFilters}
                className="w-full py-2 bg-gold text-black font-bold text-sm rounded transition-colors hover:bg-gold-light"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2 text-off-white/50 hover:text-off-white text-sm transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Saved Screens */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2">
                Saved Screens
              </label>
              <select
                defaultValue=""
                onChange={(e) => { if (e.target.value) handleLoadScreen(e.target.value); }}
                className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white focus:outline-none focus:border-gold/50 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select a saved screen…</option>
                {savedScreens.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </aside>

          {/* ── Results Area ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-off-white/60">
                Showing{' '}
                <span className="text-off-white font-semibold">{sortedStocks.length}</span>
                {' '}of{' '}
                <span className="text-off-white font-semibold">{MOCK_STOCKS.length}</span>
                {' '}stocks
              </span>

              {/* Save Screen button / inline form */}
              {showSaveForm ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <input
                    type="text"
                    autoFocus
                    value={saveFormName}
                    onChange={(e) => setSaveFormName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScreen(); if (e.key === 'Escape') { setShowSaveForm(false); setSaveFormName(''); } }}
                    placeholder="Screen name…"
                    className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-sm text-off-white placeholder-off-white/30 focus:outline-none focus:border-gold/50 w-40 transition-colors"
                  />
                  <button
                    onClick={handleSaveScreen}
                    disabled={!saveFormName.trim()}
                    className="px-3 py-1.5 bg-gold text-black text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-gold-light transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSaveForm(false); setSaveFormName(''); }}
                    className="p-1.5 text-off-white/40 hover:text-off-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-off-white/50 hover:text-gold hover:border-gold/30 rounded-lg text-sm transition-colors"
                >
                  <BookmarkPlus size={14} />
                  Save Screen
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <ColHeader col="ticker"    label="Ticker"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <ColHeader col="company"   label="Company"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <ColHeader col="sector"    label="Sector"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <ColHeader col="price"     label="Price"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="changePct" label="Change %" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="marketCap" label="Mkt Cap"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="pe"        label="P/E"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="volume"    label="Volume"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStocks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-off-white/30 text-sm">
                          No stocks match the current filters.{' '}
                          <button onClick={resetFilters} className="text-gold hover:underline ml-1">Reset filters</button>
                        </td>
                      </tr>
                    ) : (
                      sortedStocks.map((stock, idx) => {
                        const isGain = stock.changePct >= 0;
                        return (
                          <tr
                            key={stock.ticker}
                            onClick={() => handleRowClick(stock.ticker)}
                            className={`border-b border-border/50 cursor-pointer transition-colors duration-100 hover:bg-surface-2 ${
                              idx % 2 === 0 ? 'bg-surface' : 'bg-surface-2'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-semibold text-gold">{stock.ticker}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-off-white/80 truncate max-w-[160px] block">{stock.company}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 border border-border text-off-white/50 whitespace-nowrap">{stock.sector}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white tabular-nums">${stock.price.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-mono text-sm font-semibold tabular-nums ${isGain ? 'text-gain' : 'text-loss'}`}>
                                {isGain ? '+' : ''}{stock.changePct.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white/70 tabular-nums">{fmtMarketCap(stock.marketCap)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white/70 tabular-nums">
                                {stock.pe !== null ? stock.pe.toFixed(1) : <span className="text-off-white/25">—</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white/70 tabular-nums">{stock.volume.toFixed(1)}M</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-off-white/20 mt-3 text-right">
              Click any row to load the ticker into the trading panel. Data is simulated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
