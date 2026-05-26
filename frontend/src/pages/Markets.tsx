/* ============================================================
   Obsidian Capital — Markets Page
   ============================================================ */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Newspaper,
  ExternalLink,
  BarChart2,
  Clock,
} from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/utils/format';

// ── Mock Data ─────────────────────────────────────────────────

const INDICES = [
  { name: 'S&P 500',      symbol: 'SPX',   value: 5847.28,  change: 47.53,   changePct: 0.82  },
  { name: 'Nasdaq',       symbol: 'IXIC',  value: 18934.71, change: 231.84,  changePct: 1.24  },
  { name: 'Dow Jones',    symbol: 'DJI',   value: 42134.56, change: 180.22,  changePct: 0.43  },
  { name: 'Russell 2000', symbol: 'RUT',   value: 2187.43,  change: -6.83,   changePct: -0.31 },
];

const TOP_GAINERS = [
  { ticker: 'NVDA', name: 'NVIDIA Corp.',         price: 912.40,  changePct: 8.43  },
  { ticker: 'SMCI', name: 'Super Micro Computer', price: 847.12,  changePct: 7.21  },
  { ticker: 'PLTR', name: 'Palantir Technologies', price: 34.82,  changePct: 6.88  },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings',  price: 368.54, changePct: 5.94  },
  { ticker: 'MSTR', name: 'MicroStrategy Inc.',    price: 1243.80,changePct: 5.31  },
];

const TOP_LOSERS = [
  { ticker: 'INTC', name: 'Intel Corporation',     price: 19.34,  changePct: -4.82 },
  { ticker: 'PFE',  name: 'Pfizer Inc.',            price: 24.87,  changePct: -3.94 },
  { ticker: 'BA',   name: 'Boeing Co.',             price: 172.43, changePct: -3.41 },
  { ticker: 'WBA',  name: 'Walgreens Boots Alliance',price: 11.24, changePct: -3.02 },
  { ticker: 'MPW',  name: 'Medical Properties Trust',price: 4.92,  changePct: -2.74 },
];

const SECTORS = [
  { name: 'Technology',          changePct: 1.84  },
  { name: 'Healthcare',          changePct: -0.43 },
  { name: 'Financials',          changePct: 0.71  },
  { name: 'Energy',              changePct: -1.22 },
  { name: 'Consumer Disc.',      changePct: 0.94  },
  { name: 'Consumer Staples',    changePct: 0.18  },
  { name: 'Industrials',         changePct: 0.53  },
  { name: 'Materials',           changePct: -0.67 },
  { name: 'Real Estate',         changePct: -0.84 },
  { name: 'Utilities',           changePct: 0.29  },
  { name: 'Communication Svcs.', changePct: 1.12  },
];

const NEWS = [
  {
    id: 1,
    headline: 'Federal Reserve Signals Potential Rate Cut in Q3 2026 Amid Cooling Inflation Data',
    source: 'Reuters',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    description: 'Fed Chair indicated the committee is watching inflation metrics closely, with a 25bps cut increasingly likely at the September meeting following CPI data coming in below estimates for the third consecutive month.',
    tag: 'Macro',
  },
  {
    id: 2,
    headline: 'NVIDIA Reports Record Q1 Revenue of $28.4B, Beats Wall Street Estimates by 12%',
    source: 'Bloomberg',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    description: 'Data center segment drove the bulk of revenue at $22.6B as hyperscaler AI infrastructure buildout continues to accelerate. Full-year guidance raised to $112B–$118B.',
    tag: 'Earnings',
  },
  {
    id: 3,
    headline: 'S&P 500 Reaches New All-Time High as Tech Stocks Lead Broad-Based Rally',
    source: 'Financial Times',
    timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
    description: 'The index surpassed the 5,850 level for the first time as investor optimism around AI-driven productivity gains and a resilient labor market fueled continued buying.',
    tag: 'Markets',
  },
  {
    id: 4,
    headline: 'Apple Unveils AI-Powered Siri Overhaul at WWDC, Partnership with Anthropic Confirmed',
    source: 'The Wall Street Journal',
    timestamp: new Date(Date.now() - 3.8 * 60 * 60 * 1000).toISOString(),
    description: 'The company demonstrated on-device AI capabilities including advanced natural language understanding and personalized context. AAPL shares rose 2.3% in extended trading.',
    tag: 'Technology',
  },
  {
    id: 5,
    headline: 'JPMorgan Raises Year-End S&P 500 Target to 6,400 on Strong Corporate Earnings Outlook',
    source: 'CNBC',
    timestamp: new Date(Date.now() - 5.1 * 60 * 60 * 1000).toISOString(),
    description: 'The bank\'s equity strategy team cited improving earnings revisions breadth and receding recession risk as justification for the revised 400-point increase in its year-end price target.',
    tag: 'Analysis',
  },
  {
    id: 6,
    headline: 'Crude Oil Falls 2.4% as OPEC+ Production Increase Announcement Surprises Markets',
    source: 'Reuters',
    timestamp: new Date(Date.now() - 7.3 * 60 * 60 * 1000).toISOString(),
    description: 'WTI crude dropped below $72/barrel after the cartel agreed to an additional 400,000 bpd production hike starting July, larger than the 250,000 bpd most analysts anticipated.',
    tag: 'Commodities',
  },
];

// ── Tag colors ────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  Macro:       'bg-gold/10 text-gold border-gold/20',
  Earnings:    'bg-gain/10 text-gain border-gain/20',
  Markets:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Technology:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Analysis:    'bg-off-white/5 text-off-white/60 border-border',
  Commodities: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ── Sector heatmap color ──────────────────────────────────────

function sectorColor(pct: number): string {
  if (pct >= 1.5)  return 'bg-gain text-obsidian';
  if (pct >= 0.75) return 'bg-gain/70 text-white';
  if (pct >= 0.25) return 'bg-gain/40 text-gain';
  if (pct >= 0)    return 'bg-gain/20 text-gain/80';
  if (pct >= -0.5) return 'bg-loss/20 text-loss/80';
  if (pct >= -1.0) return 'bg-loss/40 text-loss';
  return 'bg-loss/70 text-white';
}

// ── Sub-components ────────────────────────────────────────────

function IndexCard({ index }: { index: typeof INDICES[0] }) {
  const isUp = index.changePct >= 0;
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-off-white/40 uppercase tracking-wider">{index.symbol}</div>
          <div className="font-serif text-base font-medium text-off-white mt-0.5">{index.name}</div>
        </div>
        {isUp ? (
          <TrendingUp size={18} className="text-gain opacity-60" />
        ) : (
          <TrendingDown size={18} className="text-loss opacity-60" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-mono font-semibold tabular-nums text-off-white">
          {index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div className={`text-right ${isUp ? 'text-gain' : 'text-loss'}`}>
          <div className="text-sm font-mono tabular-nums font-medium">
            {isUp ? '+' : ''}{index.changePct.toFixed(2)}%
          </div>
          <div className="text-xs tabular-nums opacity-70">
            {isUp ? '+' : ''}{index.change.toFixed(2)} pts
          </div>
        </div>
      </div>
    </div>
  );
}

function StockRow({
  ticker,
  name,
  price,
  changePct,
  isGainer,
  onClick,
}: {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  isGainer: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3/60 transition-colors duration-150 border-b border-border/50 last:border-0 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
          <span className="font-mono text-xs font-bold text-gold">{ticker.slice(0, 2)}</span>
        </div>
        <div>
          <div className="font-mono font-semibold text-gold text-sm">{ticker}</div>
          <div className="text-xs text-off-white/50 mt-0.5 max-w-[180px] truncate">{name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm tabular-nums text-off-white font-medium">
          {formatCurrency(price)}
        </div>
        <div className={`text-xs font-mono tabular-nums font-semibold ${isGainer ? 'text-gain' : 'text-loss'}`}>
          {isGainer ? '+' : ''}{changePct.toFixed(2)}%
        </div>
      </div>
    </button>
  );
}

// ── Markets Page ──────────────────────────────────────────────

export default function Markets() {
  const { setSelectedTicker } = useTrading();
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium text-off-white">Markets</h1>
            <p className="text-sm text-off-white/40 mt-1">
              Real-time market data &amp; analysis
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-off-white/30">
            <Clock size={12} />
            <span>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/New_York',
              })} ET
            </span>
          </div>
        </div>

        {/* ── Market Indices ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-gold" />
            <h2 className="font-serif text-lg font-medium text-off-white">Market Indices</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {INDICES.map((idx) => (
              <IndexCard key={idx.symbol} index={idx} />
            ))}
          </div>
        </div>

        {/* ── Gainers / Losers ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
              <TrendingUp size={15} className="text-gain" />
              <h2 className="font-serif text-base font-medium text-off-white">Top Gainers</h2>
              <span className="ml-auto text-xs text-off-white/30">Today</span>
            </div>
            <div>
              {TOP_GAINERS.map((s) => (
                <StockRow
                  key={s.ticker}
                  {...s}
                  isGainer={true}
                  onClick={() => setSelectedTicker(s.ticker)}
                />
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
              <TrendingDown size={15} className="text-loss" />
              <h2 className="font-serif text-base font-medium text-off-white">Top Losers</h2>
              <span className="ml-auto text-xs text-off-white/30">Today</span>
            </div>
            <div>
              {TOP_LOSERS.map((s) => (
                <StockRow
                  key={s.ticker}
                  {...s}
                  isGainer={false}
                  onClick={() => setSelectedTicker(s.ticker)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Sector Heatmap ──────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-gold" />
            <h2 className="font-serif text-lg font-medium text-off-white">Sector Performance</h2>
            <span className="ml-auto text-xs text-off-white/30">S&amp;P 500 Sectors · Today</span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
            {SECTORS.map((sector) => {
              const isHovered = hoveredSector === sector.name;
              const colorClass = sectorColor(sector.changePct);
              const isPos = sector.changePct >= 0;
              return (
                <div
                  key={sector.name}
                  className={`relative rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-default transition-all duration-200 border border-transparent ${colorClass} ${isHovered ? 'scale-105 shadow-surface-lg border-white/10 z-10' : ''}`}
                  style={{ minHeight: '80px' }}
                  onMouseEnter={() => setHoveredSector(sector.name)}
                  onMouseLeave={() => setHoveredSector(null)}
                >
                  <div className="text-xs font-medium text-center leading-tight opacity-90">
                    {sector.name}
                  </div>
                  <div className="text-sm font-mono font-bold tabular-nums">
                    {isPos ? '+' : ''}{sector.changePct.toFixed(2)}%
                  </div>
                  {isHovered && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface-2 border border-border rounded px-2 py-1 text-xs whitespace-nowrap text-off-white z-20 shadow-surface-lg pointer-events-none">
                      {sector.name}: {isPos ? '+' : ''}{sector.changePct.toFixed(2)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <span className="text-xs text-off-white/30">Performance scale:</span>
            <div className="flex items-center gap-1">
              {[-1.5, -0.8, -0.3, 0.1, 0.5, 1.0, 1.8].map((v) => (
                <div
                  key={v}
                  className={`w-5 h-3 rounded-sm ${sectorColor(v)}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-loss">Bearish</span>
              <span className="text-off-white/30">→</span>
              <span className="text-gain">Bullish</span>
            </div>
          </div>
        </div>

        {/* ── News Feed ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={14} className="text-gold" />
            <h2 className="font-serif text-lg font-medium text-off-white">Market News</h2>
          </div>
          <div className="space-y-3">
            {NEWS.map((item) => (
              <div
                key={item.id}
                className="card p-4 hover:border-gold/20 transition-colors duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium border ${TAG_COLORS[item.tag] ?? 'bg-surface-3 text-off-white/60 border-border'}`}>
                        {item.tag}
                      </span>
                      <span className="text-xs text-off-white/30">{item.source}</span>
                      <span className="text-xs text-off-white/20">·</span>
                      <span className="text-xs text-off-white/30">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <h3 className="font-serif text-base font-medium text-off-white group-hover:text-gold transition-colors duration-150 leading-snug mb-1.5">
                      {item.headline}
                    </h3>
                    <p className="text-sm text-off-white/50 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-off-white/20 group-hover:text-gold/60 transition-colors mt-0.5 shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
