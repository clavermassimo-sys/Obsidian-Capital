import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Eye, Flag } from 'lucide-react'

interface FilingItem {
  id: number
  name: string
  authority: string
  dueDate: string
  frequency: string
  status: 'complete' | 'upcoming' | 'pending' | 'overdue'
  description: string
}

interface AMLAlert {
  id: number
  userId: number
  user: string
  flagLevel: 'High' | 'Medium' | 'Low'
  amount: number
  type: string
  description: string
  date: string
  status: 'Under Review' | 'Cleared' | 'Escalated' | 'New'
}

interface RegBIItem {
  id: number
  requirement: string
  category: string
  lastReviewed: string
  nextReview: string
  status: 'Compliant' | 'In Progress' | 'Needs Attention'
  owner: string
}

interface SIPCItem {
  id: number
  period: string
  assessmentType: string
  estimatedAmount: number
  dueDate: string
  status: 'Paid' | 'Upcoming' | 'Pending'
}

const filings: FilingItem[] = [
  {
    id: 1,
    name: 'FINRA Form BD Annual Update',
    authority: 'FINRA',
    dueDate: 'March 31, 2026',
    frequency: 'Annual',
    status: 'upcoming',
    description: 'Annual broker-dealer registration renewal and information update',
  },
  {
    id: 2,
    name: 'SEC Form ADV Annual Amendment',
    authority: 'SEC',
    dueDate: 'March 31, 2026',
    frequency: 'Annual',
    status: 'upcoming',
    description: 'Investment adviser annual amendment filing',
  },
  {
    id: 3,
    name: 'FINRA Annual Certification',
    authority: 'FINRA',
    dueDate: 'December 31, 2025',
    frequency: 'Annual',
    status: 'complete',
    description: 'Annual compliance and supervision certification',
  },
  {
    id: 4,
    name: 'FinCEN SAR Monthly Filing',
    authority: 'FinCEN',
    dueDate: 'June 30, 2026',
    frequency: 'Monthly',
    status: 'pending',
    description: 'Suspicious activity report aggregation and submission',
  },
  {
    id: 5,
    name: 'SEC Reg BI Annual Review',
    authority: 'SEC',
    dueDate: 'June 30, 2026',
    frequency: 'Annual',
    status: 'upcoming',
    description: 'Best Interest obligation compliance review and documentation',
  },
  {
    id: 6,
    name: 'FINRA Rule 3310 AML Program',
    authority: 'FINRA',
    dueDate: 'Ongoing',
    frequency: 'Continuous',
    status: 'complete',
    description: 'Anti-money laundering program maintenance and testing',
  },
]

const amlAlerts: AMLAlert[] = [
  {
    id: 301,
    userId: 1089,
    user: 'User ID #1089',
    flagLevel: 'High',
    amount: 485000,
    type: 'Structuring',
    description: 'Multiple wire transfers slightly below $10K reporting threshold across 5 days',
    date: '2025-05-25',
    status: 'Under Review',
  },
  {
    id: 302,
    userId: 1143,
    user: 'User ID #1143',
    flagLevel: 'High',
    amount: 1200000,
    type: 'Rapid Movement',
    description: 'Large funds deposited and withdrawn within 48 hours without investment activity',
    date: '2025-05-24',
    status: 'Escalated',
  },
  {
    id: 303,
    userId: 1067,
    user: 'User ID #1067',
    flagLevel: 'Medium',
    amount: 92000,
    type: 'Unusual Pattern',
    description: 'Trading activity inconsistent with stated investment objectives and risk profile',
    date: '2025-05-23',
    status: 'Under Review',
  },
  {
    id: 304,
    userId: 1201,
    user: 'User ID #1201',
    flagLevel: 'Medium',
    amount: 45000,
    type: 'PEP Screening',
    description: 'Customer identity matched against Politically Exposed Persons watchlist',
    date: '2025-05-22',
    status: 'New',
  },
  {
    id: 305,
    userId: 1034,
    user: 'User ID #1034',
    flagLevel: 'Low',
    amount: 18500,
    type: 'Velocity Check',
    description: 'Unusual number of small trades in rapid succession — possible algorithmic activity',
    date: '2025-05-20',
    status: 'Cleared',
  },
  {
    id: 306,
    userId: 1078,
    user: 'User ID #1078',
    flagLevel: 'Low',
    amount: 29800,
    type: 'Geographic Risk',
    description: 'Account accessed from high-risk jurisdiction flagged in OFAC screening',
    date: '2025-05-18',
    status: 'Cleared',
  },
]

const regBIItems: RegBIItem[] = [
  {
    id: 1,
    requirement: 'Care Obligation',
    category: 'Reg BI',
    lastReviewed: '2025-01-15',
    nextReview: '2026-01-15',
    status: 'Compliant',
    owner: 'Chief Compliance Officer',
  },
  {
    id: 2,
    requirement: 'Disclosure Obligation',
    category: 'Reg BI',
    lastReviewed: '2025-01-15',
    nextReview: '2026-01-15',
    status: 'Compliant',
    owner: 'Legal Team',
  },
  {
    id: 3,
    requirement: 'Conflict of Interest Obligation',
    category: 'Reg BI',
    lastReviewed: '2025-02-28',
    nextReview: '2025-08-28',
    status: 'In Progress',
    owner: 'Chief Compliance Officer',
  },
  {
    id: 4,
    requirement: 'Compliance Obligation',
    category: 'Reg BI',
    lastReviewed: '2025-03-31',
    nextReview: '2025-09-30',
    status: 'Compliant',
    owner: 'Operations Team',
  },
  {
    id: 5,
    requirement: 'Form CRS Delivery',
    category: 'Form CRS',
    lastReviewed: '2025-04-01',
    nextReview: '2026-04-01',
    status: 'Needs Attention',
    owner: 'Client Relations',
  },
]

const sipcItems: SIPCItem[] = [
  { id: 1, period: 'Q1 2025', assessmentType: 'Annual Assessment', estimatedAmount: 18500, dueDate: 'March 31, 2025', status: 'Paid' },
  { id: 2, period: 'Q2 2025', assessmentType: 'Quarterly Report', estimatedAmount: 4800, dueDate: 'June 30, 2025', status: 'Paid' },
  { id: 3, period: 'Q3 2025', assessmentType: 'Quarterly Report', estimatedAmount: 5200, dueDate: 'September 30, 2025', status: 'Paid' },
  { id: 4, period: 'Q4 2025', assessmentType: 'Quarterly Report', estimatedAmount: 5600, dueDate: 'December 31, 2025', status: 'Paid' },
  { id: 5, period: 'Q1 2026', assessmentType: 'Annual Assessment', estimatedAmount: 22000, dueDate: 'March 31, 2026', status: 'Upcoming' },
  { id: 6, period: 'Q2 2026', assessmentType: 'Quarterly Report', estimatedAmount: 6100, dueDate: 'June 30, 2026', status: 'Pending' },
]

function FilingStatusBadge({ status }: { status: FilingItem['status'] }) {
  const map = {
    complete: 'status-badge-complete',
    upcoming: 'status-badge-upcoming',
    pending: 'status-badge-pending',
    overdue: 'status-badge-review',
  }
  const labels = {
    complete: 'Complete',
    upcoming: 'Upcoming',
    pending: 'Pending',
    overdue: 'Overdue',
  }
  return <span className={map[status]}>{labels[status]}</span>
}

function AMLFlagBadge({ level }: { level: AMLAlert['flagLevel'] }) {
  const map = {
    High: 'bg-loss/15 text-loss border border-loss/25',
    Medium: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/40',
    Low: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[level]}`}>
      <Flag size={9} />
      {level}
    </span>
  )
}

function AMLStatusBadge({ status }: { status: AMLAlert['status'] }) {
  const map: Record<AMLAlert['status'], string> = {
    'Under Review': 'status-badge-review',
    'Cleared': 'status-badge-complete',
    'Escalated': 'bg-red-900/40 text-red-400 border border-red-700/50 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    'New': 'status-badge-pending',
  }
  return <span className={map[status]}>{status}</span>
}

function RegBIStatusBadge({ status }: { status: RegBIItem['status'] }) {
  const map: Record<RegBIItem['status'], string> = {
    'Compliant': 'status-badge-complete',
    'In Progress': 'status-badge-pending',
    'Needs Attention': 'status-badge-review',
  }
  return <span className={map[status]}>{status}</span>
}

export default function AdminCompliance() {
  const openAlerts = amlAlerts.filter((a) => a.status !== 'Cleared').length
  const highAlerts = amlAlerts.filter((a) => a.flagLevel === 'High').length

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-off-white">Compliance Management</h1>
          <p className="text-sm text-off-white/40 mt-0.5">Regulatory filings, AML monitoring, and Reg BI tracking</p>
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
            <h2 className="font-serif text-base font-semibold text-off-white">Regulatory Filing Calendar</h2>
            <p className="text-xs text-off-white/40 mt-0.5">FINRA, SEC, and FinCEN filing schedule</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Filing Name</th>
                <th>Authority</th>
                <th>Frequency</th>
                <th>Due Date</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filings.map((filing) => (
                <tr key={filing.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {filing.status === 'complete' ? (
                        <CheckCircle size={13} className="text-gain flex-shrink-0" />
                      ) : filing.status === 'overdue' ? (
                        <AlertTriangle size={13} className="text-loss flex-shrink-0" />
                      ) : (
                        <Clock size={13} className="text-gold/60 flex-shrink-0" />
                      )}
                      <span className="text-off-white font-medium text-sm">{filing.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/20 rounded px-2 py-0.5">
                      {filing.authority}
                    </span>
                  </td>
                  <td className="text-off-white/50 text-xs">{filing.frequency}</td>
                  <td className="text-off-white/70 text-xs font-medium">{filing.dueDate}</td>
                  <td className="text-off-white/40 text-xs max-w-xs" style={{ maxWidth: '220px' }}>
                    <span className="line-clamp-2">{filing.description}</span>
                  </td>
                  <td><FilingStatusBadge status={filing.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AML Alerts Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-loss" />
            <div>
              <h2 className="font-serif text-base font-semibold text-off-white">AML Suspicious Activity Alerts</h2>
              <p className="text-xs text-off-white/40 mt-0.5">Anti-money laundering monitoring — flagged transactions</p>
            </div>
          </div>
          <div className="text-xs text-off-white/30 bg-surface-2 border border-border rounded px-2.5 py-1">
            {amlAlerts.length} total alerts
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>User</th>
                <th>Flag Level</th>
                <th>Amount</th>
                <th>Alert Type</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {amlAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="text-off-white/30 font-mono text-xs">#{alert.id}</td>
                  <td className="text-off-white font-medium text-sm">{alert.user}</td>
                  <td><AMLFlagBadge level={alert.flagLevel} /></td>
                  <td className="text-off-white font-semibold">
                    ${alert.amount.toLocaleString('en-US')}
                  </td>
                  <td className="text-off-white/60 text-xs font-medium">{alert.type}</td>
                  <td className="text-off-white/40 text-xs" style={{ maxWidth: '200px' }}>
                    <span className="line-clamp-2">{alert.description}</span>
                  </td>
                  <td className="text-off-white/40 text-xs">
                    {new Date(alert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td><AMLStatusBadge status={alert.status} /></td>
                  <td>
                    <button className="flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors px-2 py-1 rounded border border-border hover:border-gold/30">
                      <Eye size={11} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reg BI Disclosure Tracking */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <Shield size={16} className="text-blue-400" />
          <div>
            <h2 className="font-serif text-base font-semibold text-off-white">Reg BI Disclosure Tracking</h2>
            <p className="text-xs text-off-white/40 mt-0.5">SEC Regulation Best Interest compliance obligations</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Last Reviewed</th>
                <th>Next Review</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {regBIItems.map((item) => (
                <tr key={item.id}>
                  <td className="text-off-white font-medium">{item.requirement}</td>
                  <td>
                    <span className="text-xs text-blue-400 bg-blue-900/20 border border-blue-800/30 rounded px-2 py-0.5 font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="text-off-white/50 text-xs">{item.owner}</td>
                  <td className="text-off-white/50 text-xs">
                    {new Date(item.lastReviewed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="text-off-white/70 text-xs font-medium">
                    {new Date(item.nextReview).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td><RegBIStatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIPC Status and Assessment Schedule */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <CheckCircle size={16} className="text-gain" />
            <div>
              <h2 className="font-serif text-base font-semibold text-off-white">SIPC Assessment Schedule</h2>
              <p className="text-xs text-off-white/40 mt-0.5">Securities Investor Protection Corporation filings and payments</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gain/10 border border-gain/20 rounded-lg">
            <CheckCircle size={12} className="text-gain" />
            <span className="text-xs text-gain font-semibold">SIPC Member in Good Standing</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Assessment Type</th>
                <th>Estimated Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sipcItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 1 ? 'bg-surface-2/20' : ''}>
                  <td className="text-off-white font-medium">{item.period}</td>
                  <td className="text-off-white/60 text-sm">{item.assessmentType}</td>
                  <td className="text-off-white font-semibold">
                    ${item.estimatedAmount.toLocaleString('en-US')}
                  </td>
                  <td className="text-off-white/60 text-xs">{item.dueDate}</td>
                  <td>
                    <span
                      className={
                        item.status === 'Paid'
                          ? 'status-badge-complete'
                          : item.status === 'Upcoming'
                          ? 'status-badge-upcoming'
                          : 'status-badge-pending'
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-surface-2/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-off-white/40">
              Total assessments paid in 2025:{' '}
              <span className="text-gain font-semibold">
                ${sipcItems.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.estimatedAmount, 0).toLocaleString('en-US')}
              </span>
            </span>
            <span className="text-off-white/40">
              Upcoming obligations:{' '}
              <span className="text-gold font-semibold">
                ${sipcItems.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.estimatedAmount, 0).toLocaleString('en-US')}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
