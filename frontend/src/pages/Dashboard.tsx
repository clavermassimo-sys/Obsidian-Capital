/* ============================================================
   Obsidian Capital — Dashboard Page
   ============================================================ */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts';

import { useAuth } from '@/contexts/AuthContext';
import { useTrading } from '@/contexts/TradingContext';
import { formatCurrency, formatPercent, formatTierName } from '@/utils/format';

// ── Stub components (will be replaced when real files exist) ──
// These match the expected API for HoldingsTable, PortfolioChart, Watchlist
function HoldingsTable() {
  const { holdings } = useTrading();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Ticker', 'Company', 'Shares', 'Avg Cost', 'Current', 'Mkt Value', 'Return $', 'Return %', 'Weight'].map((h) => (
              <th key={h} className="text-left py-3 px-4 text-xs font-medium text-off-white/40 uppercase tracking-wider last:text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr
              key={h.ticker}
              className={`border-b border-border/50 table-row-hover ${i % 2 === 0 ? 'bg-surface-2/30' : 'bg-surface-3/20'}`}
            >
              <td className="py-3 px-4 font-mono font-semibold text-gold">{h.ticker}</td>
              <td className="py-3 px-4 text-off-white/80">{h.companyName}</td>
              <td className="py-3 px-4 tabular-nums">{h.shares}</td>
              <td className="py-3 px-4 tabular-nums">{formatCurrency(h.avgCost)}</td>
              <td className="py-3 px-4 tabular-nums">{formatCurrency(h.currentPrice)}</td>
              <td className="py-3 px-4 tabular-nums font-medium">{formatCurrency(h.marketValue)}</td>
              <td className={`py-3 px-4 tabular-nums font-medium ${h.returnDollar >= 0 ? 'text-gain' : 'text-loss'}`}>
                {h.returnDollar >= 0 ? '+' : ''}{formatCurrency(h.returnDollar)}
              </td>
              <td className={`py-3 px-4 tabular-nums font-medium ${h.returnPct >= 0 ? 'text-gain' : 'text-loss'}`}>
                {formatPercent(h.returnPct)}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 rounded-full bg-surface-3 w-16 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold/60"
                      style={{ width: `${Math.min(h.portfolioWeight ?? 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-off-white/60 tabular-nums text-xs w-10 text-right">
                    {(h.portfolioWeight ?? 0).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortfolioChart() {
  const data = useMemo(() => {
    const base = 1_200_000;
    return Array.from({ length: 90 }, (_, i) => {
      const date = new Date('2026-02-25');
      date.setDate(date.getDate() + i);
      const noise = (Math.random() - 0.42) * 30000;
      const trend = i * 7200;
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.max(base + trend + noise, base * 0.9),
      };
    });
  }, []);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
          labelStyle={{ color: '#a09a8e', fontSize: 11 }}
          itemStyle={{ color: '#f0ede8', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
          formatter={(v: number) => [formatCurrency(v), 'Portfolio']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#c9a84c"
          strokeWidth={2}
          fill="url(#portfolioGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#c9a84c', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Watchlist() {
  const { watchlist, setSelectedTicker } = useTrading();
  return (
    <div className="divide-y divide-border/50">
      {watchlist.map((item) => {
        const isUp = item.changePct >= 0;
        return (
          <button
            key={item.ticker}
            onClick={() => setSelectedTicker(item.ticker)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3/60 transition-colors duration-150 text-left"
          >
            <div>
              <div className="font-mono font-semibold text-gold text-sm">{item.ticker}</div>
              <div className="text-xs text-off-white/50 mt-0.5 truncate max-w-[140px]">{item.companyName}</div>
            </div>
            <div className="text-right">
              <div className="font-mono tabular-nums text-sm text-off-white">{formatCurrency(item.price)}</div>
              <div className={`text-xs tabular-nums font-medium ${isUp ? 'text-gain' : 'text-loss'}`}>
                {isUp ? '+' : ''}{item.changePct.toFixed(2)}%
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function isNYSEOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  // ET offset: UTC-5 (EST) or UTC-4 (EDT). Approximate with UTC-4 for simplicity.
  const etHour = ((now.getUTCHours() - 4 + 24) % 24) + now.getUTCMinutes() / 60;
  return etHour >= 9.5 && etHour < 16;
}

// Mini sparkline data (last 7 days)
function useMiniSparkline(base: number, trend: 'up' | 'down' | 'flat') {
  return useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const drift = trend === 'up' ? i * base * 0.003 : trend === 'down' ? -i * base * 0.002 : 0;
      const noise = (Math.random() - 0.5) * base * 0.015;
      return { v: base + drift + noise };
    });
  }, [base, trend]);
}

// ── Stat Card ─────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  sparkData?: { v: number }[];
  sparkColor?: string;
}

function StatCard({ label, value, sub, subColor, icon, sparkData, sparkColor = '#c9a84c' }: StatCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-off-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-off-white/25">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-mono font-semibold tabular-nums text-off-white tracking-tight">
            {value}
          </div>
          {sub && (
            <div className={`text-xs font-medium mt-1 tabular-nums ${subColor ?? 'text-off-white/50'}`}>
              {sub}
            </div>
          )}
        </div>
        {sparkData && (
          <div className="w-20 h-10 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${sparkColor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${sparkColor})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tier Banner ───────────────────────────────────────────────

function TierBanner({ tier }: { tier: string }) {
  if (tier === 'private') return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gold/5 border border-gold/20">
      <Zap size={14} className="text-gold shrink-0" />
      <span className="text-xs text-off-white/70">
        You're on the <span className="text-gold font-medium">{formatTierName(tier)}</span> plan.{' '}
        <Link to="/account" className="text-gold hover:text-gold-light underline underline-offset-2 transition-colors">
          Upgrade to save on commissions
        </Link>
      </span>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const { holdings } = useTrading();

  const open = isNYSEOpen();

  const portfolioValue = user?.portfolioValue ?? 1_843_200;
  const buyingPower = user?.buyingPower ?? 250_000;
  const todayPnL = 14_823.42;
  const todayPnLPct = 0.81;
  const totalReturn = 643_200;
  const totalReturnPct = 53.6;

  const portfolioSpark = useMiniSparkline(portfolioValue, 'up');
  const buySpark = useMiniSparkline(buyingPower, 'flat');
  const tier = user?.tier ?? 'standard';

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium text-off-white">
              Portfolio Overview
            </h1>
            <p className="text-sm text-off-white/40 mt-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-off-white/70">{user?.name?.split(' ')[0] ?? 'Investor'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TierBanner tier={tier} />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
              open
                ? 'bg-gain/10 border-gain/30 text-gain'
                : 'bg-loss/10 border-loss/30 text-loss'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-gain animate-pulse' : 'bg-loss'}`} />
              NYSE {open ? 'OPEN' : 'CLOSED'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-off-white/30">
              <Clock size={12} />
              <span>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET
              </span>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(portfolioValue, { compact: false })}
            sub="Total market value"
            icon={<DollarSign size={16} />}
            sparkData={portfolioSpark}
            sparkColor="#c9a84c"
          />
          <StatCard
            label="Today's P&L"
            value={`+${formatCurrency(todayPnL)}`}
            sub={`+${todayPnLPct.toFixed(2)}% today`}
            subColor="text-gain"
            icon={<TrendingUp size={16} />}
            sparkData={useMiniSparkline(todayPnL, 'up')}
            sparkColor="#3d9e6e"
          />
          <StatCard
            label="Total Return"
            value={`+${formatCurrency(totalReturn)}`}
            sub={`+${totalReturnPct.toFixed(1)}% since inception`}
            subColor="text-gain"
            icon={<ArrowUpRight size={16} />}
            sparkData={useMiniSparkline(totalReturn, 'up')}
            sparkColor="#3d9e6e"
          />
          <StatCard
            label="Buying Power"
            value={formatCurrency(buyingPower)}
            sub="Available cash"
            icon={<DollarSign size={16} />}
            sparkData={buySpark}
            sparkColor="#a09a8e"
          />
        </div>

        {/* ── Main Content ────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_300px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Portfolio Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg font-medium text-off-white">Performance</h2>
                  <p className="text-xs text-off-white/40 mt-0.5">90-day portfolio value</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gain font-medium">
                  <TrendingUp size={12} />
                  +{totalReturnPct.toFixed(1)}% overall
                </div>
              </div>
              <PortfolioChart />
            </div>

            {/* Holdings Table */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-serif text-lg font-medium text-off-white">Holdings</h2>
                <Link
                  to="/portfolio"
                  className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                >
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>
              <HoldingsTable />
            </div>
          </div>

          {/* Right column — Watchlist */}
          <div className="card overflow-hidden flex flex-col">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-serif text-base font-medium text-off-white">Watchlist</h2>
              <Link
                to="/markets"
                className="text-xs text-gold hover:text-gold-light transition-colors"
              >
                Markets
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Watchlist />
            </div>
            <div className="px-4 py-3 border-t border-border bg-surface-2/50 shrink-0">
              <Link
                to="/trade"
                className="btn-gold w-full text-center text-xs py-2 rounded-lg font-medium"
              >
                Open Trade Panel
              </Link>
            </div>
          </div>
        </div>

        {/* ── Tier Info ─────────────────────────────────────── */}
        <div className="card-2 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              tier === 'private'
                ? 'bg-gold/20 text-gold-light border-gold/40'
                : tier === 'member'
                ? 'bg-gold/10 text-gold border-gold/20'
                : 'bg-surface-3 text-off-white/60 border-border'
            }`}>
              {formatTierName(tier)}
            </div>
            <div className="text-xs text-off-white/50">
              Commission rate:{' '}
              <span className="text-off-white font-medium">
                {tier === 'private' ? '5–6%' : tier === 'member' ? '7–9%' : '10–12%'}
              </span>
            </div>
          </div>
          {tier !== 'private' && (
            <Link
              to="/account"
              className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1"
            >
              Upgrade to save on commissions <ArrowUpRight size={12} />
            </Link>
          )}
          {tier === 'private' && (
            <span className="text-xs text-off-white/30 flex items-center gap-1">
              <TrendingDown size={12} className="text-gain" />
              Lowest available commission rate
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
