import { useState } from 'react'
import { TrendingUp, DollarSign, Activity, Filter, Calendar } from 'lucide-react'

type TradeType = 'BUY' | 'SELL'

interface Trade {
  id: number
  user: string
  ticker: string
  type: TradeType
  shares: number
  price: number
  commission: number
  total: number
  time: string
  date: string
}

const allTrades: Trade[] = [
  { id: 10501, user: 'Marcus Holloway', ticker: 'AAPL', type: 'BUY', shares: 50, price: 189.24, commission: 803.77, total: 9462.00, time: '09:34 AM', date: '2025-05-27' },
  { id: 10502, user: 'Vivienne Ashford', ticker: 'NVDA', type: 'SELL', shares: 25, price: 875.60, commission: 1860.15, total: 21890.00, time: '09:41 AM', date: '2025-05-27' },
  { id: 10503, user: 'Sebastian Cole', ticker: 'MSFT', type: 'BUY', shares: 30, price: 412.80, commission: 1052.64, total: 12384.00, time: '09:55 AM', date: '2025-05-27' },
  { id: 10504, user: 'Eleanor Voss', ticker: 'TSLA', type: 'BUY', shares: 20, price: 247.15, commission: 420.16, total: 4943.00, time: '10:02 AM', date: '2025-05-27' },
  { id: 10505, user: 'Dorian Blackwell', ticker: 'AMZN', type: 'SELL', shares: 15, price: 198.30, commission: 252.83, total: 2974.50, time: '10:18 AM', date: '2025-05-27' },
  { id: 10506, user: 'Isolde Marchetti', ticker: 'GOOGL', type: 'BUY', shares: 10, price: 174.50, commission: 148.33, total: 1745.00, time: '10:29 AM', date: '2025-05-27' },
  { id: 10507, user: 'Caspian Wren', ticker: 'META', type: 'BUY', shares: 12, price: 564.20, commission: 574.28, total: 6770.40, time: '10:44 AM', date: '2025-05-27' },
  { id: 10508, user: 'Lysandra Kell', ticker: 'BRK.B', type: 'SELL', shares: 40, price: 375.80, commission: 1277.72, total: 15032.00, time: '11:03 AM', date: '2025-05-27' },
  { id: 10509, user: 'Theron Sinclair', ticker: 'JPM', type: 'BUY', shares: 35, price: 213.60, commission: 635.49, total: 7476.00, time: '11:17 AM', date: '2025-05-27' },
  { id: 10510, user: 'Seraphina Drake', ticker: 'V', type: 'BUY', shares: 18, price: 274.90, commission: 419.89, total: 4948.20, time: '11:32 AM', date: '2025-05-27' },
  { id: 10511, user: 'Aldric Harmon', ticker: 'SPY', type: 'SELL', shares: 8, price: 549.00, commission: 372.12, total: 4392.00, time: '11:48 AM', date: '2025-05-27' },
  { id: 10512, user: 'Celeste Fontaine', ticker: 'NFLX', type: 'BUY', shares: 5, price: 698.40, commission: 296.82, total: 3492.00, time: '12:05 PM', date: '2025-05-27' },
  { id: 10513, user: 'Oberon Mercer', ticker: 'AMD', type: 'BUY', shares: 22, price: 168.75, commission: 315.08, total: 3712.50, time: '12:19 PM', date: '2025-05-27' },
  { id: 10514, user: 'Isadora Quinn', ticker: 'COIN', type: 'SELL', shares: 30, price: 224.50, commission: 572.48, total: 6735.00, time: '12:34 PM', date: '2025-05-27' },
  { id: 10515, user: 'Marcus Holloway', ticker: 'QQQ', type: 'BUY', shares: 15, price: 480.20, commission: 612.26, total: 7203.00, time: '12:50 PM', date: '2025-05-27' },
  { id: 10516, user: 'Vivienne Ashford', ticker: 'AMZN', type: 'BUY', shares: 45, price: 198.30, commission: 758.48, total: 8923.50, time: '01:07 PM', date: '2025-05-27' },
  { id: 10517, user: 'Dorian Blackwell', ticker: 'TSLA', type: 'SELL', shares: 10, price: 247.15, commission: 210.08, total: 2471.50, time: '01:23 PM', date: '2025-05-27' },
  { id: 10518, user: 'Caspian Wren', ticker: 'GS', type: 'BUY', shares: 8, price: 512.60, commission: 348.57, total: 4100.80, time: '01:41 PM', date: '2025-05-27' },
  { id: 10519, user: 'Eleanor Voss', ticker: 'NVDA', type: 'BUY', shares: 15, price: 875.60, commission: 1116.39, total: 13134.00, time: '02:05 PM', date: '2025-05-27' },
  { id: 10520, user: 'Lysandra Kell', ticker: 'AAPL', type: 'SELL', shares: 25, price: 189.24, commission: 401.89, total: 4731.00, time: '02:22 PM', date: '2025-05-27' },
]

const totalVolume = allTrades.reduce((sum, t) => sum + t.total, 0)
const totalCommission = allTrades.reduce((sum, t) => sum + t.commission, 0)

export default function AdminTrades() {
  const [typeFilter, setTypeFilter] = useState<'All' | TradeType>('All')
  const [dateFilter, setDateFilter] = useState('2025-05-27')

  const filtered = allTrades.filter((t) => {
    const matchType = typeFilter === 'All' || t.type === typeFilter
    const matchDate = dateFilter === '' || t.date === dateFilter
    return matchType && matchDate
  })

  const filteredVolume = filtered.reduce((sum, t) => sum + t.total, 0)
  const filteredCommission = filtered.reduce((sum, t) => sum + t.commission, 0)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-off-white">Trade Activity</h1>
        <p className="text-sm text-off-white/40 mt-0.5">All executed trades and commission tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Total Trades Today</span>
            <Activity size={15} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-off-white">342</div>
          <div className="text-xs text-off-white/30 mt-1">Showing {filtered.length} in view</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Total Volume</span>
            <TrendingUp size={15} className="text-gain" />
          </div>
          <div className="text-3xl font-bold text-off-white">
            ${(filteredVolume / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-off-white/30 mt-1">
            Full day: ${(totalVolume / 1000000).toFixed(2)}M
          </div>
        </div>
        <div className="bg-surface border border-gold/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Total Commission</span>
            <DollarSign size={15} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-gold">
            ${filteredCommission.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-off-white/30 mt-1">
            Full day: ${totalCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-off-white/30" />
          <span className="text-xs text-off-white/30 mr-1">Type:</span>
          {(['All', 'BUY', 'SELL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? t === 'BUY'
                    ? 'bg-gain text-white'
                    : t === 'SELL'
                    ? 'bg-loss text-white'
                    : 'bg-gold text-obsidian'
                  : 'bg-surface border border-border text-off-white/50 hover:text-off-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Calendar size={13} className="text-off-white/30" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-off-white/70 focus:outline-none focus:border-gold/50 transition-colors"
            style={{ colorScheme: 'dark' }}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-off-white/30 hover:text-loss transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>User</th>
                <th>Ticker</th>
                <th>Type</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Commission</th>
                <th>Total Value</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => (
                <tr key={trade.id}>
                  <td className="text-off-white/30 font-mono text-xs">#{trade.id}</td>
                  <td className="text-off-white font-medium">{trade.user}</td>
                  <td>
                    <span className="font-mono font-semibold text-gold">{trade.ticker}</span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide ${
                        trade.type === 'BUY'
                          ? 'bg-gain/15 text-gain border border-gain/20'
                          : 'bg-loss/15 text-loss border border-loss/20'
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="text-off-white/70">{trade.shares.toLocaleString()}</td>
                  <td className="text-off-white/70">${trade.price.toFixed(2)}</td>
                  <td>
                    <span className="text-gold font-semibold">
                      ${trade.commission.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-off-white font-medium">
                    ${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-off-white/40 text-xs">{trade.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-2/30">
          <span className="text-xs text-off-white/40">
            {filtered.length} trades displayed
          </span>
          <div className="text-xs text-off-white/40">
            Commission total:{' '}
            <span className="text-gold font-semibold">
              ${filteredCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
