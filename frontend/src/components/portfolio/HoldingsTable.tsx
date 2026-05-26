/* ============================================================
   Obsidian Capital — HoldingsTable
   Sortable table of portfolio holdings. Clicking a row loads
   the ticker into the trade panel. Return columns are color-
   coded, Private tier badge shown for positions > $10,000.
   ============================================================ */

import React, { useState, useMemo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Crown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { Holding } from '@/types';
import { useTrading } from '@/contexts/TradingContext';

// ── Types ─────────────────────────────────────────────────────

type SortKey = keyof Holding;
type SortDir = 'asc' | 'desc';

interface HoldingsTableProps {
  holdings?: Holding[];
  className?: string;
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

function formatPct(v: number): string {
  const abs = Math.abs(v);
  const prefix = v >= 0 ? '+' : '-';
  return `${prefix}${abs.toFixed(2)}%`;
}

function formatDollarReturn(v: number): string {
  const prefix = v >= 0 ? '+' : '-';
  return `${prefix}${formatCurrency(Math.abs(v))}`;
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
  { key: 'currentPrice', label: 'Current Price',  align: 'right', sortable: true },
  { key: 'marketValue',  label: 'Market Value',   align: 'right', sortable: true },
  { key: 'returnDollar', label: 'Return ($)',      align: 'right', sortable: true },
  { key: 'returnPct',    label: 'Return (%)',      align: 'right', sortable: true },
];

// ── Component ─────────────────────────────────────────────────

export function HoldingsTable({ holdings: propHoldings, className = '' }: HoldingsTableProps) {
  const { holdings: contextHoldings, setSelectedTicker } = useTrading();
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
        return sortDir === 'asc'
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
  }, [holdings, sortKey, sortDir]);

  // Portfolio totals
  const totals = useMemo(() => {
    const totalMarketValue = holdings.reduce((s, h) => s + h.marketValue, 0);
    const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
    const totalReturnDollar = holdings.reduce((s, h) => s + h.returnDollar, 0);
    const totalReturnPct = totalCost > 0
      ? ((totalMarketValue - totalCost) / totalCost) * 100
      : 0;
    return { totalMarketValue, totalCost, totalReturnDollar, totalReturnPct };
  }, [holdings]);

  function SortIcon({ col }: { col: Column }) {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ArrowUpDown size={11} className="opacity-30 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp size={11} className="ml-1 text-gold" />
      : <ArrowDown size={11} className="ml-1 text-gold" />;
  }

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

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
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
            </tr>
          </thead>
          <tbody>
            {sorted.map((holding, idx) => {
              const isPositive = holding.returnDollar >= 0;
              const returnColor = isPositive ? '#3d9e6e' : '#c0453a';
              const isPrivateBadge = holding.marketValue > 10_000;
              const isLast = idx === sorted.length - 1;

              return (
                <tr
                  key={holding.ticker}
                  onClick={() => setSelectedTicker(holding.ticker)}
                  className={`
                    cursor-pointer transition-colors hover:bg-surface-2
                    ${isLast ? '' : 'border-b border-border'}
                  `}
                >
                  {/* Ticker */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-off-white">
                        {holding.ticker}
                      </span>
                      {isPrivateBadge && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-sans font-semibold"
                          style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}
                        >
                          <Crown size={9} />
                          Private
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-sans text-[#a09a8e] whitespace-nowrap">
                      {holding.companyName}
                    </span>
                  </td>

                  {/* Shares */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-off-white">
                      {holding.shares.toLocaleString()}
                    </span>
                  </td>

                  {/* Avg Cost */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-[#a09a8e]">
                      {formatCurrency(holding.avgCost)}
                    </span>
                  </td>

                  {/* Current Price */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-off-white">
                      {formatCurrency(holding.currentPrice)}
                    </span>
                  </td>

                  {/* Market Value */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono font-semibold text-off-white">
                      {formatCurrency(holding.marketValue)}
                    </span>
                  </td>

                  {/* Return $ */}
                  <td className="px-4 py-3 text-right">
                    <div
                      className="inline-flex items-center gap-1 text-sm font-mono font-semibold"
                      style={{ color: returnColor }}
                    >
                      {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {formatDollarReturn(holding.returnDollar)}
                    </div>
                  </td>

                  {/* Return % */}
                  <td className="px-4 py-3 text-right">
                    <div
                      className="inline-flex items-center gap-1 text-sm font-mono font-semibold"
                      style={{ color: returnColor }}
                    >
                      {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {formatPct(holding.returnPct)}
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
                <span className="text-xs font-sans font-semibold uppercase tracking-wide text-[#6b6560]">
                  Portfolio Total
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-sans text-[#6b6560]">
                  {holdings.length} position{holdings.length !== 1 ? 's' : ''}
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono font-bold text-off-white">
                  {formatCurrency(totals.totalMarketValue)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: totals.totalReturnDollar >= 0 ? '#3d9e6e' : '#c0453a' }}
                >
                  {formatDollarReturn(totals.totalReturnDollar)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: totals.totalReturnPct >= 0 ? '#3d9e6e' : '#c0453a' }}
                >
                  {formatPct(totals.totalReturnPct)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default HoldingsTable;
