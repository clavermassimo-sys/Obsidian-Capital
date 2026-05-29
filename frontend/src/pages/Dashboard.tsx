/* Obsidian Capital — Dashboard (Apple Liquid Glass) */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { portfolioApi, tradesApi } from '@/services/api';

// ── Types ──────────────────────────────────────────────────────
interface AccountData {
  equity: number;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  day_pl: number;
  day_plpc: number;
  currency: string;
}

interface Position {
  symbol: string;
  qty: number | string;
  avg_entry_price: number | string;
  current_price: number | string;
  market_value: number | string;
  unrealized_pl: number | string;
  unrealized_plpc: number | string;
  asset_class: string;
}

interface HistoryPoint { t: string; v: number; }

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
const toNum = (v: unknown) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0);

// ── Sparkline tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '8px 12px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.80)',
      }}
    >
      {fmt(payload[0].value)}
    </div>
  );
}

// ── Period tabs ────────────────────────────────────────────────
const PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_MAP: Record<Period, string> = {
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
  '3M': '3M',
  '1Y': '1A',
  ALL: 'all',
};

// ── Skeleton ───────────────────────────────────────────────────
function DashSkeleton() {
  return (
    <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '56px', width: '300px', marginBottom: '40px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '100px' }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyPortfolio() {
  return (
    <div className="glass" style={{ padding: '64px 32px', textAlign: 'center', marginBottom: '24px' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <TrendingUp size={20} style={{ color: 'rgba(255,255,255,0.25)' }} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255,255,255,0.60)', marginBottom: '6px' }}>
        Your portfolio is empty
      </p>
      <p
        style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.30)',
          marginBottom: '20px',
        }}
      >
        Place your first trade to get started
      </p>
      <Link to="/markets" className="btn btn-gold btn-sm" style={{ display: 'inline-flex' }}>
        Browse Markets
      </Link>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [period, setPeriod] = useState<Period>('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [accRes, posRes] = await Promise.allSettled([
        tradesApi.getAccount(),
        portfolioApi.getHoldings(),
      ]);

      if (accRes.status === 'fulfilled') {
        const d = (accRes.value as Record<string, unknown>)?.account as Record<string, unknown> ?? accRes.value as Record<string, unknown>;
        setAccount({
          equity:          toNum(d.equity ?? d.portfolio_value),
          buying_power:    toNum(d.buying_power),
          cash:            toNum(d.cash),
          portfolio_value: toNum(d.portfolio_value ?? d.equity),
          unrealized_pl:   toNum(d.unrealized_pl ?? 0),
          unrealized_plpc: toNum(d.unrealized_plpc ?? 0),
          day_pl:          toNum(d.daily_change ?? d.day_pl ?? 0),
          day_plpc:        toNum(d.daily_change_pct ?? d.day_plpc ?? 0),
          currency:        (d.currency as string) || 'USD',
        });
      }
      if (posRes.status === 'fulfilled') {
        const h =
          (posRes.value as Record<string, unknown>)?.holdings ??
          (posRes.value as Record<string, unknown>)?.positions ??
          posRes.value ??
          [];
        setPositions(Array.isArray(h) ? h : []);
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async (p: Period) => {
    try {
      const res = await portfolioApi.getHistory(PERIOD_MAP[p]);
      const raw =
        (res as Record<string, unknown>).history ??
        (res as Record<string, unknown>).equity_history ??
        res ??
        [];
      const pts: HistoryPoint[] = (Array.isArray(raw) ? raw : []).map(
        (pt: Record<string, unknown>) => ({
          t: (pt.t ?? pt.timestamp ?? pt.date ?? '') as string,
          v: toNum(pt.equity ?? pt.v ?? pt.value ?? 0),
        })
      );
      setHistory(pts);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadHistory(period); }, [period, loadHistory]);

  if (loading) return <DashSkeleton />;

  const portfolioValue = account?.portfolio_value ?? account?.equity ?? 0;
  const dayPl    = account?.day_pl   ?? 0;
  const dayPlPct = account?.day_plpc ?? 0;
  const isGain   = dayPl >= 0;
  const chartColor = isGain ? '#34c759' : '#ff3b30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {user?.name ? `Good day, ${user.name.split(' ')[0]}` : 'Portfolio'}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span
              style={{
                fontSize: '42px',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                color: 'rgba(255,255,255,0.92)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmt(portfolioValue)}
            </span>
            {dayPl !== 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: isGain ? 'rgba(52,199,89,0.10)' : 'rgba(255,59,48,0.10)',
                  border: `1px solid ${isGain ? 'rgba(52,199,89,0.20)' : 'rgba(255,59,48,0.20)'}`,
                }}
              >
                {isGain ? (
                  <TrendingUp size={12} style={{ color: '#34c759' }} />
                ) : (
                  <TrendingDown size={12} style={{ color: '#ff3b30' }} />
                )}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isGain ? '#34c759' : '#ff3b30',
                  }}
                >
                  {isGain ? '+' : ''}
                  {fmt(dayPl)} ({isGain ? '+' : ''}
                  {(dayPlPct * 100).toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => load(true)}
          className="btn btn-glass btn-sm"
          disabled={refreshing}
          style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <RefreshCw
            size={13}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(255,59,48,0.06)',
            border: '1px solid rgba(255,59,48,0.12)',
            marginBottom: '24px',
          }}
        >
          <AlertCircle size={14} style={{ color: '#ff3b30' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,59,48,0.80)', fontWeight: 300 }}>
            {error}
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Buying Power', value: fmt(account?.buying_power ?? 0) },
          { label: 'Cash',         value: fmt(account?.cash ?? 0) },
          {
            label: "Today's P&L",
            value: `${isGain ? '+' : ''}${fmt(dayPl)}`,
            color: isGain ? '#34c759' : '#ff3b30',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-sm" style={{ padding: '20px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: '22px',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: color || 'rgba(255,255,255,0.85)',
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Portfolio chart */}
      <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.60)' }}>
            Portfolio Performance
          </p>
          <div style={{ display: 'flex', gap: '4px' }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: p === period ? 500 : 300,
                  cursor: 'pointer',
                  background: p === period ? 'rgba(255,255,255,0.10)' : 'transparent',
                  border:
                    p === period
                      ? '1px solid rgba(255,255,255,0.12)'
                      : '1px solid transparent',
                  color:
                    p === period
                      ? 'rgba(255,255,255,0.90)'
                      : 'rgba(255,255,255,0.40)',
                  transition: 'all 200ms ease',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartColor} stopOpacity={0.20} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.00} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={chartColor}
                strokeWidth={1.5}
                fill="url(#chartGrad)"
                dot={false}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.30)', fontWeight: 300 }}>
              {history.length === 0 ? 'No history available' : 'Insufficient data'}
            </p>
          </div>
        )}
      </div>

      {/* Holdings */}
      <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.60)' }}>
            Positions ({positions.length})
          </p>
          <Link
            to="/markets"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', gap: '4px' }}
          >
            <Plus size={13} /> Add Position
          </Link>
        </div>

        {positions.length === 0 ? (
          <div style={{ padding: '48px 24px' }}>
            <EmptyPortfolio />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Symbol', 'Shares', 'Avg Cost', 'Current', 'Market Value', 'P&L', 'P&L %'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 24px',
                          textAlign: h === 'Symbol' ? 'left' : 'right',
                          fontSize: '10px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.30)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const pl    = toNum(pos.unrealized_pl);
                  const plPct = toNum(pos.unrealized_plpc) * 100;
                  const gain  = pl >= 0;
                  return (
                    <tr
                      key={pos.symbol}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td style={{ padding: '14px 24px' }}>
                        <Link
                          to={`/charts?ticker=${pos.symbol}`}
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.85)',
                            textDecoration: 'none',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {pos.symbol}
                        </Link>
                      </td>
                      {[
                        toNum(pos.qty).toLocaleString(undefined, { maximumFractionDigits: 4 }),
                        fmt(toNum(pos.avg_entry_price)),
                        fmt(toNum(pos.current_price)),
                        fmt(toNum(pos.market_value)),
                      ].map((val, i) => (
                        <td
                          key={i}
                          style={{
                            padding: '14px 24px',
                            textAlign: 'right',
                            fontSize: '13px',
                            fontWeight: 300,
                            color: 'rgba(255,255,255,0.70)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {val}
                        </td>
                      ))}
                      <td
                        style={{
                          padding: '14px 24px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: gain ? '#34c759' : '#ff3b30',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {gain ? '+' : ''}
                        {fmt(pl)}
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500 }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: gain ? 'rgba(52,199,89,0.08)' : 'rgba(255,59,48,0.08)',
                            color: gain ? '#34c759' : '#ff3b30',
                          }}
                        >
                          {gain ? '+' : ''}
                          {plPct.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
