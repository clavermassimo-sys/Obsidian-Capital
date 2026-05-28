/* ============================================================
   Obsidian Capital — HoldingsTable (Updated)
   Sortable holdings table with watchlist button, chart link,
   color-coded market value, loading skeleton, and CSV export.
   ============================================================ */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Crown,
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart2,
  Download,
} from 'lucide-react';
import type { Holding } from '@/types';
import { useTrading } from '@/contexts/TradingContext';

// ── Types ─────────────────────────────────────────────────────

type SortKey = keyof Holding;
type SortDir = 'asc' | 'desc';

interface HoldingsTableProps {
  holdings?: Holding[];
  className?: string;
  showHeader?: boolean;
  isLoading?: boolean;
}

// ── Formatters ────────────────────────────────────────────────

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(v);
}

function fmtPct(v: number): string {
  const abs = Math.abs(v);
  const prefix = v >= 0 ? '+' : '-';
  return `${prefix}${abs.toFixed(2)}%`;
}

function fmtDollarReturn(v: number): string {
  return `${v >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(v))}`;
}

// ── Skeleton Row ──────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[140, 180, 60, 80, 80, 100, 100, 80, 40].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded animate-pulse bg-surface-3"
            style={{ width: w, maxWidth: '100%' }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Column Config ─────────────────────────────────────────────

interface Column {
  key: SortKey;
  label: string;
  align: 'left' | 'right';
  sortable: boolean;
}

const COLUMNS: Column[] = [
  { key: 'ticker',       label: 'Ticker',        align: 'left',  sortable: true },
  { key: 'companyName',  label: 'Company',        align: 'left',  sortable: true },
  { key: 'shares',       label: 'Shares',         align: 'right', sortable: true },
  { key: 'avgCost',      label: 'Avg Cost',       align: 'right', sortable: true },
  { key: 'currentPrice', label: 'Current',        align: 'right', sortable: true },
  { key: 'marketValue',  label: 'Market Value',   align: 'right', sortable: true },
  { key: 'returnDollar', label: 'Return ($)',      align: 'right', sortable: true },
  { key: 'returnPct',    label: 'Return (%)',      align: 'right', sortable: true },
  { key: 'portfolioWeight', label: 'Weight',       align: 'right', sortable: true },
];

// ── Component ─────────────────────────────────────────────────

export function HoldingsTable({ holdings: propHoldings, className = '', showHeader = false, isLoading = false }: HoldingsTableProps) {
  const { holdings: contextHoldings, setSelectedTicker, addToWatchlist } = useTrading();
  const navigate = useNavigate();
  const holdings = propHoldings ?? contextHoldings;

  const [sortKey, setSortKey] = useState<SortKey>('marketValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
  }, [holdings, sortKey, sortDir]);

  const totals = useMemo(() => {
    const totalMarketValue  = holdings.reduce((s, h) => s + h.marketValue, 0);
    const totalCost         = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
    const totalReturnDollar = holdings.reduce((s, h) => s + h.returnDollar, 0);
    const totalReturnPct    = totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost) * 100 : 0;
    return { totalMarketValue, totalCost, totalReturnDollar, totalReturnPct };
  }, [holdings]);

  const exportCSV = useCallback(() => {
    const headers = ['Ticker', 'Company', 'Shares', 'Avg Cost', 'Current Price', 'Market Value', 'Return ($)', 'Return (%)'];
    const rows = sorted.map((h) => [
      h.ticker, h.companyName, h.shares, h.avgCost.toFixed(2),
      h.currentPrice.toFixed(2), h.marketValue.toFixed(2),
      h.returnDollar.toFixed(2), h.returnPct.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'obsidian-holdings.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

  function SortIcon({ col }: { col: Column }) {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ArrowUpDown size={11} className="opacity-30 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp size={11} className="ml-1 text-gold" />
      : <ArrowDown size={11} className="ml-1 text-gold" />;
  }

  // ── Skeleton loading state ────────────────────────────────

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="h-4 w-24 rounded animate-pulse bg-surface-3" />
            <div className="h-3 w-16 rounded animate-pulse bg-surface-3" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-3">
                    <div className="h-2.5 w-16 rounded animate-pulse bg-surface-3" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────

  if (holdings.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-surface ${className}`}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp size={40} className="text-[#2a2a2a] mb-4" />
          <p className="text-base font-sans font-medium text-[#a09a8e]">No holdings yet</p>
          <p className="text-sm font-sans text-[#6b6560] mt-1">
            Your portfolio positions will appear here after your first trade.
          </p>
        </div>
      </div>
    );
  }

  // ── Full table ────────────────────────────────────────────

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      {/* Optional export header */}
      {showHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[#6b6560]">
            {holdings.length} Position{holdings.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-[#6b6560] hover:text-off-white transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      )}

      {/* ── Mobile card list (< md) ──────────────────────── */}
      <div className="md:hidden divide-y divide-border">
        {sorted.map((holding) => {
          const isPositive  = holding.returnDollar >= 0;
          const returnColor = isPositive ? '#3d9e6e' : '#c0453a';
          return (
            <button
              key={holding.ticker}
              onClick={() => setSelectedTicker(holding.ticker)}
              className="w-full text-left px-4 py-3 active:bg-surface-2 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                {/* Left: ticker + company + shares */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono font-bold text-sm text-off-white">{holding.ticker}</span>
                    {holding.marketValue > 10_000 && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-2xs font-semibold" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                        <Crown size={8} /> P
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#a09a8e] truncate">{holding.companyName}</p>
                  <p className="text-xs text-[#6b6560] mt-0.5">{holding.shares.toLocaleString()} shares</p>
                </div>
                {/* Right: value + return */}
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-sm font-semibold text-off-white">{fmtCurrency(holding.marketValue)}</p>
                  <p className="font-mono text-xs font-semibold mt-0.5" style={{ color: returnColor }}>
                    {isPositive ? '+' : ''}{holding.returnPct.toFixed(2)}%
                  </p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: returnColor }}>
                    {fmtDollarReturn(holding.returnDollar)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
        {/* Mobile totals footer */}
        <div className="px-4 py-3 bg-surface-2/50 flex items-center justify-between">
          <span className="text-xs text-[#6b6560]">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</span>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-off-white">{fmtCurrency(totals.totalMarketValue)}</p>
            <p className="font-mono text-xs font-semibold mt-0.5" style={{ color: totals.totalReturnDollar >= 0 ? '#3d9e6e' : '#c0453a' }}>
              {fmtPct(totals.totalReturnPct)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Desktop table (md+) ──────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-sans font-semibold uppercase tracking-wider text-[#6b6560] whitespace-nowrap select-none
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer hover:text-[#a09a8e] transition-colors' : ''}
                  `}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.align === 'right' && <SortIcon col={col} />}
                    {col.label}
                    {col.align === 'left' && <SortIcon col={col} />}
                  </span>
                </th>
              ))}
              {/* Actions column */}
              <th className="px-4 py-3 text-xs font-sans font-semibold uppercase tracking-wider text-[#6b6560] text-center whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((holding, idx) => {
              const isPositive    = holding.returnDollar >= 0;
              const returnColor   = isPositive ? '#3d9e6e' : '#c0453a';
              const mktValColor   = isPositive ? '#3d9e6e' : '#c0453a';
              const isPrivateBadge = holding.marketValue > 10_000;
              const isLast        = idx === sorted.length - 1;

              return (
                <tr
                  key={holding.ticker}
                  onClick={() => setSelectedTicker(holding.ticker)}
                  className={`cursor-pointer transition-colors hover:bg-surface-2 ${isLast ? '' : 'border-b border-border'}`}
                >
                  {/* Ticker */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-off-white">{holding.ticker}</span>
                      {isPrivateBadge && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-sans font-semibold" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                          <Crown size={9} /> Private
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-sans text-[#a09a8e] whitespace-nowrap">{holding.companyName}</span>
                  </td>

                  {/* Shares */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-off-white">{holding.shares.toLocaleString()}</span>
                  </td>

                  {/* Avg Cost */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-[#a09a8e]">{fmtCurrency(holding.avgCost)}</span>
                  </td>

                  {/* Current Price */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-off-white">{fmtCurrency(holding.currentPrice)}</span>
                  </td>

                  {/* Market Value — color coded */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono font-semibold" style={{ color: mktValColor }}>
                      {fmtCurrency(holding.marketValue)}
                    </span>
                  </td>

                  {/* Return $ */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1 text-sm font-mono font-semibold" style={{ color: returnColor }}>
                      {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {fmtDollarReturn(holding.returnDollar)}
                    </div>
                  </td>

                  {/* Return % */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1 text-sm font-mono font-semibold" style={{ color: returnColor }}>
                      {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {fmtPct(holding.returnPct)}
                    </div>
                  </td>

                  {/* Portfolio Weight */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 rounded-full bg-surface-3 w-14 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gold/60"
                          style={{ width: `${Math.min(holding.portfolioWeight ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-off-white/60 tabular-nums w-10 text-right">
                        {(holding.portfolioWeight ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Action buttons */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Add to Watchlist */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWatchlist({
                            ticker: holding.ticker,
                            companyName: holding.companyName,
                            price: holding.currentPrice,
                            change: holding.currentPrice - holding.avgCost,
                            changePct: holding.returnPct,
                            volume: 0,
                          });
                        }}
                        title="Add to Watchlist"
                        className="w-7 h-7 rounded flex items-center justify-center text-[#6b6560] hover:text-gold hover:bg-surface-3 transition-colors"
                        aria-label={`Add ${holding.ticker} to watchlist`}
                      >
                        <Eye size={13} />
                      </button>

                      {/* View Chart */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/charts?ticker=${holding.ticker}`);
                          setSelectedTicker(holding.ticker);
                        }}
                        title="View Chart"
                        className="w-7 h-7 rounded flex items-center justify-center text-[#6b6560] hover:text-[#c9a84c] hover:bg-surface-3 transition-colors"
                        aria-label={`View chart for ${holding.ticker}`}
                      >
                        <BarChart2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals row */}
          <tfoot>
            <tr className="border-t-2 border-border bg-surface-2">
              <td className="px-4 py-3">
                <span className="text-xs font-sans font-semibold uppercase tracking-wide text-[#6b6560]">Total</span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-sans text-[#6b6560]">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono font-bold text-off-white">{fmtCurrency(totals.totalMarketValue)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono font-bold" style={{ color: totals.totalReturnDollar >= 0 ? '#3d9e6e' : '#c0453a' }}>
                  {fmtDollarReturn(totals.totalReturnDollar)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono font-bold" style={{ color: totals.totalReturnPct >= 0 ? '#3d9e6e' : '#c0453a' }}>
                  {fmtPct(totals.totalReturnPct)}
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Export footer — desktop only */}
      {!showHeader && (
        <div className="hidden md:flex items-center justify-end px-5 py-2.5 border-t border-border bg-surface-2/50">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-[#6b6560] hover:text-off-white transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default HoldingsTable;
