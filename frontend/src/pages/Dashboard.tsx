/* ============================================================
   Obsidian Capital — Dashboard Page (Complete Rewrite)
   Portfolio overview with Framer Motion staggered animations,
   market status, commission tier info, and upgrade prompts.
   ============================================================ */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  ArrowUpRight,
  Clock,
  Download,
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
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { Watchlist } from '@/components/market/Watchlist';
import { AlpacaConnectBanner } from '@/components/ui/AlpacaConnectBanner';

// ── Market Status ─────────────────────────────────────────────

type MarketStatus = 'open' | 'pre-market' | 'after-hours' | 'closed';

function getMarketStatus(): MarketStatus {
  const now = new Date();
  const et = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const hour    = parseInt(et.find((p) => p.type === 'hour')?.value    ?? '0');
  const minute  = parseInt(et.find((p) => p.type === 'minute')?.value  ?? '0');
  const day     = et.find((p) => p.type === 'weekday')?.value ?? '';
  const isWeekday = !['Sat', 'Sun'].includes(day);
  const timeNum = hour * 100 + minute;

  if (!isWeekday) return 'closed';
  if (timeNum >= 400 && timeNum < 930)  return 'pre-market';
  if (timeNum >= 930 && timeNum < 1600) return 'open';
  if (timeNum >= 1600 && timeNum < 2000) return 'after-hours';
  return 'closed';
}

const MARKET_STATUS_CONFIG: Record<MarketStatus, { label: string; dot: string; badge: string }> = {
  'open':         { label: 'Market Open',   dot: 'bg-gain animate-pulse', badge: 'bg-gain/10 border-gain/30 text-gain' },
  'pre-market':   { label: 'Pre-Market',    dot: 'bg-gold animate-pulse', badge: 'bg-gold/10 border-gold/30 text-gold' },
  'after-hours':  { label: 'After Hours',   dot: 'bg-blue-400',           badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  'closed':       { label: 'Market Closed', dot: 'bg-[#6b6560]',          badge: 'bg-surface-3 border-border text-[#6b6560]' },
};

// ── Animation variants ────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Sparkline data ────────────────────────────────────────────

function useMiniSparkline(base: number, trend: 'up' | 'down' | 'flat', seed = 1) {
  return useMemo(() => {
    // Deterministic "random" using seed
    const rng = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 8 }, (_, i) => {
      const drift = trend === 'up' ? i * base * 0.004 : trend === 'down' ? -i * base * 0.003 : 0;
      const noise = (rng(i) - 0.5) * base * 0.012;
      return { v: Math.max(0, base + drift + noise) };
    });
  }, [base, trend, seed]);
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
  sparkId?: string;
}

function StatCard({ label, value, sub, subColor, icon, sparkData, sparkColor = '#c9a84c', sparkId = 'spark' }: StatCardProps) {
  return (
    <motion.div variants={item} className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-off-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-off-white/25">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-mono font-semibold tabular-nums text-off-white tracking-tight leading-none">
            {value}
          </div>
          {sub && (
            <div className={`text-xs font-medium mt-1.5 tabular-nums ${subColor ?? 'text-off-white/50'}`}>
              {sub}
            </div>
          )}
        </div>
        {sparkData && (
          <div className="w-20 h-10 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${sparkId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${sparkId})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Commission Tier Card ───────────────────────────────────────

function CommissionTierCard({ tier }: { tier: string }) {
  const tierRate = tier === 'private' ? '5–6%' : tier === 'member' ? '7–9%' : '10–12%';
  const nextTier = tier === 'standard' ? 'Member' : tier === 'member' ? 'Private Client' : null;
  const savings   = tier === 'standard' ? '2–3%' : tier === 'member' ? '2%' : null;

  return (
    <motion.div variants={item} className="card-2 p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          tier === 'private' ? 'bg-gold/20 text-gold-light border-gold/40'
          : tier === 'member' ? 'bg-gold/10 text-gold border-gold/20'
          : 'bg-surface-3 text-off-white/60 border-border'
        }`}>
          {formatTierName(tier)}
        </div>
        <div className="text-xs text-off-white/50">
          Commission rate: <span className="text-off-white font-medium">{tierRate}</span>
        </div>
        {tier === 'private' && (
          <span className="flex items-center gap-1 text-xs text-gain">
            <TrendingDown size={12} className="text-gain" />
            Lowest available rate
          </span>
        )}
      </div>
      {nextTier && savings && (
        <Link
          to="/account"
          className="flex items-center gap-1.5 text-xs text-gold hover:text-[#e0c070] transition-colors"
        >
          Upgrade to {nextTier} · save {savings} on commissions <ArrowUpRight size={12} />
        </Link>
      )}
    </motion.div>
  );
}

// ── Portfolio Performance Chart ───────────────────────────────

function PortfolioChart({ portfolioValue }: { portfolioValue: number }) {
  const data = useMemo(() => {
    const base = portfolioValue * 0.65;
    return Array.from({ length: 90 }, (_, i) => {
      const date = new Date('2026-02-25');
      date.setDate(date.getDate() + i);
      // Deterministic noise
      const noise = Math.sin(i * 2.1 + 0.7) * portfolioValue * 0.018 + Math.cos(i * 0.8) * portfolioValue * 0.01;
      const trend = i * (portfolioValue - base) / 90;
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.max(base + trend + noise, base * 0.9),
      };
    });
  }, [portfolioValue]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.22} />
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

// ── Upgrade Prompt ────────────────────────────────────────────

function UpgradePromptBanner({ tier, monthlyVolume }: { tier: string; monthlyVolume: number }) {
  if (tier === 'private') return null;
  const currentRate  = tier === 'standard' ? 0.11 : 0.08;
  const upgradeRate  = tier === 'standard' ? 0.08 : 0.055;
  const savings      = (currentRate - upgradeRate) * monthlyVolume;
  const upgradeName  = tier === 'standard' ? 'Member' : 'Private Client';

  return (
    <motion.div variants={item} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gold/5 border border-gold/20">
      <Zap size={15} className="text-gold shrink-0" />
      <span className="text-xs text-off-white/70 flex-1">
        After 10 trades, you could save{' '}
        <span className="text-gold font-semibold">{formatCurrency(savings)}/month</span>{' '}
        by upgrading to <span className="text-gold font-medium">{upgradeName}</span>.
      </span>
      <Link
        to="/account"
        className="flex items-center gap-1 text-xs text-gold font-semibold hover:text-[#e0c070] transition-colors whitespace-nowrap"
      >
        Upgrade <ArrowUpRight size={12} />
      </Link>
    </motion.div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────

export default function Dashboard() {
  const { user, alpacaConnected } = useAuth();
  const { holdings } = useTrading();

  const marketStatus = getMarketStatus();
  const statusConfig = MARKET_STATUS_CONFIG[marketStatus];

  const portfolioValue = user?.portfolioValue ?? 1_843_200;
  const buyingPower    = user?.buyingPower ?? 250_000;
  const todayPnL       = 14_823.42;
  const todayPnLPct    = 0.81;
  const totalReturn    = 643_200;
  const totalReturnPct = 53.6;
  const tier           = user?.tier ?? 'standard';

  const portfolioSpark = useMiniSparkline(portfolioValue, 'up', 1);
  const pnlSpark       = useMiniSparkline(todayPnL, 'up', 2);
  const returnSpark    = useMiniSparkline(totalReturn, 'up', 3);
  const buySpark       = useMiniSparkline(buyingPower, 'flat', 4);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* ── Header ───────────────────────────────────────── */}
          <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium text-off-white">Portfolio Overview</h1>
              <p className="text-sm text-off-white/40 mt-1">
                {greeting},{' '}
                <span className="text-off-white/70">{user?.name?.split(' ')[0] ?? 'Investor'}</span>
                {' '}· {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Market status badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusConfig.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </div>
              {/* ET clock */}
              <div className="flex items-center gap-1.5 text-xs text-off-white/30">
                <Clock size={12} />
                <span>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Alpaca Connect Banner ─────────────────────────── */}
          {!alpacaConnected && (
            <motion.div variants={item}>
              <AlpacaConnectBanner />
            </motion.div>
          )}

          {/* ── Upgrade prompt ────────────────────────────────── */}
          <UpgradePromptBanner tier={tier} monthlyVolume={portfolioValue * 0.15} />

          {/* ── Stats Row ────────────────────────────────────── */}
          <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Portfolio Value"
              value={formatCurrency(portfolioValue, { compact: false })}
              sub="Total market value"
              icon={<DollarSign size={16} />}
              sparkData={portfolioSpark}
              sparkColor="#c9a84c"
              sparkId="portfolio"
            />
            <StatCard
              label="Today's P&L"
              value={`+${formatCurrency(todayPnL)}`}
              sub={`+${todayPnLPct.toFixed(2)}% today`}
              subColor="text-gain"
              icon={<TrendingUp size={16} />}
              sparkData={pnlSpark}
              sparkColor="#3d9e6e"
              sparkId="pnl"
            />
            <StatCard
              label="Total Return"
              value={`+${formatCurrency(totalReturn)}`}
              sub={`+${totalReturnPct.toFixed(1)}% since inception`}
              subColor="text-gain"
              icon={<ArrowUpRight size={16} />}
              sparkData={returnSpark}
              sparkColor="#3d9e6e"
              sparkId="return"
            />
            <StatCard
              label="Buying Power"
              value={formatCurrency(buyingPower)}
              sub="Available cash"
              icon={<DollarSign size={16} />}
              sparkData={buySpark}
              sparkColor="#a09a8e"
              sparkId="buying"
            />
          </motion.div>

          {/* ── Commission Tier Card ──────────────────────────── */}
          <CommissionTierCard tier={tier} />

          {/* ── Main Content: 60/40 grid ──────────────────────── */}
          <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

            {/* Left: Portfolio Chart + Holdings */}
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
                <PortfolioChart portfolioValue={portfolioValue} />
              </div>

              {/* Holdings Table */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="font-serif text-lg font-medium text-off-white">Holdings</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const headers = ['Ticker', 'Company', 'Shares', 'Avg Cost', 'Current', 'Mkt Value', 'Return $', 'Return %'];
                        const rows = holdings.map((h) => [h.ticker, h.companyName, h.shares, h.avgCost.toFixed(2), h.currentPrice.toFixed(2), h.marketValue.toFixed(2), h.returnDollar.toFixed(2), h.returnPct.toFixed(2)]);
                        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'holdings.csv'; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 text-xs text-[#6b6560] hover:text-off-white transition-colors"
                    >
                      <Download size={12} /> Export CSV
                    </button>
                    <Link
                      to="/portfolio"
                      className="text-xs text-gold hover:text-[#e0c070] transition-colors flex items-center gap-1"
                    >
                      View all <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
                <HoldingsTable />
              </div>
            </div>

            {/* Right: Watchlist */}
            <div className="flex flex-col">
              <Watchlist className="flex-1" />
              <div className="mt-3">
                <Link
                  to="/trade"
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-gold text-obsidian text-sm font-bold hover:brightness-110 transition-all"
                >
                  <Zap size={14} />
                  Open Trade Panel
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
