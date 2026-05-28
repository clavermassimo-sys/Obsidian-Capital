/* ============================================================
   Obsidian Capital — PortfolioChart
   Responsive line chart showing portfolio value over time.
   Timeframe selector (1D, 1W, 1M, 3M, 1Y, All), gradient fill,
   and return summary at top. Data fetched from real API.
   ============================================================ */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { TimeRange } from '@/types';
import { portfolioApi } from '@/services/api';

// ── Types ─────────────────────────────────────────────────────

interface DataPoint {
  date: string;
  value: number;
}

interface PortfolioChartProps {
  className?: string;
}

// ── Formatters ────────────────────────────────────────────────

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function formatCurrencyFull(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function formatPct(v: number): string {
  const prefix = v >= 0 ? '+' : '';
  return `${prefix}${v.toFixed(2)}%`;
}

// ── Timeframe → API period mapping ────────────────────────────

const TIMEFRAMES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const PERIOD_MAP: Record<TimeRange, string> = {
  '1D':  '1D',
  '1W':  '1W',
  '1M':  '1M',
  '3M':  '3M',
  '6M':  '6M',
  '1Y':  '1Y',
  'ALL': 'All',
};

// ── Custom Tooltip ────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value as number;
  return (
    <div
      className="rounded-lg border border-border px-3 py-2.5"
      style={{ backgroundColor: '#1a1a1a', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
    >
      <p className="text-xs font-sans text-[#a09a8e] mb-1">{label}</p>
      <p className="text-sm font-mono font-semibold text-off-white">
        {formatCurrencyFull(value)}
      </p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-56 w-full rounded-lg bg-surface-2 animate-pulse" />
  );
}

// ── Component ─────────────────────────────────────────────────

export function PortfolioChart({ className = '' }: PortfolioChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>('1M');

  const period = PERIOD_MAP[activeRange];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portfolio-history', period],
    queryFn: () => portfolioApi.getHistory(period),
    staleTime: 60_000,
  });

  const history: DataPoint[] = data?.history ?? [];

  const startValue = history[0]?.value ?? 0;
  const endValue   = history[history.length - 1]?.value ?? 0;
  const dollarChange = endValue - startValue;
  const pctChange    = startValue > 0 ? (dollarChange / startValue) * 100 : 0;
  const isPositive   = dollarChange >= 0;

  // Y axis domain with slight padding
  const values  = history.map((d) => d.value);
  const minVal  = values.length > 0 ? Math.min(...values) : 0;
  const maxVal  = values.length > 0 ? Math.max(...values) : 1;
  const padding = (maxVal - minVal) * 0.1 || 1;
  const yMin    = Math.max(0, minVal - padding);
  const yMax    = maxVal + padding;

  // Thin out X axis labels to avoid crowding
  const xTickCount   = 6;
  const tickInterval = Math.max(1, Math.floor(history.length / xTickCount));

  const gradientId  = 'portfolioGradient';
  const strokeColor = isPositive ? '#c9a84c' : '#c0453a';
  const gradientTop = isPositive ? 'rgba(201,168,76,0.25)' : 'rgba(192,69,58,0.25)';

  return (
    <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      {/* ── Top Summary ──────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-sans font-medium text-[#6b6560] uppercase tracking-wider mb-1">
            Portfolio Value
          </p>
          {isLoading ? (
            <div className="h-8 w-40 bg-surface-2 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-semibold text-off-white">
              {history.length > 0 ? formatCurrency(endValue) : '—'}
            </p>
          )}
          {!isLoading && history.length > 0 && (
            <div
              className="flex items-center gap-1.5 mt-1"
              style={{ color: isPositive ? '#3d9e6e' : '#c0453a' }}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-sm font-sans font-semibold">
                {isPositive ? '+' : ''}
                {formatCurrencyFull(dollarChange)}
              </span>
              <span className="text-sm font-sans text-[#a09a8e]">
                ({formatPct(pctChange)})
              </span>
              <span className="text-xs font-sans text-[#6b6560]">
                this period
              </span>
            </div>
          )}
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-surface-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveRange(tf)}
              className="px-2.5 py-1 rounded-md text-xs font-sans font-semibold transition-colors"
              style={
                activeRange === tf
                  ? { backgroundColor: '#c9a84c', color: '#0a0a0a' }
                  : { backgroundColor: 'transparent', color: '#6b6560' }
              }
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ────────────────────────────────────────── */}
      <div className="h-56">
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-sans text-[#a09a8e]">Unable to load portfolio data</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface-2 text-xs font-sans text-[#a09a8e] hover:text-off-white hover:border-gold/40 transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-sans text-[#6b6560]">No portfolio history yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientTop} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(42,42,42,0.6)"
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b6560', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                interval={tickInterval}
                dy={6}
              />

              <YAxis
                domain={[yMin, yMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b6560', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                width={56}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'rgba(201,168,76,0.3)',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: strokeColor,
                  stroke: '#111111',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default PortfolioChart;
