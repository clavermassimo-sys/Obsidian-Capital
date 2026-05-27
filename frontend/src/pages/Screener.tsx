/* ============================================================
   Obsidian Capital — Stock Screener Page
   ============================================================ */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Save,
  Filter,
} from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { formatCurrency, formatMarketCap } from '@/utils/format';

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
  marketCap: number;
  pe:        number | null;
  volume:    number;
}

interface Filters {
  sectors:         Set<string>;
  marketCap:       MarketCapFilter;
  peMin:           string;
  peMax:           string;
  priceMin:        string;
  priceMax:        string;
  volumeMin:       string;
}

// ── Mock Stock Universe ────────────────────────────────────────

const MOCK_STOCKS: Stock[] = [
  { ticker: 'AAPL',  company: 'Apple Inc.',                  sector: 'Technology',              price: 189.84,  changePct:  1.24, marketCap: 2_950_000_000_000, pe:  31.2, volume:  52_840_000 },
  { ticker: 'MSFT',  company: 'Microsoft Corp.',             sector: 'Technology',              price: 418.32,  changePct:  0.87, marketCap: 3_110_000_000_000, pe:  36.8, volume:  21_320_000 },
  { ticker: 'GOOGL', company: 'Alphabet Inc.',               sector: 'Communication Services',  price: 171.96,  changePct:  2.13, marketCap: 2_140_000_000_000, pe:  24.6, volume:  19_450_000 },
  { ticker: 'AMZN',  company: 'Amazon.com Inc.',             sector: 'Consumer Discretionary',  price: 198.72,  changePct:  1.58, marketCap: 2_090_000_000_000, pe:  43.1, volume:  38_760_000 },
  { ticker: 'NVDA',  company: 'NVIDIA Corp.',                sector: 'Technology',              price: 875.40,  changePct:  3.44, marketCap: 2_150_000_000_000, pe:  64.2, volume:  41_230_000 },
  { ticker: 'META',  company: 'Meta Platforms Inc.',         sector: 'Communication Services',  price: 571.28,  changePct: -0.72, marketCap: 1_450_000_000_000, pe:  28.4, volume:  14_320_000 },
  { ticker: 'TSLA',  company: 'Tesla Inc.',                  sector: 'Consumer Discretionary',  price: 248.42,  changePct:  3.46, marketCap:   793_000_000_000, pe:  73.5, volume:  82_450_000 },
  { ticker: 'BRK.B', company: 'Berkshire Hathaway B',        sector: 'Finance',                 price: 452.80,  changePct:  0.46, marketCap:   988_000_000_000, pe:  21.3, volume:   3_850_000 },
  { ticker: 'UNH',   company: 'UnitedHealth Group',          sector: 'Healthcare',              price: 523.45,  changePct: -1.32, marketCap:   483_000_000_000, pe:  18.9, volume:   3_220_000 },
  { ticker: 'JNJ',   company: 'Johnson & Johnson',           sector: 'Healthcare',              price: 157.82,  changePct: -0.44, marketCap:   380_000_000_000, pe:  14.6, volume:   6_140_000 },
  { ticker: 'V',     company: 'Visa Inc.',                   sector: 'Finance',                 price: 289.34,  changePct: -0.30, marketCap:   597_000_000_000, pe:  31.2, volume:   6_450_000 },
  { ticker: 'MA',    company: 'Mastercard Inc.',             sector: 'Finance',                 price: 487.16,  changePct:  0.54, marketCap:   452_000_000_000, pe:  34.8, volume:   3_970_000 },
  { ticker: 'HD',    company: 'Home Depot Inc.',             sector: 'Consumer Discretionary',  price: 362.54,  changePct:  0.28, marketCap:   360_000_000_000, pe:  22.7, volume:   4_380_000 },
  { ticker: 'PFE',   company: 'Pfizer Inc.',                 sector: 'Healthcare',              price:  27.43,  changePct: -1.84, marketCap:   154_000_000_000, pe:   9.4, volume:  41_780_000 },
  { ticker: 'BAC',   company: 'Bank of America Corp.',       sector: 'Finance',                 price:  40.18,  changePct:  1.08, marketCap:   317_000_000_000, pe:  12.4, volume:  36_120_000 },
  { ticker: 'XOM',   company: 'Exxon Mobil Corp.',           sector: 'Energy',                  price: 118.64,  changePct: -0.62, marketCap:   470_000_000_000, pe:  13.8, volume:  15_640_000 },
  { ticker: 'ABBV',  company: 'AbbVie Inc.',                 sector: 'Healthcare',              price: 174.28,  changePct:  0.91, marketCap:   307_000_000_000, pe:  18.1, volume:   6_530_000 },
  { ticker: 'CVX',   company: 'Chevron Corp.',               sector: 'Energy',                  price: 156.32,  changePct: -0.45, marketCap:   286_000_000_000, pe:  14.2, volume:   8_740_000 },
  { ticker: 'MRK',   company: 'Merck & Co. Inc.',            sector: 'Healthcare',              price: 108.64,  changePct:  0.68, marketCap:   275_000_000_000, pe:  15.6, volume:   9_820_000 },
  { ticker: 'COST',  company: 'Costco Wholesale Corp.',      sector: 'Consumer Staples',        price: 912.48,  changePct:  1.34, marketCap:   404_000_000_000, pe:  52.3, volume:   2_340_000 },
  { ticker: 'PEP',   company: 'PepsiCo Inc.',                sector: 'Consumer Staples',        price: 162.38,  changePct: -0.18, marketCap:   223_000_000_000, pe:  22.1, volume:   4_780_000 },
  { ticker: 'KO',    company: 'Coca-Cola Co.',               sector: 'Consumer Staples',        price:  62.14,  changePct:  0.22, marketCap:   268_000_000_000, pe:  23.8, volume:  13_460_000 },
  { ticker: 'WMT',   company: 'Walmart Inc.',                sector: 'Consumer Staples',        price:  81.42,  changePct:  0.75, marketCap:   655_000_000_000, pe:  38.4, volume:  11_230_000 },
  { ticker: 'DIS',   company: 'Walt Disney Co.',             sector: 'Communication Services',  price:  92.78,  changePct: -2.14, marketCap:   168_000_000_000, pe:  47.8, volume:  10_580_000 },
  { ticker: 'NFLX',  company: 'Netflix Inc.',                sector: 'Communication Services',  price: 724.58,  changePct:  2.88, marketCap:   311_000_000_000, pe:  48.6, volume:   5_230_000 },
  { ticker: 'INTC',  company: 'Intel Corp.',                 sector: 'Technology',              price:  20.14,  changePct: -1.54, marketCap:    86_000_000_000, pe:  null, volume:  43_820_000 },
  { ticker: 'AMD',   company: 'Advanced Micro Devices',      sector: 'Technology',              price: 162.84,  changePct:  4.12, marketCap:   263_000_000_000, pe:  38.7, volume:  28_640_000 },
  { ticker: 'CRM',   company: 'Salesforce Inc.',             sector: 'Technology',              price: 294.16,  changePct:  1.62, marketCap:   283_000_000_000, pe:  46.2, volume:   4_870_000 },
  { ticker: 'ORCL',  company: 'Oracle Corp.',                sector: 'Technology',              price: 148.42,  changePct:  0.94, marketCap:   408_000_000_000, pe:  24.8, volume:   6_320_000 },
  { ticker: 'ADBE',  company: 'Adobe Inc.',                  sector: 'Technology',              price: 437.28,  changePct:  2.24, marketCap:   192_000_000_000, pe:  34.6, volume:   3_480_000 },
  { ticker: 'NEE',   company: 'NextEra Energy Inc.',         sector: 'Utilities',               price:  73.42,  changePct:  0.32, marketCap:   150_000_000_000, pe:  22.4, volume:   8_960_000 },
  { ticker: 'AMT',   company: 'American Tower Corp.',        sector: 'Real Estate',             price: 178.64,  changePct: -0.86, marketCap:    84_000_000_000, pe:  41.2, volume:   2_140_000 },
  { ticker: 'CAT',   company: 'Caterpillar Inc.',            sector: 'Industrials',             price: 362.18,  changePct:  1.14, marketCap:   175_000_000_000, pe:  17.8, volume:   3_640_000 },
  { ticker: 'LIN',   company: 'Linde plc',                  sector: 'Materials',               price: 458.82,  changePct:  0.68, marketCap:   218_000_000_000, pe:  32.4, volume:   2_180_000 },
  { ticker: 'UPS',   company: 'United Parcel Service',       sector: 'Industrials',             price: 128.46,  changePct: -0.92, marketCap:   109_000_000_000, pe:  13.6, volume:   4_280_000 },
];

const ALL_SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Energy',
  'Consumer Discretionary',
  'Consumer Staples',
  'Industrials',
  'Materials',
  'Real Estate',
  'Utilities',
  'Communication Services',
];

const MARKET_CAP_OPTIONS: { id: MarketCapFilter; label: string }[] = [
  { id: 'any',   label: 'Any' },
  { id: 'small', label: 'Small  (<$2B)' },
  { id: 'mid',   label: 'Mid  ($2B–$10B)' },
  { id: 'large', label: 'Large  ($10B–$100B)' },
  { id: 'mega',  label: 'Mega  (>$100B)' },
];

const SAVED_SCREENS = [
  { name: 'Tech Momentum',  description: 'Tech >$10B, P/E < 50' },
  { name: 'Value Dividend', description: 'P/E < 20, All sectors' },
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

function matchesMarketCap(cap: number, filter: MarketCapFilter): boolean {
  switch (filter) {
    case 'any':   return true;
    case 'small': return cap < 2e9;
    case 'mid':   return cap >= 2e9 && cap < 10e9;
    case 'large': return cap >= 10e9 && cap < 100e9;
    case 'mega':  return cap >= 100e9;
  }
}

// ── Column header component ────────────────────────────────────

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
          sortDir === 'asc' ? (
            <ChevronUp size={12} className="text-gold" />
          ) : (
            <ChevronDown size={12} className="text-gold" />
          )
        ) : (
          <ChevronDown size={12} className="opacity-30" />
        )}
      </span>
    </th>
  );
}

// ── Save Screen Modal ──────────────────────────────────────────

interface SaveModalProps {
  onSave:  (name: string) => void;
  onClose: () => void;
}

function SaveScreenModal({ onSave, onClose }: SaveModalProps) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-surface-lg animate-fade-in">
        <h3 className="font-serif text-lg text-off-white mb-4">Name Your Screen</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name.trim())}
          placeholder="e.g. Tech Momentum Q2"
          autoFocus
          className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-off-white placeholder-off-white/25 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-gold text-obsidian rounded-lg text-sm font-bold hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Screen
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border text-off-white/60 rounded-lg text-sm font-medium hover:text-off-white hover:border-off-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screener Page ─────────────────────────────────────────────

export default function Screener() {
  const { setSelectedTicker } = useTrading();

  // Staged filters (edited but not applied)
  const [draftFilters, setDraftFilters] = useState<Filters>({ ...DEFAULT_FILTERS, sectors: new Set() });
  // Applied filters (drive results)
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...DEFAULT_FILTERS, sectors: new Set() });

  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [savedScreens, setSavedScreens] = useState(SAVED_SCREENS);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedSavedScreen, setSelectedSavedScreen] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── Filter logic ──────────────────────────────────────────

  const filteredStocks = useMemo(() => {
    return MOCK_STOCKS.filter((s) => {
      // Sector
      if (appliedFilters.sectors.size > 0 && !appliedFilters.sectors.has(s.sector)) return false;
      // Market cap
      if (!matchesMarketCap(s.marketCap, appliedFilters.marketCap)) return false;
      // P/E min
      if (appliedFilters.peMin !== '') {
        const min = parseFloat(appliedFilters.peMin);
        if (!isNaN(min) && (s.pe === null || s.pe < min)) return false;
      }
      // P/E max
      if (appliedFilters.peMax !== '') {
        const max = parseFloat(appliedFilters.peMax);
        if (!isNaN(max) && (s.pe === null || s.pe > max)) return false;
      }
      // Price min
      if (appliedFilters.priceMin !== '') {
        const min = parseFloat(appliedFilters.priceMin);
        if (!isNaN(min) && s.price < min) return false;
      }
      // Price max
      if (appliedFilters.priceMax !== '') {
        const max = parseFloat(appliedFilters.priceMax);
        if (!isNaN(max) && s.price > max) return false;
      }
      // Volume min
      if (appliedFilters.volumeMin !== '') {
        const min = parseFloat(appliedFilters.volumeMin);
        if (!isNaN(min) && s.volume < min) return false;
      }
      return true;
    });
  }, [appliedFilters]);

  // ── Sort logic ────────────────────────────────────────────

  const sortedStocks = useMemo(() => {
    const sorted = [...filteredStocks].sort((a, b) => {
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
        default:          return 0;
      }
      // Nulls to end
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [filteredStocks, sortKey, sortDir]);

  // ── Handlers ──────────────────────────────────────────────

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  const toggleSector = useCallback((sector: string) => {
    setDraftFilters((prev) => {
      const next = new Set(prev.sectors);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return { ...prev, sectors: next };
    });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters, sectors: new Set(draftFilters.sectors) });
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    const empty: Filters = { ...DEFAULT_FILTERS, sectors: new Set() };
    setDraftFilters(empty);
    setAppliedFilters({ ...empty, sectors: new Set() });
  }, []);

  const handleSaveScreen = useCallback((name: string) => {
    setSavedScreens((prev) => [
      ...prev,
      { name, description: `${appliedFilters.sectors.size > 0 ? [...appliedFilters.sectors].join(', ') : 'All sectors'}` },
    ]);
    setShowSaveModal(false);
    setSaveSuccess(name);
    setTimeout(() => setSaveSuccess(''), 2500);
  }, [appliedFilters]);

  const handleLoadSavedScreen = useCallback((screenName: string) => {
    setSelectedSavedScreen(screenName);
    // Loading a saved screen just resets to default for demo purposes
    const empty: Filters = { ...DEFAULT_FILTERS, sectors: new Set() };
    setDraftFilters(empty);
    setAppliedFilters({ ...empty, sectors: new Set() });
  }, []);

  const activeFilterCount =
    appliedFilters.sectors.size +
    (appliedFilters.marketCap !== 'any' ? 1 : 0) +
    (appliedFilters.peMin !== '' || appliedFilters.peMax !== '' ? 1 : 0) +
    (appliedFilters.priceMin !== '' || appliedFilters.priceMax !== '' ? 1 : 0) +
    (appliedFilters.volumeMin !== '' ? 1 : 0);

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8">

        {/* ── Page Title ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl text-off-white mb-1">Stock Screener</h1>
            <p className="text-sm text-off-white/40">
              Filter and discover opportunities across the market
            </p>
          </div>
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border text-off-white/60 rounded-lg text-sm font-medium hover:text-off-white hover:border-off-white/20 transition-colors"
          >
            <Save size={14} />
            Save Screen
          </button>
        </div>

        {saveSuccess && (
          <div className="mb-4 px-4 py-3 bg-gain/10 border border-gain/30 rounded-lg text-sm text-gain flex items-center gap-2 animate-fade-in">
            <TrendingUp size={14} />
            Screen &ldquo;{saveSuccess}&rdquo; saved successfully.
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ── Filter Sidebar ────────────────────────────────── */}
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

            {/* Saved Screens */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2">
                My Screens
              </label>
              <select
                value={selectedSavedScreen}
                onChange={(e) => handleLoadSavedScreen(e.target.value)}
                className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-sm text-off-white focus:outline-none focus:border-gold/50 transition-colors cursor-pointer"
              >
                <option value="">Select a saved screen…</option>
                {savedScreens.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                Sector
              </label>
              <div className="space-y-2">
                {ALL_SECTORS.map((sector) => {
                  const checked = draftFilters.sectors.has(sector);
                  return (
                    <label
                      key={sector}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        onClick={() => toggleSector(sector)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                          checked
                            ? 'bg-gold border-gold'
                            : 'border-border bg-surface-3 group-hover:border-gold/40'
                        }`}
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                            className="pointer-events-none"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="#0a0a0a"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs transition-colors ${
                          checked ? 'text-off-white' : 'text-off-white/50 group-hover:text-off-white/80'
                        }`}
                        onClick={() => toggleSector(sector)}
                      >
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
                  <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setDraftFilters((p) => ({ ...p, marketCap: id }))}
                      className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                        draftFilters.marketCap === id
                          ? 'border-gold'
                          : 'border-border bg-surface-3 group-hover:border-gold/40'
                      }`}
                    >
                      {draftFilters.marketCap === id && (
                        <div className="w-2 h-2 rounded-full bg-gold" />
                      )}
                    </div>
                    <span
                      className={`text-xs transition-colors cursor-pointer ${
                        draftFilters.marketCap === id
                          ? 'text-off-white'
                          : 'text-off-white/50 group-hover:text-off-white/80'
                      }`}
                      onClick={() => setDraftFilters((p) => ({ ...p, marketCap: id }))}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* P/E Ratio */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                P/E Ratio
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-2xs text-off-white/30 mb-1">Min</label>
                  <input
                    type="number"
                    value={draftFilters.peMin}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, peMin: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-2xs text-off-white/30 mb-1">Max</label>
                  <input
                    type="number"
                    value={draftFilters.peMax}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, peMax: e.target.value }))}
                    placeholder="∞"
                    min={0}
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
                  <label className="block text-2xs text-off-white/30 mb-1">$ Min</label>
                  <input
                    type="number"
                    value={draftFilters.priceMin}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, priceMin: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-2xs text-off-white/30 mb-1">$ Max</label>
                  <input
                    type="number"
                    value={draftFilters.priceMax}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, priceMax: e.target.value }))}
                    placeholder="∞"
                    min={0}
                    className="w-full px-2.5 py-1.5 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Volume Min */}
            <div>
              <label className="block text-xs font-semibold text-off-white/40 uppercase tracking-wider mb-2.5">
                Volume Min
              </label>
              <input
                type="number"
                value={draftFilters.volumeMin}
                onChange={(e) => setDraftFilters((p) => ({ ...p, volumeMin: e.target.value }))}
                placeholder="e.g. 1000000"
                min={0}
                className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={applyFilters}
                className="w-full py-2.5 bg-gold text-obsidian rounded-lg text-sm font-bold hover:bg-gold-light transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2.5 border border-border text-off-white/60 rounded-lg text-sm font-medium hover:text-off-white hover:border-off-white/20 transition-colors"
              >
                Reset
              </button>
            </div>
          </aside>

          {/* ── Results Table ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Results count + save */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-off-white/60">
                  Showing{' '}
                  <span className="text-off-white font-semibold">{sortedStocks.length}</span>
                  {' '}of{' '}
                  <span className="text-off-white font-semibold">{MOCK_STOCKS.length}</span>
                  {' '}stocks
                </span>
                {activeFilterCount > 0 && (
                  <span className="text-xs text-gold/70">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 text-xs text-off-white/40 hover:text-gold transition-colors"
              >
                <Save size={12} />
                Save this screen
              </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <ColHeader col="ticker"    label="Ticker"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <ColHeader col="company"   label="Company"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <ColHeader col="sector"    label="Sector"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <ColHeader col="price"     label="Price"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="changePct" label="Change %"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="marketCap" label="Mkt Cap"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="pe"        label="P/E"        sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ColHeader col="volume"    label="Volume"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStocks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-off-white/30 text-sm">
                          No stocks match the current filters.{' '}
                          <button
                            onClick={resetFilters}
                            className="text-gold hover:underline ml-1"
                          >
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      sortedStocks.map((stock, idx) => {
                        const isGain = stock.changePct >= 0;
                        return (
                          <tr
                            key={stock.ticker}
                            onClick={() => setSelectedTicker(stock.ticker)}
                            className={`border-b border-border/50 cursor-pointer transition-colors duration-100 hover:bg-surface-2 ${
                              idx % 2 === 0 ? 'bg-surface/30' : ''
                            }`}
                          >
                            {/* Ticker */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-semibold text-gold">
                                {stock.ticker}
                              </span>
                            </td>
                            {/* Company */}
                            <td className="px-4 py-3">
                              <span className="text-sm text-off-white/80 truncate max-w-[160px] block">
                                {stock.company}
                              </span>
                            </td>
                            {/* Sector */}
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 border border-border text-off-white/50 whitespace-nowrap">
                                {stock.sector}
                              </span>
                            </td>
                            {/* Price */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white tabular-nums">
                                {formatCurrency(stock.price)}
                              </span>
                            </td>
                            {/* Change % */}
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex items-center justify-end gap-0.5 font-mono text-sm font-semibold tabular-nums ${
                                  isGain ? 'text-gain' : 'text-loss'
                                }`}
                              >
                                {isGain ? (
                                  <TrendingUp size={12} className="flex-shrink-0" />
                                ) : (
                                  <TrendingDown size={12} className="flex-shrink-0" />
                                )}
                                {isGain ? '+' : ''}
                                {stock.changePct.toFixed(2)}%
                              </span>
                            </td>
                            {/* Market Cap */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white/70 tabular-nums">
                                {formatMarketCap(stock.marketCap)}
                              </span>
                            </td>
                            {/* P/E */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white/70 tabular-nums">
                                {stock.pe !== null ? stock.pe.toFixed(1) : (
                                  <span className="text-off-white/25">—</span>
                                )}
                              </span>
                            </td>
                            {/* Volume */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm text-off-white/70 tabular-nums">
                                {(stock.volume / 1_000_000).toFixed(1)}M
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-xs text-off-white/20 mt-3 text-right">
              Click any row to open the stock in the trading panel.
              Data is simulated for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Save Screen Modal ────────────────────────────────── */}
      {showSaveModal && (
        <SaveScreenModal
          onSave={handleSaveScreen}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
