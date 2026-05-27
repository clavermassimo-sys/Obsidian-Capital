import { useState } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Users, UserPlus, Star } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  tier: 'standard' | 'member' | 'private'
  kycStatus: 'verified' | 'pending' | 'failed'
  portfolioValue: number
  buyingPower: number
  joinedAt: string
  tradesCount: number
}

const mockUsers: AdminUser[] = [
  { id: 'U1001', name: 'Marcus Holloway',    email: 'marcus.holloway@gmail.com',        tier: 'private',  kycStatus: 'verified', portfolioValue: 2847500, buyingPower: 418200, joinedAt: '2024-01-15', tradesCount: 284 },
  { id: 'U1002', name: 'Vivienne Ashford',   email: 'v.ashford@ashfordventures.com',    tier: 'private',  kycStatus: 'verified', portfolioValue: 5120000, buyingPower: 890000, joinedAt: '2024-01-22', tradesCount: 512 },
  { id: 'U1003', name: 'Sebastian Cole',     email: 'scole@protonmail.com',             tier: 'private',  kycStatus: 'verified', portfolioValue: 1380000, buyingPower: 225000, joinedAt: '2024-02-08', tradesCount: 196 },
  { id: 'U1004', name: 'Eleanor Voss',       email: 'eleanor.voss@vossgroup.com',       tier: 'private',  kycStatus: 'verified', portfolioValue: 3600000, buyingPower: 540000, joinedAt: '2024-02-14', tradesCount: 330 },
  { id: 'U1005', name: 'Dorian Blackwell',   email: 'dorian@blackwellfamily.net',       tier: 'member',   kycStatus: 'verified', portfolioValue:  284000, buyingPower:  45000, joinedAt: '2024-03-01', tradesCount:  87 },
  { id: 'U1006', name: 'Isolde Marchetti',   email: 'isolde.m@marchetti-co.it',         tier: 'member',   kycStatus: 'verified', portfolioValue:  192000, buyingPower:  28000, joinedAt: '2024-03-19', tradesCount:  54 },
  { id: 'U1007', name: 'Caspian Wren',       email: 'caspian.wren@icloud.com',          tier: 'member',   kycStatus: 'verified', portfolioValue:  445000, buyingPower:  72000, joinedAt: '2024-04-05', tradesCount: 143 },
  { id: 'U1008', name: 'Lysandra Kell',      email: 'lkell@kell-financial.com',         tier: 'member',   kycStatus: 'verified', portfolioValue:  318000, buyingPower:  58000, joinedAt: '2024-04-22', tradesCount:  98 },
  { id: 'U1009', name: 'Theron Sinclair',    email: 'theron.sinclair@outlook.com',      tier: 'member',   kycStatus: 'pending',  portfolioValue:   87500, buyingPower:  14000, joinedAt: '2024-05-10', tradesCount:  21 },
  { id: 'U1010', name: 'Seraphina Drake',    email: 'sera.drake@gmail.com',             tier: 'standard', kycStatus: 'verified', portfolioValue:   42800, buyingPower:   8500, joinedAt: '2024-05-28', tradesCount:  34 },
  { id: 'U1011', name: 'Aldric Harmon',      email: 'aldric.h@harmon.dev',              tier: 'standard', kycStatus: 'verified', portfolioValue:   18200, buyingPower:   3200, joinedAt: '2024-06-12', tradesCount:  12 },
  { id: 'U1012', name: 'Celeste Fontaine',   email: 'cfontaine@yahoo.com',              tier: 'standard', kycStatus: 'verified', portfolioValue:   29600, buyingPower:   5100, joinedAt: '2024-06-30', tradesCount:  19 },
  { id: 'U1013', name: 'Oberon Mercer',      email: 'oberon.mercer@proton.me',          tier: 'standard', kycStatus: 'pending',  portfolioValue:   12400, buyingPower:   1800, joinedAt: '2024-07-14', tradesCount:   7 },
  { id: 'U1014', name: 'Isadora Quinn',      email: 'iquinn@gmail.com',                 tier: 'standard', kycStatus: 'verified', portfolioValue:   54200, buyingPower:   9600, joinedAt: '2024-07-28', tradesCount:  41 },
  { id: 'U1015', name: 'Remy Devereux',      email: 'remy.devereux@me.com',             tier: 'standard', kycStatus: 'failed',   portfolioValue:       0, buyingPower:      0, joinedAt: '2024-08-05', tradesCount:   0 },
]

// ── Inline badge helpers ────────────────────────────────────────

function TierBadge({ tier }: { tier: AdminUser['tier'] }) {
  if (tier === 'private') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[rgba(201,168,76,0.1)] text-[#c9a84c]">
        <Star size={9} />
        PRIVATE
      </span>
    )
  }
  if (tier === 'member') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/30 text-blue-400">
        MEMBER
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#2a2a2a] text-[#888]">
      STANDARD
    </span>
  )
}

function KYCBadge({ status }: { status: AdminUser['kycStatus'] }) {
  if (status === 'verified') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3d9e6e]/15 text-[#3d9e6e] border border-[#3d9e6e]/20">Verified</span>
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">Pending</span>
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c0453a]/15 text-[#c0453a] border border-[#c0453a]/20">Failed</span>
}

function formatPortfolio(value: number) {
  if (value === 0) return '—'
  return '$' + value.toLocaleString('en-US')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsers() {
  const [search, setSearch]     = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'standard' | 'member' | 'private'>('all')

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchTier = tierFilter === 'all' || u.tier === tierFilter
    return matchSearch && matchTier
  })

  const counts = {
    all:      mockUsers.length,
    standard: mockUsers.filter((u) => u.tier === 'standard').length,
    member:   mockUsers.filter((u) => u.tier === 'member').length,
    private:  mockUsers.filter((u) => u.tier === 'private').length,
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Tier', 'KYC Status', 'Portfolio Value', 'Buying Power', 'Joined', 'Trades']
    const rows = mockUsers.map((u) => [
      u.id, u.name, u.email, u.tier, u.kycStatus,
      u.portfolioValue, u.buyingPower, u.joinedAt, u.tradesCount,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'obsidian-capital-users.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  type TabKey = 'all' | 'standard' | 'member' | 'private'
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'standard', label: 'Standard' },
    { key: 'member',   label: 'Member' },
    { key: 'private',  label: 'Private' },
  ]

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">User Management</h1>
          <p className="text-sm text-off-white/40 mt-0.5">Manage accounts, tiers, and KYC status</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[rgba(201,168,76,0.1)] hover:bg-[rgba(201,168,76,0.2)] border border-[rgba(201,168,76,0.3)] rounded-lg text-sm text-[#c9a84c] font-medium transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <Users size={16} className="text-[#c9a84c]" />
          </div>
          <div>
            <div className="text-xs text-[#f0ede8]/40 uppercase tracking-wider">Total Users</div>
            <div className="text-2xl font-bold text-[#f0ede8] mt-0.5">1,247</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <UserPlus size={16} className="text-[#3d9e6e]" />
          </div>
          <div>
            <div className="text-xs text-[#f0ede8]/40 uppercase tracking-wider">Today's Signups</div>
            <div className="text-2xl font-bold text-[#f0ede8] mt-0.5">12</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <Star size={16} className="text-[#c9a84c]" />
          </div>
          <div>
            <div className="text-xs text-[#f0ede8]/40 uppercase tracking-wider">Private Tier</div>
            <div className="text-2xl font-bold text-[#f0ede8] mt-0.5">57</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex items-center gap-4">
        {/* Tabs */}
        <div className="flex items-center border-b border-[#2a2a2a]">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTierFilter(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                tierFilter === key
                  ? 'text-[#c9a84c]'
                  : 'text-[#f0ede8]/40 hover:text-[#f0ede8]/70'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-60">{counts[key]}</span>
              {tierFilter === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a84c] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f0ede8]/30" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-[#111111] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-[#f0ede8] placeholder-[#f0ede8]/30 focus:outline-none focus:border-[rgba(201,168,76,0.5)] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                {['Name', 'Email', 'Tier', 'KYC', 'Portfolio Value', 'Buying Power', 'Joined', 'Trades'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#f0ede8]/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`border-b border-[#2a2a2a]/50 transition-colors hover:bg-[#1a1a1a] ${idx % 2 === 1 ? 'bg-[#1a1a1a]/40' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <span className={user.tier === 'private' ? 'text-[#c9a84c] font-semibold text-sm' : 'text-[#f0ede8] font-medium text-sm'}>
                      {user.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#f0ede8]/50 text-xs">{user.email}</td>
                  <td className="px-5 py-3.5"><TierBadge tier={user.tier} /></td>
                  <td className="px-5 py-3.5"><KYCBadge status={user.kycStatus} /></td>
                  <td className="px-5 py-3.5 text-[#f0ede8] font-medium text-sm tabular-nums">{formatPortfolio(user.portfolioValue)}</td>
                  <td className="px-5 py-3.5 text-[#f0ede8]/60 text-sm tabular-nums">{formatPortfolio(user.buyingPower)}</td>
                  <td className="px-5 py-3.5 text-[#f0ede8]/40 text-xs">{formatDate(user.joinedAt)}</td>
                  <td className="px-5 py-3.5 text-[#f0ede8]/60 text-sm tabular-nums">{user.tradesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#2a2a2a] bg-[#1a1a1a]/30">
          <span className="text-xs text-[#f0ede8]/40">
            Showing {filtered.length} of 1,247 users
          </span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-md bg-[#222222] border border-[#2a2a2a] flex items-center justify-center text-[#f0ede8]/40 hover:text-[#c9a84c] hover:border-[rgba(201,168,76,0.3)] transition-colors">
              <ChevronLeft size={14} />
            </button>
            {[1, 2, 3, '…', 84].map((page, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded-md border text-xs font-medium transition-colors ${
                  page === 1
                    ? 'bg-[#c9a84c] text-[#0a0a0a] border-[#c9a84c]'
                    : 'bg-[#222222] border-[#2a2a2a] text-[#f0ede8]/40 hover:text-[#c9a84c] hover:border-[rgba(201,168,76,0.3)]'
                }`}
              >
                {page}
              </button>
            ))}
            <button className="w-8 h-8 rounded-md bg-[#222222] border border-[#2a2a2a] flex items-center justify-center text-[#f0ede8]/40 hover:text-[#c9a84c] hover:border-[rgba(201,168,76,0.3)] transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
