/* ============================================================
   Obsidian Capital — Register Page
   2-step: Account Info → Choose Tier
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
  Phone,
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
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#c9a54e" strokeWidth="1.5" />
      <polygon points="20,7 32,14 32,26 20,33 8,26 8,14" fill="rgba(201,165,78,0.08)" stroke="#c9a54e" strokeWidth="0.75" />
      <polygon points="20,7 28,14 20,18 12,14" fill="rgba(201,165,78,0.18)" />
      <circle cx="20" cy="20" r="1.5" fill="#c9a54e" />
    </svg>
  );
}

// ── Step Progress ─────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Account Info' },
  { num: 2, label: 'Choose Tier'  },
];

function StepProgress({ current }: { current: 1 | 2 }) {
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
                  ${done    ? 'bg-gold text-obsidian'                          : ''}
                  ${active  ? 'bg-gold/15 text-gold border border-gold'        : ''}
                  ${pending ? 'bg-surface-3 text-off-white/30 border border-border' : ''}
                `}
              >
                {done ? <Check size={14} /> : step.num}
              </div>
              <span className={`text-2xs tracking-wide font-medium whitespace-nowrap
                ${active  ? 'text-gold'         : ''}
                ${done    ? 'text-off-white/60' : ''}
                ${pending ? 'text-off-white/25' : ''}
              `}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 transition-colors duration-300
                ${step.num < current ? 'bg-gold/40' : 'bg-border'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────

function Field({ id, label, error, children }: {
  id: string; label: string; error?: string; children: React.ReactNode;
}) {
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

// ── Form data ─────────────────────────────────────────────────

interface FormData {
  name:            string;
  email:           string;
  phone:           string;
  password:        string;
  confirmPassword: string;
  tier:            'standard' | 'private';
  regBiAccepted:   boolean;
}

const INITIAL_FORM: FormData = {
  name: '', email: '', phone: '', password: '', confirmPassword: '',
  tier: 'standard', regBiAccepted: false,
};

// ── Step 1: Account Info ──────────────────────────────────────

function Step1({ data, onChange, onNext }: {
  data: FormData;
  onChange: (p: Partial<FormData>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!data.name.trim())                  e.name = 'Full name is required.';
    if (!data.email.trim())                 e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email.';
    if (data.phone && !/^\+?[\d\s\-().]{7,}$/.test(data.phone)) e.phone = 'Enter a valid phone number.';
    if (!data.password)                     e.password = 'Password is required.';
    else if (data.password.length < 8)      e.password = 'Must be at least 8 characters.';
    else if (!/[A-Z]/.test(data.password))  e.password = 'Must contain an uppercase letter.';
    else if (!/[0-9]/.test(data.password))  e.password = 'Must contain a number.';
    if (data.confirmPassword !== data.password) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const passwordStrength = (() => {
    const pw = data.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)          s++;
    if (pw.length >= 12)         s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength] ?? '';
  const strengthColor = ['', 'bg-loss', 'bg-loss/70', 'bg-yellow-500', 'bg-gain', 'bg-gold'][passwordStrength] ?? '';

  return (
    <div className="space-y-5">
      <Field id="reg-name" label="Full Name" error={errors.name}>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input id="reg-name" type="text" autoComplete="name"
            value={data.name} onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your full name" className="input pl-9"
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

      <Field id="reg-phone" label="Phone Number (optional)" error={errors.phone}>
        <div className="relative">
          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input id="reg-phone" type="tel" autoComplete="tel"
            value={data.phone} onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 (555) 000-0000" className="input pl-9"
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
        style={{ background: 'linear-gradient(135deg, #c9a54e 0%, #e8c96e 100%)' }}
      >
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Step 2: Tier Selection ────────────────────────────────────

const TIER_FEATURES = {
  standard: [
    '$4.99 flat fee per trade',
    'Real-time market data',
    'Full platform access',
    'Standard support',
    'All order types',
  ],
  member: [
    '$2.99 flat fee per trade',
    '$29.99 / month subscription',
    'Real-time market data',
    'Full platform access',
    'Priority support',
  ],
  private: [
    '$0.99 flat fee per trade',
    '$199.99 / month subscription',
    'Real-time market data',
    'Full platform access',
    'Dedicated relationship manager',
    'Priority order execution',
    'White-glove onboarding',
    'Concierge support 24/7',
  ],
};

function Step2({ data, onChange, onBack, onSubmit, submitting, error }: {
  data: FormData;
  onChange: (p: Partial<FormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
}) {
  const [regBiError, setRegBiError] = useState('');

  function handleSubmit() {
    if (!data.regBiAccepted) {
      setRegBiError('You must acknowledge the disclosure to proceed.');
      return;
    }
    setRegBiError('');
    onSubmit();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-off-white/50 leading-relaxed">
        Select the account tier that best fits your investing goals. You can upgrade at any time.
      </p>

      {/* Standard */}
      <TierCard
        selected={data.tier === 'standard'}
        onClick={() => onChange({ tier: 'standard' })}
        icon={<Shield size={16} className="text-off-white/50" />}
        iconBg="bg-surface-3"
        name="Standard"
        price="$4.99 / trade"
        features={TIER_FEATURES.standard}
        checkColor="text-off-white/25"
        badgeColor=""
      />

      {/* Member */}
      <TierCard
        selected={data.tier === 'private'}
        onClick={() => onChange({ tier: 'private' })}
        icon={<Gem size={16} className="text-gold" />}
        iconBg="bg-gold/10"
        name="Obsidian Private"
        price="$0.99 / trade · $199.99/mo"
        features={TIER_FEATURES.private}
        checkColor="text-gold/60"
        badgeColor="gold"
        badge="FLAGSHIP"
      />

      {/* Reg BI Disclosure */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
        <div className="flex items-start gap-2">
          <Info size={13} className="text-gold/50 flex-shrink-0 mt-0.5" />
          <p className="text-2xs text-off-white/35 leading-relaxed">
            <strong className="text-off-white/50">Regulation Best Interest Disclosure:</strong>{' '}
            Obsidian Capital acts in accordance with SEC Regulation Best Interest.
            Our flat-fee commission may create a conflict of interest and is disclosed for each tier.
            You have the right to request our full Form CRS.
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
            I have read and acknowledge the Regulation Best Interest disclosure and understand that
            investing involves risk including the possible loss of principal.
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
          style={{ background: 'linear-gradient(135deg, #c9a54e 0%, #e8c96e 100%)' }}>
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Opening Account…</>
          ) : (
            <>Open Account <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

function TierCard({
  selected, onClick, icon, iconBg, name, price, features, checkColor, badge,
}: {
  selected: boolean; onClick: () => void;
  icon: React.ReactNode; iconBg: string;
  name: string; price: string; features: string[];
  checkColor: string; badgeColor: string; badge?: string;
}) {
  const isGold = badge != null;
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 select-none
        ${selected
          ? isGold ? 'bg-gold/5 border-gold/40 shadow-gold-md' : 'bg-surface-2 border-off-white/20'
          : isGold ? 'bg-surface border-border hover:border-gold/20' : 'bg-surface border-border hover:border-off-white/10'
        }`}
    >
      {badge && (
        <div className="absolute -top-2.5 left-4">
          <span className="px-2.5 py-0.5 text-2xs font-bold tracking-widest uppercase text-obsidian rounded-full"
            style={{ background: 'linear-gradient(135deg, #c9a54e, #e8c96e)' }}>
            {badge}
          </span>
        </div>
      )}
      {selected && (
        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center
          ${isGold ? 'bg-gold/20 border border-gold/40' : 'bg-off-white/20 border border-off-white/30'}`}>
          <Check size={11} className={isGold ? 'text-gold' : 'text-off-white'} />
        </div>
      )}
      <div className={`flex items-center gap-3 mb-3 ${badge ? 'mt-1' : ''}`}>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-sm font-semibold text-off-white">{name}</p>
          <p className={`text-xs ${isGold ? 'text-gold/60' : 'text-off-white/40'}`}>{price}</p>
        </div>
      </div>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-off-white/50">
            <CheckCircle2 size={11} className={`${checkColor} flex-shrink-0`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function Register() {
  const [step, setStep]      = useState<1 | 2>(1);
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
        phone:    form.phone || undefined,
        tier:     form.tier,
      };
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSub(false);
    }
  }

  const STEP_TITLES = [
    { title: 'Create Account',    sub: 'Set up your login credentials'  },
    { title: 'Choose Your Tier',  sub: 'Select your membership level'   },
  ];
  const { title, sub } = STEP_TITLES[step - 1];

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#000000' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(201,165,78,0.04) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(201,165,78,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,165,78,1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border p-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px) saturate(180%)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col items-center mb-7">
            <GemLogoSmall />
            <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase font-sans mt-2">
              OBSIDIAN CAPITAL
            </p>
          </div>

          <StepProgress current={step} />

          <div className="mb-6">
            <h2 className="font-serif text-xl font-medium text-off-white">{title}</h2>
            <p className="text-xs text-off-white/40 mt-0.5">{sub}</p>
          </div>

          {step === 1 && (
            <Step1 data={form} onChange={patch} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2
              data={form} onChange={patch}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          )}

          <p className="text-xs text-center text-off-white/30 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold/70 hover:text-gold transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-off-white/20 mt-6 leading-relaxed px-4">
          Member SIPC · SEC Regulated · Your information is encrypted and never sold
        </p>
      </div>
    </div>
  );
}
