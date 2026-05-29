import { Shield, CheckCircle, Clock, FileText, AlertTriangle } from 'lucide-react'

type FilingStatus = 'Current' | 'Upcoming' | 'Overdue'

interface Filing {
  filing: string
  dueDate: string
  status: FilingStatus
  notes: string
}

// Compliance data is static regulatory information, not database-driven.
// These are real FINRA/SEC filing requirements for a registered broker-dealer.

const filings: Filing[] = [
  { filing: 'Form BD Annual Update',    dueDate: 'March 31 each year',    status: 'Upcoming', notes: 'Annual broker-dealer registration update via FINRA WebCRD' },
  { filing: 'FOCUS Report (Monthly)',   dueDate: '15th of each month',     status: 'Current',  notes: 'Financial and Operational Combined Uniform Single report' },
  { filing: 'Annual Compliance Report', dueDate: 'December 31 each year',  status: 'Upcoming', notes: 'Required under FINRA Rule 3120 — designated principal review' },
  { filing: 'AML Program Review',       dueDate: 'Annually',               status: 'Upcoming', notes: 'Independent testing of Anti-Money Laundering procedures' },
  { filing: 'Customer Complaint Log',   dueDate: 'Quarterly',              status: 'Current',  notes: 'FINRA Rule 4513 — written complaint recordkeeping' },
]

function StatusBadge({ status }: { status: FilingStatus }) {
  if (status === 'Current') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3d9e6e]/15 text-[#3d9e6e] border border-[#3d9e6e]/20">
      <CheckCircle size={10} />Current
    </span>
  )
  if (status === 'Upcoming') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">
      <Clock size={10} />Upcoming
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c0453a]/15 text-[#c0453a] border border-[#c0453a]/20">
      <AlertTriangle size={10} />Overdue
    </span>
  )
}

export default function AdminCompliance() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-off-white">Compliance &amp; Regulatory</h1>
        <p className="text-sm text-off-white/40 mt-0.5">FINRA filing schedule, SEC Reg BI, and SIPC status</p>
      </div>

      {/* Filing Schedule */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <FileText size={16} className="text-gold" />
          <div>
            <h2 className="font-serif text-base font-semibold text-off-white">Regulatory Filing Schedule</h2>
            <p className="text-xs text-off-white/40 mt-0.5">Required FINRA and SEC filings for registered broker-dealers</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['Filing', 'Schedule', 'Status', 'Notes'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-off-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filings.map((row, idx) => (
                <tr key={row.filing} className={`border-b border-border/50 transition-colors hover:bg-surface-2 ${idx % 2 === 1 ? 'bg-surface-2/30' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {row.status === 'Current' ? <CheckCircle size={13} className="text-gain flex-shrink-0" />
                        : row.status === 'Overdue' ? <AlertTriangle size={13} className="text-loss flex-shrink-0" />
                        : <Clock size={13} className="text-gold/60 flex-shrink-0" />}
                      <span className="text-off-white font-medium text-sm">{row.filing}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-off-white/70 text-sm font-medium whitespace-nowrap">{row.dueDate}</td>
                  <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                  <td className="px-5 py-4 text-off-white/40 text-xs">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* SEC Reg BI */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <Shield size={16} className="text-blue-400" />
            <h2 className="font-serif text-base font-semibold text-off-white">SEC Regulation Best Interest</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Standard</span>
                <span className="text-off-white">Best Interest — not merely suitability</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Obligation type</span>
                <span className="text-off-white">Conduct standard</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Effective since</span>
                <span className="text-off-white">June 30, 2020</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-2.5">
              {[
                'Commission disclosure on all trade confirmations',
                'Best interest standard for all recommendations',
                'Conflicts of interest must be disclosed',
                'Form CRS (Client Relationship Summary) required',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle size={14} className="text-gain flex-shrink-0" />
                  <span className="text-sm text-off-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIPC */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <CheckCircle size={16} className="text-gain" />
            <h2 className="font-serif text-base font-semibold text-off-white">SIPC Protection</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="text-center py-2">
              <div className="font-serif text-2xl font-bold text-gold">SIPC Member</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <CheckCircle size={14} className="text-gain" />
                <span className="text-sm text-gain font-medium">Securities Investor Protection Corporation</span>
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Coverage per customer</span>
                <span className="text-off-white font-semibold">$500,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Cash sub-limit</span>
                <span className="text-off-white font-semibold">$250,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Coverage type</span>
                <span className="text-off-white font-semibold">Securities &amp; cash</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-off-white/60">Assessment status</span>
                <span className="text-gain font-semibold">Current</span>
              </div>
            </div>
            <p className="text-xs text-off-white/30 border-t border-border pt-3">
              SIPC protects against loss due to broker-dealer failure, not market loss. Alpaca Securities LLC (our clearing partner) is a SIPC member.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
