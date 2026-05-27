import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts'
import { DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react'

const monthlyRevenue = [
  { month: 'Jun', revenue: 612000, prev: 480000 },
  { month: 'Jul', revenue: 648000, prev: 510000 },
  { month: 'Aug', revenue: 695000, prev: 540000 },
  { month: 'Sep', revenue: 720000, prev: 575000 },
  { month: 'Oct', revenue: 758000, prev: 610000 },
  { month: 'Nov', revenue: 792000, prev: 650000 },
  { month: 'Dec', revenue: 845000, prev: 698000 },
  { month: 'Jan', revenue: 810000, prev: 720000 },
  { month: 'Feb', revenue: 856000, prev: 748000 },
  { month: 'Mar', revenue: 875000, prev: 768000 },
  { month: 'Apr', revenue: 890000, prev: 792000 },
  { month: 'May', revenue: 892450, prev: 820000 },
]

const stackedData = [
  { month: 'Q1 2025', commissions: 480000, subscriptions: 42000, margin: 32000, lending: 21000, sweep: 16000, other: 5000 },
  { month: 'Q2 2025', commissions: 525000, subscriptions: 46000, margin: 37000, lending: 24000, sweep: 18000, other: 6000 },
  { month: 'Q3 2025', commissions: 612000, subscriptions: 53000, margin: 43000, lending: 29000, sweep: 21000, other: 7000 },
  { month: 'Q4 2025', commissions: 695811, subscriptions: 71396, margin: 53547, lending: 35698, sweep: 26774, other: 8925 },
]

const yoyData = [
  { month: 'Jan', y2024: 310000, y2025: 620000 },
  { month: 'Feb', y2024: 328000, y2025: 648000 },
  { month: 'Mar', y2024: 345000, y2025: 675000 },
  { month: 'Apr', y2024: 362000, y2025: 712000 },
  { month: 'May', y2024: 380000, y2025: 758000 },
  { month: 'Jun', y2024: 398000, y2025: 792000 },
  { month: 'Jul', y2024: 415000, y2025: 825000 },
  { month: 'Aug', y2024: 430000, y2025: 848000 },
  { month: 'Sep', y2024: 448000, y2025: 862000 },
  { month: 'Oct', y2024: 462000, y2025: 875000 },
  { month: 'Nov', y2024: 478000, y2025: 882000 },
  { month: 'Dec', y2024: 495000, y2025: 892450 },
]

const projectionData = [
  { year: 'Y1', revenue: 2550000, milestone: 'Launch' },
  { year: 'Y2', revenue: 25500000, milestone: '10K Users' },
  { year: 'Y3', revenue: 127500000, milestone: '50K Users' },
  { year: 'Y4', revenue: 255000000, milestone: '100K Users' },
  { year: 'Y5', revenue: 1275000000, milestone: '$1B Revenue' },
]

const formatRevenue = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

const RevenueTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-xs text-off-white/50 mb-2 font-semibold">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-off-white/60">{p.name}:</span>
            <span className="text-off-white font-semibold">{formatRevenue(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminRevenue() {
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1].revenue
  const prevMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2].revenue
  const growth = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100

  const annualRevenue2025 = yoyData.reduce((sum, d) => sum + d.y2025, 0)
  const annualRevenue2024 = yoyData.reduce((sum, d) => sum + d.y2024, 0)
  const yoyGrowth = ((annualRevenue2025 - annualRevenue2024) / annualRevenue2024) * 100

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-off-white">Revenue Analytics</h1>
        <p className="text-sm text-off-white/40 mt-0.5">Financial performance and growth projections</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-gold/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Monthly Revenue</span>
            <DollarSign size={15} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-gold">{formatRevenue(currentMonthRevenue)}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gain">
            <ArrowUpRight size={12} />
            <span>+{growth.toFixed(1)}% vs last month</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Annual Revenue 2025</span>
            <TrendingUp size={15} className="text-gain" />
          </div>
          <div className="text-3xl font-bold text-off-white">{formatRevenue(annualRevenue2025)}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gain">
            <ArrowUpRight size={12} />
            <span>+{yoyGrowth.toFixed(1)}% YoY growth</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Avg Monthly Revenue</span>
            <DollarSign size={15} className="text-off-white/40" />
          </div>
          <div className="text-3xl font-bold text-off-white">
            {formatRevenue(Math.round(annualRevenue2025 / 12))}
          </div>
          <div className="text-xs text-off-white/30 mt-1">Per month in 2025</div>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">Monthly Revenue</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Last 12 months — all revenue streams combined</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatRevenue(v)}
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#c9a84c" radius={[3, 3, 0, 0]} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Breakdown Stacked Bar */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">Revenue by Stream (Quarterly)</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Breakdown by revenue category</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stackedData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatRevenue(v)}
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '11px', color: '#f0ede880' }}
            />
            <Bar dataKey="commissions" name="Trade Commissions" stackId="a" fill="#c9a84c" />
            <Bar dataKey="subscriptions" name="Private Subscriptions" stackId="a" fill="#3b82f6" />
            <Bar dataKey="margin" name="Margin Interest" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="lending" name="Stock Lending" stackId="a" fill="#3d9e6e" />
            <Bar dataKey="sweep" name="Cash Sweep" stackId="a" fill="#f97316" />
            <Bar dataKey="other" name="Other" stackId="a" fill="#6b7280" radius={[3, 3, 0, 0]} />
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
          <LineChart data={yoyData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatRevenue(v)}
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '11px', color: '#f0ede880' }} />
            <Line
              type="monotone"
              dataKey="y2024"
              name="2024"
              stroke="#6b7280"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="y2025"
              name="2025"
              stroke="#c9a84c"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#c9a84c', stroke: '#0a0a0a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Projections Chart */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="mb-5">
          <h2 className="font-serif text-base font-semibold text-off-white">5-Year Revenue Projections</h2>
          <p className="text-xs text-off-white/40 mt-0.5">Based on 8.5% commission, 5 trades/user/month, avg $500</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={projectionData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#f0ede8', opacity: 0.5, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatRevenue(v)}
              tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = projectionData.find((d) => d.year === label)
                  return (
                    <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 shadow-xl">
                      <p className="text-xs text-gold font-semibold mb-1">{label}</p>
                      <p className="text-sm font-bold text-off-white">{formatRevenue(payload[0].value as number)}</p>
                      {item && (
                        <p className="text-xs text-off-white/40 mt-1">Milestone: {item.milestone}</p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={1000000000} stroke="#c9a84c" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Bar
              dataKey="revenue"
              name="Projected Revenue"
              fill="#c9a84c"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
        {/* Milestone labels */}
        <div className="flex items-center justify-between mt-4 px-2">
          {projectionData.map((d) => (
            <div key={d.year} className="text-center flex-1">
              <div className="text-xs font-semibold text-gold">{formatRevenue(d.revenue)}</div>
              <div className="text-xs text-off-white/30 mt-0.5">{d.milestone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
