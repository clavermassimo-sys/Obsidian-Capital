/* ============================================================
   Obsidian Capital — Settings Page (Full 6-Tab Rewrite)
   Tabs: Profile | Security | Billing | Notifications | Bank | Tax
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Building2,
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
  Link as LinkIcon,
  Monitor as MonitorIcon,
  X,
  ChevronRight,
  Star,
  Gem,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageContent, PageHeader } from '@/components/layout/AppLayout';
import { brokerApi } from '@/services/api';
import type { IBKRAccountData } from '@/services/api';

// ── Shared Styles ─────────────────────────────────────────────

const inputClass =
  'w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-off-white font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors';
const inputReadonlyClass =
  'w-full bg-surface-3 border border-border/50 rounded-lg px-4 py-2.5 text-off-white/40 font-sans text-sm cursor-not-allowed';
const labelClass =
  'block text-xs font-medium text-off-white/50 uppercase tracking-wider mb-1.5 font-sans';
const btnPrimary =
  'inline-flex items-center gap-2 bg-gold text-obsidian font-semibold px-5 py-2.5 rounded-lg font-sans text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex items-center gap-2 bg-surface-2 border border-border text-off-white/80 font-sans text-sm px-4 py-2 rounded-lg hover:border-gold/30 hover:text-off-white transition-colors';
const btnDanger =
  'inline-flex items-center gap-2 bg-loss/10 border border-loss/20 text-loss font-sans text-sm px-4 py-2 rounded-lg hover:bg-loss/20 transition-colors';

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

// ── Confirmation Modal ────────────────────────────────────────

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  danger,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-off-white/30 hover:text-off-white/60"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-serif text-xl text-off-white mb-2">{title}</h3>
        <p className="text-sm text-off-white/60 font-sans mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? btnDanger : btnPrimary}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab IDs ───────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Profile',             icon: User },
  { id: 'security',      label: 'Security',            icon: Shield },
  { id: 'billing',       label: 'Billing',             icon: CreditCard },
  { id: 'notifications', label: 'Notifications',       icon: Bell },
  { id: 'bank',          label: 'Bank Accounts',       icon: Building2 },
  { id: 'tax',           label: 'Tax Documents',       icon: FileText },
] as const;

type TabId = typeof TABS[number]['id'];

// ── 1. Profile Tab ────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName]     = useState(user?.name ?? '');
  const [phone, setPhone]   = useState('(202) 555-0188');
  const [address, setAddress] = useState('1600 Pennsylvania Ave NW');
  const [city, setCity]     = useState('Washington');
  const [state, setState]   = useState('DC');
  const [zip, setZip]       = useState('20500');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

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
          <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {/* Silhouette SVG */}
            <svg viewBox="0 0 80 80" width="80" height="80" className="absolute inset-0">
              <circle cx="40" cy="30" r="16" fill="rgba(201,168,76,0.25)" />
              <ellipse cx="40" cy="72" rx="24" ry="18" fill="rgba(201,168,76,0.15)" />
            </svg>
            <span className="relative font-serif text-3xl text-gold/60 font-semibold z-10">
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

      {/* Name + Email */}
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
          <input type="email" value={user?.email ?? ''} readOnly className={inputReadonlyClass} />
          <p className="text-xs text-off-white/30 mt-1 font-sans">Contact support to change.</p>
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
            <span className="text-sm font-sans text-off-white/70 capitalize">
              {user?.tier ?? 'Standard'}
            </span>
            {user?.tier === 'private' && (
              <span className="ml-auto px-2 py-0.5 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-sans">
                Private
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <p className={labelClass}>Mailing Address</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street Address"
              className={inputClass}
            />
          </div>
          <div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className={inputClass}
            />
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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

// ── 2. Security Tab ───────────────────────────────────────────

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
  const [alpacaAccount, setAlpacaAccount] = useState<IBKRAccountData | null>(null);
  const [alpacaLoading, setAlpacaLoading] = useState(true);

  // Fetch Alpaca Broker account status on mount
  useEffect(() => {
    brokerApi.getAccount()
      .then((res) => {
        if ((res.data.alpaca_connected || res.data.ibkr_connected) && res.data.account) {
          setAlpacaAccount(res.data.account);
        } else {
          setAlpacaAccount(null);
        }
      })
      .catch(() => {
        setAlpacaAccount(null);
      })
      .finally(() => setAlpacaLoading(false));
  }, []);

  const alpacaConnected = !!alpacaAccount;
  const alpacaStatus    = (alpacaAccount as IBKRAccountData & { status?: string } | null)?.status ?? 'ONBOARDING';
  const alpacaIsActive  = alpacaStatus === 'ACTIVE';

  const sessions = [
    { id: '1', device: 'MacBook Pro — Chrome', location: 'Washington, DC', lastActive: 'Now', current: true },
    { id: '2', device: 'iPhone 15 Pro — Safari', location: 'Washington, DC', lastActive: '2 hours ago', current: false },
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
              {changingPw && <Loader2 className="w-4 h-4 animate-spin" />}
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
              Add an extra layer of security with an authenticator app.
            </p>
          </div>
          <Toggle
            id="2fa-toggle"
            checked={twoFAEnabled}
            onChange={(v) => { setTwoFAEnabled(v); if (v) setShow2FA(true); else setShow2FA(false); }}
          />
        </div>

        {show2FA && twoFAEnabled && (
          <div className="mt-4 bg-surface-2 border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gold" />
              <p className="text-sm text-off-white/80 font-sans">
                Scan this QR code with Google Authenticator or Authy.
              </p>
            </div>
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mx-auto p-2">
              <svg viewBox="0 0 100 100" width="112" height="112">
                {/* QR-like pattern */}
                {[0,1,2,3,4,5,6].map(row =>
                  [0,1,2,3,4,5,6].map(col => {
                    const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
                    const rand = ((row * 7 + col) * 137) % 100;
                    const filled = isCorner || rand > 45;
                    return filled ? (
                      <rect
                        key={`${row}-${col}`}
                        x={col * 14 + 1}
                        y={row * 14 + 1}
                        width="12"
                        height="12"
                        fill="#0a0a0a"
                      />
                    ) : null;
                  })
                )}
              </svg>
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
                <MonitorIcon className="w-5 h-5 text-off-white/40 flex-shrink-0" />
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

      {/* Brokerage Account Status */}
      <div className="border-t border-border pt-6">
        <h3 className="font-serif text-lg text-off-white mb-1">Brokerage Account</h3>
        <p className="text-sm text-off-white/50 font-sans mb-4">
          Your trading account is held securely with our regulated brokerage partner. No connection required — your account is set up automatically.
        </p>
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          {alpacaLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-gold/60" />
              <p className="text-sm text-off-white/40 font-sans">Loading account status…</p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-gold/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-off-white font-sans">Obsidian Capital Brokerage</p>
                  {alpacaConnected ? (
                    <>
                      {alpacaAccount?.accountId && (
                        <p className="text-xs text-off-white/40 font-sans mt-0.5">
                          Account: <span className="font-mono text-off-white/60">
                            {'•••• ' + String(alpacaAccount.accountId).slice(-4)}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-sans border
                          ${alpacaIsActive
                            ? 'bg-gain/10 border-gain/20 text-gain'
                            : 'bg-gold/10 border-gold/20 text-gold/80'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${alpacaIsActive ? 'bg-gain' : 'bg-gold/60'}`} />
                          {alpacaIsActive ? 'Active' : alpacaStatus}
                        </span>
                        {alpacaAccount && alpacaAccount.buying_power !== undefined && (
                          <span className="text-xs text-off-white/40 font-sans">
                            Buying Power: <span className="text-off-white/70 font-mono">
                              ${Number(alpacaAccount.buying_power).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </span>
                        )}
                        {alpacaAccount && alpacaAccount.equity !== undefined && (
                          <span className="text-xs text-off-white/40 font-sans">
                            Equity: <span className="text-off-white/70 font-mono">
                              ${Number(alpacaAccount.equity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-off-white/40 font-sans mt-0.5">Account setup in progress</p>
                  )}
                </div>
              </div>
              {!alpacaIsActive && (
                <button
                  className={btnPrimary}
                  onClick={() => window.location.href = '/settings/security'}
                >
                  <LinkIcon className="w-4 h-4" />
                  Complete Setup
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 3. Billing & Subscriptions Tab ────────────────────────────

type PlanKey = 'standard' | 'member' | 'private';

const PLANS = [
  {
    key: 'standard' as PlanKey,
    name: 'Standard',
    icon: null,
    price: 'Free',
    commission: '10–12% commission per trade',
    color: 'border-border',
    badge: 'text-off-white/60 bg-surface-3 border-border',
  },
  {
    key: 'member' as PlanKey,
    name: 'Member',
    icon: Star,
    price: '$29.99/mo',
    commission: '7–9% commission per trade',
    color: 'border-indigo-500/30',
    badge: 'text-indigo-300 bg-[#1e1b4b] border-indigo-500/30',
  },
  {
    key: 'private' as PlanKey,
    name: 'Private',
    icon: Gem,
    price: '$199.99/mo',
    commission: '5–6% commission per trade',
    color: 'border-gold/30',
    badge: 'text-gold bg-gold/10 border-gold/30',
  },
];

const COMPARISON = [
  { feature: 'Commission',   standard: '10–12%', member: '7–9%',     private: '5–6%' },
  { feature: 'Monthly Fee',  standard: 'Free',   member: '$29.99',   private: '$199.99' },
  { feature: 'Support',      standard: 'Standard', member: 'Priority', private: 'White-Glove' },
  { feature: 'Analytics',    standard: 'Basic',  member: 'Advanced', private: 'Institutional' },
  { feature: 'Advisor',      standard: '—',      member: '—',        private: 'Dedicated' },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-004', date: 'May 1, 2026',   description: 'Member Plan — May 2026',   amount: '$29.99', status: 'Paid'    },
  { id: 'INV-2026-003', date: 'Apr 1, 2026',   description: 'Member Plan — Apr 2026',   amount: '$29.99', status: 'Paid'    },
  { id: 'INV-2026-002', date: 'Mar 1, 2026',   description: 'Member Plan — Mar 2026',   amount: '$29.99', status: 'Paid'    },
  { id: 'INV-2026-001', date: 'Feb 1, 2026',   description: 'Member Plan — Feb 2026',   amount: '$29.99', status: 'Pending' },
];

function BillingTab() {
  const { user } = useAuth();
  const currentPlan: PlanKey = (user?.tier as PlanKey) ?? 'standard';
  const [upgradeModal, setUpgradeModal] = useState<PlanKey | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const targetPlan = upgradeModal ? PLANS.find((p) => p.key === upgradeModal) : null;
  const activePlan = PLANS.find((p) => p.key === currentPlan)!;

  return (
    <div className="space-y-10">
      {/* Current Plan */}
      <div>
        <h3 className="font-serif text-lg text-off-white mb-4">Current Plan</h3>
        <div
          className={`bg-surface-2 border ${activePlan.color} rounded-xl p-5 flex items-center justify-between gap-4`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              {activePlan.icon && React.createElement(activePlan.icon as React.ComponentType<{ className: string }>, { className: 'w-4 h-4 text-gold' })}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activePlan.badge}`}>
                {activePlan.name}
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-off-white">{activePlan.price}</p>
            <p className="text-sm text-off-white/50 font-sans mt-0.5">{activePlan.commission}</p>
          </div>
          <div className="flex flex-col gap-2">
            {currentPlan === 'standard' && (
              <button
                onClick={() => setUpgradeModal('member')}
                className={btnPrimary}
              >
                Upgrade to Member
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {(currentPlan === 'member' || currentPlan === 'private') && (
              <button onClick={() => setCancelModal(true)} className={btnDanger}>
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier Comparison */}
      <div>
        <h3 className="font-serif text-lg text-off-white mb-4">Plan Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-off-white/40 uppercase tracking-wider font-sans border-b border-border">
                  Feature
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.key}
                    className={`text-center py-3 px-4 text-xs font-medium uppercase tracking-wider font-sans border-b border-border ${
                      plan.key === currentPlan ? 'text-gold' : 'text-off-white/40'
                    }`}
                  >
                    {plan.name}
                    {plan.key === currentPlan && (
                      <span className="block text-2xs text-gold/60 normal-case font-normal tracking-normal mt-0.5">
                        (current)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-surface-2/30' : ''}>
                  <td className="py-3 px-4 text-off-white/60 font-sans border-b border-border/40">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 text-center text-off-white/70 font-sans border-b border-border/40">
                    {row.standard}
                  </td>
                  <td className="py-3 px-4 text-center text-off-white/70 font-sans border-b border-border/40">
                    {row.member}
                  </td>
                  <td className="py-3 px-4 text-center text-gold font-sans border-b border-border/40">
                    {row.private}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Upgrade buttons below table */}
        {currentPlan !== 'private' && (
          <div className="flex gap-3 mt-4">
            {currentPlan === 'standard' && (
              <>
                <button onClick={() => setUpgradeModal('member')} className={btnPrimary}>
                  Upgrade to Member — $29.99/mo
                </button>
                <button onClick={() => setUpgradeModal('private')} className={btnSecondary}>
                  Upgrade to Private — $199.99/mo
                </button>
              </>
            )}
            {currentPlan === 'member' && (
              <button onClick={() => setUpgradeModal('private')} className={btnPrimary}>
                Upgrade to Private — $199.99/mo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-off-white">Payment Methods</h3>
          <button onClick={() => setShowCardForm(!showCardForm)} className={btnSecondary}>
            <Plus className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>

        {/* Saved card */}
        <div className="flex items-center justify-between bg-surface-2 border border-border rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-[#1a1f71] rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="text-sm text-off-white font-sans">Visa ending in 4242</p>
              <p className="text-xs text-off-white/40 font-sans">Expires 12/2028</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gain/10 border border-gain/20 rounded text-xs text-gain font-sans">
              Default
            </span>
            <button className="text-off-white/30 hover:text-loss transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card input form (Stripe placeholder) */}
        {showCardForm && (
          <div className="bg-surface-2 border border-gold/20 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-off-white/70 font-sans">Add New Card</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Card Number</label>
                <div className="flex items-center gap-2 bg-surface-3 border border-border rounded-lg px-4 py-2.5">
                  <CreditCard className="w-4 h-4 text-off-white/30 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="bg-transparent text-off-white text-sm font-sans flex-1 outline-none placeholder-off-white/20 font-mono tracking-wider"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Expiry</label>
                <input type="text" placeholder="MM / YY" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CVC</label>
                <input type="text" placeholder="123" maxLength={4} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Name on Card</label>
                <input type="text" placeholder="Full name" className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button className={btnPrimary}>
                <DollarSign className="w-4 h-4" />
                Save Card
              </button>
              <button onClick={() => setShowCardForm(false)} className={btnSecondary}>
                Cancel
              </button>
            </div>
            <p className="text-xs text-off-white/30 font-sans">
              Payments secured by Stripe. Card data is encrypted and never stored on our servers.
            </p>
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div>
        <h3 className="font-serif text-lg text-off-white mb-4">Invoice History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Description', 'Amount', 'Status', ''].map((h) => (
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
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-border/40 hover:bg-surface-2/40 transition-colors">
                  <td className="py-3 px-4 text-off-white/60 font-sans text-xs">{inv.date}</td>
                  <td className="py-3 px-4 text-off-white font-sans">{inv.description}</td>
                  <td className="py-3 px-4 font-mono text-off-white">{inv.amount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-sans border ${
                        inv.status === 'Paid'
                          ? 'text-gain bg-gain/10 border-gain/20'
                          : 'text-gold bg-gold/10 border-gold/20'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {inv.status === 'Paid' && (
                      <button className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold font-sans transition-colors border border-gold/20 hover:border-gold/40 px-3 py-1.5 rounded-lg">
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-off-white/30 font-sans">
          Commission history →{' '}
          <a href="/orders" className="text-gold/60 hover:text-gold transition-colors underline">
            View in Orders page
          </a>
        </p>
      </div>

      {/* Upgrade Confirmation Modal */}
      <ConfirmModal
        open={upgradeModal !== null}
        title={`Upgrade to ${targetPlan?.name ?? ''}`}
        message={`You will be charged ${targetPlan?.price ?? ''} starting today. Your commission rate will change to ${targetPlan?.commission ?? ''}. You can cancel at any time.`}
        confirmLabel={`Confirm Upgrade`}
        onConfirm={() => setUpgradeModal(null)}
        onClose={() => setUpgradeModal(null)}
      />

      {/* Cancel Subscription Modal */}
      <ConfirmModal
        open={cancelModal}
        title="Cancel Subscription?"
        message="Your subscription will remain active until the end of the current billing period. After that, your account will revert to the Standard plan (10–12% commission)."
        confirmLabel="Cancel Subscription"
        onConfirm={() => setCancelModal(false)}
        onClose={() => setCancelModal(false)}
        danger
      />
    </div>
  );
}

// ── 4. Notifications Tab ──────────────────────────────────────

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  hasEmail: boolean;
  hasPush: boolean;
}

function NotificationsTab() {
  const [settings, setSettings] = useState<NotifSetting[]>([
    { id: 'trade_confirm',   label: 'Trade Confirmations',       description: 'Receive confirmation for every executed order',      emailEnabled: true,  pushEnabled: true,  hasEmail: true,  hasPush: true  },
    { id: 'daily_summary',   label: 'Daily Portfolio Summary',   description: 'End-of-day snapshot of your portfolio performance',  emailEnabled: true,  pushEnabled: false, hasEmail: true,  hasPush: false },
    { id: 'price_alerts',    label: 'Price Alert Triggers',      description: 'Notifications when watchlist stocks hit your targets', emailEnabled: false, pushEnabled: true,  hasEmail: false, hasPush: true  },
    { id: 'market_hours',    label: 'Market Open/Close',         description: 'Alerts at 9:30 AM and 4:00 PM ET on trading days',  emailEnabled: false, pushEnabled: true,  hasEmail: false, hasPush: true  },
    { id: 'commission_stmt', label: 'Commission Statements',     description: 'Monthly commission and fee statements (email)',      emailEnabled: true,  pushEnabled: false, hasEmail: true,  hasPush: false },
    { id: 'news',            label: 'News & Research',           description: 'Market news, earnings reports, and research updates', emailEnabled: true,  pushEnabled: false, hasEmail: true,  hasPush: false },
  ]);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string, channel: 'emailEnabled' | 'pushEnabled') => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, [channel]: !s[channel] } : s)));
  };

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-off-white mb-1">Notification Preferences</h3>
        <p className="text-sm text-off-white/50 font-sans">
          Choose how you'd like to be notified about account activity.
        </p>
      </div>

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
            {s.hasEmail ? (
              <Toggle id={`${s.id}-email`} checked={s.emailEnabled} onChange={() => toggle(s.id, 'emailEnabled')} />
            ) : (
              <span className="text-off-white/20 text-xs font-sans">—</span>
            )}
          </div>
          <div className="flex sm:justify-center items-center gap-2">
            <span className="text-xs text-off-white/30 font-sans sm:hidden">Push:</span>
            {s.hasPush ? (
              <Toggle id={`${s.id}-push`} checked={s.pushEnabled} onChange={() => toggle(s.id, 'pushEnabled')} />
            ) : (
              <span className="text-off-white/20 text-xs font-sans">—</span>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2 justify-end">
        <button onClick={handleSave} className={btnPrimary}>
          Save Preferences
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

// ── 5. Bank Accounts Tab ──────────────────────────────────────

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
        <button onClick={() => setShowLink(!showLink)} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Link New Account
        </button>
      </div>

      {showLink && (
        <div className="bg-surface-2 border border-gold/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-gold mb-2">
            <LinkIcon className="w-4 h-4" />
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
            <span
              className={`px-2 py-0.5 rounded text-xs font-sans border ${
                acc.status === 'verified'
                  ? 'bg-gain/10 border-gain/20 text-gain'
                  : 'bg-gold/10 border-gold/20 text-gold'
              }`}
            >
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

// ── 6. Tax Documents Tab ──────────────────────────────────────

interface TaxDoc {
  id: string;
  year: number;
  docType: string;
  status: 'Available' | 'Pending' | 'Processing';
}

function TaxDocumentsTab() {
  const docs: TaxDoc[] = [
    { id: '1', year: 2024, docType: '1099-B',   status: 'Available' },
    { id: '2', year: 2024, docType: '1099-DIV', status: 'Available' },
    { id: '3', year: 2025, docType: '1099-B',   status: 'Pending'   },
  ];

  const statusColor: Record<TaxDoc['status'], string> = {
    'Available':  'text-gain bg-gain/10 border-gain/20',
    'Pending':    'text-off-white/40 bg-surface-3 border-border/40',
    'Processing': 'text-gold bg-gold/10 border-gold/20',
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
              {['Tax Year', 'Document', 'Status', ''].map((h) => (
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
                    {doc.status === 'Pending' ? 'Pending (year not ended)' : doc.status}
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

      <div className="bg-surface-2 rounded-xl p-5 border border-border/50 space-y-2">
        <div className="flex items-center gap-2 text-off-white/60 text-xs font-medium uppercase tracking-wider font-sans">
          <FileText className="w-4 h-4" />
          FINRA / IRS Tax Notice
        </div>
        <p className="text-xs text-off-white/40 font-sans leading-relaxed">
          Obsidian Capital reports all commissions paid to the IRS as required by law. 1099-B forms
          report proceeds from securities sales. 1099-DIV forms report dividends and distributions
          received during the tax year. All tax documents are prepared in compliance with IRS
          regulations and FINRA requirements.
        </p>
        <p className="text-xs text-off-white/30 font-sans">
          FINRA BrokerCheck: brokercheck.finra.org · IRS: irs.gov
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function SettingsPage() {
  const params = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const validTabs: TabId[] = ['profile', 'security', 'billing', 'notifications', 'bank', 'tax'];
  const activeTab: TabId =
    validTabs.includes(params.tab as TabId) ? (params.tab as TabId) : 'profile';

  const handleTabChange = (id: TabId) => {
    navigate(`/settings/${id}`, { replace: true });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':       return <ProfileTab />;
      case 'security':      return <SecurityTab />;
      case 'billing':       return <BillingTab />;
      case 'notifications': return <NotificationsTab />;
      case 'bank':          return <BankAccountsTab />;
      case 'tax':           return <TaxDocumentsTab />;
      default:              return <ProfileTab />;
    }
  };

  return (
    <PageContent>
        <PageHeader
          title="Settings"
          subtitle="Manage your account, security, and preferences"
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border scrollbar-hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-sans font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-gold border-b-2 border-gold -mb-px bg-gold/5'
                    : 'text-off-white/50 hover:text-off-white/80 border-b-2 border-transparent -mb-px'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-off-white/30'}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
          {renderTab()}
        </div>
    </PageContent>
  );
}
