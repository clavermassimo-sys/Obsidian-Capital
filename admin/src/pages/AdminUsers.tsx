import { useState, useEffect, useCallback } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Users, UserPlus, Star, RefreshCw } from 'lucide-react'
import { adminApi, type AdminUser, type UsersPagination } from '../services/api'

// ── Badge helpers ──────────────────────────────────────────────

function TierBadge({ tier }: { tier: AdminUser['tier'] }) {
  if (tier === 'private') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[rgba(201,168,76,0.1)] text-[#c9a84c]">
      <Star size={9} />PRIVATE
    </span>
  )
  if (tier === 'member') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/30 text-blue-400">MEMBER</span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#2a2a2a] text-[#888]">STANDARD</span>
  )
}

function KYCBadge({ status }: { status: AdminUser['kyc_status'] }) {
  if (status === 'approved') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3d9e6e]/15 text-[#3d9e6e] border border-[#3d9e6e]/20">Approved</span>
  if (status === 'pending') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">Pending</span>
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c0453a]/15 text-[#c0453a] border border-[#c0453a]/20">Rejected</span>
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#2a2a2a] rounded animate-pulse ${className}`} />
}

type TierFilter = 'all' | 'standard' | 'member' | 'private'
const TABS: { key: TierFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'standard', label: 'Standard' },
  { key: 'member', label: 'Member' },
  { key: 'private', label: 'Private' },
]

export default function AdminUsers() {
  const [users, setUsers]             = useState<AdminUser[]>([])
  const [pagination, setPagination]   = useState<UsersPagination | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [tierFilter, setTierFilter]   = useState<TierFilter>('all')
  const [page, setPage]               = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getUsers({
        page,
        limit: 20,
        tier: tierFilter === 'all' ? undefined : tierFilter,
        search: search || undefined,
      })
      setUsers(res.users)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [page, tierFilter, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    setPage(1)
  }, [search, tierFilter])

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Tier', 'KYC Status', 'Buying Power', 'Holdings', 'Trades', 'Commission Generated', 'Joined']
    const rows = users.map((u) => [
      u.id, u.name, u.email, u.tier, u.kyc_status,
      u.buying_power, u.holdings_count, u.trades_count, u.commission_generated,
      new Date(u.created_at).toLocaleDateString('en-US'),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'obsidian-capital-users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">User Management</h1>
          <p className="text-sm text-off-white/40 mt-0.5">Manage accounts, tiers, and KYC status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-off-white/60 hover:text-gold hover:border-gold/30 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={users.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(201,168,76,0.1)] hover:bg-[rgba(201,168,76,0.2)] border border-[rgba(201,168,76,0.3)] rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <Users size={16} className="text-[#c9a84c]" />
          </div>
          <div>
            <div className="text-xs text-[#f0ede8]/40 uppercase tracking-wider">Total Users</div>
            <div className="text-2xl font-bold text-[#f0ede8] mt-0.5">
              {loading ? <Skeleton className="h-7 w-16 inline-block" /> : (pagination?.total ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <UserPlus size={16} className="text-[#3d9e6e]" />
          </div>
          <div>
            <div className="text-xs text-[#f0ede8]/40 uppercase tracking-wider">Showing</div>
            <div className="text-2xl font-bold text-[#f0ede8] mt-0.5">
              {loading ? <Skeleton className="h-7 w-16 inline-block" /> : users.length}
            </div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <Star size={16} className="text-[#c9a84c]" />
          </div>
          <div>
            <div className="text-xs text-[#f0ede8]/40 uppercase tracking-wider">Page</div>
            <div className="text-2xl font-bold text-[#f0ede8] mt-0.5">
              {pagination ? `${pagination.page} / ${pagination.total_pages || 1}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border-b border-[#2a2a2a]">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTierFilter(key); setPage(1) }}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${tierFilter === key ? 'text-[#c9a84c]' : 'text-[#f0ede8]/40 hover:text-[#f0ede8]/70'}`}
            >
              {label}
              {tierFilter === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a84c] rounded-full" />}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f0ede8]/30" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-64 bg-[#111111] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-[#f0ede8] placeholder-[#f0ede8]/30 focus:outline-none focus:border-[rgba(201,168,76,0.5)] transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-loss/10 border border-loss/25 rounded-lg text-sm text-loss">{error}</div>
      )}

      {/* Table */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                {['Name', 'Email', 'Tier', 'KYC', 'Buying Power', 'Trades', 'Commission', 'Joined'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#f0ede8]/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2a2a2a]/50">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-[#f0ede8]/30 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`border-b border-[#2a2a2a]/50 transition-colors hover:bg-[#1a1a1a] ${idx % 2 === 1 ? 'bg-[#1a1a1a]/40' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className={u.tier === 'private' ? 'text-[#c9a84c] font-semibold text-sm' : 'text-[#f0ede8] font-medium text-sm'}>
                        {u.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#f0ede8]/50 text-xs">{u.email}</td>
                    <td className="px-5 py-3.5"><TierBadge tier={u.tier} /></td>
                    <td className="px-5 py-3.5"><KYCBadge status={u.kyc_status} /></td>
                    <td className="px-5 py-3.5 text-[#f0ede8] font-medium text-sm tabular-nums">
                      {u.buying_power > 0 ? `$${u.buying_power.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#f0ede8]/60 text-sm tabular-nums">{u.trades_count}</td>
                    <td className="px-5 py-3.5 text-[#c9a84c] font-semibold text-sm tabular-nums">
                      {u.commission_generated > 0 ? `$${u.commission_generated.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#f0ede8]/40 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#2a2a2a] bg-[#1a1a1a]/30">
            <span className="text-xs text-[#f0ede8]/40">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.has_prev || loading}
                className="w-8 h-8 rounded-md bg-[#222222] border border-[#2a2a2a] flex items-center justify-center text-[#f0ede8]/40 hover:text-[#c9a84c] hover:border-[rgba(201,168,76,0.3)] transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 text-xs text-[#f0ede8]/50">Page {pagination.page} of {pagination.total_pages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.has_next || loading}
                className="w-8 h-8 rounded-md bg-[#222222] border border-[#2a2a2a] flex items-center justify-center text-[#f0ede8]/40 hover:text-[#c9a84c] hover:border-[rgba(201,168,76,0.3)] transition-colors disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
