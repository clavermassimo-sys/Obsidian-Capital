/* ============================================================
   Obsidian Capital — Login Page
   Two-step authentication: credentials → 2FA
   ============================================================ */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Logo ──────────────────────────────────────────────────────

function GemLogoSmall() {
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
      <polygon points="20,7 32,14 32,26 20,33 8,26 8,14" fill="rgba(201,168,76,0.08)" stroke="#c9a84c" strokeWidth="0.75" />
      <polygon points="20,7 28,14 20,18 12,14" fill="rgba(201,168,76,0.18)" />
      <polygon points="20,33 28,26 20,22 12,26" fill="rgba(201,168,76,0.08)" />
      <line x1="8" y1="14" x2="20" y2="18" stroke="#c9a84c" strokeWidth="0.5" opacity="0.5" />
      <line x1="32" y1="14" x2="20" y2="18" stroke="#c9a84c" strokeWidth="0.5" opacity="0.5" />
      <circle cx="20" cy="20" r="1.5" fill="#c9a84c" />
    </svg>
  );
}

// ── 2FA Code Input ────────────────────────────────────────────

interface TwoFAInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}

function TwoFAInput({ value, onChange, disabled }: TwoFAInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    const joined = next.join('').replace(/\s/g, '');
    onChange(joined);
    if (char && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    onChange(text);
    const nextIdx = Math.min(text.length, 5);
    inputs.current[nextIdx]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete="one-time-code"
          className="w-10 h-12 text-center text-lg font-mono font-bold text-off-white
                     bg-surface-2 border border-border rounded-lg
                     focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-150"
        />
      ))}
    </div>
  );
}

// ── Step 1: Credentials ───────────────────────────────────────

interface CredentialsStepProps {
  onSuccess: () => void;
  setTwoFACode: (code: string) => void;
  twoFACode: string;
}

function CredentialsStep({ onSuccess }: CredentialsStepProps) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const { login, clearError }         = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    clearError();

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password)     { setError('Please enter your password.'); return; }

    setSubmitting(true);
    try {
      const result = await login({ email: email.trim(), password });
      if (result.requires2FA) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label className="label" htmlFor="login-email">Email Address</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={submitting}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="label" htmlFor="login-password">Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={submitting}
            className="input pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/30 hover:text-off-white/60
                       transition-colors duration-150"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-surface-2 accent-gold cursor-pointer"
          />
          <span className="text-xs text-off-white/50 group-hover:text-off-white/70 transition-colors">
            Remember me
          </span>
        </label>
        <button
          type="button"
          className="text-xs text-gold/70 hover:text-gold transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-loss/8 border border-loss/20">
          <AlertCircle size={14} className="text-loss flex-shrink-0 mt-0.5" />
          <p className="text-xs text-loss leading-snug">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold
                   text-obsidian transition-all duration-250 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}
      >
        {submitting ? (
          <><Loader2 size={16} className="animate-spin" /> Signing in...</>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  );
}

// ── Step 2: 2FA ───────────────────────────────────────────────

interface TwoFAStepProps {
  email: string;
  onBack: () => void;
}

function TwoFAStep({ email, onBack }: TwoFAStepProps) {
  const [code, setCode]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const { login, clearError }       = useAuth();
  const navigate                    = useNavigate();

  // Store email in closure via parent; re-read from form data
  const [storedEmail] = useState(email);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    clearError();
    setSubmitting(true);
    try {
      // We need the original password — for demo, we pass a placeholder.
      // In production, the session token from step 1 would be used.
      await login({ email: storedEmail, password: 'mock-session', twoFactorCode: code });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6" noValidate>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={22} className="text-gold" />
        </div>
        <p className="text-sm text-off-white/60 leading-relaxed">
          Enter the 6-digit verification code sent to your authenticator app.
        </p>
        <p className="text-xs text-off-white/30 mt-2">
          Demo code: <span className="font-mono text-gold/60">123456</span>
        </p>
      </div>

      <TwoFAInput value={code} onChange={setCode} disabled={submitting} />

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-loss/8 border border-loss/20">
          <AlertCircle size={14} className="text-loss flex-shrink-0 mt-0.5" />
          <p className="text-xs text-loss leading-snug">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || code.length < 6}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold
                   text-obsidian transition-all duration-250 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}
      >
        {submitting ? (
          <><Loader2 size={16} className="animate-spin" /> Verifying...</>
        ) : (
          'Verify & Sign In'
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-xs text-off-white/40 hover:text-off-white/70 transition-colors py-1"
      >
        Back to credentials
      </button>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function Login() {
  const [step, setStep]   = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#000000' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(201,168,76,0.04) 0%, transparent 70%)',
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl border border-border p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <GemLogoSmall />
            <div className="mt-3 text-center">
              <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase font-sans">
                OBSIDIAN CAPITAL
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${step === 'credentials' ? 'bg-gold' : 'bg-gold/60'}`} />
            <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${step === '2fa' ? 'bg-gold' : 'bg-border'}`} />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="font-serif text-xl font-medium text-off-white">
              {step === 'credentials' ? 'Welcome Back' : 'Two-Factor Auth'}
            </h2>
            <p className="text-xs text-off-white/40 mt-1">
              {step === 'credentials'
                ? 'Sign in to your Obsidian Capital account'
                : 'Verify your identity to continue'
              }
            </p>
          </div>

          {/* Form */}
          {step === 'credentials' ? (
            <CredentialsStep
              onSuccess={() => setStep('2fa')}
              setTwoFACode={setTwoFACode}
              twoFACode={twoFACode}
            />
          ) : (
            <TwoFAStep
              email={email}
              onBack={() => setStep('credentials')}
            />
          )}

          {/* Register link */}
          {step === 'credentials' && (
            <p className="text-xs text-center text-off-white/30 mt-6">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-gold/70 hover:text-gold transition-colors font-medium"
              >
                Open an account
              </Link>
            </p>
          )}
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-xs text-off-white/20 mt-6 leading-relaxed px-2">
          Protected by Reg BI · SIPC Member · Securities involve risk
        </p>
      </div>
    </div>
  );
}
