/* ============================================================
   Obsidian Capital — Admin Commissions Dashboard
   KPIs, revenue by tier, top users, distribution, history
   ============================================================ */

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  Activity,
  BarChart2,
  Users,
  Sliders,
} from 'lucide-react'

// ── Design tokens ──────────────────────────────────────────────
const GOLD    = '#c9a84c'
const SURFACE = '#111111'
const SURFACE2 = '#1a1a1a'
const BORDER  = '#2a2a2a'
const OFFWHITE = '#f0ede8'

// ── KPI Data ───────────────────────────────────────────────────
const KPIS = [
  { label: 'Total Commissions (All Time)', value: '$892,450', icon: DollarSign, sub: '+12.4% MoM' },
  { label: 'This Month',                   value: '$127,456', icon: TrendingUp,  sub: 'May 2026'   },
  { label: 'Today',                         value: '$8,923',   icon: Activity,    sub: 'May 28'     },
  { label: 'Avg Commission / Trade',        value: '$43.21',   icon: BarChart2,   sub: 'All tiers'  },
  { label: 'Total Trades (Commission)',     value: '20,654',   icon: Users,       sub: 'All time'   },
]

// ── Monthly Revenue by Tier ────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: 'Jan', standard: 18200, member: 34500, private: 42100 },
  { month: 'Feb', standard: 21400, member: 38200, private: 47800 },
  { month: 'Mar', standard: 19800, member: 41000, private: 52300 },
  { month: 'Apr', standard: 24100, member: 43700, private: 56400 },
  { month: 'May', standard: 22900, member: 46300, private: 58200 },
]

// ── Top Revenue Users ──────────────────────────────────────────
const TOP_USERS = [
  { rank: 1,  name: 'Alexander Mercer',   tier: 'private', trades: 412, commission: '$38,420', avg: '$93.25' },
  { rank: 2,  name: 'Victoria Hargrove',  tier: 'private', trades: 389, commission: '$34,890', avg: '$89.69' },
  { rank: 3,  name: 'James Whitfield',    tier: 'private', trades: 361, commission: '$31,250', avg: '$86.57' },
  { rank: 4,  name: 'Sophia Vanderbilt',  tier: 'member',  trades: 621, commission: '$27,840', avg: '$44.83' },
  { rank: 5,  name: 'Richard Ashton',     tier: 'private', trades: 298, commission: '$25,610', avg: '$85.94' },
  { rank: 6,  name: 'Catherine Laurent',  tier: 'member',  trades: 578, commission: '$22,190', avg: '$38.39' },
  { rank: 7,  name: 'Thomas Blackwell',   tier: 'member',  trades: 512, commission: '$19,840', avg: '$38.75' },
  { rank: 8,  name: 'Eleanor Thornton',   tier: 'private', trades: 214, commission: '$18,330', avg: '$85.65' },
  { rank: 9,  name: 'William Castleton',  tier: 'member',  trades: 489, commission: '$16,770', avg: '$34.29' },
  { rank: 10, name: 'Margaret Holloway',  tier: 'standard',trades: 1042, commission: '$14,920', avg: '$14.32' },
]

// ── Tier Distribution ──────────────────────────────────────────
const TIER_DISTRIBUTION = [
  { name: 'Standard', value: 52, color: '#4a4a4a' },
  { name: 'Member',   value: 33, color: '#4f6ef7' },
  { name: 'Private',  value: 15, color: GOLD       },
]

// ── Commission History ─────────────────────────────────────────
type PayStatus = 'Charged' | 'Pending' | 'Failed'

const HISTORY: {
  tradeId: string
  user: string
  ticker: string
  tradeValue: string
  rate: string
  commission: string
  status: PayStatus
  date: string
}[] = [
  { tradeId: 'TRD-029841', user: 'Alexander Mercer',   ticker: 'AAPL', tradeValue: '$42,500', rate: '5.5%', commission: '$2,337',  status: 'Charged', date: 'May 28, 2026' },
  { tradeId: 'TRD-029840', user: 'Sophia Vanderbilt',  ticker: 'NVDA', tradeValue: '$18,200', rate: '8.0%', commission: '$1,456',  status: 'Charged', date: 'May 28, 2026' },
  { tradeId: 'TRD-029839', user: 'Victoria Hargrove',  ticker: 'MSFT', tradeValue: '$31,000', rate: '5.5%', commission: '$1,705',  status: 'Pending', date: 'May 28, 2026' },
  { tradeId: 'TRD-029838', user: 'Margaret Holloway',  ticker: 'TSLA', tradeValue: '$8,400',  rate: '11%',  commission: '$924',    status: 'Charged', date: 'May 27, 2026' },
  { tradeId: 'TRD-029837', user: 'Richard Ashton',     ticker: 'AMZN', tradeValue: '$27,800', rate: '5.5%', commission: '$1,529',  status: 'Charged', date: 'May 27, 2026' },
  { tradeId: 'TRD-029836', user: 'Thomas Blackwell',   ticker: 'GOOG', tradeValue: '$14,600', rate: '8.0%', commission: '$1,168',  status: 'Charged', date: 'May 27, 2026' },
  { tradeId: 'TRD-029835', user: 'Catherine Laurent',  ticker: 'META', tradeValue: '$22,100', rate: '8.0%', commission: '$1,768',  status: 'Charged', date: 'May 26, 2026' },
  { tradeId: 'TRD-029834', user: 'James Whitfield',    ticker: 'SPY',  tradeValue: '$55,000', rate: '5.5%', commission: '$3,025',  status: 'Pending', date: 'May 26, 2026' },
  { tradeId: 'TRD-029833', user: 'Eleanor Thornton',   ticker: 'QQQ',  tradeValue: '$38,400', rate: '5.5%', commission: '$2,112',  status: 'Charged', date: 'May 26, 2026' },
  { tradeId: 'TRD-029832', user: 'William Castleton',  ticker: 'NFLX', tradeValue: '$9,800',  rate: '8.0%', commission: '$784',    status: 'Failed',  date: 'May 25, 2026' },
  { tradeId: 'TRD-029831', user: 'Margaret Holloway',  ticker: 'AMD',  tradeValue: '$5,200',  rate: '11%',  commission: '$572',    status: 'Charged', date: 'May 25, 2026' },
  { tradeId: 'TRD-029830', user: 'Sophia Vanderbilt',  ticker: 'CRM',  tradeValue: '$16,700', rate: '8.0%', commission: '$1,336',  status: 'Charged', date: 'May 25, 2026' },
  { tradeId: 'TRD-029829', user: 'Alexander Mercer',   ticker: 'TSLA', tradeValue: '$48,200', rate: '5.5%', commission: '$2,651',  status: 'Charged', date: 'May 24, 2026' },
  { tradeId: 'TRD-029828', user: 'Richard Ashton',     ticker: 'AAPL', tradeValue: '$33,600', rate: '5.5%', commission: '$1,848',  status: 'Pending', date: 'May 24, 2026' },
  { tradeId: 'TRD-029827', user: 'Victoria Hargrove',  ticker: 'NVDA', tradeValue: '$29,100', rate: '5.5%', commission: '$1,600',  status: 'Charged', date: 'May 24, 2026' },
]

// ── Sub-components ─────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, sub }: typeof KPIS[0]) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider font-sans" style={{ color: `${OFFWHITE}60` }}>
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${GOLD}15` }}
        >
          <Icon size={16} style={{ color: GOLD }} />
        </div>
      </div>
      <p className="text-2xl font-mono font-bold" style={{ color: OFFWHITE }}>
        {value}
      </p>
      <p className="text-xs font-sans" style={{ color: `${OFFWHITE}40` }}>
        {sub}
      </p>
    </div>
  )
}

const STATUS_STYLES: Record<PayStatus, { bg: string; border: string; text: string }> = {
  Charged: { bg: 'rgba(61,158,110,0.1)', border: 'rgba(61,158,110,0.2)', text: '#3d9e6e' },
  Pending: { bg: `${GOLD}18`,            border: `${GOLD}30`,            text: GOLD      },
  Failed:  { bg: 'rgba(192,69,58,0.1)',   border: 'rgba(192,69,58,0.2)', text: '#c0453a' },
}

const TIER_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  private:  { text: GOLD,              bg: `${GOLD}12`,            border: `${GOLD}30` },
  member:   { text: '#818cf8',         bg: 'rgba(79,110,247,0.1)', border: 'rgba(79,110,247,0.2)' },
  standard: { text: `${OFFWHITE}60`,   bg: `${OFFWHITE}08`,        border: BORDER },
}

// ── Custom Recharts Tooltip ────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border p-3 text-xs font-sans space-y-1" style={{ background: '#1a1a1a', borderColor: BORDER }}>
      <p className="font-medium mb-2" style={{ color: OFFWHITE }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: `${OFFWHITE}60` }}>{p.name}</span>
          </div>
          <span className="font-mono" style={{ color: OFFWHITE }}>
            ${p.value.toLocaleString()}
          </span>
        </div>
      ))}
      <div className="border-t pt-1 flex justify-between font-medium mt-1" style={{ borderColor: BORDER }}>
        <span style={{ color: `${OFFWHITE}60` }}>Total</span>
        <span className="font-mono" style={{ color: GOLD }}>
          ${(payload.reduce((s, p) => s + p.value, 0)).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// ── Projected Revenue ──────────────────────────────────────────

function ProjectedRevenue() {
  const [growth, setGrowth] = useState(10)

  const baseMonthly = 127456
  const projected = baseMonthly * (1 + growth / 100)
  const projected12 = projected * 12

  return (
    <div
      className="rounded-xl border p-6 space-y-5"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div className="flex items-center gap-2">
        <Sliders size={16} style={{ color: GOLD }} />
        <h3 className="text-sm font-semibold font-sans" style={{ color: OFFWHITE }}>
          Projected Revenue
        </h3>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-sans" style={{ color: `${OFFWHITE}50` }}>
            Projected User Growth
          </label>
          <span className="text-xs font-mono font-semibold" style={{ color: GOLD }}>
            +{growth}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={growth}
          onChange={(e) => setGrowth(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${GOLD} ${growth}%, ${BORDER} ${growth}%)`,
          }}
        />
        <div className="flex justify-between text-xs mt-1 font-mono" style={{ color: `${OFFWHITE}25` }}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-4 text-center" style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-sans mb-1" style={{ color: `${OFFWHITE}40` }}>
            Next Month
          </p>
          <p className="text-xl font-mono font-bold" style={{ color: OFFWHITE }}>
            ${projected.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-lg p-4 text-center" style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-sans mb-1" style={{ color: `${OFFWHITE}40` }}>
            Next 12 Months
          </p>
          <p className="text-xl font-mono font-bold" style={{ color: GOLD }}>
            ${(projected12 / 1_000_000).toFixed(2)}M
          </p>
        </div>
      </div>
      <p className="text-xs font-sans" style={{ color: `${OFFWHITE}25` }}>
        * Based on current avg commission/trade and projected user growth applied to this month's
        volume.
      </p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminCommissions() {
  return (
    <div className="space-y-8 p-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-bold tracking-[0.3em] uppercase font-sans mb-1" style={{ color: `${GOLD}80` }}>
          ADMIN
        </p>
        <h1 className="font-serif text-3xl font-medium" style={{ color: OFFWHITE }}>
          Commission Revenue
        </h1>
        <p className="text-sm font-sans mt-1" style={{ color: `${OFFWHITE}50` }}>
          Real-time commission analytics and revenue reporting
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {KPIS.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Revenue by Tier Chart + Projected Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stacked bar chart — 2/3 width */}
        <div
          className="lg:col-span-2 rounded-xl border p-6"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <h3 className="text-sm font-semibold font-sans mb-4" style={{ color: OFFWHITE }}>
            Monthly Revenue by Tier
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={MONTHLY_REVENUE}
              barCategoryGap="28%"
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke={BORDER} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: `${OFFWHITE}50`, fontSize: 11, fontFamily: 'sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: `${OFFWHITE}50`, fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `${OFFWHITE}05` }} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'sans-serif', paddingTop: 12 }}
                formatter={(value: string) =>
                  <span style={{ color: `${OFFWHITE}60` }}>{value}</span>
                }
              />
              <Bar dataKey="standard" name="Standard" stackId="a" fill="#4a4a4a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="member"   name="Member"   stackId="a" fill="#4f6ef7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="private"  name="Private"  stackId="a" fill={GOLD}    radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projected Revenue — 1/3 width */}
        <ProjectedRevenue />
      </div>

      {/* Top Users + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top users table — 2/3 */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <h3 className="text-sm font-semibold font-sans" style={{ color: OFFWHITE }}>
              Top Revenue-Generating Users
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Rank', 'Name', 'Tier', 'Trades', 'Commission', 'Avg / Trade'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 font-medium uppercase tracking-wider font-sans"
                      style={{ color: `${OFFWHITE}40` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_USERS.map((u) => {
                  const ts = TIER_STYLES[u.tier]
                  return (
                    <tr
                      key={u.rank}
                      className="transition-colors"
                      style={{ borderBottom: `1px solid ${BORDER}50` }}
                    >
                      <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}40` }}>
                        {u.rank}
                      </td>
                      <td
                        className="py-3 px-4 font-sans font-medium"
                        style={{ color: u.tier === 'private' ? GOLD : OFFWHITE }}
                      >
                        {u.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-sans border capitalize"
                          style={{ color: ts.text, background: ts.bg, borderColor: ts.border }}
                        >
                          {u.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}70` }}>
                        {u.trades.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold" style={{ color: OFFWHITE }}>
                        {u.commission}
                      </td>
                      <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}60` }}>
                        {u.avg}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie chart — 1/3 */}
        <div
          className="rounded-xl border p-6"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <h3 className="text-sm font-semibold font-sans mb-4" style={{ color: OFFWHITE }}>
            Trades by Tier
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={TIER_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {TIER_DISTRIBUTION.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Share']}
                contentStyle={{
                  background: SURFACE2,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  fontSize: 11,
                }}
                itemStyle={{ color: OFFWHITE }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {TIER_DISTRIBUTION.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs font-sans capitalize" style={{ color: `${OFFWHITE}60` }}>
                    {t.name}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: OFFWHITE }}>
                  {t.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission History Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
          <h3 className="text-sm font-semibold font-sans" style={{ color: OFFWHITE }}>
            Commission History
          </h3>
          <span className="text-xs font-sans" style={{ color: `${OFFWHITE}40` }}>
            Last 15 transactions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
                {['Trade ID', 'User', 'Ticker', 'Trade Value', 'Rate', 'Commission', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 font-medium uppercase tracking-wider font-sans"
                    style={{ color: `${OFFWHITE}40` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((row) => {
                const ss = STATUS_STYLES[row.status]
                return (
                  <tr
                    key={row.tradeId}
                    className="transition-colors hover:opacity-80"
                    style={{ borderBottom: `1px solid ${BORDER}40` }}
                  >
                    <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}50` }}>
                      {row.tradeId}
                    </td>
                    <td className="py-3 px-4 font-sans" style={{ color: OFFWHITE }}>
                      {row.user}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold" style={{ color: GOLD }}>
                      {row.ticker}
                    </td>
                    <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}70` }}>
                      {row.tradeValue}
                    </td>
                    <td className="py-3 px-4 font-mono" style={{ color: `${OFFWHITE}60` }}>
                      {row.rate}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold" style={{ color: OFFWHITE }}>
                      {row.commission}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-1 rounded-full font-sans border"
                        style={{ color: ss.text, background: ss.bg, borderColor: ss.border }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans" style={{ color: `${OFFWHITE}40` }}>
                      {row.date}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
