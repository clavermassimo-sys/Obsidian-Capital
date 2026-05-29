/* ============================================================
   Obsidian Capital — Dashboard Page
   Portfolio overview fetching live data from the API.
   ============================================================ */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  ArrowUpRight,
  Clock,
  Download,
  ExternalLink,
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
import { marketApi, tradesApi } from '@/services/api';

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

// ── Helpers ───────────────────────────────────────────────────

function toNum(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  return typeof v === 'number' ? v : parseFloat(v as string) || 0;
}

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

// ── Skeleton card ─────────────────────────────────────────────

function SkeletonCard() {
  return (
    <motion.div variants={item} className="card p-5 flex flex-col gap-3">
      <div className="h-3 w-24 bg-surface-2 rounded animate-pulse" />
      <div className="h-8 w-32 bg-surface-2 rounded animate-pulse" />
      <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
    </motion.div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, subColor, icon }: StatCardProps) {
  return (
    <motion.div variants={item} className="card p-3 md:p-5 flex flex-col gap-2 md:gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs font-medium text-off-white/40 uppercase tracking-wider leading-tight">{label}</span>
        <span className="text-off-white/25 hidden sm:block">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-base md:text-2xl font-mono font-semibold tabular-nums text-off-white tracking-tight leading-none truncate">
          {value}
        </div>
        {sub && (
          <div className={`text-[10px] md:text-xs font-medium mt-1 md:mt-1.5 tabular-nums ${subColor ?? 'text-off-white/50'}`}>
            {sub}
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
    <motion.div variants={item} className="card-2 p-3 md:p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
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
          to="/settings/billing"
          className="flex items-center gap-1.5 text-xs text-gold hover:text-[#e0c070] transition-colors"
        >
          Upgrade to {nextTier} · save {savings} on commissions <ArrowUpRight size={12} />
        </Link>
      )}
    </motion.div>
  );
}

// ── Market Indices Bar ─────────────────────────────────────────

function MarketIndicesBar() {
  const { data, isLoading } = useQuery({
    queryKey: ['market-indices'],
    queryFn: () => marketApi.getIndices(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto py-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-32 rounded-lg bg-surface-2 animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  const indices = data?.indices ?? [];
  if (indices.length === 0) return null;

  return (
    <div className="flex gap-2 md:gap-3 overflow-x-auto py-1 scrollbar-hidden -mx-4 md:mx-0 px-4 md:px-0">
      {indices.map((idx) => {
        const isPos = idx.changePct >= 0;
        return (
          <div key={idx.symbol} className="flex-shrink-0 card-2 px-4 py-2.5 flex items-center gap-3">
            <div>
              <p className="text-xs font-sans font-medium text-off-white/50">{idx.name ?? idx.symbol}</p>
              <p className="text-sm font-mono font-semibold text-off-white tabular-nums">
                {idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className={`text-xs font-mono font-semibold ${isPos ? 'text-gain' : 'text-loss'}`}>
              {isPos ? '+' : ''}{idx.changePct.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Top Movers ────────────────────────────────────────────────

function TopMovers() {
  const { data, isLoading } = useQuery({
    queryKey: ['market-movers'],
    queryFn: () => marketApi.getMovers(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  const gainers = data?.gainers?.slice(0, 3) ?? [];
  const losers  = data?.losers?.slice(0, 3) ?? [];

  if (gainers.length === 0 && losers.length === 0) return (
    <p className="text-xs text-off-white/30 text-center py-4">No mover data available</p>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-sans font-semibold text-off-white/30 uppercase tracking-wider mb-2">Top Gainers</p>
        <div className="space-y-1.5">
          {gainers.map((m) => (
            <div key={m.symbol} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2">
              <span className="text-sm font-mono font-semibold text-gold">{m.symbol}</span>
              <span className="text-xs font-mono font-semibold text-gain">+{m.changePct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-sans font-semibold text-off-white/30 uppercase tracking-wider mb-2">Top Losers</p>
        <div className="space-y-1.5">
          {losers.map((m) => (
            <div key={m.symbol} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2">
              <span className="text-sm font-mono font-semibold text-gold">{m.symbol}</span>
              <span className="text-xs font-mono font-semibold text-loss">{m.changePct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── News Feed ────────────────────────────────────────────────

function NewsFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['market-news'],
    queryFn: () => marketApi.getNews(undefined, 5),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  const news = data?.news ?? [];
  if (news.length === 0) return (
    <p className="text-xs text-off-white/30 text-center py-4">No news available</p>
  );

  return (
    <div className="space-y-3">
      {news.map((n, i) => (
        <a
          key={i}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors group"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-sans text-off-white/80 group-hover:text-off-white line-clamp-2 transition-colors flex-1">
              {n.headline}
            </p>
            <ExternalLink size={12} className="text-off-white/20 group-hover:text-off-white/40 flex-shrink-0 mt-0.5 transition-colors" />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-sans text-off-white/30">
              {new Date(n.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {n.symbols?.slice(0, 3).map((s) => (
              <span key={s} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-3 text-off-white/40">{s}</span>
            ))}
          </div>
        </a>
      ))}
    </div>
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
        to="/settings/billing"
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
  const tier = user?.tier ?? 'standard';

  // ── Fetch account data ───────────────────────────────────

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['account'],
    queryFn: () => tradesApi.getAccount(),
    staleTime: 60_000,
    enabled: !!alpacaConnected,
  });

  // accountData comes from /trades/account (Alpaca Broker API)
  const account      = accountData?.account;
  // Alpaca uses equity; net_liquidation kept as fallback for legacy shapes
  const equity       = toNum(account?.equity ?? account?.net_liquidation);
  const buyingPower  = toNum(account?.buying_power);
  const cash         = toNum(account?.cash);
  const unrealizedPnL = toNum((account as { unrealized_pnl?: number } | null | undefined)?.unrealized_pnl);
  const todayPnL     = unrealizedPnL;
  const todayPnLPct  = equity > 0 && unrealizedPnL !== 0 ? (unrealizedPnL / (equity - unrealizedPnL)) * 100 : 0;
  const isGain       = todayPnL >= 0;
  const portfolioValue = equity > 0 ? equity : user?.portfolioValue ?? 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4 md:space-y-6"
        >
          {/* ── Header ───────────────────────────────────────── */}
          <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-medium text-off-white">Portfolio Overview</h1>
              <p className="text-xs md:text-sm text-off-white/40 mt-1">
                {greeting},{' '}
                <span className="text-off-white/70">{user?.name?.split(' ')[0] ?? 'Investor'}</span>
                {' '}·{' '}
                <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusConfig.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-off-white/30">
                <Clock size={12} />
                <span>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Account activation banner ─────────────────── */}
          {!alpacaConnected && (
            <motion.div variants={item}>
              <AlpacaConnectBanner />
            </motion.div>
          )}

          {/* ── Market Indices ────────────────────────────────── */}
          <motion.div variants={item}>
            <MarketIndicesBar />
          </motion.div>

          {/* ── Upgrade prompt ────────────────────────────────── */}
          <UpgradePromptBanner tier={tier} monthlyVolume={portfolioValue * 0.15} />

          {/* ── Stats Row ────────────────────────────────────── */}
          <motion.div variants={container} className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {accountLoading ? (
              [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
            ) : !alpacaConnected || !account ? (
              <motion.div variants={item} className="card p-5 col-span-full flex items-center justify-center gap-3 py-8">
                <p className="text-sm font-sans text-off-white/40">
                  Your brokerage account is being activated. Portfolio data will appear once setup is complete.
                </p>
              </motion.div>
            ) : (
              <>
                <StatCard
                  label="Portfolio Value"
                  value={formatCurrency(portfolioValue, { compact: false })}
                  sub="Total equity"
                  icon={<DollarSign size={16} />}
                />
                <StatCard
                  label="Today's P&L"
                  value={`${isGain ? '+' : ''}${formatCurrency(todayPnL)}`}
                  sub={`${isGain ? '+' : ''}${todayPnLPct.toFixed(2)}% today`}
                  subColor={isGain ? 'text-gain' : 'text-loss'}
                  icon={isGain ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                />
                <StatCard
                  label="Cash"
                  value={formatCurrency(cash)}
                  sub="Available cash"
                  icon={<DollarSign size={16} />}
                />
                <StatCard
                  label="Buying Power"
                  value={formatCurrency(buyingPower)}
                  sub="Available to trade"
                  icon={<Zap size={16} />}
                />
              </>
            )}
          </motion.div>

          {/* ── Commission Tier Card ──────────────────────────── */}
          <CommissionTierCard tier={tier} />

          {/* ── Main Content: 60/40 grid ──────────────────────── */}
          <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 md:gap-6">

            {/* Left: Holdings + Market Data */}
            <div className="space-y-4 md:space-y-6">
              {/* Holdings Table */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
                  <h2 className="font-serif text-base md:text-lg font-medium text-off-white">Holdings</h2>
                  <div className="flex items-center gap-2 md:gap-3">
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
                      className="hidden sm:flex items-center gap-1.5 text-xs text-[#6b6560] hover:text-off-white transition-colors"
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

              {/* Top Movers + News */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="card p-4 md:p-5">
                  <h2 className="font-serif text-base font-medium text-off-white mb-3 md:mb-4">Top Movers</h2>
                  <TopMovers />
                </div>
                <div className="card p-4 md:p-5">
                  <h2 className="font-serif text-base font-medium text-off-white mb-3 md:mb-4">Market News</h2>
                  <NewsFeed />
                </div>
              </div>
            </div>

            {/* Right: Watchlist — hidden on mobile (accessible via Markets tab) */}
            <div className="hidden xl:flex flex-col">
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
