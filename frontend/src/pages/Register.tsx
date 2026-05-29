/* ============================================================
   Obsidian Capital — Register Page
   Multi-step registration with KYC and tier selection
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Lock,
  Shield,
  Gem,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAuth, type RegisterPayload } from '@/contexts/AuthContext';

// ── Logo ──────────────────────────────────────────────────────

function GemLogoSmall() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
      <polygon points="20,7 32,14 32,26 20,33 8,26 8,14" fill="rgba(201,168,76,0.08)" stroke="#c9a84c" strokeWidth="0.75" />
      <polygon points="20,7 28,14 20,18 12,14" fill="rgba(201,168,76,0.18)" />
      <circle cx="20" cy="20" r="1.5" fill="#c9a84c" />
    </svg>
  );
}

// ── Step Progress Indicator ───────────────────────────────────

const STEPS = [
  { num: 1, label: 'Account Info'   },
  { num: 2, label: 'Identity (KYC)' },
  { num: 3, label: 'Choose Tier'    },
];

function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, idx) => {
        const done    = step.num < current;
        const active  = step.num === current;
        const pending = step.num > current;

        return (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${done    ? 'bg-gold text-obsidian'          : ''}
                  ${active  ? 'bg-gold/15 text-gold border border-gold' : ''}
                  ${pending ? 'bg-surface-3 text-off-white/30 border border-border' : ''}
                `}
              >
                {done ? <Check size={14} /> : step.num}
              </div>
              <span className={`text-2xs tracking-wide font-medium whitespace-nowrap
                ${active  ? 'text-gold'           : ''}
                ${done    ? 'text-off-white/60'   : ''}
                ${pending ? 'text-off-white/25'   : ''}
              `}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 transition-colors duration-300
                ${step.num < current ? 'bg-gold/40' : 'bg-border'}`
              } />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Shared field helpers ──────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-loss flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Form Data ─────────────────────────────────────────────────

interface FormData {
  // Step 1
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2
  dob: string;
  ssnLast4: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  // Step 3
  tier: 'standard' | 'private';
  regBiAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  name: '', email: '', password: '', confirmPassword: '',
  dob: '', ssnLast4: '', address: '', city: '', state: '', zip: '',
  tier: 'standard', regBiAccepted: false,
};

// ── Step 1: Basic Info ────────────────────────────────────────

interface Step1Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
}

function Step1({ data, onChange, onNext }: Step1Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!data.name.trim())                 e.name = 'Full name is required.';
    if (!data.email.trim())                e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email.';
    if (!data.password)                    e.password = 'Password is required.';
    else if (data.password.length < 8)    e.password = 'Must be at least 8 characters.';
    else if (!/[A-Z]/.test(data.password)) e.password = 'Must contain an uppercase letter.';
    else if (!/[0-9]/.test(data.password)) e.password = 'Must contain a number.';
    if (data.confirmPassword !== data.password) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const passwordStrength = (() => {
    const pw = data.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength] ?? '';
  const strengthColor = ['', 'bg-loss', 'bg-loss/70', 'bg-yellow-500', 'bg-gain', 'bg-gold'][passwordStrength] ?? '';

  return (
    <div className="space-y-5">
      <Field id="reg-name" label="Full Legal Name" error={errors.name}>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input id="reg-name" type="text" autoComplete="name"
            value={data.name} onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Massimo Caruso" className="input pl-9"
          />
        </div>
      </Field>

      <Field id="reg-email" label="Email Address" error={errors.email}>
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input id="reg-email" type="email" autoComplete="email"
            value={data.email} onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@example.com" className="input pl-9"
          />
        </div>
      </Field>

      <Field id="reg-password" label="Password" error={errors.password}>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input id="reg-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
            value={data.password} onChange={(e) => onChange({ password: e.target.value })}
            placeholder="Min. 8 chars, uppercase, number" className="input pl-9 pr-10"
          />
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/30 hover:text-off-white/60 transition-colors"
            tabIndex={-1} aria-label={showPw ? 'Hide' : 'Show'}>
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {/* Password strength */}
        {data.password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex-1 h-0.5 rounded-full transition-all duration-200
                  ${i < passwordStrength ? strengthColor : 'bg-border'}`} />
              ))}
            </div>
            <p className="text-2xs text-off-white/40">{strengthLabel}</p>
          </div>
        )}
      </Field>

      <Field id="reg-confirm" label="Confirm Password" error={errors.confirmPassword}>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
            value={data.confirmPassword} onChange={(e) => onChange({ confirmPassword: e.target.value })}
            placeholder="Re-enter password" className="input pl-9 pr-10"
          />
          <button type="button" onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/30 hover:text-off-white/60 transition-colors"
            tabIndex={-1}>
            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>

      <button
        type="button" onClick={() => { if (validate()) onNext(); }}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold
                   text-obsidian transition-all duration-250 active:scale-[0.98] mt-2"
        style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}
      >
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Step 2: KYC ───────────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

interface Step2Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function Step2({ data, onChange, onNext, onBack }: Step2Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!data.dob)                           e.dob = 'Date of birth is required.';
    else {
      const age = (Date.now() - new Date(data.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) e.dob = 'You must be at least 18 years old.';
    }
    if (!data.ssnLast4 || !/^\d{4}$/.test(data.ssnLast4)) e.ssnLast4 = 'Enter the last 4 digits of your SSN.';
    if (!data.address.trim()) e.address = 'Street address is required.';
    if (!data.city.trim())    e.city    = 'City is required.';
    if (!data.state)          e.state   = 'State is required.';
    if (!data.zip || !/^\d{5}(-\d{4})?$/.test(data.zip)) e.zip = 'Enter a valid ZIP code.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="space-y-5">
      {/* KYC notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gold/5 border border-gold/15">
        <Info size={13} className="text-gold/70 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-off-white/50 leading-relaxed">
          Federal law requires us to verify your identity before opening a brokerage account.
          Your information is encrypted and protected under our privacy policy.
        </p>
      </div>

      <Field id="reg-dob" label="Date of Birth" error={errors.dob}>
        <input id="reg-dob" type="date" max={new Date().toISOString().split('T')[0]}
          value={data.dob} onChange={(e) => onChange({ dob: e.target.value })}
          className="input"
          style={{ colorScheme: 'dark' }}
        />
      </Field>

      <Field id="reg-ssn" label="Last 4 Digits of SSN" error={errors.ssnLast4}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-off-white/30 font-mono flex-shrink-0">XXX-XX-</span>
          <input id="reg-ssn" type="text" inputMode="numeric" maxLength={4}
            value={data.ssnLast4}
            onChange={(e) => onChange({ ssnLast4: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
            placeholder="0000" className="input w-24 font-mono tracking-widest text-center"
          />
        </div>
      </Field>

      <Field id="reg-address" label="Street Address" error={errors.address}>
        <input id="reg-address" type="text" autoComplete="street-address"
          value={data.address} onChange={(e) => onChange({ address: e.target.value })}
          placeholder="123 Main Street, Apt 4B" className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="reg-city" label="City" error={errors.city}>
          <input id="reg-city" type="text" autoComplete="address-level2"
            value={data.city} onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Washington" className="input"
          />
        </Field>

        <Field id="reg-zip" label="ZIP Code" error={errors.zip}>
          <input id="reg-zip" type="text" inputMode="numeric" maxLength={10}
            autoComplete="postal-code"
            value={data.zip} onChange={(e) => onChange({ zip: e.target.value })}
            placeholder="20001" className="input"
          />
        </Field>
      </div>

      <Field id="reg-state" label="State" error={errors.state}>
        <select id="reg-state" autoComplete="address-level1"
          value={data.state} onChange={(e) => onChange({ state: e.target.value })}
          className="input appearance-none"
          style={{ colorScheme: 'dark' }}
        >
          <option value="">Select state</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack}
          className="flex-1 h-11 rounded-xl text-sm font-medium text-off-white/60 border border-border
                     hover:border-off-white/30 hover:text-off-white transition-all duration-200">
          Back
        </button>
        <button type="button" onClick={() => { if (validate()) onNext(); }}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold
                     text-obsidian transition-all duration-250 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}>
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Tier Selection (formerly Step 4) ─────────────────
// Note: Step 3 "Link IBKR" has been removed. Accounts are created
// programmatically via the Alpaca Broker API after registration.

// ── (Step 3 placeholder — merged into Step4 below) ───────────

// ── Step 3: IBKR Account Setup (REMOVED — kept as comment) ───
// Alpaca Broker API creates accounts programmatically — no OAuth step needed.

// ── Step 3: Tier Selection ────────────────────────────────────

const TIER_FEATURES = {
  standard: [
    'Commission: 10–12% per trade',
    'Real-time market data',
    'Full platform access',
    'Standard support',
    'All order types',
  ],
  private: [
    'Commission: 5–6% per trade',
    'Real-time market data',
    'Full platform access',
    'Dedicated relationship manager',
    'Priority order execution',
    'Exclusive investment access',
    'White-glove onboarding',
    'Concierge support 24/7',
  ],
};

interface Step3Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
}

function Step3({ data, onChange, onBack, onSubmit, submitting, error }: Step3Props) {
  const [regBiError, setRegBiError] = useState('');

  function handleSubmit() {
    if (!data.regBiAccepted) {
      setRegBiError('You must acknowledge the Regulation Best Interest disclosure to proceed.');
      return;
    }
    setRegBiError('');
    onSubmit();
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-off-white/50 leading-relaxed">
        Select the account tier that best fits your investing goals.
        You can upgrade your tier at any time after opening.
      </p>

      {/* Standard tier */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onChange({ tier: 'standard' })}
        onKeyDown={(e) => e.key === 'Enter' && onChange({ tier: 'standard' })}
        className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 select-none
          ${data.tier === 'standard'
            ? 'bg-surface-2 border-off-white/20'
            : 'bg-surface border-border hover:border-off-white/10'
          }`}
      >
        {data.tier === 'standard' && (
          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-off-white/20 border border-off-white/30
                          flex items-center justify-center">
            <Check size={11} className="text-off-white" />
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
            <Shield size={16} className="text-off-white/50" />
          </div>
          <div>
            <p className="text-sm font-semibold text-off-white">Standard</p>
            <p className="text-xs text-off-white/40">10–12% commission · No minimum</p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {TIER_FEATURES.standard.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-off-white/50">
              <CheckCircle2 size={11} className="text-off-white/25 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Obsidian Private tier */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onChange({ tier: 'private' })}
        onKeyDown={(e) => e.key === 'Enter' && onChange({ tier: 'private' })}
        className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 select-none
          ${data.tier === 'private'
            ? 'bg-gold/5 border-gold/40 shadow-gold-md'
            : 'bg-surface border-border hover:border-gold/20'
          }`}
      >
        {/* Featured badge */}
        <div className="absolute -top-2.5 left-4">
          <span className="px-2.5 py-0.5 text-2xs font-bold tracking-widest uppercase text-obsidian rounded-full"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96e)' }}>
            FLAGSHIP TIER
          </span>
        </div>

        {data.tier === 'private' && (
          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold/20 border border-gold/40
                          flex items-center justify-center">
            <Check size={11} className="text-gold" />
          </div>
        )}
        <div className="flex items-center gap-3 mb-3 mt-1">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            <Gem size={16} className="text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-off-white">Obsidian Private</p>
            <p className="text-xs text-gold/60">5–6% commission · $100K+ recommended</p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {TIER_FEATURES.private.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-off-white/60">
              <CheckCircle2 size={11} className="text-gold/60 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Reg BI Disclosure */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
        <div className="flex items-start gap-2">
          <Info size={13} className="text-gold/50 flex-shrink-0 mt-0.5" />
          <p className="text-2xs text-off-white/35 leading-relaxed">
            <strong className="text-off-white/50">Regulation Best Interest Disclosure:</strong> Obsidian Capital
            is registered with the SEC and acts in accordance with Regulation Best Interest.
            We are required to act in your best interest when making recommendations.
            Our commission-based compensation may create a conflict of interest. Commission
            rates are clearly disclosed for each tier. You have the right to ask for and
            receive a copy of our full Form CRS.
          </p>
        </div>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={data.regBiAccepted}
            onChange={(e) => { onChange({ regBiAccepted: e.target.checked }); setRegBiError(''); }}
            className="w-4 h-4 rounded border-border bg-surface-2 accent-gold cursor-pointer mt-0.5 flex-shrink-0"
          />
          <span className="text-xs text-off-white/50 group-hover:text-off-white/70 transition-colors leading-relaxed">
            I have read and acknowledge the Regulation Best Interest disclosure and
            understand that investing involves risk including the possible loss of principal.
          </span>
        </label>
        {regBiError && (
          <p className="text-xs text-loss flex items-center gap-1.5">
            <AlertCircle size={11} /> {regBiError}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-loss/8 border border-loss/20">
          <AlertCircle size={14} className="text-loss flex-shrink-0 mt-0.5" />
          <p className="text-xs text-loss">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 h-11 rounded-xl text-sm font-medium text-off-white/60 border border-border
                     hover:border-off-white/30 hover:text-off-white transition-all duration-200">
          Back
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold
                     text-obsidian transition-all duration-250 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}>
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Opening Account...</>
          ) : (
            <>Open Account <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function Register() {
  const [step, setStep]      = useState<1 | 2 | 3>(1);
  const [form, setForm]      = useState<FormData>(INITIAL_FORM);
  const [submitting, setSub] = useState(false);
  const [error, setError]    = useState('');
  const { register, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  function patch(update: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  async function handleSubmit() {
    setSub(true);
    setError('');
    clearError();
    try {
      const payload: RegisterPayload = {
        name:     form.name,
        email:    form.email,
        password: form.password,
        tier:     form.tier,
        dob:      form.dob,
        ssnLast4: form.ssnLast4,
        address:  form.address,
        city:     form.city,
        state:    form.state,
        zip:      form.zip,
      };
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSub(false);
    }
  }

  const STEP_TITLES: Array<{ title: string; sub: string }> = [
    { title: 'Create Account', sub: 'Set up your login credentials'  },
    { title: 'Verify Identity', sub: 'Required by federal law (KYC)' },
    { title: 'Choose Your Tier', sub: 'Select your membership level' },
  ];
  const { title, sub } = STEP_TITLES[step - 1];

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-border p-8"
          style={{ background: '#111111', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <GemLogoSmall />
            <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase font-sans mt-2">
              OBSIDIAN CAPITAL
            </p>
          </div>

          {/* Progress */}
          <StepProgress current={step} />

          {/* Title */}
          <div className="mb-6">
            <h2 className="font-serif text-xl font-medium text-off-white">{title}</h2>
            <p className="text-xs text-off-white/40 mt-0.5">{sub}</p>
          </div>

          {/* Steps */}
          {step === 1 && (
            <Step1 data={form} onChange={patch} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2 data={form} onChange={patch} onNext={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <Step3 data={form} onChange={patch} onBack={() => setStep(2)}
              onSubmit={handleSubmit} submitting={submitting} error={error} />
          )}

          {/* Sign in link */}
          <p className="text-xs text-center text-off-white/30 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold/70 hover:text-gold transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-off-white/20 mt-6 leading-relaxed px-4">
          Member SIPC · SEC Regulated · Your information is encrypted and never sold
        </p>
      </div>
    </div>
  );
}
