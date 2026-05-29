import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { DollarSign, TrendingUp, Activity, RefreshCw } from 'lucide-react'
import { adminApi, type RevenueData } from '../services/api'

function fmtRevenue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-surface-2 rounded animate-pulse ${className}`} />
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-off-white/50 mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-off-white/60">{p.name}:</span>
          <span className="text-off-white font-semibold">{fmtRevenue(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const axisStyle = { fill: '#f0ede8', opacity: 0.4, fontSize: 11 }

export default function AdminRevenue() {
  const [data, setData]     = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getRevenue()
      setData(res)
    } catch {
      setError('Failed to load revenue data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const historical = (data?.historical ?? []).map((h) => ({
    month: fmtMonth(h.month),
    commission: h.commission_revenue,
    volume: h.total_volume,
    trades: h.trade_count,
  }))

  const projections = data?.projections ?? []
  const current = data?.current_period
  const tierBreakdown = data?.tier_breakdown ?? {}

  const totalHistorical = historical.reduce((s, h) => s + h.commission, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">Revenue Analytics</h1>
          <p className="text-sm text-off-white/40 mt-0.5">Commission revenue and growth projections from real data</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-off-white/60 hover:text-gold hover:border-gold/30 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-loss/10 border border-loss/25 rounded-lg text-sm text-loss">{error}</div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-gold/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Total Commission</span>
            <DollarSign size={15} className="text-gold" />
          </div>
          {loading ? <Skeleton className="h-8 w-28" /> : (
            <div className="text-2xl font-bold text-gold">{fmtRevenue(totalHistorical)}</div>
          )}
          <div className="text-xs text-off-white/30 mt-1">Last 12 months</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Monthly Run Rate</span>
            <TrendingUp size={15} className="text-gain" />
          </div>
          {loading ? <Skeleton className="h-8 w-28" /> : (
            <div className="text-2xl font-bold text-off-white">{fmtRevenue(current?.monthly_run_rate ?? 0)}</div>
          )}
          <div className="text-xs text-off-white/30 mt-1">Based on last 30 days</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Active Users (30d)</span>
            <Activity size={15} className="text-off-white/40" />
          </div>
          {loading ? <Skeleton className="h-8 w-20" /> : (
            <div className="text-2xl font-bold text-off-white">{(current?.active_users ?? 0).toLocaleString()}</div>
          )}
          <div className="text-xs text-off-white/30 mt-1">Traded in last 30 days</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Avg Commission</span>
            <TrendingUp size={15} className="text-gold" />
          </div>
          {loading ? <Skeleton className="h-8 w-24" /> : (
            <div className="text-2xl font-bold text-off-white">{fmtRevenue(current?.avg_commission_per_trade ?? 0)}</div>
          )}
          <div className="text-xs text-off-white/30 mt-1">Per trade (last 30 days)</div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">Monthly Commission Revenue</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Last 12 months — real data from completed trades</p>
        </div>
        {loading ? (
          <Skeleton className="h-60" />
        ) : historical.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-off-white/30 text-sm">
            No revenue data yet — complete trades to see earnings
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={historical} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtRevenue} tick={axisStyle} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="commission" name="Commission" fill="#c9a84c" radius={[3, 3, 0, 0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tier Breakdown */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-serif text-base font-semibold text-off-white">Revenue by Tier (Last 30 Days)</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Commission breakdown by user subscription tier</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['Tier', 'Active Users', 'Trades', 'Commission Revenue', 'Avg / Trade', 'Rate'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>)}
                  </tr>
                ))
              ) : (['private', 'member', 'standard'] as const).map((tier) => {
                const t = tierBreakdown[tier]
                return (
                  <tr key={tier} className="border-b border-border/50 transition-colors hover:bg-surface-2">
                    <td className="px-5 py-4">
                      <span className={`font-semibold text-sm capitalize ${tier === 'private' ? 'text-gold' : tier === 'member' ? 'text-blue-400' : 'text-off-white/60'}`}>
                        {tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-off-white/70 text-sm tabular-nums">{(t?.active_users ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-off-white/70 text-sm tabular-nums">{(t?.trade_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4"><span className="text-gold font-bold text-sm tabular-nums">{fmtRevenue(t?.commission_revenue ?? 0)}</span></td>
                    <td className="px-5 py-4 text-off-white/70 text-sm tabular-nums">{fmtRevenue(t?.avg_commission_per_trade ?? 0)}</td>
                    <td className="px-5 py-4 text-off-white/50 text-xs">{t?.commission_display ?? data?.assumptions.commission_rates[tier] ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6-Month Projections */}
      {projections.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-serif text-base font-semibold text-off-white">6-Month Revenue Projection</h2>
            <p className="text-xs text-off-white/40 mt-0.5">
              Based on {data?.assumptions.growth_rate ?? '10% MoM growth'} with current avg commission per trade
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-2 border-b border-border">
                  {['Month', 'Proj. Users', 'Proj. Trades', 'Proj. Commission', 'Growth'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projections.map((row, idx) => (
                  <tr key={row.month} className={`border-b border-border/50 transition-colors hover:bg-surface-2 ${idx % 2 === 1 ? 'bg-surface-2/30' : ''}`}>
                    <td className="px-5 py-3.5 text-off-white font-semibold text-sm">{fmtMonth(row.month)}</td>
                    <td className="px-5 py-3.5 text-off-white/70 text-sm tabular-nums">{row.projected_users.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-off-white/70 text-sm tabular-nums">{row.projected_trades.toLocaleString()}</td>
                    <td className="px-5 py-3.5"><span className="text-gold font-bold text-sm tabular-nums">{fmtRevenue(row.projected_revenue)}</span></td>
                    <td className="px-5 py-3.5 text-off-white/50 text-xs">{row.growth_assumption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border bg-surface-2/20">
            <p className="text-xs text-off-white/30">
              Projections use actual current-period metrics. Assumes {data?.assumptions.growth_rate ?? '10% MoM growth'}.
              Actual results may vary.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
