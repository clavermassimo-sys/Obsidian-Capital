import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Eye, Flag } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface FilingRow {
  filing: string
  dueDate: string
  status: 'Current' | 'Upcoming' | 'Overdue'
  notes: string
}

interface AMLAlert {
  id: string
  user: string
  amount: number
  flagType: string
  date: string
  status: 'Under Review' | 'Cleared' | 'Escalated'
  severity: 'High' | 'Medium' | 'Low'
}

// ── Mock Data ─────────────────────────────────────────────────

const filings: FilingRow[] = [
  {
    filing:  'Form BD Annual Update',
    dueDate: 'March 31, 2026',
    status:  'Upcoming',
    notes:   'Annual broker-dealer registration update',
  },
  {
    filing:  'Form U4 Updates',
    dueDate: 'Rolling',
    status:  'Current',
    notes:   'Registered representative updates',
  },
  {
    filing:  'FOCUS Report (Monthly)',
    dueDate: '15th of each month',
    status:  'Current',
    notes:   'Financial/operational report',
  },
  {
    filing:  'Annual Compliance Report',
    dueDate: 'Dec 31, 2026',
    status:  'Upcoming',
    notes:   'FINRA Rule 3120',
  },
  {
    filing:  'AML Program Review',
    dueDate: 'June 30, 2026',
    status:  'Upcoming',
    notes:   'Annual independent testing',
  },
]

const amlAlerts: AMLAlert[] = [
  {
    id: 'AML-301',
    user: 'User ID #1089',
    amount: 485000,
    flagType: 'Large Cash Transaction',
    date: '2025-05-25',
    status: 'Under Review',
    severity: 'High',
  },
  {
    id: 'AML-302',
    user: 'User ID #1143',
    amount: 1200000,
    flagType: 'Rapid Movement',
    date: '2025-05-24',
    status: 'Escalated',
    severity: 'High',
  },
  {
    id: 'AML-303',
    user: 'User ID #1067',
    amount: 92000,
    flagType: 'Unusual Pattern',
    date: '2025-05-23',
    status: 'Under Review',
    severity: 'Medium',
  },
  {
    id: 'AML-304',
    user: 'User ID #1201',
    amount: 45000,
    flagType: 'Multiple Small Deposits',
    date: '2025-05-22',
    status: 'Cleared',
    severity: 'Medium',
  },
  {
    id: 'AML-305',
    user: 'User ID #1034',
    amount: 180000,
    flagType: 'International Transfer',
    date: '2025-05-20',
    status: 'Under Review',
    severity: 'Low',
  },
]

// ── Badge Helpers ─────────────────────────────────────────────

function FilingStatusBadge({ status }: { status: FilingRow['status'] }) {
  if (status === 'Current') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3d9e6e]/15 text-[#3d9e6e] border border-[#3d9e6e]/20">
        <CheckCircle size={10} />Current
      </span>
    )
  }
  if (status === 'Upcoming') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">
        <Clock size={10} />Upcoming
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c0453a]/15 text-[#c0453a] border border-[#c0453a]/20">
      <AlertTriangle size={10} />Overdue
    </span>
  )
}

function SeverityBadge({ severity }: { severity: AMLAlert['severity'] }) {
  const styles = {
    High:   'bg-[#c0453a]/15 text-[#c0453a] border border-[#c0453a]/25',
    Medium: 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30',
    Low:    'bg-blue-900/20 text-blue-400 border border-blue-700/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[severity]}`}>
      <Flag size={9} />{severity}
    </span>
  )
}

function AMLStatusBadge({ status }: { status: AMLAlert['status'] }) {
  if (status === 'Cleared') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3d9e6e]/15 text-[#3d9e6e] border border-[#3d9e6e]/20">Cleared</span>
  }
  if (status === 'Escalated') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700/40">Escalated</span>
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900/20 text-orange-400 border border-orange-700/30">Under Review</span>
}

// ── Page ──────────────────────────────────────────────────────

export default function AdminCompliance() {
  const openAlerts = amlAlerts.filter((a) => a.status !== 'Cleared').length
  const highAlerts = amlAlerts.filter((a) => a.severity === 'High').length

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">Compliance &amp; Regulatory</h1>
          <p className="text-sm text-off-white/40 mt-0.5">FINRA filings, AML monitoring, Reg BI, and SIPC status</p>
        </div>
        <div className="flex items-center gap-3">
          {highAlerts > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-loss/10 border border-loss/25 rounded-lg">
              <AlertTriangle size={13} className="text-loss" />
              <span className="text-xs text-loss font-semibold">{highAlerts} High Priority Alert{highAlerts > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-lg">
            <Shield size={13} className="text-gold" />
            <span className="text-xs text-off-white/60">{openAlerts} open AML alerts</span>
          </div>
        </div>
      </div>

      {/* FINRA Filing Calendar */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <FileText size={16} className="text-gold" />
          <div>
            <h2 className="font-serif text-base font-semibold text-off-white">FINRA Filing Calendar</h2>
            <p className="text-xs text-off-white/40 mt-0.5">Regulatory filing schedule and status</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['Filing', 'Due Date', 'Status', 'Notes'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filings.map((row, idx) => (
                <tr
                  key={row.filing}
                  className={`border-b border-border/50 transition-colors hover:bg-surface-2 ${idx % 2 === 1 ? 'bg-surface-2/30' : ''}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {row.status === 'Current'
                        ? <CheckCircle size={13} className="text-gain flex-shrink-0" />
                        : row.status === 'Overdue'
                        ? <AlertTriangle size={13} className="text-loss flex-shrink-0" />
                        : <Clock size={13} className="text-gold/60 flex-shrink-0" />
                      }
                      <span className="text-off-white font-medium text-sm">{row.filing}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-off-white/70 text-sm font-medium whitespace-nowrap">{row.dueDate}</td>
                  <td className="px-5 py-4"><FilingStatusBadge status={row.status} /></td>
                  <td className="px-5 py-4 text-off-white/40 text-xs">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AML Alerts */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-loss" />
            <div>
              <h2 className="font-serif text-base font-semibold text-off-white">AML Alerts</h2>
              <p className="text-xs text-off-white/40 mt-0.5">Anti-money laundering flagged transactions</p>
            </div>
          </div>
          <div className="text-xs text-off-white/30 bg-surface-2 border border-border rounded px-2.5 py-1">
            {amlAlerts.length} total alerts
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['Alert ID', 'User', 'Amount', 'Flag Type', 'Date', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {amlAlerts.map((alert, idx) => (
                <tr
                  key={alert.id}
                  className={`border-b border-border/50 transition-colors hover:bg-surface-2 ${idx % 2 === 1 ? 'bg-surface-2/30' : ''}`}
                >
                  <td className="px-5 py-3.5 text-off-white/30 font-mono text-xs">{alert.id}</td>
                  <td className="px-5 py-3.5 text-off-white font-medium text-sm">{alert.user}</td>
                  <td className="px-5 py-3.5 text-off-white font-semibold tabular-nums">${alert.amount.toLocaleString('en-US')}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-off-white/60 text-xs">{alert.flagType}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-off-white/40 text-xs whitespace-nowrap">
                    {new Date(alert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5"><AMLStatusBadge status={alert.status} /></td>
                  <td className="px-5 py-3.5">
                    <button className="flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors px-2.5 py-1.5 rounded border border-border hover:border-gold/30">
                      <Eye size={11} />Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom two cards side by side */}
      <div className="grid grid-cols-2 gap-6">

        {/* SEC Reg BI */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <Shield size={16} className="text-blue-400" />
            <h2 className="font-serif text-base font-semibold text-off-white">SEC Reg BI</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Disclosure requirement</span>
                <span className="text-gain font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Last audit</span>
                <span className="text-off-white">Jan 15, 2026</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Next review</span>
                <span className="text-off-white">July 15, 2026</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-2.5">
              {[
                'Commission disclosure on all trades',
                'Best interest standard met',
                'Conflicts of interest documented',
                'Form CRS filed',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle size={14} className="text-gain flex-shrink-0" />
                  <span className="text-sm text-off-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIPC Status */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <CheckCircle size={16} className="text-gain" />
            <h2 className="font-serif text-base font-semibold text-off-white">SIPC Status</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="text-center py-2">
              <div className="font-serif text-3xl font-bold text-gold">SIPC Member</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <CheckCircle size={14} className="text-gain" />
                <span className="text-sm text-gain font-medium">Member in Good Standing</span>
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Coverage per customer</span>
                <span className="text-off-white font-semibold">$500,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Cash coverage</span>
                <span className="text-off-white font-semibold">$250,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Member since</span>
                <span className="text-off-white font-semibold">2026</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Assessment status</span>
                <span className="text-gain font-semibold">Current</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
