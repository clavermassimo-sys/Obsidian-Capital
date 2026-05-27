import { useState } from 'react'
import { TrendingUp, DollarSign, Activity, Filter, Calendar, Search, Star } from 'lucide-react'

interface AdminTrade {
  id: string
  userId: string
  userName: string
  ticker: string
  companyName: string
  type: 'buy' | 'sell'
  shares: number
  price: number
  commission: number
  total: number
  tier: 'standard' | 'member' | 'private'
  createdAt: string
}

const allTrades: AdminTrade[] = [
  { id: 'T10501', userId: 'U1001', userName: 'Marcus Holloway',  ticker: 'AAPL',  companyName: 'Apple Inc.',           type: 'buy',  shares: 50,  price: 189.24, commission:  803.77, total:  9462.00, tier: 'private',  createdAt: '2025-05-27T09:34:00Z' },
  { id: 'T10502', userId: 'U1002', userName: 'Vivienne Ashford', ticker: 'NVDA',  companyName: 'NVIDIA Corp.',         type: 'sell', shares: 25,  price: 875.60, commission: 1860.15, total: 21890.00, tier: 'private',  createdAt: '2025-05-27T09:41:00Z' },
  { id: 'T10503', userId: 'U1003', userName: 'Sebastian Cole',   ticker: 'MSFT',  companyName: 'Microsoft Corp.',      type: 'buy',  shares: 30,  price: 412.80, commission: 1052.64, total: 12384.00, tier: 'private',  createdAt: '2025-05-27T09:55:00Z' },
  { id: 'T10504', userId: 'U1004', userName: 'Eleanor Voss',     ticker: 'TSLA',  companyName: 'Tesla Inc.',           type: 'buy',  shares: 20,  price: 247.15, commission:  420.16, total:  4943.00, tier: 'private',  createdAt: '2025-05-27T10:02:00Z' },
  { id: 'T10505', userId: 'U1005', userName: 'Dorian Blackwell', ticker: 'AMZN',  companyName: 'Amazon.com',           type: 'sell', shares: 15,  price: 198.30, commission:  252.83, total:  2974.50, tier: 'member',   createdAt: '2025-05-27T10:18:00Z' },
  { id: 'T10506', userId: 'U1006', userName: 'Isolde Marchetti', ticker: 'GOOGL', companyName: 'Alphabet Inc.',        type: 'buy',  shares: 10,  price: 174.50, commission:  148.33, total:  1745.00, tier: 'member',   createdAt: '2025-05-27T10:29:00Z' },
  { id: 'T10507', userId: 'U1007', userName: 'Caspian Wren',     ticker: 'META',  companyName: 'Meta Platforms',       type: 'buy',  shares: 12,  price: 564.20, commission:  574.28, total:  6770.40, tier: 'member',   createdAt: '2025-05-27T10:44:00Z' },
  { id: 'T10508', userId: 'U1008', userName: 'Lysandra Kell',    ticker: 'BRK.B', companyName: 'Berkshire Hathaway',   type: 'sell', shares: 40,  price: 375.80, commission: 1277.72, total: 15032.00, tier: 'member',   createdAt: '2025-05-27T11:03:00Z' },
  { id: 'T10509', userId: 'U1007', userName: 'Caspian Wren',     ticker: 'JPM',   companyName: 'JPMorgan Chase',       type: 'buy',  shares: 35,  price: 213.60, commission:  635.49, total:  7476.00, tier: 'member',   createdAt: '2025-05-27T11:17:00Z' },
  { id: 'T10510', userId: 'U1010', userName: 'Seraphina Drake',  ticker: 'V',     companyName: 'Visa Inc.',            type: 'buy',  shares: 18,  price: 274.90, commission:  419.89, total:  4948.20, tier: 'standard', createdAt: '2025-05-27T11:32:00Z' },
  { id: 'T10511', userId: 'U1011', userName: 'Aldric Harmon',    ticker: 'SPY',   companyName: 'SPDR S&P 500 ETF',    type: 'sell', shares: 8,   price: 549.00, commission:  372.12, total:  4392.00, tier: 'standard', createdAt: '2025-05-27T11:48:00Z' },
  { id: 'T10512', userId: 'U1012', userName: 'Celeste Fontaine', ticker: 'NFLX',  companyName: 'Netflix Inc.',         type: 'buy',  shares: 5,   price: 698.40, commission:  296.82, total:  3492.00, tier: 'standard', createdAt: '2025-05-27T12:05:00Z' },
  { id: 'T10513', userId: 'U1013', userName: 'Oberon Mercer',    ticker: 'AMD',   companyName: 'Advanced Micro Devices', type: 'buy', shares: 22, price: 168.75, commission:  315.08, total:  3712.50, tier: 'standard', createdAt: '2025-05-27T12:19:00Z' },
  { id: 'T10514', userId: 'U1014', userName: 'Isadora Quinn',    ticker: 'COIN',  companyName: 'Coinbase Global',      type: 'sell', shares: 30,  price: 224.50, commission:  572.48, total:  6735.00, tier: 'standard', createdAt: '2025-05-27T12:34:00Z' },
  { id: 'T10515', userId: 'U1001', userName: 'Marcus Holloway',  ticker: 'QQQ',   companyName: 'Invesco QQQ ETF',      type: 'buy',  shares: 15,  price: 480.20, commission:  612.26, total:  7203.00, tier: 'private',  createdAt: '2025-05-27T12:50:00Z' },
  { id: 'T10516', userId: 'U1002', userName: 'Vivienne Ashford', ticker: 'AMZN',  companyName: 'Amazon.com',           type: 'buy',  shares: 45,  price: 198.30, commission:  758.48, total:  8923.50, tier: 'private',  createdAt: '2025-05-27T13:07:00Z' },
  { id: 'T10517', userId: 'U1005', userName: 'Dorian Blackwell', ticker: 'TSLA',  companyName: 'Tesla Inc.',           type: 'sell', shares: 10,  price: 247.15, commission:  210.08, total:  2471.50, tier: 'member',   createdAt: '2025-05-27T13:23:00Z' },
  { id: 'T10518', userId: 'U1007', userName: 'Caspian Wren',     ticker: 'GS',    companyName: 'Goldman Sachs',        type: 'buy',  shares: 8,   price: 512.60, commission:  348.57, total:  4100.80, tier: 'member',   createdAt: '2025-05-27T13:41:00Z' },
  { id: 'T10519', userId: 'U1004', userName: 'Eleanor Voss',     ticker: 'NVDA',  companyName: 'NVIDIA Corp.',         type: 'buy',  shares: 15,  price: 875.60, commission: 1116.39, total: 13134.00, tier: 'private',  createdAt: '2025-05-27T14:05:00Z' },
  { id: 'T10520', userId: 'U1008', userName: 'Lysandra Kell',    ticker: 'AAPL',  companyName: 'Apple Inc.',           type: 'sell', shares: 25,  price: 189.24, commission:  401.89, total:  4731.00, tier: 'member',   createdAt: '2025-05-27T14:22:00Z' },
]

// ── Inline badge helpers ────────────────────────────────────────

function TierBadge({ tier }: { tier: AdminTrade['tier'] }) {
  if (tier === 'private') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[rgba(201,168,76,0.1)] text-[#c9a84c]">
        <Star size={9} />PRIVATE
      </span>
    )
  }
  if (tier === 'member') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/30 text-blue-400">MEMBER</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#2a2a2a] text-[#888]">STANDARD</span>
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function AdminTrades() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [dateFilter, setDateFilter] = useState('2025-05-27')
  const [tickerSearch, setTickerSearch] = useState('')

  const filtered = allTrades.filter((t) => {
    const matchType   = typeFilter === 'all' || t.type === typeFilter
    const matchDate   = dateFilter === '' || t.createdAt.startsWith(dateFilter)
    const matchTicker = tickerSearch === '' || t.ticker.toUpperCase().includes(tickerSearch.toUpperCase())
    return matchType && matchDate && matchTicker
  })

  const totalVolume     = allTrades.reduce((s, t) => s + t.total, 0)
  const totalCommission = allTrades.reduce((s, t) => s + t.commission, 0)

  const filteredVolume     = filtered.reduce((s, t) => s + t.total, 0)
  const filteredCommission = filtered.reduce((s, t) => s + t.commission, 0)

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-off-white">Trade Activity</h1>
        <p className="text-sm text-off-white/40 mt-0.5">All executed trades and commission tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Today's Trades</span>
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
          <div className="text-3xl font-bold text-off-white">$1.24M</div>
          <div className="text-xs text-off-white/30 mt-1">View: ${(filteredVolume / 1000).toFixed(1)}K</div>
        </div>
        <div className="bg-surface border border-gold/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Commission Earned</span>
            <DollarSign size={15} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-gold">$52,340</div>
          <div className="text-xs text-off-white/30 mt-1">View: ${filteredCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Avg Commission %</span>
            <DollarSign size={15} className="text-off-white/40" />
          </div>
          <div className="text-3xl font-bold text-off-white">8.7%</div>
          <div className="text-xs text-off-white/30 mt-1">Blended rate</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Type toggle */}
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-off-white/30" />
          <span className="text-xs text-off-white/30 mr-1">Type:</span>
          {(['all', 'buy', 'sell'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
                typeFilter === t
                  ? t === 'buy'
                    ? 'bg-gain text-white'
                    : t === 'sell'
                    ? 'bg-loss text-white'
                    : 'bg-gold text-obsidian'
                  : 'bg-surface border border-border text-off-white/50 hover:text-off-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Ticker search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30" />
          <input
            type="text"
            placeholder="Ticker…"
            value={tickerSearch}
            onChange={(e) => setTickerSearch(e.target.value)}
            className="pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-xs text-off-white placeholder-off-white/30 focus:outline-none focus:border-gold/50 transition-colors w-28 uppercase"
          />
        </div>

        {/* Date filter */}
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
            <button onClick={() => setDateFilter('')} className="text-xs text-off-white/30 hover:text-loss transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['Time', 'User', 'Ticker', 'Type', 'Shares', 'Price', 'Commission', 'Total', 'Tier'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => (
                <tr key={trade.id} className="border-b border-border/50 transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3 text-off-white/40 text-xs font-mono">{fmtTime(trade.createdAt)}</td>
                  <td className="px-4 py-3 text-off-white font-medium text-sm">{trade.userName}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-gold">{trade.ticker}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide ${
                        trade.type === 'buy'
                          ? 'bg-[#c9a84c] text-[#0a0a0a]'
                          : 'bg-[#c0453a] text-white'
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-off-white/70 text-sm tabular-nums">{trade.shares.toLocaleString()}</td>
                  <td className="px-4 py-3 text-off-white/70 text-sm tabular-nums">${trade.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="text-gold font-semibold text-sm tabular-nums">
                      ${trade.commission.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-off-white font-medium text-sm tabular-nums">
                    ${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3"><TierBadge tier={trade.tier} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commission total footer row */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-border bg-surface-3 font-bold">
          <span className="text-xs text-off-white/50 uppercase tracking-wider">
            {filtered.length} trades in view
          </span>
          <div className="flex items-center gap-6 text-xs">
            <span className="text-off-white/40">
              Volume:{' '}
              <span className="text-off-white font-bold">
                ${filteredVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
            <span className="text-off-white/40">
              Commission Total:{' '}
              <span className="text-gold font-bold">
                ${filteredCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
