/* ============================================================
   Obsidian Capital — Stock Screener Page
   Real asset universe fetched from the API.
   ============================================================ */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '@/services/api';
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

// (No mock stock data — populated from API in the component below)

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

  // Mobile filter drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // "Save Screen" inline form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormName, setSaveFormName] = useState('');

  // Row-click toast
  const [toast, setToast] = useState<string | null>(null);

  // ── Fetch top 100 active assets + quotes ─────────────────

  const { data: searchData, isLoading: assetsLoading } = useQuery({
    queryKey: ['screener-assets'],
    queryFn: async () => {
      // Fetch a set of popular large-cap tickers via search
      const popular = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'JPM', 'V', 'XOM',
                       'UNH', 'JNJ', 'WMT', 'PG', 'MA', 'BAC', 'HD', 'PFE', 'COST', 'ABBV',
                       'KO', 'PEP', 'NFLX', 'INTC', 'AMD', 'DIS', 'QCOM', 'IBM', 'GE', 'F'];
      const quotes = await Promise.all(
        popular.map((sym) =>
          marketApi.getQuote(sym).then((q) => ({
            ticker:    sym,
            company:   sym,
            sector:    'N/A',
            price:     q.price,
            changePct: q.changePct,
            marketCap: 0,
            pe:        null as number | null,
            volume:    q.volume / 1_000_000,
          } as Stock)).catch(() => null)
        )
      );
      return quotes.filter((q): q is Stock => q !== null);
    },
    staleTime: 60_000,
  });

  const allApiStocks: Stock[] = searchData ?? [];

  // ── Filter logic ────────────────────────────────────────────

  const filteredStocks = useMemo(() => {
    return allApiStocks.filter((s) => {
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

      {/* ── Mobile filter bottom sheet ──────────────────────── */}
      {showMobileFilters && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="md:hidden bottom-sheet z-50 overflow-hidden" style={{ maxHeight: '85vh' }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gold" />
                <h2 className="text-sm font-semibold text-off-white">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-gold/20 text-gold rounded text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="tap-target p-1.5 rounded-md text-off-white/40 hover:text-off-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-5" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {/* Sectors */}
              <div>
                <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">Sector</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SECTORS.map((sector) => {
                    const checked = draftFilters.sectors.has(sector);
                    return (
                      <button
                        key={sector}
                        onClick={() => toggleSector(sector)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          checked
                            ? 'bg-gold/15 text-gold border-gold/30'
                            : 'bg-surface-3 text-off-white/50 border-border'
                        }`}
                      >
                        {sector}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Market Cap */}
              <div>
                <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">Market Cap</label>
                <div className="flex flex-wrap gap-2">
                  {MARKET_CAP_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setDraftFilters((p) => ({ ...p, marketCap: id }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        draftFilters.marketCap === id
                          ? 'bg-gold/15 text-gold border-gold/30'
                          : 'bg-surface-3 text-off-white/50 border-border'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* P/E Range */}
              <div>
                <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">P/E Range</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="text-2xs text-off-white/30 mb-1">Min</div>
                    <input type="number" min={0} placeholder="0" value={draftFilters.peMin}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, peMin: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xs text-off-white/30 mb-1">Max</div>
                    <input type="number" min={0} placeholder="∞" value={draftFilters.peMax}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, peMax: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                </div>
              </div>
              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">Price Range</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="text-2xs text-off-white/30 mb-1">Min $</div>
                    <input type="number" min={0} placeholder="0" value={draftFilters.priceMin}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, priceMin: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xs text-off-white/30 mb-1">Max $</div>
                    <input type="number" min={0} placeholder="∞" value={draftFilters.priceMax}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, priceMax: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                </div>
              </div>
              {/* Min Volume */}
              <div>
                <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">Min Volume (M)</label>
                <input type="number" min={0} placeholder="e.g. 10" value={draftFilters.volumeMin}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, volumeMin: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors" />
              </div>
              {/* Actions */}
              <div className="flex gap-3 pt-2 pb-4">
                <button
                  onClick={() => { applyFilters(); setShowMobileFilters(false); }}
                  className="flex-1 py-3 bg-gold text-black font-bold text-sm rounded-lg transition-colors hover:bg-gold-light"
                >
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-3 text-off-white/50 hover:text-off-white text-sm border border-border rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Page Title */}
        <div className="mb-4 md:mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-off-white mb-1">Stock Screener</h1>
          <p className="text-xs md:text-sm text-off-white/40">Filter and discover opportunities across the market</p>
        </div>

        {/* Mobile: Filters button + sort chips */}
        <div className="md:hidden mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="tap-target flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-off-white/70 hover:border-gold/40 hover:text-off-white transition-colors"
            >
              <Filter size={14} className="text-gold" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-gold text-obsidian rounded text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span className="text-xs text-off-white/40 ml-auto">
              {sortedStocks.length} of {allApiStocks.length} stocks
            </span>
          </div>
          {/* Sort chips — horizontal scroll */}
          <div className="overflow-x-auto scrollbar-hidden -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {([
                { key: 'marketCap' as SortKey, label: 'Mkt Cap' },
                { key: 'changePct' as SortKey, label: 'Change %' },
                { key: 'price'     as SortKey, label: 'Price' },
                { key: 'volume'    as SortKey, label: 'Volume' },
                { key: 'pe'        as SortKey, label: 'P/E' },
                { key: 'ticker'    as SortKey, label: 'Ticker' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                    sortKey === key
                      ? 'bg-gold/15 text-gold border-gold/30'
                      : 'bg-surface-2 text-off-white/50 border-border'
                  }`}
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Filter Sidebar — desktop only ───────────────── */}
          <aside className="hidden md:block w-72 flex-shrink-0 bg-surface-2 border border-border rounded-xl p-5 space-y-6 sticky top-6">

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

            {/* Results header — desktop */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <span className="text-sm text-off-white/60">
                Showing{' '}
                <span className="text-off-white font-semibold">{sortedStocks.length}</span>
                {' '}of{' '}
                <span className="text-off-white font-semibold">{allApiStocks.length}</span>
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

            {/* ── Mobile card list ──────────────────────────── */}
            <div className="md:hidden space-y-2">
              {sortedStocks.length === 0 ? (
                <div className="card p-8 text-center text-off-white/30 text-sm">
                  No stocks match filters.{' '}
                  <button onClick={resetFilters} className="text-gold hover:underline ml-1">Reset</button>
                </div>
              ) : (
                sortedStocks.map((stock) => {
                  const isGain = stock.changePct >= 0;
                  return (
                    <button
                      key={stock.ticker}
                      onClick={() => handleRowClick(stock.ticker)}
                      className="w-full text-left mobile-card"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <span className="font-mono font-bold text-gold text-sm">{stock.ticker}</span>
                          <span className="text-xs text-off-white/50 ml-2">{stock.company}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono text-sm text-off-white">${stock.price.toFixed(2)}</p>
                          <p className={`font-mono text-xs font-semibold ${isGain ? 'text-gain' : 'text-loss'}`}>
                            {isGain ? '+' : ''}{stock.changePct.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-3 border border-border text-off-white/40">{stock.sector}</span>
                        <span className="text-xs text-off-white/30">{fmtMarketCap(stock.marketCap)}</span>
                        {stock.pe !== null && <span className="text-xs text-off-white/30">P/E {stock.pe.toFixed(1)}</span>}
                        <span className="text-xs text-off-white/30">{stock.volume.toFixed(1)}M vol</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* ── Desktop table ─────────────────────────────── */}
            <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
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

            <p className="text-xs text-off-white/20 mt-3 text-right hidden md:block">
              Click any row to load the ticker into the trading panel. Data is simulated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
