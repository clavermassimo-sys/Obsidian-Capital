/* ============================================================
   Obsidian Capital — PortfolioChart
   Responsive line chart showing portfolio value over time.
   Timeframe selector (1D, 1W, 1M, 3M, 1Y, All), gradient fill,
   and return summary at top.
   ============================================================ */

import React, { useState, useMemo } from 'react';
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
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TimeRange } from '@/types';

// ── Types ─────────────────────────────────────────────────────

interface DataPoint {
  date: string;
  value: number;
}

interface PortfolioChartProps {
  /** Current portfolio value (USD). Used to anchor mock data. */
  currentValue?: number;
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

// ── Mock Data Generator ───────────────────────────────────────

function generateMockData(
  range: TimeRange,
  endValue: number
): DataPoint[] {
  const now = new Date('2026-05-26');

  interface RangeConfig {
    days: number;
    volatility: number;
    trend: number;
    labelFn: (d: Date) => string;
  }

  const configs: Record<TimeRange, RangeConfig> = {
    '1D': {
      days: 1,
      volatility: 0.003,
      trend: 0.0008,
      labelFn: (d) =>
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    },
    '1W': {
      days: 7,
      volatility: 0.012,
      trend: 0.004,
      labelFn: (d) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
    '1M': {
      days: 30,
      volatility: 0.018,
      trend: 0.012,
      labelFn: (d) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
    '3M': {
      days: 90,
      volatility: 0.02,
      trend: 0.025,
      labelFn: (d) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
    '1Y': {
      days: 365,
      volatility: 0.025,
      trend: 0.08,
      labelFn: (d) =>
        d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    },
    ALL: {
      days: 730,
      volatility: 0.03,
      trend: 0.18,
      labelFn: (d) =>
        d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    },
    '6M': {
      days: 180,
      volatility: 0.022,
      trend: 0.04,
      labelFn: (d) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
  };

  const cfg = configs[range];
  const numPoints = range === '1D' ? 78 : Math.min(cfg.days, 120); // ~5-min intervals for 1D
  const stepMs =
    range === '1D'
      ? (6.5 * 60 * 60 * 1000) / numPoints // 6.5 trading hours
      : (cfg.days * 24 * 60 * 60 * 1000) / numPoints;

  // Seed the random walk: work backwards from endValue
  const startValue = endValue / (1 + cfg.trend);
  let value = startValue;

  const raw: { ts: number; value: number }[] = [];
  const startTs = now.getTime() - cfg.days * 24 * 60 * 60 * 1000;

  for (let i = 0; i <= numPoints; i++) {
    raw.push({ ts: startTs + i * stepMs, value });
    // Geometric brownian motion step
    const randomShock = (Math.random() - 0.48) * cfg.volatility;
    const trendStep = cfg.trend / numPoints;
    value *= 1 + trendStep + randomShock;
  }

  // Scale the last point to exactly endValue
  const lastRaw = raw[raw.length - 1].value;
  const scale = endValue / lastRaw;

  return raw.map((r) => ({
    date: cfg.labelFn(new Date(r.ts)),
    value: parseFloat((r.value * scale).toFixed(2)),
  }));
}

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

// ── Timeframe Button ──────────────────────────────────────────

const TIMEFRAMES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

// ── Component ─────────────────────────────────────────────────

export function PortfolioChart({
  currentValue = 1_843_200,
  className = '',
}: PortfolioChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>('1M');

  const data = useMemo(
    () => generateMockData(activeRange, currentValue),
    [activeRange, currentValue]
  );

  const startValue = data[0]?.value ?? currentValue;
  const endValue = data[data.length - 1]?.value ?? currentValue;
  const dollarChange = endValue - startValue;
  const pctChange = startValue > 0 ? (dollarChange / startValue) * 100 : 0;
  const isPositive = dollarChange >= 0;

  // Y axis domain with slight padding
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.1;
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  // Thin out X axis labels to avoid crowding
  const xTickCount = 6;
  const tickInterval = Math.max(1, Math.floor(data.length / xTickCount));

  const gradientId = 'portfolioGradient';
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
          <p className="text-2xl font-serif font-semibold text-off-white">
            {formatCurrency(endValue)}
          </p>
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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
      </div>
    </div>
  );
}

export default PortfolioChart;
