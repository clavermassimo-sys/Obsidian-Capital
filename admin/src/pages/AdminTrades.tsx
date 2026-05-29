import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, DollarSign, Activity, Filter, Search, RefreshCw, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi, type AdminTrade, type UsersPagination } from '../services/api'

function TierBadge({ tier }: { tier: AdminTrade['user_tier'] }) {
  if (tier === 'private') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[rgba(201,168,76,0.1)] text-[#c9a84c]"><Star size={9} />PRIVATE</span>
  if (tier === 'member') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/30 text-blue-400">MEMBER</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#2a2a2a] text-[#888]">STANDARD</span>
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-surface-2 rounded animate-pulse ${className}`} />
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function AdminTrades() {
  const [trades, setTrades]           = useState<AdminTrade[]>([])
  const [pagination, setPagination]   = useState<UsersPagination | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [typeFilter, setTypeFilter]   = useState<'all' | 'buy' | 'sell'>('all')
  const [tickerSearch, setTickerSearch] = useState('')
  const [page, setPage]               = useState(1)

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getTrades({
        page,
        limit: 25,
        type: typeFilter === 'all' ? undefined : typeFilter,
        ticker: tickerSearch.trim() || undefined,
      })
      setTrades(res.trades)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load trades.')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, tickerSearch])

  useEffect(() => { fetchTrades() }, [fetchTrades])
  useEffect(() => { setPage(1) }, [typeFilter, tickerSearch])

  const totalVolume     = trades.reduce((s, t) => s + t.total, 0)
  const totalCommission = trades.reduce((s, t) => s + t.commission, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-off-white">Trade Activity</h1>
        <p className="text-sm text-off-white/40 mt-0.5">All executed trades and commission tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Total Trades</span>
            <Activity size={15} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-off-white">
            {loading ? <Skeleton className="h-9 w-20" /> : (pagination?.total ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-off-white/30 mt-1">On platform</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">View Volume</span>
            <TrendingUp size={15} className="text-gain" />
          </div>
          <div className="text-3xl font-bold text-off-white">
            {loading ? <Skeleton className="h-9 w-24" /> : `$${(totalVolume / 1000).toFixed(1)}K`}
          </div>
          <div className="text-xs text-off-white/30 mt-1">{trades.length} trades shown</div>
        </div>
        <div className="bg-surface border border-gold/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">View Commission</span>
            <DollarSign size={15} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-gold">
            {loading ? <Skeleton className="h-9 w-24" /> : `$${totalCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          </div>
          <div className="text-xs text-off-white/30 mt-1">Current view</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-off-white/40">Avg Commission</span>
            <DollarSign size={15} className="text-off-white/40" />
          </div>
          <div className="text-3xl font-bold text-off-white">
            {loading ? <Skeleton className="h-9 w-20" /> :
              trades.length > 0 ? `$${(totalCommission / trades.length).toFixed(2)}` : '—'}
          </div>
          <div className="text-xs text-off-white/30 mt-1">Per trade (view)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-off-white/30" />
          <span className="text-xs text-off-white/30 mr-1">Type:</span>
          {(['all', 'buy', 'sell'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
                typeFilter === t
                  ? t === 'buy' ? 'bg-gain text-white' : t === 'sell' ? 'bg-loss text-white' : 'bg-gold text-obsidian'
                  : 'bg-surface border border-border text-off-white/50 hover:text-off-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
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
        <button
          onClick={fetchTrades}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-off-white/60 hover:text-gold hover:border-gold/30 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-loss/10 border border-loss/25 rounded-lg text-sm text-loss">{error}</div>
      )}

      {/* Table */}
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
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-off-white/30 text-sm">
                    No trades found — platform ready for trading
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 transition-colors hover:bg-surface-2">
                    <td className="px-4 py-3 text-off-white/40 text-xs font-mono">{fmtTime(trade.created_at)}</td>
                    <td className="px-4 py-3 text-off-white font-medium text-sm">{trade.user_name}</td>
                    <td className="px-4 py-3"><span className="font-mono font-semibold text-gold">{trade.ticker}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide ${trade.type === 'buy' ? 'bg-[#c9a84c] text-[#0a0a0a]' : 'bg-[#c0453a] text-white'}`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-off-white/70 text-sm tabular-nums">{trade.shares.toLocaleString()}</td>
                    <td className="px-4 py-3 text-off-white/70 text-sm tabular-nums">${trade.price.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className="text-gold font-semibold text-sm tabular-nums">${trade.commission.toFixed(2)}</span></td>
                    <td className="px-4 py-3 text-off-white font-medium text-sm tabular-nums">${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3"><TierBadge tier={trade.user_tier} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-border bg-surface-3 font-bold">
          <div className="flex items-center gap-2">
            {pagination && (
              <>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.has_prev || loading}
                  className="w-7 h-7 rounded bg-surface-2 border border-border flex items-center justify-center text-off-white/40 hover:text-gold disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-xs text-off-white/40">Page {pagination.page} of {pagination.total_pages || 1}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.has_next || loading}
                  className="w-7 h-7 rounded bg-surface-2 border border-border flex items-center justify-center text-off-white/40 hover:text-gold disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={13} />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span className="text-off-white/40">
              Volume: <span className="text-off-white font-bold">${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </span>
            <span className="text-off-white/40">
              Commission: <span className="text-gold font-bold">${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
