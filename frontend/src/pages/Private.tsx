/* ============================================================
   Obsidian Capital — Private Tier Upgrade Page
   ============================================================ */

import React, { useState, useCallback } from 'react';
import {
  Crown,
  TrendingDown,
  UserCheck,
  BarChart3,
  Headphones,
  FileText,
  Calculator,
  CheckCircle2,
  Star,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout, { PageContent } from '@/components/layout/AppLayout';

// ── Types ─────────────────────────────────────────────────────

interface ApplicationForm {
  fullName: string;
  netWorthRange: string;
  liquidAssetsRange: string;
  annualIncomeRange: string;
  investmentExperience: string;
  referralSource: string;
}

// ── Feature Card ──────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

function FeatureCard({ icon, title, description, highlight }: FeatureCardProps) {
  return (
    <div className="relative group bg-surface border border-border rounded-xl p-6 hover:border-gold/40 transition-all duration-300 hover:shadow-gold-md">
      {/* Gold accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gold/10 rounded-lg text-gold">
          {icon}
        </div>
        <h3 className="font-serif text-lg font-medium text-off-white">{title}</h3>
      </div>

      <p className="text-sm text-off-white/60 leading-relaxed font-sans">{description}</p>

      {highlight && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full">
          <Star className="w-3 h-3 text-gold" />
          <span className="text-xs font-medium text-gold font-sans">{highlight}</span>
        </div>
      )}
    </div>
  );
}

// ── Commission Calculator ─────────────────────────────────────

function CommissionCalculator() {
  const [volume, setVolume] = useState('');

  const parseVolume = () => {
    const raw = volume.replace(/[^0-9.]/g, '');
    return parseFloat(raw) || 0;
  };

  const v = parseVolume();
  const standardMin = v * 0.10;
  const standardMax = v * 0.12;
  const privateMin  = v * 0.05;
  const privateMax  = v * 0.06;
  const savingsMin  = standardMin - privateMax;
  const savingsMax  = standardMax - privateMin;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gold/10 rounded-lg text-gold">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-medium text-off-white">Commission Savings Calculator</h3>
          <p className="text-sm text-off-white/50 font-sans">See how much Private tier saves you</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-off-white/70 mb-2 font-sans">
          Monthly Trade Volume
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/40 font-sans">$</span>
          <input
            type="text"
            value={volume}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setVolume(raw ? parseInt(raw).toLocaleString() : '');
            }}
            placeholder="100,000"
            className="w-full bg-surface-2 border border-border rounded-lg pl-7 pr-4 py-3 text-off-white font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
          />
        </div>
      </div>

      {v > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-2 rounded-lg p-4 border border-border">
            <p className="text-xs text-off-white/40 uppercase tracking-wider mb-1 font-sans">Standard Commission</p>
            <p className="text-lg font-semibold text-loss font-mono">
              {fmt(standardMin)}–{fmt(standardMax)}
            </p>
            <p className="text-xs text-off-white/40 font-sans mt-1">10–12% rate</p>
          </div>
          <div className="bg-gold/5 rounded-lg p-4 border border-gold/20">
            <p className="text-xs text-gold/70 uppercase tracking-wider mb-1 font-sans">Private Commission</p>
            <p className="text-lg font-semibold text-gold font-mono">
              {fmt(privateMin)}–{fmt(privateMax)}
            </p>
            <p className="text-xs text-gold/50 font-sans mt-1">5–6% rate</p>
          </div>
          <div className="bg-gain/10 rounded-lg p-4 border border-gain/20">
            <p className="text-xs text-gain/70 uppercase tracking-wider mb-1 font-sans">You Save</p>
            <p className="text-lg font-semibold text-gain font-mono">
              {fmt(savingsMin)}–{fmt(savingsMax)}
            </p>
            <p className="text-xs text-gain/50 font-sans mt-1">per month</p>
          </div>
        </div>
      )}

      {v === 0 && (
        <div className="text-center py-6 text-off-white/30 text-sm font-sans">
          Enter your monthly trade volume above to see your savings
        </div>
      )}
    </div>
  );
}

// ── Already Private Banner ─────────────────────────────────────

function AlreadyPrivateBanner({ name }: { name: string }) {
  return (
    <div className="relative overflow-hidden bg-surface border border-gold/30 rounded-2xl p-8 shadow-gold-md">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gold-gradient-subtle" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="p-4 bg-gold/10 rounded-xl border border-gold/20">
          <Crown className="w-8 h-8 text-gold" />
        </div>

        <div className="flex-1">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-1 font-sans">
            Active Membership
          </p>
          <h2 className="font-serif text-2xl font-semibold text-off-white mb-2">
            You're an Obsidian Private Member
          </h2>
          <p className="text-off-white/60 text-sm font-sans">
            Welcome, {name}. You have full access to all Private tier benefits.
          </p>
        </div>
      </div>

      {/* Perks reminder */}
      <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: <TrendingDown className="w-4 h-4" />, text: '5–6% commissions' },
          { icon: <UserCheck className="w-4 h-4" />, text: 'Dedicated advisor' },
          { icon: <BarChart3 className="w-4 h-4" />, text: 'Advanced analytics' },
          { icon: <Headphones className="w-4 h-4" />, text: '24/7 priority support' },
          { icon: <FileText className="w-4 h-4" />, text: 'Exclusive research' },
          { icon: <Calculator className="w-4 h-4" />, text: 'Tax optimization' },
        ].map((p) => (
          <div key={p.text} className="flex items-center gap-2 text-sm text-off-white/70 font-sans">
            <span className="text-gold">{p.icon}</span>
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Application Form ──────────────────────────────────────────

function ApplicationFormSection({ defaultName }: { defaultName: string }) {
  const [form, setForm] = useState<ApplicationForm>({
    fullName: defaultName,
    netWorthRange: '',
    liquidAssetsRange: '',
    annualIncomeRange: '',
    investmentExperience: '',
    referralSource: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ApplicationForm>>({});

  const validate = (): boolean => {
    const e: Partial<ApplicationForm> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.netWorthRange) e.netWorthRange = 'Please select a range';
    if (!form.liquidAssetsRange) e.liquidAssetsRange = 'Please select a range';
    if (!form.annualIncomeRange) e.annualIncomeRange = 'Please select a range';
    if (!form.investmentExperience) e.investmentExperience = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const update = (field: keyof ApplicationForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <div className="bg-surface border border-gain/30 rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gain/10 rounded-full">
            <CheckCircle2 className="w-10 h-10 text-gain" />
          </div>
        </div>
        <h3 className="font-serif text-2xl font-medium text-off-white mb-3">Application Submitted</h3>
        <p className="text-off-white/60 font-sans text-sm max-w-md mx-auto">
          Thank you for applying for Obsidian Private. A relationship manager will review your application
          and contact you within 1–2 business days.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-gold/70 text-xs font-sans">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Reference ID: OCP-{Date.now().toString(36).toUpperCase()}</span>
        </div>
      </div>
    );
  }

  const selectClass =
    'w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-off-white font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors appearance-none';
  const inputClass =
    'w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-off-white font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors';
  const labelClass = 'block text-sm font-medium text-off-white/70 mb-2 font-sans';
  const errorClass = 'text-xs text-loss mt-1 font-sans';

  return (
    <div className="bg-surface border border-border rounded-xl">
      <div className="p-6 border-b border-border">
        <h3 className="font-serif text-xl font-medium text-off-white">Apply for Obsidian Private</h3>
        <p className="text-sm text-off-white/50 mt-1 font-sans">
          Complete the form below. All information is kept strictly confidential.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className={labelClass}>Full Legal Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={update('fullName')}
            className={inputClass}
            placeholder="Your full legal name"
          />
          {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
        </div>

        {/* Net Worth & Liquid Assets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Net Worth Range</label>
            <select value={form.netWorthRange} onChange={update('netWorthRange')} className={selectClass}>
              <option value="" disabled>Select range</option>
              <option value="1m-5m">$1M – $5M</option>
              <option value="5m-10m">$5M – $10M</option>
              <option value="10m-25m">$10M – $25M</option>
              <option value="25m+">$25M+</option>
            </select>
            {errors.netWorthRange && <p className={errorClass}>{errors.netWorthRange}</p>}
          </div>
          <div>
            <label className={labelClass}>Liquid Assets Range</label>
            <select value={form.liquidAssetsRange} onChange={update('liquidAssetsRange')} className={selectClass}>
              <option value="" disabled>Select range</option>
              <option value="500k-1m">$500K – $1M</option>
              <option value="1m-5m">$1M – $5M</option>
              <option value="5m-10m">$5M – $10M</option>
              <option value="10m+">$10M+</option>
            </select>
            {errors.liquidAssetsRange && <p className={errorClass}>{errors.liquidAssetsRange}</p>}
          </div>
        </div>

        {/* Annual Income & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Annual Income Range</label>
            <select value={form.annualIncomeRange} onChange={update('annualIncomeRange')} className={selectClass}>
              <option value="" disabled>Select range</option>
              <option value="200k-500k">$200K – $500K</option>
              <option value="500k-1m">$500K – $1M</option>
              <option value="1m-5m">$1M – $5M</option>
              <option value="5m+">$5M+</option>
            </select>
            {errors.annualIncomeRange && <p className={errorClass}>{errors.annualIncomeRange}</p>}
          </div>
          <div>
            <label className={labelClass}>Investment Experience (years)</label>
            <select value={form.investmentExperience} onChange={update('investmentExperience')} className={selectClass}>
              <option value="" disabled>Select</option>
              <option value="1-3">1–3 years</option>
              <option value="3-10">3–10 years</option>
              <option value="10-20">10–20 years</option>
              <option value="20+">20+ years</option>
            </select>
            {errors.investmentExperience && <p className={errorClass}>{errors.investmentExperience}</p>}
          </div>
        </div>

        {/* Referral Source */}
        <div>
          <label className={labelClass}>How did you hear about Obsidian Private? <span className="text-off-white/30">(optional)</span></label>
          <select value={form.referralSource} onChange={update('referralSource')} className={selectClass}>
            <option value="">Select (optional)</option>
            <option value="advisor">Financial Advisor</option>
            <option value="existing-client">Existing Client Referral</option>
            <option value="social-media">Social Media</option>
            <option value="press">Press / Media Coverage</option>
            <option value="search">Online Search</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Disclaimer */}
        <div className="bg-surface-2 rounded-lg p-4 text-xs text-off-white/40 font-sans leading-relaxed border border-border/50">
          By submitting this application, you acknowledge that Obsidian Capital will conduct a suitability
          assessment per FINRA Rule 4512. Membership is subject to approval. All financial information
          provided is kept strictly confidential per our Privacy Policy.
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gold text-obsidian font-semibold py-3.5 px-6 rounded-lg font-sans text-sm hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Application…
            </>
          ) : (
            <>
              Apply for Obsidian Private
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function PrivatePage() {
  const { user } = useAuth();
  const isPrivate = user?.tier === 'private';

  return (
    <PageContent>
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-10 sm:p-16 text-center">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gold-gradient-subtle" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

          <div className="relative">
            {/* Crown badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/30 mb-6 mx-auto">
              <Crown className="w-8 h-8 text-gold" />
            </div>

            {/* Title */}
            <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 40%, #f5dfa0 60%, #c9a84c 100%)',
                }}
              >
                Obsidian Private
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-off-white/60 text-lg font-sans font-light tracking-wide mb-2">
              Exclusive access for discerning investors
            </p>
            <p className="text-off-white/40 text-sm font-sans">
              Minimum portfolio value: $1,000,000 · By invitation or application only
            </p>

            {!isPrivate && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 bg-gold text-obsidian font-semibold px-8 py-3 rounded-lg font-sans text-sm hover:bg-gold-light transition-colors"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#calculator"
                  className="inline-flex items-center gap-2 text-gold/80 font-sans text-sm hover:text-gold transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate Your Savings
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Already Private ───────────────────────────── */}
        {isPrivate && user && (
          <AlreadyPrivateBanner name={user.name} />
        )}

        {/* ── Features Grid ─────────────────────────────── */}
        <div>
          <h2 className="font-serif text-2xl font-medium text-off-white mb-6">
            Private Tier Benefits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<TrendingDown className="w-5 h-5" />}
              title="Reduced Commissions"
              description="Trade at 5–6% commission versus the standard 10–12%, saving up to 50% on every transaction."
              highlight="5–6% vs 10–12%"
            />
            <FeatureCard
              icon={<UserCheck className="w-5 h-5" />}
              title="Dedicated Advisor"
              description="Your own personal relationship manager with direct line, email, and mobile access — available when markets demand it."
              highlight="Direct line access"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Advanced Analytics"
              description="Institutional-grade portfolio analytics, factor exposure modeling, risk attribution, and real-time custom alerts."
              highlight="Institutional tools"
            />
            <FeatureCard
              icon={<Headphones className="w-5 h-5" />}
              title="Priority Support"
              description="24/7 white-glove service with a dedicated support team that knows your account and your preferences."
              highlight="24/7 white-glove"
            />
            <FeatureCard
              icon={<FileText className="w-5 h-5" />}
              title="Exclusive Research"
              description="Access proprietary market reports, sector deep-dives, and macro outlooks produced by our in-house research team."
              highlight="Proprietary reports"
            />
            <FeatureCard
              icon={<Calculator className="w-5 h-5" />}
              title="Tax Optimization"
              description="Automated K-1 preparation, tax-loss harvesting strategies, and year-end reporting coordinated with your tax advisor."
              highlight="K-1 & TLH"
            />
          </div>
        </div>

        {/* ── Commission Calculator ──────────────────────── */}
        <div id="calculator">
          <CommissionCalculator />
        </div>

        {/* ── Application Form (non-private users only) ─── */}
        {!isPrivate && (
          <div id="apply">
            <ApplicationFormSection defaultName={user?.name ?? ''} />
          </div>
        )}
    </PageContent>
  );
}
