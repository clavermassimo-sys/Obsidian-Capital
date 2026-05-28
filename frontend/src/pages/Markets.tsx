/* ============================================================
   Obsidian Capital — Markets Page
   Real data from Polygon.io via /api/market/* endpoints.
   ============================================================ */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Newspaper,
  ExternalLink,
  BarChart2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { marketApi } from '@/services/api';
import type { IndexQuote, MoverEntry, NewsItem } from '@/services/api';
import { formatCurrency, formatRelativeTime } from '@/utils/format';

// ── Tag color map for news ────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  Macro:       'bg-gold/10 text-gold border-gold/20',
  Earnings:    'bg-gain/10 text-gain border-gain/20',
  Markets:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Technology:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Analysis:    'bg-off-white/5 text-off-white/60 border-border',
  Commodities: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function tagForSymbols(symbols: string[]): string {
  if (!symbols.length) return 'Markets';
  const tech = ['AAPL','MSFT','GOOGL','NVDA','META','AMZN','TSLA','PLTR','AMD','SMCI'];
  if (symbols.some((s) => tech.includes(s))) return 'Technology';
  const energy = ['XOM','CVX','COP','OXY','SLB'];
  if (symbols.some((s) => energy.includes(s))) return 'Commodities';
  if (!symbols[0]) return 'Markets';
  return 'Markets';
}

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

// ── Skeleton helpers ──────────────────────────────────────────

function IndexCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-16 rounded bg-surface-3" />
      <div className="h-4 w-24 rounded bg-surface-3" />
      <div className="flex items-end justify-between">
        <div className="h-5 w-24 rounded bg-surface-3" />
        <div className="h-4 w-16 rounded bg-surface-3" />
      </div>
    </div>
  );
}

function StockRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-3" />
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-surface-3" />
          <div className="h-2.5 w-28 rounded bg-surface-3" />
        </div>
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-3 w-16 rounded bg-surface-3" />
        <div className="h-2.5 w-12 rounded bg-surface-3" />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function IndexCard({ index }: { index: IndexQuote }) {
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
          {index.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <div className="text-xs text-off-white/50 mt-0.5 max-w-[180px] truncate">{name || ticker}</div>
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

function NewsCard({ item }: { item: NewsItem }) {
  const tag = tagForSymbols(item.symbols ?? []);
  const tagClass = TAG_COLORS[tag] ?? 'bg-surface-3 text-off-white/60 border-border';

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-4 hover:border-gold/20 transition-colors duration-200 cursor-pointer group block"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium border ${tagClass}`}>
              {tag}
            </span>
            {item.symbols?.slice(0, 2).map((s) => (
              <span key={s} className="text-xs font-mono text-gold/60">{s}</span>
            ))}
            <span className="text-xs text-off-white/20 hidden sm:inline">·</span>
            <span className="text-xs text-off-white/30 hidden sm:inline">
              {formatRelativeTime(item.publishedAt)}
            </span>
          </div>
          <h3 className="font-serif text-sm md:text-base font-medium text-off-white group-hover:text-gold transition-colors duration-150 leading-snug mb-1.5">
            {item.headline}
          </h3>
          {item.summary && (
            <p className="text-xs md:text-sm text-off-white/50 leading-relaxed line-clamp-2 hidden sm:block">
              {item.summary}
            </p>
          )}
        </div>
        <ExternalLink
          size={14}
          className="text-off-white/20 group-hover:text-gold/60 transition-colors mt-0.5 shrink-0"
        />
      </div>
    </a>
  );
}

// ── Markets Page ──────────────────────────────────────────────

export default function Markets() {
  const { setSelectedTicker } = useTrading();
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const {
    data: indicesData,
    isLoading: loadingIndices,
    refetch: refetchIndices,
  } = useQuery({
    queryKey: ['market-indices'],
    queryFn: () => marketApi.getIndices(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const {
    data: moversData,
    isLoading: loadingMovers,
  } = useQuery({
    queryKey: ['market-movers'],
    queryFn: () => marketApi.getMovers(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const {
    data: newsData,
    isLoading: loadingNews,
  } = useQuery({
    queryKey: ['market-news'],
    queryFn: () => marketApi.getNews(undefined, 8),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const indices  = indicesData?.indices  ?? [];
  const gainers  = moversData?.gainers   ?? [];
  const losers   = moversData?.losers    ?? [];
  const newsItems = newsData?.news       ?? [];

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4 md:space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-off-white">Markets</h1>
            <p className="text-xs md:text-sm text-off-white/40 mt-1">
              Real-time market data &amp; analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchIndices()}
              className="p-1.5 rounded-md hover:bg-surface-3 transition-colors text-off-white/30 hover:text-off-white/60"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
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
        </div>

        {/* ── Market Indices ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-gold" />
            <h2 className="font-serif text-base md:text-lg font-medium text-off-white">Market Indices</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {loadingIndices
              ? Array.from({ length: 4 }).map((_, i) => <IndexCardSkeleton key={i} />)
              : indices.map((idx) => <IndexCard key={idx.symbol} index={idx} />)
            }
          </div>
        </div>

        {/* ── Gainers / Losers ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Top Gainers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
              <TrendingUp size={15} className="text-gain" />
              <h2 className="font-serif text-base font-medium text-off-white">Top Gainers</h2>
              <span className="ml-auto text-xs text-off-white/30">Today</span>
            </div>
            <div>
              {loadingMovers
                ? Array.from({ length: 5 }).map((_, i) => <StockRowSkeleton key={i} />)
                : gainers.slice(0, 5).map((s: MoverEntry) => (
                    <StockRow
                      key={s.symbol}
                      ticker={s.symbol}
                      name={s.name ?? s.symbol}
                      price={s.price}
                      changePct={s.changePct}
                      isGainer={true}
                      onClick={() => setSelectedTicker(s.symbol)}
                    />
                  ))
              }
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
              {loadingMovers
                ? Array.from({ length: 5 }).map((_, i) => <StockRowSkeleton key={i} />)
                : losers.slice(0, 5).map((s: MoverEntry) => (
                    <StockRow
                      key={s.symbol}
                      ticker={s.symbol}
                      name={s.name ?? s.symbol}
                      price={s.price}
                      changePct={s.changePct}
                      isGainer={false}
                      onClick={() => setSelectedTicker(s.symbol)}
                    />
                  ))
              }
            </div>
          </div>
        </div>

        {/* ── Sector Heatmap ──────────────────────────────────── */}
        {/* Populated from movers data; shows when available */}
        {moversData && gainers.length > 0 && (
          <div className="card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <BarChart2 size={15} className="text-gold" />
              <h2 className="font-serif text-base md:text-lg font-medium text-off-white">Sector Performance</h2>
              <span className="ml-auto text-xs text-off-white/30 hidden sm:inline">S&amp;P 500 Sectors · Today</span>
            </div>
            <div className="overflow-x-auto scrollbar-hidden -mx-4 md:mx-0 px-4 md:px-0">
              <div className="flex gap-2 md:grid md:grid-cols-4 lg:grid-cols-6 min-w-max md:min-w-0">
                {gainers.slice(0, 6).map((s) => {
                  const isHovered = hoveredSector === s.symbol;
                  const colorClass = sectorColor(s.changePct);
                  const isPos = s.changePct >= 0;
                  return (
                    <div
                      key={s.symbol}
                      className={`relative rounded-lg p-2 md:p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 border border-transparent ${colorClass} ${isHovered ? 'scale-105 shadow-surface-lg border-white/10 z-10' : ''}`}
                      style={{ minHeight: '70px', minWidth: '72px' }}
                      onMouseEnter={() => setHoveredSector(s.symbol)}
                      onMouseLeave={() => setHoveredSector(null)}
                      onClick={() => setSelectedTicker(s.symbol)}
                    >
                      <div className="text-[10px] md:text-xs font-bold text-center leading-tight">{s.symbol}</div>
                      <div className="text-xs md:text-sm font-mono font-bold tabular-nums">
                        {isPos ? '+' : ''}{s.changePct.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 mt-4 pt-3 border-t border-border flex-wrap">
              <span className="text-xs text-off-white/30">Scale:</span>
              <div className="flex items-center gap-1">
                {[-1.5, -0.8, -0.3, 0.1, 0.5, 1.0, 1.8].map((v) => (
                  <div key={v} className={`w-4 md:w-5 h-3 rounded-sm ${sectorColor(v)}`} />
                ))}
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-xs">
                <span className="text-loss">Bearish</span>
                <span className="text-off-white/30">→</span>
                <span className="text-gain">Bullish</span>
              </div>
            </div>
          </div>
        )}

        {/* ── News Feed ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={14} className="text-gold" />
            <h2 className="font-serif text-base md:text-lg font-medium text-off-white">Market News</h2>
          </div>
          <div className="space-y-3">
            {loadingNews
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded bg-surface-3" />
                      <div className="h-4 w-4/5 rounded bg-surface-3" />
                      <div className="h-3 w-full rounded bg-surface-3" />
                    </div>
                  </div>
                ))
              : newsItems.map((item, i) => <NewsCard key={i} item={item} />)
            }
          </div>
        </div>

      </div>
    </div>
  );
}
