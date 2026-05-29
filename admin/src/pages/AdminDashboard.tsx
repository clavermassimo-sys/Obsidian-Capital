import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { adminApi, type AdminStats, type AdminTrade } from '../services/api'

// ── Helpers ────────────────────────────────────────────────────

function fmtDollar(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ── Sub-components ─────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, accent = false, iconColor = 'text-gold' }: {
  title: string; value: string; sub: string; icon: React.ElementType; accent?: boolean; iconColor?: string
}) {
  return (
    <div className={`bg-surface border ${accent ? 'border-gold/30' : 'border-border'} rounded-lg p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-off-white/50">{title}</span>
        <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center">
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <div className={`text-2xl font-bold mb-1 ${accent ? 'text-gold' : 'text-off-white'}`}>{value}</div>
      <div className="text-xs text-off-white/40">{sub}</div>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-surface-2 rounded animate-pulse ${className}`} />
}

const SignupTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-off-white/50 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gold">{payload[0].value} new user{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats]         = useState<AdminStats | null>(null)
  const [trades, setTrades]       = useState<AdminTrade[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, tradesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getTrades({ limit: 10, page: 1 }),
      ])
      setStats(statsRes)
      setTrades(tradesRes.trades)
      setLastRefresh(new Date())
    } catch {
      setError('Failed to load dashboard data. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Build chart data from recent_signups
  const signupChartData = stats?.recent_signups?.map((s) => ({
    date: fmtDate(s.date),
    users: s.new_users,
  })) ?? []

  const totalUsers = stats?.users.total ?? 0
  const std        = stats?.users.by_tier.standard.count ?? 0
  const mem        = stats?.users.by_tier.member.count ?? 0
  const prv        = stats?.users.by_tier.private.count ?? 0
  const tradesLast24 = stats?.trades.last_24h ?? 0
  const commission24h = trades
    .filter((t) => new Date(t.created_at) > new Date(Date.now() - 86400_000))
    .reduce((s, t) => s + t.commission, 0)
  const totalCommission = stats?.trades.total_commission_revenue ?? 0
  const totalVolume     = stats?.trades.total_volume ?? 0

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">Admin Dashboard</h1>
          <p className="text-sm text-off-white/40 mt-0.5">Obsidian Capital — Platform Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-off-white/40">
            <Clock size={13} />
            <span>Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-off-white/60 hover:text-gold hover:border-gold/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-loss/10 border border-loss/25 rounded-lg text-sm text-loss">
          {error}
        </div>
      )}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard title="Total Users" value={totalUsers.toLocaleString()} sub={`${stats?.users.kyc_pipeline.pending ?? 0} pending KYC`} icon={Users} accent />
            <KpiCard title="Standard Tier" value={std.toLocaleString()} sub={totalUsers > 0 ? `${((std / totalUsers) * 100).toFixed(1)}% of users` : '—'} icon={Users} iconColor="text-off-white/50" />
            <KpiCard title="Member Tier" value={mem.toLocaleString()} sub={totalUsers > 0 ? `${((mem / totalUsers) * 100).toFixed(1)}% of users` : '—'} icon={Users} iconColor="text-blue-400" />
          </>
        )}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard title="Private Tier" value={prv.toLocaleString()} sub={totalUsers > 0 ? `${((prv / totalUsers) * 100).toFixed(1)}% of users` : '—'} icon={Users} iconColor="text-gold" />
            <KpiCard title="Trades (24h)" value={tradesLast24.toLocaleString()} sub={`${stats?.trades.last_7d ?? 0} this week`} icon={Activity} iconColor="text-gain" accent />
            <KpiCard title="Total Commission" value={fmtDollar(totalCommission)} sub={`${fmtDollar(totalVolume)} total volume`} icon={DollarSign} iconColor="text-gold" accent />
          </>
        )}
      </div>

      {/* Chart + Stats */}
      <div className="grid grid-cols-5 gap-6">
        {/* User Signups Chart */}
        <div className="col-span-3 bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-base font-semibold text-off-white">Daily Signups</h2>
              <p className="text-xs text-off-white/40 mt-0.5">New user registrations — last 30 days</p>
            </div>
            {!loading && totalUsers > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gain">
                <ArrowUpRight size={13} />
                <span>{totalUsers} total</span>
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-[220px]" />
          ) : signupChartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-off-white/30 text-sm">
              No signup data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={signupChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<SignupTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#c9a84c" strokeWidth={2} fill="url(#signupGrad)" dot={false} activeDot={{ r: 4, fill: '#c9a84c', stroke: '#0a0a0a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform Stats */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
          <h2 className="font-serif text-base font-semibold text-off-white">Platform Stats</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <div className="space-y-0 flex-1">
              {[
                { label: 'Total Trades', value: (stats?.trades.total ?? 0).toLocaleString() },
                { label: 'Buy Orders', value: (stats?.trades.buy_orders ?? 0).toLocaleString() },
                { label: 'Sell Orders', value: (stats?.trades.sell_orders ?? 0).toLocaleString() },
                { label: 'Avg Order Size', value: fmtDollar(stats?.trades.avg_order_size ?? 0) },
                { label: 'KYC Approved', value: (stats?.users.kyc_pipeline.approved ?? 0).toLocaleString() },
                { label: 'KYC Pending', value: (stats?.users.kyc_pipeline.pending ?? 0).toLocaleString() },
                { label: 'KYC Rejected', value: (stats?.users.kyc_pipeline.rejected ?? 0).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <span className="text-xs text-off-white/50">{label}</span>
                  <span className="text-sm font-semibold text-off-white">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commission Rates */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="font-serif text-base font-semibold text-off-white mb-4">Commission Rates</h2>
        <div className="grid grid-cols-3 gap-4">
          {(['standard', 'member', 'private'] as const).map((tier) => (
            <div key={tier} className="bg-surface-2 border border-border rounded-lg p-4 text-center">
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${tier === 'private' ? 'text-gold' : tier === 'member' ? 'text-blue-400' : 'text-off-white/50'}`}>
                {tier}
              </div>
              <div className="text-xl font-mono font-bold text-off-white">
                {loading ? '—' : (stats?.commission_rates[tier] ?? '—')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-serif text-base font-semibold text-off-white">Recent Trades</h2>
            <p className="text-xs text-off-white/40 mt-0.5">Last 10 platform trades</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-off-white/40">
            <TrendingUp size={13} />
            <span>{stats?.trades.total ?? 0} total</span>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-off-white/30 text-sm">
            No trades yet — platform is ready for trading
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Ticker</th>
                  <th>Type</th>
                  <th>Shares</th>
                  <th>Price</th>
                  <th>Commission</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="text-off-white/40 text-xs font-mono">{fmtTime(trade.created_at)}</td>
                    <td className="font-medium">{trade.user_name}</td>
                    <td><span className="font-mono font-semibold text-gold">{trade.ticker}</span></td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${trade.type === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss'}`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-off-white/70 tabular-nums">{trade.shares.toLocaleString()}</td>
                    <td className="text-off-white/70 tabular-nums">${trade.price.toFixed(2)}</td>
                    <td className="text-gold font-semibold tabular-nums">${trade.commission.toFixed(2)}</td>
                    <td className="font-medium tabular-nums">${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
