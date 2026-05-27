import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DollarSign, TrendingUp, ArrowUpRight, Calendar } from 'lucide-react'

// ── Mock Data ─────────────────────────────────────────────────

// Jan–Dec 2025, growing from ~$45K to $185K
const monthlyRevenue = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 61000 },
  { month: 'Apr', revenue: 71000 },
  { month: 'May', revenue: 80000 },
  { month: 'Jun', revenue: 91000 },
  { month: 'Jul', revenue: 103000 },
  { month: 'Aug', revenue: 118000 },
  { month: 'Sep', revenue: 130000 },
  { month: 'Oct', revenue: 148000 },
  { month: 'Nov', revenue: 164000 },
  { month: 'Dec', revenue: 185234 },
]

// Revenue streams by month
const revenueByStream = [
  { month: 'Jan', commissions: 32000, subscriptions:  4500, margin: 3200, lending: 2800, cashSweep: 2500 },
  { month: 'Feb', commissions: 37000, subscriptions:  5000, margin: 3700, lending: 3200, cashSweep: 3100 },
  { month: 'Mar', commissions: 43000, subscriptions:  6000, margin: 4400, lending: 3800, cashSweep: 3800 },
  { month: 'Apr', commissions: 50000, subscriptions:  7000, margin: 5000, lending: 4400, cashSweep: 4600 },
  { month: 'May', commissions: 56000, subscriptions:  8000, margin: 5800, lending: 5000, cashSweep: 5200 },
  { month: 'Jun', commissions: 64000, subscriptions:  9000, margin: 6500, lending: 5700, cashSweep: 5800 },
  { month: 'Jul', commissions: 72000, subscriptions: 10500, margin: 7500, lending: 6500, cashSweep: 6500 },
  { month: 'Aug', commissions: 82000, subscriptions: 12000, margin: 8600, lending: 7500, cashSweep: 7900 },
  { month: 'Sep', commissions: 91000, subscriptions: 13500, margin: 9400, lending: 8200, cashSweep: 7900 },
  { month: 'Oct', commissions: 103000, subscriptions: 15000, margin: 10800, lending: 9500, cashSweep: 9700 },
  { month: 'Nov', commissions: 114000, subscriptions: 17000, margin: 12000, lending: 10500, cashSweep: 10500 },
  { month: 'Dec', commissions: 128000, subscriptions: 20000, margin: 14500, lending: 12500, cashSweep: 10234 },
]

// YoY comparison
const yoyComparison = [
  { month: 'Jan', y2024: 22000,  y2025: 45000  },
  { month: 'Feb', y2024: 25000,  y2025: 52000  },
  { month: 'Mar', y2024: 29000,  y2025: 61000  },
  { month: 'Apr', y2024: 33000,  y2025: 71000  },
  { month: 'May', y2024: 38000,  y2025: 80000  },
  { month: 'Jun', y2024: 44000,  y2025: 91000  },
  { month: 'Jul', y2024: 51000,  y2025: 103000 },
  { month: 'Aug', y2024: 59000,  y2025: 118000 },
  { month: 'Sep', y2024: 66000,  y2025: 130000 },
  { month: 'Oct', y2024: 75000,  y2025: 148000 },
  { month: 'Nov', y2024: 84000,  y2025: 164000 },
  { month: 'Dec', y2024: 94000,  y2025: 185234 },
]

// 5-year projections
const projections = [
  { year: 'Year 1 (2026)', users: '2,500',   revenue: '$255,000',       commission: '$178,500',      notes: 'Platform launch' },
  { year: 'Year 2 (2027)', users: '10,000',  revenue: '$2,550,000',     commission: '$1,785,000',    notes: '10K user milestone' },
  { year: 'Year 3 (2028)', users: '50,000',  revenue: '$25,500,000',    commission: '$17,850,000',   notes: 'Series A growth' },
  { year: 'Year 4 (2029)', users: '100,000', revenue: '$127,500,000',   commission: '$89,250,000',   notes: '100K user milestone' },
  { year: 'Year 5 (2030)', users: '250,000', revenue: '$1,000,000,000', commission: '$700,000,000',  notes: '$1B revenue target' },
]

// ── Computed KPIs ─────────────────────────────────────────────

const ytdRevenue   = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)  // 892,450 (ish)
const ytdCommission = revenueByStream.reduce((s, m) => s + m.commissions, 0)
const avgMonthly   = Math.round(ytdRevenue / 12)
const bestMonth    = Math.max(...monthlyRevenue.map((m) => m.revenue))

function fmtRevenue(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

// ── Custom Tooltip ─────────────────────────────────────────────

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
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
  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-off-white">Revenue Analytics</h1>
        <p className="text-sm text-off-white/40 mt-0.5">Financial performance and growth projections</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-gold/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">YTD Revenue</span>
            <DollarSign size={15} className="text-gold" />
          </div>
          <div className="text-2xl font-bold text-gold">${ytdRevenue.toLocaleString('en-US')}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gain">
            <ArrowUpRight size={12} />
            <span>+311% vs 2024</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">YTD Commission</span>
            <TrendingUp size={15} className="text-gain" />
          </div>
          <div className="text-2xl font-bold text-off-white">${ytdCommission.toLocaleString('en-US')}</div>
          <div className="text-xs text-off-white/30 mt-1">{((ytdCommission / ytdRevenue) * 100).toFixed(0)}% of total revenue</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Avg Monthly</span>
            <Calendar size={15} className="text-off-white/40" />
          </div>
          <div className="text-2xl font-bold text-off-white">{fmtRevenue(avgMonthly)}</div>
          <div className="text-xs text-off-white/30 mt-1">Per month in 2025</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Best Month</span>
            <TrendingUp size={15} className="text-gold" />
          </div>
          <div className="text-2xl font-bold text-off-white">${bestMonth.toLocaleString('en-US')}</div>
          <div className="text-xs text-off-white/30 mt-1">December 2025</div>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">Monthly Revenue — 2025</h2>
          <p className="text-xs text-off-white/40 mt-0.5">All revenue streams combined, Jan–Dec 2025</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmtRevenue(v)} tick={axisStyle} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#c9a84c" radius={[3, 3, 0, 0]} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Streams Stacked Bar */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">Revenue by Stream</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Monthly breakdown by revenue category</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueByStream} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmtRevenue(v)} tick={axisStyle} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '11px', color: 'rgba(240,237,232,0.5)' }} />
            <Bar dataKey="commissions"   name="Commissions"    stackId="a" fill="#c9a84c" />
            <Bar dataKey="subscriptions" name="Subscriptions"  stackId="a" fill="#3b82f6" />
            <Bar dataKey="margin"        name="Margin Interest" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="lending"       name="Stock Lending"  stackId="a" fill="#3d9e6e" />
            <Bar dataKey="cashSweep"     name="Cash Sweep"     stackId="a" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* YoY Comparison Line Chart */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">Year-over-Year Comparison</h2>
          <p className="text-xs text-off-white/40 mt-0.5">2024 vs 2025 monthly revenue</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={yoyComparison} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmtRevenue(v)} tick={axisStyle} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '11px', color: 'rgba(240,237,232,0.5)' }} />
            <Line
              type="monotone" dataKey="y2024" name="2024"
              stroke="#6b7280" strokeWidth={2} dot={false} strokeDasharray="4 4"
            />
            <Line
              type="monotone" dataKey="y2025" name="2025"
              stroke="#c9a84c" strokeWidth={2.5} dot={false}
              activeDot={{ r: 4, fill: '#c9a84c', stroke: '#0a0a0a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 5-Year Projections Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-serif text-base font-semibold text-off-white">5-Year Revenue Projections</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Based on 8.5% commission, 5 trades/user/month, avg $500 trade size</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['Year', 'Active Users', 'Projected Revenue', 'Est. Commission', 'Notes'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projections.map((row, idx) => (
                <tr
                  key={row.year}
                  className={`border-b border-border/50 transition-colors hover:bg-surface-2 ${idx % 2 === 1 ? 'bg-surface-2/30' : ''}`}
                >
                  <td className="px-5 py-3.5 text-off-white font-semibold text-sm">{row.year}</td>
                  <td className="px-5 py-3.5 text-off-white/70 text-sm tabular-nums">{row.users}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-gold font-bold text-sm tabular-nums">{row.revenue}</span>
                  </td>
                  <td className="px-5 py-3.5 text-off-white/70 text-sm tabular-nums">{row.commission}</td>
                  <td className="px-5 py-3.5 text-off-white/40 text-xs">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-surface-2/20">
          <p className="text-xs text-off-white/30">
            Projections assume linear user growth, consistent trade frequency, and stable commission rates.
            Actual results may vary.
          </p>
        </div>
      </div>
    </div>
  )
}
