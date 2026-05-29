/* ============================================================
   Obsidian Capital — Landing Page
   Full marketing page for the luxury brokerage platform
   ============================================================ */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Shield,
  Gem,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Lock,
  Globe,
  Award,
  Users,
  DollarSign,
  Eye,
} from 'lucide-react';

// ── Logo SVG ──────────────────────────────────────────────────

function GemLogo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Obsidian Capital gem logo"
    >
      <polygon
        points="40,4 72,22 72,58 40,76 8,58 8,22"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="2"
      />
      <polygon
        points="40,14 64,28 64,52 40,66 16,52 16,28"
        fill="rgba(201,168,76,0.06)"
        stroke="#c9a84c"
        strokeWidth="1"
      />
      {/* Top facet */}
      <polygon
        points="40,14 56,28 40,36 24,28"
        fill="rgba(201,168,76,0.18)"
        stroke="rgba(201,168,76,0.3)"
        strokeWidth="0.5"
      />
      {/* Bottom facet */}
      <polygon
        points="40,66 56,52 40,44 24,52"
        fill="rgba(201,168,76,0.08)"
        stroke="rgba(201,168,76,0.2)"
        strokeWidth="0.5"
      />
      {/* Left facet */}
      <polygon
        points="16,28 40,36 40,44 16,52"
        fill="rgba(201,168,76,0.12)"
        stroke="rgba(201,168,76,0.25)"
        strokeWidth="0.5"
      />
      {/* Right facet */}
      <polygon
        points="64,28 40,36 40,44 64,52"
        fill="rgba(201,168,76,0.14)"
        stroke="rgba(201,168,76,0.25)"
        strokeWidth="0.5"
      />
      {/* Inner glow lines */}
      <line x1="40" y1="14" x2="40" y2="36" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6" />
      <line x1="40" y1="44" x2="40" y2="66" stroke="#c9a84c" strokeWidth="0.75" opacity="0.4" />
      <line x1="16" y1="28" x2="40" y2="36" stroke="#c9a84c" strokeWidth="0.75" opacity="0.5" />
      <line x1="64" y1="28" x2="40" y2="36" stroke="#c9a84c" strokeWidth="0.75" opacity="0.5" />
      <line x1="16" y1="52" x2="40" y2="44" stroke="#c9a84c" strokeWidth="0.75" opacity="0.4" />
      <line x1="64" y1="52" x2="40" y2="44" stroke="#c9a84c" strokeWidth="0.75" opacity="0.4" />
      {/* Outer glow */}
      <polygon
        points="40,4 72,22 72,58 40,76 8,58 8,22"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="0.5"
        opacity="0.3"
        transform="scale(1.06) translate(-2.4,-2.4)"
      />
      {/* Center jewel */}
      <circle cx="40" cy="40" r="3" fill="#c9a84c" />
      <circle cx="40" cy="40" r="5" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

// ── Section: Hero ─────────────────────────────────────────────

function HeroSection({ onCTA }: { onCTA: (path: string) => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 md:px-6 py-16 md:py-24">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(201,168,76,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div
            className="p-4 md:p-6 rounded-2xl"
            style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <GemLogo size={56} />
          </div>
        </div>

        {/* Brand name */}
        <p className="text-xs font-bold tracking-[0.3em] md:tracking-[0.4em] text-gold uppercase mb-4 md:mb-6 font-sans">
          OBSIDIAN CAPITAL
        </p>

        {/* Headline */}
        <h1
          className="font-serif font-medium leading-tight mb-4 md:mb-6"
          style={{
            fontSize: 'clamp(2rem, 6vw, 5rem)',
            background: 'linear-gradient(135deg, #f0ede8 0%, #c9a84c 40%, #e8c96e 60%, #f0ede8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Trade Like the Elite.
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-off-white/60 max-w-2xl mx-auto mb-3 md:mb-4 font-sans leading-relaxed">
          A new standard in private brokerage. Commission-based trading engineered for
          discerning investors who demand sophistication, transparency, and elite access.
        </p>
        <p className="text-xs md:text-sm text-off-white/40 max-w-xl mx-auto mb-8 md:mb-12 font-sans">
          Washington, D.C. · Founded 2026 · SIPC Protected · SEC Regulated
        </p>

        {/* CTAs — full width on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 md:gap-4 max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={() => onCTA('/register')}
            className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold
                       text-obsidian transition-all duration-250 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)',
              boxShadow: '0 8px 32px rgba(201,168,76,0.25)',
            }}
          >
            Open Account
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>

          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold
                       text-off-white border border-border hover:border-gold/40 hover:text-gold
                       transition-all duration-250 bg-surface/50 backdrop-blur-sm"
          >
            Learn More
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scroll indicator — hidden on small mobile */}
        <div className="mt-12 md:mt-20 hidden sm:flex justify-center opacity-30">
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-gold" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: Stats ────────────────────────────────────────────

const STATS = [
  { label: 'Standard Commission', value: '$4.99', icon: DollarSign },
  { label: 'Member Commission', value: '$2.99', icon: TrendingUp },
  { label: 'Private Commission', value: '$0.99', icon: Eye },
  { label: 'Founded', value: 'D.C. 2026', icon: Users },
];

function StatsBar() {
  return (
    <section className="py-8 md:py-12 px-4 md:px-6 border-y border-border relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }}
      />
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div className="flex justify-center mb-2">
                <Icon size={18} className="text-gold/60" />
              </div>
              <div
                className="font-mono font-bold mb-1"
                style={{
                  fontSize: '1.75rem',
                  background: 'linear-gradient(135deg, #c9a84c, #e8c96e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </div>
              <p className="text-xs text-off-white/40 font-sans tracking-wide">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Section: Features ─────────────────────────────────────────

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Commission-Based Trading',
    description:
      'Straightforward commission structure based on your membership tier. No hidden fees, no surprises — just transparent pricing that rewards loyalty and account size.',
    points: ['Standard: $4.99 per trade', 'Member: $2.99 per trade', 'Obsidian Private: $0.99 per trade'],
    accent: 'border-gold/20',
    iconBg: 'bg-gold/10',
    iconColor: 'text-gold',
  },
  {
    icon: Gem,
    title: 'Obsidian Private Tier',
    description:
      'Our flagship membership for high-net-worth investors. Access exclusive markets, priority execution, dedicated concierge support, and the lowest available commission rates.',
    points: ['Priority order execution', 'Dedicated relationship manager', 'Exclusive investment access', 'White-glove onboarding'],
    accent: 'border-gold/40',
    iconBg: 'bg-gold/15',
    iconColor: 'text-gold',
    featured: true,
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Institutional-grade market data, real-time charts, portfolio analytics, and screening tools — the same intelligence that powers professional trading desks.',
    points: ['Real-time market data', 'Advanced charting suite', 'Portfolio performance analytics', 'Custom stock screener'],
    accent: 'border-border',
    iconBg: 'bg-surface-3',
    iconColor: 'text-off-white/70',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-16">
          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            PLATFORM FEATURES
          </p>
          <h2 className="font-serif text-2xl md:text-4xl font-medium text-off-white mb-4">
            Built for Serious Investors
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />
        </div>

        {/* Feature cards — single col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`relative p-6 rounded-2xl border ${feature.accent} transition-all duration-300 hover:border-gold/30
                  ${feature.featured
                    ? 'bg-gradient-to-b from-surface-2 to-surface shadow-gold-md'
                    : 'bg-surface'
                  }`}
              >
                {feature.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-2xs font-bold tracking-widest uppercase text-obsidian rounded-full"
                      style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96e)' }}>
                      FLAGSHIP TIER
                    </span>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.iconBg}`}>
                  <Icon size={20} className={feature.iconColor} />
                </div>

                <h3 className="font-sans font-semibold text-off-white text-base mb-3">{feature.title}</h3>
                <p className="text-sm text-off-white/50 mb-5 leading-relaxed">{feature.description}</p>

                <ul className="space-y-2">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-xs text-off-white/60">
                      <CheckCircle2 size={13} className="text-gold/60 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Section: Commission Table ─────────────────────────────────

const COMMISSION_TIERS = [
  {
    tier: 'Standard',
    rate: '$4.99',
    rateSub: 'per trade · free account',
    monthly: null,
    support: 'Standard',
    execution: 'Standard',
    features: ['Full platform access', 'Real-time market data', 'Charts & screener', 'Portfolio tracking'],
    badge: 'bg-surface-3 text-off-white/60 border border-border',
  },
  {
    tier: 'Member',
    rate: '$2.99',
    rateSub: 'per trade · $29.99/month',
    monthly: '$29.99/mo',
    support: 'Priority',
    execution: 'Enhanced',
    features: ['Full platform access', 'Real-time market data', 'Advanced charts', 'Priority support', '40% lower commission'],
    badge: 'bg-[#1e1b4b] text-indigo-300 border border-indigo-500/30',
    highlighted: true,
  },
  {
    tier: 'Obsidian Private',
    rate: '$0.99',
    rateSub: 'per trade · $199.99/month',
    monthly: '$199.99/mo',
    support: 'Concierge',
    execution: 'Priority',
    features: ['Full platform access', 'Real-time market data', 'Advanced charts', 'Dedicated relationship manager', '80% lower commission', 'Priority execution'],
    badge: 'bg-gold/10 text-gold-light border border-gold/30',
    featured: true,
  },
];

function CommissionTable() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-surface/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            TRANSPARENT PRICING
          </p>
          <h2 className="font-serif text-2xl md:text-4xl font-medium text-off-white mb-4">
            Commission Tiers
          </h2>
          <p className="text-off-white/50 max-w-xl mx-auto text-sm">
            Our commission structure rewards commitment. The more you invest, the more you save.
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
        </div>

        {/* Tier cards — horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 min-w-[280px]">
          {COMMISSION_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className={`p-6 rounded-2xl border transition-all duration-300 relative
                ${tier.featured
                  ? 'bg-surface border-gold/30 shadow-gold-md'
                  : tier.highlighted
                    ? 'bg-surface border-indigo-500/20'
                    : 'bg-surface border-border hover:border-border/80'
                }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-2xs font-bold tracking-widest uppercase text-obsidian rounded-full"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96e)' }}>
                    MOST EXCLUSIVE
                  </span>
                </div>
              )}

              {/* Tier badge */}
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold tracking-wider uppercase mb-4 ${tier.badge}`}>
                {tier.tier}
              </div>

              {/* Commission rate — prominent */}
              <div className="mb-1">
                <span
                  className="font-mono font-bold"
                  style={{
                    fontSize: '2.5rem',
                    background: tier.featured
                      ? 'linear-gradient(135deg, #c9a84c, #e8c96e)'
                      : tier.highlighted
                        ? 'linear-gradient(135deg, #818cf8, #a5b4fc)'
                        : 'none',
                    color: tier.featured || tier.highlighted ? 'transparent' : '#f0ede8',
                    WebkitBackgroundClip: tier.featured || tier.highlighted ? 'text' : undefined,
                    WebkitTextFillColor: tier.featured || tier.highlighted ? 'transparent' : undefined,
                    backgroundClip: tier.featured || tier.highlighted ? 'text' : undefined,
                  }}
                >
                  {tier.rate}
                </span>
              </div>
              <p className="text-xs text-off-white/40 mb-6">{tier.rateSub}</p>

              {/* Details */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-off-white/50">Min. Account</span>
                  <span className="text-off-white font-medium font-mono">{tier.minDeposit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-off-white/50">Support Level</span>
                  <span className="text-off-white font-medium">{tier.support}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-off-white/50">Execution</span>
                  <span className="text-off-white font-medium">{tier.execution}</span>
                </div>
              </div>

              {/* Feature list */}
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-off-white/60">
                    <CheckCircle2
                      size={12}
                      className={tier.featured ? 'text-gold' : tier.highlighted ? 'text-indigo-400' : 'text-off-white/30'}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: About ────────────────────────────────────────────

const LEADERSHIP = [
  { name: 'Massimo Claver-Carone', role: 'Chief Executive Officer & Founder', initial: 'MC' },
  { name: 'Marco Torterelli', role: 'Chief Technology Officer', initial: 'MT' },
  { name: 'Hugh Snyder', role: 'Chief Financial Officer', initial: 'HS' },
];

function AboutSection() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left: About text */}
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
              ABOUT US
            </p>
            <h2 className="font-serif text-2xl md:text-4xl font-medium text-off-white mb-4 md:mb-6 leading-tight">
              A New Standard in<br />Private Brokerage
            </h2>
            <div className="w-12 h-px bg-gold mb-8" />

            <div className="space-y-5 text-sm text-off-white/60 leading-relaxed">
              <p>
                Founded in Washington, D.C. in 2026, Obsidian Capital was built on the
                belief that sophisticated investors deserve a brokerage that matches their
                standard. We combine institutional-grade technology with the personalized
                service of a private bank.
              </p>
              <p>
                Our flat-fee commission model aligns our interests with yours. Standard
                accounts pay $4.99 per trade — Members pay $2.99, Private clients just
                $0.99. No hidden fees, no inactivity charges, no payment-for-order-flow.
              </p>
              <p>
                From our flagship Obsidian Private tier to our accessible Standard
                accounts, every client receives the same best-in-class platform,
                real-time data, and the security of SIPC protection.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: Globe,  label: 'Washington, D.C.' },
                { icon: Shield, label: 'SIPC Protected'    },
                { icon: Lock,   label: 'SEC Regulated'     },
                { icon: Award,  label: 'Est. 2026'         },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs text-off-white/50">
                    <Icon size={13} className="text-gold/60 flex-shrink-0" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Leadership */}
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-gold/60 uppercase mb-6 font-sans">
              LEADERSHIP
            </p>
            <div className="space-y-4">
              {LEADERSHIP.map((leader) => (
                <div
                  key={leader.name}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border
                             hover:border-gold/20 transition-colors duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                               text-xs font-bold text-obsidian"
                    style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}
                  >
                    {leader.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-off-white">{leader.name}</p>
                    <p className="text-xs text-off-white/40">{leader.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: Leadership ───────────────────────────────────────

const LEADERS = [
  {
    firstName: 'Massimo',
    lastName: 'Claver-Carone',
    role: 'CEO & Founder',
    quote: 'Building the future of elite trading.',
    initials: 'MC',
  },
  {
    firstName: 'Marco',
    lastName: 'Torterelli',
    role: 'CTO',
    quote: 'Technology-first approach to brokerage.',
    initials: 'MT',
  },
  {
    firstName: 'Hugh',
    lastName: 'Snyder',
    role: 'CFO',
    quote: 'Sound financial architecture for growth.',
    initials: 'HS',
  },
];

function PersonSilhouette() {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">
      <circle cx="40" cy="28" r="16" fill="rgba(201,168,76,0.18)" />
      <ellipse cx="40" cy="68" rx="24" ry="16" fill="rgba(201,168,76,0.10)" />
    </svg>
  );
}

function LeadershipSection() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-surface/20">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-16">
          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            LEADERSHIP
          </p>
          <h2 className="font-serif text-2xl md:text-4xl font-medium text-off-white mb-4">
            The Team Behind Obsidian
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />
        </div>

        {/* Leader cards — single col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {LEADERS.map((leader) => (
            <div
              key={leader.lastName}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border hover:border-gold/20 transition-colors duration-300"
            >
              {/* Avatar circle with initials */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5 flex-shrink-0 font-serif text-xl font-semibold text-obsidian"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)',
                  border: '2px solid rgba(201,168,76,0.5)',
                }}
              >
                {leader.initials}
              </div>

              {/* Name */}
              <p className="font-serif text-lg font-medium text-off-white leading-tight">
                {leader.firstName}
              </p>
              <p className="font-serif text-lg font-medium text-off-white leading-tight mb-1">
                {leader.lastName}
              </p>

              {/* Role */}
              <p className="text-xs font-bold tracking-[0.2em] text-gold/70 uppercase font-sans mb-4">
                {leader.role}
              </p>

              {/* Quote */}
              <div className="border-t border-border/50 pt-4 w-full">
                <p className="text-sm text-off-white/50 font-sans italic leading-relaxed">
                  &ldquo;{leader.quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section: CTA ──────────────────────────────────────────────

function CTASection({ onCTA }: { onCTA: (path: string) => void }) {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6 md:mb-8">
          <GemLogo size={48} />
        </div>
        <h2 className="font-serif text-2xl md:text-4xl font-medium text-off-white mb-4">
          Ready to Trade with Obsidian?
        </h2>
        <p className="text-off-white/50 text-sm mb-8 md:mb-10 max-w-lg mx-auto leading-relaxed">
          Join a select community of investors who have elevated their approach.
          Open your account in minutes and start trading with confidence.
        </p>
        {/* Full-width buttons on mobile */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={() => onCTA('/register')}
            className="group inline-flex items-center justify-center gap-2.5 px-8 md:px-10 py-4 rounded-xl text-sm font-semibold
                       text-obsidian transition-all duration-250 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)',
              boxShadow: '0 8px 40px rgba(201,168,76,0.25)',
            }}
          >
            Open Your Account
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => onCTA('/login')}
            className="inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 rounded-xl text-sm font-semibold
                       text-off-white/70 border border-border hover:border-gold/30 hover:text-off-white
                       transition-all duration-250 bg-surface/50"
          >
            Sign In
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Footer nav links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 pb-6 border-b border-border/50">
          <span className="text-xs font-bold tracking-[0.25em] text-gold/60 uppercase font-sans">
            OBSIDIAN CAPITAL
          </span>
          <div className="flex items-center gap-x-5 ml-auto flex-wrap gap-y-2">
            <a href="/fees" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Fee Schedule
            </a>
            <a href="/terms" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Terms
            </a>
            <a href="/privacy" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Privacy
            </a>
            <a href="/login" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Sign In
            </a>
          </div>
        </div>

        {/* Legal text */}
        <div className="space-y-3 text-xs text-off-white/25 leading-relaxed max-w-4xl">
          <p>
            Brokerage services powered by{' '}
            <strong className="text-off-white/35">Alpaca Securities LLC</strong>, member FINRA/SIPC.
            Obsidian Capital is an introducing broker. Securities accounts held at Alpaca Securities LLC.
            Order execution and account custody services provided exclusively by Alpaca Securities LLC.
          </p>
          <p>
            <strong className="text-off-white/35">SIPC Protection Notice:</strong> Securities held in accounts
            at Obsidian Capital are protected by the Securities Investor Protection Corporation (SIPC) up to
            $500,000 (including $250,000 in cash). SIPC protection does not cover market losses or guarantee
            investment returns.
          </p>
          <p>
            Investing involves risk, including the possible loss of principal. Past performance is not
            indicative of future results. Commission rates shown are estimates; actual rates may vary based
            on order type, market conditions, and account tier. All figures are projections for illustrative
            purposes.
          </p>
          <p>
            © 2026 Obsidian Capital LLC. Washington, D.C. All rights reserved. Member SIPC.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();

  function handleCTA(path: string) {
    navigate(path);
  }

  return (
    <div className="min-h-screen bg-obsidian font-sans">
      {/* Top nav bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 h-14 md:h-16"
        style={{ background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(42,42,42,0.8)' }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
            <polygon points="20,7 32,14 32,26 20,33 8,26 8,14" fill="rgba(201,168,76,0.08)" stroke="#c9a84c" strokeWidth="0.75" />
            <circle cx="20" cy="20" r="2" fill="#c9a84c" />
          </svg>
          <span className="text-xs font-bold tracking-[0.2em] md:tracking-[0.25em] text-gold uppercase font-sans">
            <span className="hidden sm:inline">OBSIDIAN CAPITAL</span>
            <span className="sm:hidden">OBSIDIAN</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCTA('/login')}
            className="tap-target text-xs font-medium text-off-white/60 hover:text-off-white transition-colors px-3 py-2"
          >
            Sign In
          </button>
          <button
            onClick={() => handleCTA('/register')}
            className="tap-target text-xs font-semibold text-obsidian px-3 md:px-4 py-2 rounded-lg transition-all duration-200 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96e)' }}
          >
            <span className="hidden sm:inline">Open Account</span>
            <span className="sm:hidden">Open</span>
          </button>
        </div>
      </header>

      {/* Main sections */}
      <div className="pt-16">
        <HeroSection onCTA={handleCTA} />
        <StatsBar />
        <FeaturesSection />
        <CommissionTable />
        <LeadershipSection />
        <AboutSection />
        <CTASection onCTA={handleCTA} />
        <Footer />
      </div>
    </div>
  );
}
