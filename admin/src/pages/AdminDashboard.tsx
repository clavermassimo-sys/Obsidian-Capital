import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import {
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react'

const userGrowthData = [
  { month: 'Jan', users: 52 },
  { month: 'Feb', users: 68 },
  { month: 'Mar', users: 75 },
  { month: 'Apr', users: 91 },
  { month: 'May', users: 103 },
  { month: 'Jun', users: 118 },
  { month: 'Jul', users: 134 },
  { month: 'Aug', users: 149 },
  { month: 'Sep', users: 163 },
  { month: 'Oct', users: 178 },
  { month: 'Nov', users: 190 },
  { month: 'Dec', users: 207 },
]

const revenueBreakdown = [
  { name: 'Trade Commissions', value: 78, amount: 695811, color: '#c9a84c' },
  { name: 'Private Subscriptions', value: 8, amount: 71396, color: '#3b82f6' },
  { name: 'Margin Interest', value: 6, amount: 53547, color: '#8b5cf6' },
  { name: 'Stock Lending', value: 4, amount: 35698, color: '#3d9e6e' },
  { name: 'Cash Sweep Interest', value: 3, amount: 26774, color: '#f97316' },
  { name: 'Other', value: 1, amount: 8925, color: '#6b7280' },
]

const revenueProjections = [
  { year: 1, users: '1,000', tradesPerUser: 5, avgTrade: '$500', commissionRate: '8.5%', annualRevenue: '$2.55M' },
  { year: 2, users: '10,000', tradesPerUser: 5, avgTrade: '$500', commissionRate: '8.5%', annualRevenue: '$25.5M' },
  { year: 3, users: '50,000', tradesPerUser: 5, avgTrade: '$500', commissionRate: '8.5%', annualRevenue: '$127.5M' },
  { year: 4, users: '100,000', tradesPerUser: 5, avgTrade: '$500', commissionRate: '8.5%', annualRevenue: '$255M' },
  { year: 5, users: '500,000', tradesPerUser: 5, avgTrade: '$500', commissionRate: '8.5%', annualRevenue: '$1.27B' },
]

const recentTrades = [
  { user: 'Marcus Holloway', ticker: 'AAPL', type: 'BUY', shares: 50, price: 189.24, commission: 803.77, total: 9462.00, time: '09:34 AM' },
  { user: 'Vivienne Ashford', ticker: 'NVDA', type: 'SELL', shares: 25, price: 875.60, commission: 1860.15, total: 21890.00, time: '09:41 AM' },
  { user: 'Sebastian Cole', ticker: 'MSFT', type: 'BUY', shares: 30, price: 412.80, commission: 1052.64, total: 12384.00, time: '09:55 AM' },
  { user: 'Eleanor Voss', ticker: 'TSLA', type: 'BUY', shares: 20, price: 247.15, commission: 420.16, total: 4943.00, time: '10:02 AM' },
  { user: 'Dorian Blackwell', ticker: 'AMZN', type: 'SELL', shares: 15, price: 198.30, commission: 252.83, total: 2974.50, time: '10:18 AM' },
  { user: 'Isolde Marchetti', ticker: 'GOOGL', type: 'BUY', shares: 10, price: 174.50, commission: 148.33, total: 1745.00, time: '10:29 AM' },
  { user: 'Caspian Wren', ticker: 'META', type: 'BUY', shares: 12, price: 564.20, commission: 574.28, total: 6770.40, time: '10:44 AM' },
  { user: 'Lysandra Kell', ticker: 'BRK.B', type: 'SELL', shares: 40, price: 375.80, commission: 1277.72, total: 15032.00, time: '11:03 AM' },
  { user: 'Theron Sinclair', ticker: 'JPM', type: 'BUY', shares: 35, price: 213.60, commission: 635.49, total: 7476.00, time: '11:17 AM' },
  { user: 'Seraphina Drake', ticker: 'V', type: 'BUY', shares: 18, price: 274.90, commission: 419.89, total: 4948.20, time: '11:32 AM' },
]

const complianceAlerts = [
  {
    id: 1,
    title: 'FINRA Form BD Annual Update',
    detail: 'Annual broker-dealer registration renewal',
    due: 'March 31, 2026',
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'SEC Reg BI Review',
    detail: 'Best Interest obligation compliance audit',
    due: 'June 30, 2026',
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'AML Suspicious Activity',
    detail: 'User ID: #1089 — Unusual wire transfer pattern detected',
    due: 'Immediate Review',
    status: 'review',
  },
  {
    id: 4,
    title: 'SIPC Assessment',
    detail: 'Q2 2026 Securities Investor Protection Corporation filing',
    due: 'Q2 2026',
    status: 'pending',
  },
]

interface KpiCardProps {
  title: string
  value: string
  sub: string
  icon: React.ElementType
  iconColor?: string
  accent?: boolean
}

function KpiCard({ title, value, sub, icon: Icon, iconColor = 'text-gold', accent = false }: KpiCardProps) {
  return (
    <div className={`bg-surface border ${accent ? 'border-gold/30' : 'border-border'} rounded-lg p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-off-white/50">{title}</span>
        <div className={`w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center`}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <div className={`text-2xl font-bold mb-1 ${accent ? 'text-gold' : 'text-off-white'}`}>{value}</div>
      <div className="text-xs text-off-white/40">{sub}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-xs text-off-white/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gold">{payload[0].value} new users</p>
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { amount: number } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-xs font-semibold text-off-white mb-1">{payload[0].name}</p>
        <p className="text-sm text-gold">{payload[0].value}%</p>
        <p className="text-xs text-off-white/50">${payload[0].payload.amount.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) => {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#f0ede8" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">Admin Dashboard</h1>
          <p className="text-sm text-off-white/40 mt-0.5">Obsidian Capital — Platform Overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-off-white/40">
          <Clock size={13} />
          <span>Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          title="Total Users"
          value="1,247"
          sub="+12 new today"
          icon={Users}
          accent
        />
        <KpiCard
          title="Standard Tier"
          value="892"
          sub="71.5% of all users"
          icon={Users}
          iconColor="text-off-white/50"
        />
        <KpiCard
          title="Member Tier"
          value="298"
          sub="23.9% of all users"
          icon={Users}
          iconColor="text-blue-400"
        />
      </div>

      {/* KPI Cards — Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          title="Private Tier"
          value="57"
          sub="4.6% of all users"
          icon={Users}
          iconColor="text-gold"
        />
        <KpiCard
          title="Today's Commission"
          value="$52,340"
          sub="Across 342 trades"
          icon={DollarSign}
          iconColor="text-gain"
          accent
        />
        <KpiCard
          title="Monthly Revenue"
          value="$892,450"
          sub="+8.4% vs last month"
          icon={TrendingUp}
          iconColor="text-gold"
          accent
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-6">
        {/* User Growth Chart */}
        <div className="col-span-3 bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-base font-semibold text-off-white">User Growth</h2>
              <p className="text-xs text-off-white/40 mt-0.5">Monthly new user registrations — 2025</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gain">
              <ArrowUpRight size={13} />
              <span>+298% YoY</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={userGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#f0ede8', opacity: 0.4, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#c9a84c"
                strokeWidth={2}
                fill="url(#userGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#c9a84c', stroke: '#0a0a0a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Pie Chart */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-6">
          <div className="mb-4">
            <h2 className="font-serif text-base font-semibold text-off-white">Revenue by Stream</h2>
            <p className="text-xs text-off-white/40 mt-0.5">Monthly breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={revenueBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={40}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {revenueBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {revenueBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-off-white/60 truncate" style={{ maxWidth: '110px' }}>{item.name}</span>
                </div>
                <span className="text-off-white/80 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Projections Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-serif text-base font-semibold text-off-white">Revenue Projections</h2>
          <p className="text-xs text-off-white/40 mt-0.5">5-year growth model — 8.5% commission on avg $500 trade</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Users</th>
                <th>Monthly Trades / User</th>
                <th>Avg Trade Value</th>
                <th>Commission Rate</th>
                <th>Annual Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueProjections.map((row, i) => (
                <tr key={row.year} className={i % 2 === 1 ? 'bg-surface-2/30' : ''}>
                  <td>
                    <span className="text-gold font-semibold">Year {row.year}</span>
                  </td>
                  <td className="text-off-white">{row.users}</td>
                  <td className="text-off-white/70">{row.tradesPerUser}</td>
                  <td className="text-off-white/70">{row.avgTrade}</td>
                  <td className="text-off-white/70">{row.commissionRate}</td>
                  <td>
                    <span className="text-gain font-semibold">{row.annualRevenue}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-serif text-base font-semibold text-off-white">Recent Trades</h2>
            <p className="text-xs text-off-white/40 mt-0.5">Last 10 executed trades today</p>
          </div>
          <span className="text-xs text-off-white/30 bg-surface-2 border border-border rounded px-2.5 py-1">
            342 total today
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Ticker</th>
                <th>Type</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Commission</th>
                <th>Total</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, i) => (
                <tr key={i}>
                  <td className="text-off-white font-medium">{trade.user}</td>
                  <td>
                    <span className="font-mono text-gold font-semibold">{trade.ticker}</span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        trade.type === 'BUY'
                          ? 'bg-gain/15 text-gain'
                          : 'bg-loss/15 text-loss'
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="text-off-white/70">{trade.shares}</td>
                  <td className="text-off-white/70">${trade.price.toFixed(2)}</td>
                  <td className="text-gold font-medium">${trade.commission.toFixed(2)}</td>
                  <td className="text-off-white">${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="text-off-white/40 text-xs">{trade.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Alerts */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-gold" />
            <div>
              <h2 className="font-serif text-base font-semibold text-off-white">Compliance Alerts</h2>
              <p className="text-xs text-off-white/40 mt-0.5">Regulatory filings and AML monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-loss">
            <AlertTriangle size={12} />
            <span>1 requires immediate attention</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {complianceAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between px-6 py-4 hover:bg-surface-2 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.status === 'review' ? (
                    <AlertTriangle size={15} className="text-loss" />
                  ) : alert.status === 'complete' ? (
                    <CheckCircle size={15} className="text-gain" />
                  ) : (
                    <Clock size={15} className="text-gold/60" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-off-white">{alert.title}</div>
                  <div className="text-xs text-off-white/40 mt-0.5">{alert.detail}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-6 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs text-off-white/30 mb-1">Due</div>
                  <div className="text-xs font-medium text-off-white/60">{alert.due}</div>
                </div>
                <span
                  className={
                    alert.status === 'upcoming'
                      ? 'status-badge-upcoming'
                      : alert.status === 'review'
                      ? 'status-badge-review'
                      : alert.status === 'pending'
                      ? 'status-badge-pending'
                      : 'status-badge-complete'
                  }
                >
                  {alert.status === 'upcoming'
                    ? 'Upcoming'
                    : alert.status === 'review'
                    ? 'Under Review'
                    : alert.status === 'pending'
                    ? 'Pending'
                    : 'Complete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
