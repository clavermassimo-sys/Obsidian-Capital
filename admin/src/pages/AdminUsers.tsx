import { useState } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Users, Star, Shield } from 'lucide-react'

type Tier = 'Standard' | 'Member' | 'Private'
type KYCStatus = 'Verified' | 'Pending' | 'Under Review' | 'Rejected'

interface User {
  id: number
  name: string
  email: string
  tier: Tier
  kyc: KYCStatus
  portfolio: number
  buyingPower: number
  joined: string
}

const mockUsers: User[] = [
  { id: 1001, name: 'Marcus Holloway', email: 'marcus.holloway@gmail.com', tier: 'Private', kyc: 'Verified', portfolio: 2847500, buyingPower: 418200, joined: '2024-01-15' },
  { id: 1002, name: 'Vivienne Ashford', email: 'v.ashford@ashfordventures.com', tier: 'Private', kyc: 'Verified', portfolio: 5120000, buyingPower: 890000, joined: '2024-01-22' },
  { id: 1003, name: 'Sebastian Cole', email: 'scole@protonmail.com', tier: 'Private', kyc: 'Verified', portfolio: 1380000, buyingPower: 225000, joined: '2024-02-08' },
  { id: 1004, name: 'Eleanor Voss', email: 'eleanor.voss@vossgroup.com', tier: 'Private', kyc: 'Verified', portfolio: 3600000, buyingPower: 540000, joined: '2024-02-14' },
  { id: 1005, name: 'Dorian Blackwell', email: 'dorian@blackwellfamily.net', tier: 'Member', kyc: 'Verified', portfolio: 284000, buyingPower: 45000, joined: '2024-03-01' },
  { id: 1006, name: 'Isolde Marchetti', email: 'isolde.m@marchetti-co.it', tier: 'Member', kyc: 'Verified', portfolio: 192000, buyingPower: 28000, joined: '2024-03-19' },
  { id: 1007, name: 'Caspian Wren', email: 'caspian.wren@icloud.com', tier: 'Member', kyc: 'Verified', portfolio: 445000, buyingPower: 72000, joined: '2024-04-05' },
  { id: 1008, name: 'Lysandra Kell', email: 'lkell@kell-financial.com', tier: 'Member', kyc: 'Verified', portfolio: 318000, buyingPower: 58000, joined: '2024-04-22' },
  { id: 1009, name: 'Theron Sinclair', email: 'theron.sinclair@outlook.com', tier: 'Member', kyc: 'Pending', portfolio: 87500, buyingPower: 14000, joined: '2024-05-10' },
  { id: 1010, name: 'Seraphina Drake', email: 'sera.drake@gmail.com', tier: 'Standard', kyc: 'Verified', portfolio: 42800, buyingPower: 8500, joined: '2024-05-28' },
  { id: 1011, name: 'Aldric Harmon', email: 'aldric.h@harmon.dev', tier: 'Standard', kyc: 'Verified', portfolio: 18200, buyingPower: 3200, joined: '2024-06-12' },
  { id: 1012, name: 'Celeste Fontaine', email: 'cfontaine@yahoo.com', tier: 'Standard', kyc: 'Verified', portfolio: 29600, buyingPower: 5100, joined: '2024-06-30' },
  { id: 1013, name: 'Oberon Mercer', email: 'oberon.mercer@proton.me', tier: 'Standard', kyc: 'Under Review', portfolio: 12400, buyingPower: 1800, joined: '2024-07-14' },
  { id: 1014, name: 'Isadora Quinn', email: 'iquinn@gmail.com', tier: 'Standard', kyc: 'Verified', portfolio: 54200, buyingPower: 9600, joined: '2024-07-28' },
  { id: 1015, name: 'Remy Devereux', email: 'remy.devereux@me.com', tier: 'Standard', kyc: 'Rejected', portfolio: 0, buyingPower: 0, joined: '2024-08-05' },
]

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === 'Private') {
    return <span className="tier-badge-private flex items-center gap-1"><Star size={10} />{tier}</span>
  }
  if (tier === 'Member') {
    return <span className="tier-badge-member">{tier}</span>
  }
  return <span className="tier-badge-standard">{tier}</span>
}

function KYCBadge({ status }: { status: KYCStatus }) {
  const map: Record<KYCStatus, string> = {
    'Verified': 'status-badge-complete',
    'Pending': 'status-badge-pending',
    'Under Review': 'status-badge-review',
    'Rejected': 'status-badge-review',
  }
  return <span className={map[status]}>{status}</span>
}

function formatCurrency(value: number) {
  if (value === 0) return '—'
  return '$' + value.toLocaleString('en-US')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'All' | Tier>('All')

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      String(u.id).includes(search)
    const matchTier = tierFilter === 'All' || u.tier === tierFilter
    return matchSearch && matchTier
  })

  const counts = {
    All: mockUsers.length,
    Standard: mockUsers.filter((u) => u.tier === 'Standard').length,
    Member: mockUsers.filter((u) => u.tier === 'Member').length,
    Private: mockUsers.filter((u) => u.tier === 'Private').length,
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Tier', 'KYC Status', 'Portfolio Value', 'Buying Power', 'Joined']
    const rows = filtered.map((u) => [
      u.id,
      u.name,
      u.email,
      u.tier,
      u.kyc,
      u.portfolio,
      u.buyingPower,
      u.joined,
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'obsidian-capital-users.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const tierButtons: Array<'All' | Tier> = ['All', 'Standard', 'Member', 'Private']

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
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-sm text-gold font-medium transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '1,247', icon: Users, color: 'text-gold' },
          { label: 'Standard Tier', value: '892', icon: Users, color: 'text-off-white/50' },
          { label: 'Member Tier', value: '298', icon: Shield, color: 'text-blue-400' },
          { label: 'Private Tier', value: '57', icon: Star, color: 'text-gold' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-md bg-surface-2 flex items-center justify-center">
              <stat.icon size={16} className={stat.color} />
            </div>
            <div>
              <div className="text-xs text-off-white/40 uppercase tracking-wider">{stat.label}</div>
              <div className="text-xl font-bold text-off-white mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30" />
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-off-white placeholder-off-white/30 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {tierButtons.map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tierFilter === t
                  ? 'bg-gold text-obsidian'
                  : 'bg-surface border border-border text-off-white/50 hover:text-off-white hover:border-gold/30'
              }`}
            >
              {t}
              <span className="ml-1.5 opacity-70">{counts[t]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Tier</th>
                <th>KYC Status</th>
                <th>Portfolio Value</th>
                <th>Buying Power</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className="text-off-white/30 font-mono text-xs">#{user.id}</td>
                  <td>
                    <span className={user.tier === 'Private' ? 'text-gold font-semibold' : 'text-off-white font-medium'}>
                      {user.name}
                    </span>
                  </td>
                  <td className="text-off-white/50 text-xs">{user.email}</td>
                  <td><TierBadge tier={user.tier} /></td>
                  <td><KYCBadge status={user.kyc} /></td>
                  <td className="text-off-white font-medium">{formatCurrency(user.portfolio)}</td>
                  <td className="text-off-white/60">{formatCurrency(user.buyingPower)}</td>
                  <td className="text-off-white/40 text-xs">{formatDate(user.joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-2/30">
          <span className="text-xs text-off-white/40">
            Showing 1–{filtered.length} of 1,247 users
          </span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-md bg-surface-3 border border-border flex items-center justify-center text-off-white/40 hover:text-gold hover:border-gold/30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {[1, 2, 3, '...', 84].map((page, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded-md border text-xs font-medium transition-colors ${
                  page === 1
                    ? 'bg-gold text-obsidian border-gold'
                    : 'bg-surface-3 border-border text-off-white/40 hover:text-gold hover:border-gold/30'
                }`}
              >
                {page}
              </button>
            ))}
            <button className="w-8 h-8 rounded-md bg-surface-3 border border-border flex items-center justify-center text-off-white/40 hover:text-gold hover:border-gold/30 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
