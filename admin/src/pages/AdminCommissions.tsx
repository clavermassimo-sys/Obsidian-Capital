import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { DollarSign, TrendingUp, Activity, BarChart2, Users, RefreshCw } from 'lucide-react'
import { adminApi, type AdminStats, type RevenueData, type AdminTrade } from '../services/api'

const GOLD    = '#c9a84c'
const SURFACE = '#111111'
const SURFACE2 = '#1a1a1a'
const BORDER  = '#2a2a2a'
const OFFWHITE = '#f0ede8'

const TIER_COLORS = { private: GOLD, member: '#4f6ef7', standard: '#4a4a4a' }

function fmtRevenue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short' })
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className}`} style={{ background: BORDER }} />
}

function KPICard({ label, value, icon: Icon, sub }: { label: string; value: string; icon: React.ElementType; sub: string }) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: SURFACE, borderColor: BORDER }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: `${OFFWHITE}60` }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}15` }}>
          <Icon size={16} style={{ color: GOLD }} />
        </div>
      </div>
      <p className="text-2xl font-mono font-bold" style={{ color: OFFWHITE }}>{value}</p>
      <p className="text-xs" style={{ color: `${OFFWHITE}40` }}>{sub}</p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border p-3 text-xs space-y-1" style={{ background: SURFACE2, borderColor: BORDER }}>
      <p className="font-medium mb-2" style={{ color: OFFWHITE }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: `${OFFWHITE}60` }}>{p.name}</span>
          </div>
          <span className="font-mono" style={{ color: OFFWHITE }}>${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

const STATUS_STYLES = {
  completed: { bg: 'rgba(61,158,110,0.1)', border: 'rgba(61,158,110,0.2)', text: '#3d9e6e', label: 'Charged' },
  pending:   { bg: `${GOLD}18`,            border: `${GOLD}30`,            text: GOLD,      label: 'Pending' },
  cancelled: { bg: 'rgba(192,69,58,0.1)', border: 'rgba(192,69,58,0.2)', text: '#c0453a', label: 'Cancelled' },
}

export default function AdminCommissions() {
  const [stats, setStats]       = useState<AdminStats | null>(null)
  const [revenue, setRevenue]   = useState<RevenueData | null>(null)
  const [trades, setTrades]     = useState<AdminTrade[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, revenueRes, tradesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRevenue(),
        adminApi.getTrades({ limit: 15, page: 1 }),
      ])
      setStats(statsRes)
      setRevenue(revenueRes)
      setTrades(tradesRes.trades)
    } catch {
      setError('Failed to load commission data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const totalCommission = stats?.trades.total_commission_revenue ?? 0
  const last30dTrades   = stats?.trades.last_30d ?? 0
  const avgCommission   = revenue?.current_period.avg_commission_per_trade ?? 0

  // Chart: monthly commissions from historical
  const historicalChart = (revenue?.historical ?? []).slice(-6).map((h) => ({
    month: fmtMonth(h.month),
    commission: h.commission_revenue,
  }))

  // Tier distribution for pie
  const tierBreakdown = revenue?.tier_breakdown ?? {}
  const totalTierCommission = Object.values(tierBreakdown).reduce((s, t) => s + t.commission_revenue, 0)
  const pieData = (['private', 'member', 'standard'] as const)
    .map((tier) => ({
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      value: totalTierCommission > 0
        ? Math.round(((tierBreakdown[tier]?.commission_revenue ?? 0) / totalTierCommission) * 100)
        : 0,
      color: TIER_COLORS[tier],
    }))
    .filter((d) => d.value > 0)

  // Top users by commission from trades
  const userCommissionMap = new Map<string, { name: string; tier: AdminTrade['user_tier']; commission: number; trades: number }>()
  trades.forEach((t) => {
    const existing = userCommissionMap.get(t.user_name)
    if (existing) {
      existing.commission += t.commission
      existing.trades += 1
    } else {
      userCommissionMap.set(t.user_name, { name: t.user_name, tier: t.user_tier, commission: t.commission, trades: 1 })
    }
  })
  const topUsers = Array.from(userCommissionMap.values())
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 8)

  const KPIS = [
    { label: 'Total Commission (All Time)', value: loading ? '—' : fmtRevenue(totalCommission), icon: DollarSign, sub: 'All completed trades' },
    { label: 'Run Rate (Monthly)', value: loading ? '—' : fmtRevenue(revenue?.current_period.monthly_run_rate ?? 0), icon: TrendingUp, sub: 'Based on last 30 days' },
    { label: 'Trades (Last 30d)', value: loading ? '—' : last30dTrades.toLocaleString(), icon: Activity, sub: 'Completed orders' },
    { label: 'Avg Commission / Trade', value: loading ? '—' : fmtRevenue(avgCommission), icon: BarChart2, sub: 'All tiers blended' },
    { label: 'Active Users (30d)', value: loading ? '—' : (revenue?.current_period.active_users ?? 0).toLocaleString(), icon: Users, sub: 'Traded in last 30 days' },
  ]

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1" style={{ color: `${GOLD}80` }}>ADMIN</p>
          <h1 className="font-serif text-3xl font-medium" style={{ color: OFFWHITE }}>Commission Revenue</h1>
          <p className="text-sm mt-1" style={{ color: `${OFFWHITE}50` }}>Real-time commission analytics from platform data</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: `${OFFWHITE}60` }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border text-sm" style={{ background: 'rgba(192,69,58,0.1)', borderColor: 'rgba(192,69,58,0.25)', color: '#c0453a' }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {KPIS.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}
      </div>

      {/* Chart + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border p-6" style={{ background: SURFACE, borderColor: BORDER }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: OFFWHITE }}>Monthly Commission Revenue</h3>
          {loading ? (
            <Skeleton className="h-64" />
          ) : historicalChart.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm" style={{ color: `${OFFWHITE}30` }}>
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={historicalChart} barCategoryGap="28%" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={BORDER} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: `${OFFWHITE}50`, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: `${OFFWHITE}50`, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtRevenue} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${OFFWHITE}05` }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={(v: string) => <span style={{ color: `${OFFWHITE}60` }}>{v}</span>} />
                <Bar dataKey="commission" name="Commission" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border p-6" style={{ background: SURFACE, borderColor: BORDER }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: OFFWHITE }}>Revenue by Tier</h3>
          {loading ? (
            <Skeleton className="h-52" />
          ) : pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm" style={{ color: `${OFFWHITE}30` }}>No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Share']}
                    contentStyle={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11 }}
                    itemStyle={{ color: OFFWHITE }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                      <span className="text-xs capitalize" style={{ color: `${OFFWHITE}60` }}>{t.name}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: OFFWHITE }}>{t.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Users + Commission History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Users */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: SURFACE, borderColor: BORDER }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <h3 className="text-sm font-semibold" style={{ color: OFFWHITE }}>Top Commission Users (Current View)</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : topUsers.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: `${OFFWHITE}30` }}>No trade data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
                    {['#', 'Name', 'Tier', 'Trades', 'Commission'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-medium uppercase tracking-wider" style={{ color: `${OFFWHITE}40` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u, idx) => (
                    <tr key={u.name} style={{ borderBottom: `1px solid ${BORDER}50` }}>
                      <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}40` }}>{idx + 1}</td>
                      <td className="py-3 px-4 font-medium" style={{ color: u.tier === 'private' ? GOLD : OFFWHITE }}>{u.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs border capitalize"
                          style={u.tier === 'private' ? { color: GOLD, background: `${GOLD}12`, borderColor: `${GOLD}30` }
                            : u.tier === 'member' ? { color: '#818cf8', background: 'rgba(79,110,247,0.1)', borderColor: 'rgba(79,110,247,0.2)' }
                            : { color: `${OFFWHITE}60`, background: `${OFFWHITE}08`, borderColor: BORDER }}>
                          {u.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}70` }}>{u.trades}</td>
                      <td className="py-3 px-4 font-mono font-semibold" style={{ color: GOLD }}>${u.commission.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commission History */}
        <div className="rounded-xl border overflow-hidden" style={{ background: SURFACE, borderColor: BORDER }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <h3 className="text-sm font-semibold" style={{ color: OFFWHITE }}>Recent Commissions</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : trades.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: `${OFFWHITE}30` }}>No trades yet</div>
          ) : (
            <div className="divide-y" style={{ borderColor: `${BORDER}50` }}>
              {trades.slice(0, 10).map((t) => {
                const ss = STATUS_STYLES[(t.status as keyof typeof STATUS_STYLES) ?? 'pending'] ?? STATUS_STYLES.pending
                return (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs font-semibold" style={{ color: GOLD }}>{t.ticker}</div>
                      <div className="text-xs mt-0.5" style={{ color: `${OFFWHITE}50` }}>{t.user_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-xs" style={{ color: OFFWHITE }}>${t.commission.toFixed(2)}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: ss.text, background: ss.bg, borderColor: ss.border }}>
                        {ss.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
