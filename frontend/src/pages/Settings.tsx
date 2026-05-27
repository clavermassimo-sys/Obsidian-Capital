/* ============================================================
   Obsidian Capital — Settings Page
   ============================================================ */

import React, { useState, useCallback } from 'react';
import {
  User,
  Shield,
  Building2,
  Bell,
  FileText,
  Eye,
  EyeOff,
  Upload,
  Plus,
  Download,
  Loader2,
  CheckCircle2,
  Smartphone,
  AlertTriangle,
  Trash2,
  Link,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout, { PageContent, PageHeader } from '@/components/layout/AppLayout';

// ── Shared Styles ─────────────────────────────────────────────

const inputClass =
  'w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-off-white font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors';
const inputReadonlyClass =
  'w-full bg-surface-3 border border-border/50 rounded-lg px-4 py-2.5 text-off-white/40 font-sans text-sm cursor-not-allowed';
const labelClass = 'block text-xs font-medium text-off-white/50 uppercase tracking-wider mb-1.5 font-sans';
const btnPrimary =
  'inline-flex items-center gap-2 bg-gold text-obsidian font-semibold px-5 py-2.5 rounded-lg font-sans text-sm hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex items-center gap-2 bg-surface-2 border border-border text-off-white/80 font-sans text-sm px-4 py-2 rounded-lg hover:border-gold/30 hover:text-off-white transition-colors';

// ── Toggle Switch ──────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold/30 ${
        checked ? 'bg-gold' : 'bg-surface-3 border border-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Tab Navigation ────────────────────────────────────────────

const TABS = [
  { id: 'profile',      label: 'Profile',        icon: <User className="w-4 h-4" /> },
  { id: 'security',     label: 'Security',       icon: <Shield className="w-4 h-4" /> },
  { id: 'bank',         label: 'Bank Accounts',  icon: <Building2 className="w-4 h-4" /> },
  { id: 'notifications',label: 'Notifications',  icon: <Bell className="w-4 h-4" /> },
  { id: 'tax',          label: 'Tax Documents',  icon: <FileText className="w-4 h-4" /> },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Profile Tab ───────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName]   = useState(user?.name ?? '');
  const [phone, setPhone] = useState('(212) 555-0188');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Photo upload */}
      <div>
        <p className={labelClass}>Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-2xl text-gold font-semibold">
              {(user?.name ?? 'U').charAt(0)}
            </span>
          </div>
          <div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" />
              <span className={btnSecondary}>
                <Upload className="w-4 h-4" />
                Upload Photo
              </span>
            </label>
            <p className="text-xs text-off-white/30 mt-1.5 font-sans">JPG, PNG or GIF · Max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass} htmlFor="s-name">Full Name</label>
          <input
            id="s-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email Address</label>
          <input
            type="email"
            value={user?.email ?? ''}
            readOnly
            className={inputReadonlyClass}
          />
          <p className="text-xs text-off-white/30 mt-1 font-sans">Email cannot be changed. Contact support.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="s-phone">Phone Number</label>
          <input
            id="s-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Member Tier</label>
          <div className="flex items-center gap-2 h-[42px] px-4 bg-surface-2 border border-border rounded-lg">
            <span className="text-sm font-sans text-off-white/70 capitalize">{user?.tier ?? 'Standard'}</span>
            {user?.tier === 'private' && (
              <span className="ml-auto px-2 py-0.5 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-sans">
                Private
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-gain text-sm font-sans">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────

function SecurityTab() {
  const [current, setCurrent]   = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [show2FA, setShow2FA]         = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [changingPw, setChangingPw]   = useState(false);
  const [pwSuccess, setPwSuccess]     = useState(false);

  const sessions = [
    { id: '1', device: 'MacBook Pro — Chrome', location: 'New York, NY', lastActive: 'Now', current: true },
    { id: '2', device: 'iPhone 15 Pro — Safari', location: 'New York, NY', lastActive: '2 hours ago', current: false },
    { id: '3', device: 'iPad Pro — Safari', location: 'Boston, MA', lastActive: '3 days ago', current: false },
  ];

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !newPw || newPw !== confirm) return;
    setChangingPw(true);
    await new Promise((r) => setTimeout(r, 1000));
    setChangingPw(false);
    setPwSuccess(true);
    setCurrent(''); setNewPw(''); setConfirm('');
    setTimeout(() => setPwSuccess(false), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <h3 className="font-serif text-lg text-off-white mb-4">Change Password</h3>
        <form onSubmit={handleChangePw} className="space-y-4 max-w-md">
          <div>
            <label className={labelClass} htmlFor="pw-current">Current Password</label>
            <div className="relative">
              <input
                id="pw-current"
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/30 hover:text-off-white/60"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="pw-new">New Password</label>
            <div className="relative">
              <input
                id="pw-new"
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/30 hover:text-off-white/60"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="pw-confirm">Confirm New Password</label>
            <input
              id="pw-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              placeholder="Repeat new password"
            />
            {confirm && newPw !== confirm && (
              <p className="text-xs text-loss mt-1 font-sans">Passwords do not match</p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={changingPw || !current || !newPw || newPw !== confirm}
              className={btnPrimary}
            >
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {changingPw ? 'Updating…' : 'Update Password'}
            </button>
            {pwSuccess && (
              <span className="flex items-center gap-1.5 text-gain text-sm font-sans">
                <CheckCircle2 className="w-4 h-4" />
                Password updated
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 2FA */}
      <div className="border-t border-border pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg text-off-white mb-1">Two-Factor Authentication</h3>
            <p className="text-sm text-off-white/50 font-sans">
              Add an extra layer of security with an authenticator app or SMS.
            </p>
          </div>
          <Toggle
            id="2fa-toggle"
            checked={twoFAEnabled}
            onChange={(v) => {
              setTwoFAEnabled(v);
              if (v) setShow2FA(true);
              else setShow2FA(false);
            }}
          />
        </div>

        {show2FA && twoFAEnabled && (
          <div className="mt-4 bg-surface-2 border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gold" />
              <p className="text-sm text-off-white/80 font-sans">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>
            {/* Mock QR placeholder */}
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mx-auto">
              <div className="grid grid-cols-4 gap-1 p-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-sm"
                    style={{ background: Math.random() > 0.5 ? '#0a0a0a' : '#fff' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-off-white/40 font-sans mb-2">Or enter this code manually:</p>
              <code className="text-sm text-gold font-mono bg-obsidian px-3 py-1.5 rounded border border-border">
                OBSIDIAN-2FA-DEMO-KEY4
              </code>
            </div>
            <div>
              <label className={labelClass}>Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className={`${inputClass} max-w-[160px] font-mono text-center tracking-widest`}
              />
            </div>
            <button className={btnPrimary}>Confirm & Enable 2FA</button>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="border-t border-border pt-6">
        <h3 className="font-serif text-lg text-off-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 bg-surface-2 rounded-lg p-4 border border-border"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-off-white/40 flex-shrink-0" />
                <div>
                  <p className="text-sm text-off-white font-sans flex items-center gap-2">
                    {s.device}
                    {s.current && (
                      <span className="px-1.5 py-0.5 bg-gain/10 border border-gain/20 rounded text-xs text-gain font-sans">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-off-white/40 font-sans mt-0.5">
                    {s.location} · {s.lastActive}
                  </p>
                </div>
              </div>
              {!s.current && (
                <button className="text-off-white/30 hover:text-loss transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="mt-3 text-sm text-loss/70 hover:text-loss font-sans transition-colors">
          Revoke all other sessions
        </button>
      </div>
    </div>
  );
}

// ── Bank Accounts Tab ─────────────────────────────────────────

interface BankAccount {
  id: string;
  bankName: string;
  last4: string;
  type: string;
  status: 'verified' | 'pending';
}

function BankAccountsTab() {
  const [accounts] = useState<BankAccount[]>([
    { id: '1', bankName: 'JPMorgan Chase', last4: '4821', type: 'Checking', status: 'verified' },
    { id: '2', bankName: 'Bank of America', last4: '9034', type: 'Savings',  status: 'verified' },
  ]);
  const [showLink, setShowLink] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-off-white">Linked Bank Accounts</h3>
          <p className="text-sm text-off-white/50 font-sans mt-0.5">Manage ACH transfers for deposits and withdrawals</p>
        </div>
        <button
          onClick={() => setShowLink(!showLink)}
          className={btnPrimary}
        >
          <Plus className="w-4 h-4" />
          Link New Account
        </button>
      </div>

      {showLink && (
        <div className="bg-surface-2 border border-gold/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-gold mb-2">
            <Link className="w-4 h-4" />
            <span className="text-sm font-medium font-sans">Connect via Plaid (ACH)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Routing Number</label>
              <input type="text" maxLength={9} placeholder="021000021" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Account Number</label>
              <input type="text" placeholder="•••••••••••" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Account Type</label>
              <select className={inputClass}>
                <option>Checking</option>
                <option>Savings</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Bank Name</label>
              <input type="text" placeholder="e.g. Chase Bank" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button className={btnPrimary}>Link Account</button>
            <button onClick={() => setShowLink(false)} className={btnSecondary}>Cancel</button>
          </div>
          <p className="text-xs text-off-white/30 font-sans">
            Micro-deposits of $0.01–$0.99 will be sent within 1–3 business days for verification.
          </p>
        </div>
      )}

      {accounts.map((acc) => (
        <div
          key={acc.id}
          className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-off-white/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-off-white font-sans">{acc.bankName}</p>
              <p className="text-xs text-off-white/40 font-sans mt-0.5">
                {acc.type} ···· {acc.last4}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-sans border ${
              acc.status === 'verified'
                ? 'bg-gain/10 border-gain/20 text-gain'
                : 'bg-gold/10 border-gold/20 text-gold'
            }`}>
              {acc.status === 'verified' ? 'Verified' : 'Pending'}
            </span>

            <button className="text-xs text-gold/70 hover:text-gold font-sans transition-colors border border-gold/20 hover:border-gold/40 px-3 py-1.5 rounded-lg">
              Deposit
            </button>
            <button className="text-xs text-off-white/60 hover:text-off-white font-sans transition-colors border border-border hover:border-border/80 px-3 py-1.5 rounded-lg">
              Withdraw
            </button>
            <button className="text-off-white/20 hover:text-loss transition-colors ml-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <div className="bg-surface-2 rounded-lg p-4 border border-border/50 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
        <p className="text-xs text-off-white/40 font-sans leading-relaxed">
          Bank account transfers are processed via ACH and may take 2–4 business days to settle.
          Wire transfers are available for amounts over $50,000. Contact your advisor for wire details.
        </p>
      </div>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

function NotificationsTab() {
  const [settings, setSettings] = useState<NotifSetting[]>([
    { id: 'trade_confirm',   label: 'Trade Confirmations',      description: 'Receive confirmation for every executed order',     email: true,  push: true  },
    { id: 'daily_summary',   label: 'Daily Portfolio Summary',   description: 'End-of-day snapshot of your portfolio performance', email: true,  push: false },
    { id: 'market_news',     label: 'Market News',               description: 'Breaking news and significant market events',       email: false, push: true  },
    { id: 'price_alerts',    label: 'Price Alerts',              description: 'Notifications when watchlist stocks hit your targets',email: true, push: true  },
    { id: 'commission_stmt', label: 'Commission Statements',     description: 'Monthly commission and fee statements',              email: true,  push: false },
  ]);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setSettings((prev) =>
      prev.map((s) => s.id === id ? { ...s, [channel]: !s[channel] } : s)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-off-white mb-1">Notification Preferences</h3>
        <p className="text-sm text-off-white/50 font-sans">
          Choose how you'd like to be notified about account activity.
        </p>
      </div>

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-4 px-5 pb-2 border-b border-border">
        <span className="text-xs text-off-white/30 uppercase tracking-wider font-sans">Notification</span>
        <span className="text-xs text-off-white/30 uppercase tracking-wider font-sans text-center">Email</span>
        <span className="text-xs text-off-white/30 uppercase tracking-wider font-sans text-center">Push</span>
      </div>

      {settings.map((s) => (
        <div
          key={s.id}
          className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-4 items-center bg-surface border border-border rounded-xl p-5"
        >
          <div>
            <p className="text-sm font-medium text-off-white font-sans">{s.label}</p>
            <p className="text-xs text-off-white/40 font-sans mt-0.5">{s.description}</p>
          </div>
          <div className="flex sm:justify-center items-center gap-2">
            <span className="text-xs text-off-white/30 font-sans sm:hidden">Email:</span>
            <Toggle id={`${s.id}-email`} checked={s.email} onChange={() => toggle(s.id, 'email')} />
          </div>
          <div className="flex sm:justify-center items-center gap-2">
            <span className="text-xs text-off-white/30 font-sans sm:hidden">Push:</span>
            <Toggle id={`${s.id}-push`} checked={s.push} onChange={() => toggle(s.id, 'push')} />
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <button className={btnPrimary}>Save Preferences</button>
      </div>
    </div>
  );
}

// ── Tax Documents Tab ─────────────────────────────────────────

interface TaxDoc {
  id: string;
  year: number;
  docType: '1099-B' | '1099-DIV' | 'K-1' | '1099-INT';
  status: 'Available' | 'Processing' | 'Not Available';
}

function TaxDocumentsTab() {
  const docs: TaxDoc[] = [
    { id: '1', year: 2025, docType: '1099-B',   status: 'Available'  },
    { id: '2', year: 2025, docType: '1099-DIV', status: 'Available'  },
    { id: '3', year: 2025, docType: 'K-1',      status: 'Processing' },
    { id: '4', year: 2024, docType: '1099-B',   status: 'Available'  },
    { id: '5', year: 2024, docType: '1099-DIV', status: 'Available'  },
    { id: '6', year: 2024, docType: 'K-1',      status: 'Available'  },
    { id: '7', year: 2024, docType: '1099-INT', status: 'Available'  },
  ];

  const statusColor: Record<TaxDoc['status'], string> = {
    'Available':     'text-gain bg-gain/10 border-gain/20',
    'Processing':    'text-gold bg-gold/10 border-gold/20',
    'Not Available': 'text-off-white/30 bg-surface-3 border-border/30',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-off-white mb-1">Tax Documents</h3>
        <p className="text-sm text-off-white/50 font-sans">
          Download your tax forms. Documents are typically available by mid-February each year.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Year', 'Document Type', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-xs font-medium text-off-white/40 uppercase tracking-wider font-sans last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                <td className="py-3 px-4 font-mono text-off-white/80">{doc.year}</td>
                <td className="py-3 px-4 font-sans text-off-white">{doc.docType}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-sans border ${statusColor[doc.status]}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {doc.status === 'Available' ? (
                    <button className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold font-sans transition-colors border border-gold/20 hover:border-gold/40 px-3 py-1.5 rounded-lg">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  ) : (
                    <span className="text-xs text-off-white/20 font-sans">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FINRA Disclosure */}
      <div className="bg-surface-2 rounded-xl p-5 border border-border/50 space-y-2">
        <div className="flex items-center gap-2 text-off-white/60 text-xs font-medium uppercase tracking-wider font-sans">
          <FileText className="w-4 h-4" />
          FINRA Regulatory Disclosure
        </div>
        <p className="text-xs text-off-white/40 font-sans leading-relaxed">
          Obsidian Capital LLC is a registered broker-dealer with FINRA (CRD# 000000) and a member of SIPC.
          Your securities account is protected up to $500,000, including $250,000 for cash claims.
          Tax documents are prepared in accordance with IRS regulations. K-1 forms are issued for
          partnership interests held through the Obsidian Private tier. For questions regarding
          your tax documents, consult your tax advisor or contact Obsidian Capital Tax Services.
        </p>
        <p className="text-xs text-off-white/30 font-sans">
          FINRA BrokerCheck: brokercheck.finra.org · SIPC: sipc.org
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':       return <ProfileTab />;
      case 'security':      return <SecurityTab />;
      case 'bank':          return <BankAccountsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'tax':           return <TaxDocumentsTab />;
    }
  };

  return (
    <AppLayout>
      <PageContent>
        <PageHeader
          title="Settings"
          subtitle="Manage your account, security, and preferences"
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border scrollbar-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-sans font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-gold border-b-2 border-gold -mb-px bg-gold/5'
                  : 'text-off-white/50 hover:text-off-white/80 border-b-2 border-transparent -mb-px'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-gold' : 'text-off-white/30'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
          {renderTab()}
        </div>
      </PageContent>
    </AppLayout>
  );
}
