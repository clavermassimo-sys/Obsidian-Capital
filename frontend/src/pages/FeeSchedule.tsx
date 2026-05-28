/* ============================================================
   Obsidian Capital — Fee Schedule Page
   Public page: commission tiers, interactive calculator, other fees, disclosures
   ============================================================ */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Gem, Check, TrendingUp, ArrowRight } from 'lucide-react';

// ── Tier Data ──────────────────────────────────────────────────

const TIERS = [
  {
    key: 'standard',
    name: 'STANDARD',
    icon: null,
    priceLabel: 'Free to join',
    priceDetail: '$0/month',
    commissionMin: 0.10,
    commissionMax: 0.12,
    commissionLabel: '10–12% per trade',
    savingsLabel: null,
    ctaLabel: 'Get Started',
    ctaPath: '/register',
    featured: false,
    color: 'border-border',
    badgeColor: 'text-off-white/60',
    rateColor: '#f0ede8',
  },
  {
    key: 'member',
    name: 'OBSIDIAN MEMBER',
    icon: Star,
    priceLabel: '$29.99/month',
    priceDetail: 'Billed monthly',
    commissionMin: 0.07,
    commissionMax: 0.09,
    commissionLabel: '7–9% per trade',
    savingsLabel: 'Save up to 3% vs Standard',
    ctaLabel: 'Start Free Trial',
    ctaPath: '/register?plan=member',
    featured: true,
    color: 'border-gold/40',
    badgeColor: 'text-gold',
    rateColor: '#c9a84c',
  },
  {
    key: 'private',
    name: 'OBSIDIAN PRIVATE',
    icon: Gem,
    priceLabel: '$199.99/month',
    priceDetail: 'Billed monthly',
    commissionMin: 0.05,
    commissionMax: 0.06,
    commissionLabel: '5–6% per trade',
    savingsLabel: 'Save up to 7% vs Standard',
    ctaLabel: 'Apply Now',
    ctaPath: '/register?plan=private',
    featured: false,
    color: 'border-border',
    badgeColor: 'text-off-white/50',
    rateColor: '#f0ede8',
  },
] as const;

// ── Other Fees ─────────────────────────────────────────────────

const OTHER_FEES = [
  { type: 'Margin Interest',    amount: 'Prime + 2.5%' },
  { type: 'Paper Trading',      amount: 'Free'          },
  { type: 'Account Minimum',    amount: '$0'            },
  { type: 'ACH Transfer',       amount: 'Free'          },
  { type: 'Wire Transfer',      amount: '$25'           },
  { type: 'Monthly Statement',  amount: 'Free'          },
  { type: 'Inactivity Fee',     amount: 'None'          },
  { type: 'Account Closure',    amount: 'Free'          },
];

// ── Commission Calculator ──────────────────────────────────────

function CommissionCalculator() {
  const [tradeValue, setTradeValue]   = useState(10000);
  const [tradesPerMonth, setTradesPerMonth] = useState(10);

  const formatUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  // Use midpoint rate for display
  const rates = {
    standard: 0.11,
    member:   0.08,
    private:  0.055,
  };

  const commission = (rate: number) => tradeValue * rate;
  const annualSavings = (rateA: number, rateB: number) =>
    (rateA - rateB) * tradeValue * tradesPerMonth * 12;

  return (
    <section className="py-20 px-6 bg-surface/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            COMMISSION CALCULATOR
          </p>
          <h2 className="font-serif text-3xl font-medium text-off-white mb-3">
            See How Much You Save
          </h2>
          <p className="text-off-white/50 text-sm max-w-lg mx-auto">
            Adjust the sliders to see your estimated commission costs and annual savings by tier.
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
        </div>

        {/* Sliders */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8 space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-off-white/60 font-sans">Trade Value</label>
              <span className="text-sm font-mono font-semibold text-gold">
                {formatUSD(tradeValue)}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={tradeValue}
              onChange={(e) => setTradeValue(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #c9a84c ${((tradeValue - 100) / 99900) * 100}%, #2a2a2a ${((tradeValue - 100) / 99900) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-off-white/25 mt-1 font-mono">
              <span>$100</span>
              <span>$100,000</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-off-white/60 font-sans">Trades per Month</label>
              <span className="text-sm font-mono font-semibold text-gold">{tradesPerMonth}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={tradesPerMonth}
              onChange={(e) => setTradesPerMonth(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #c9a84c ${((tradesPerMonth - 1) / 99) * 100}%, #2a2a2a ${((tradesPerMonth - 1) / 99) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-off-white/25 mt-1 font-mono">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Per-trade comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {(['standard', 'member', 'private'] as const).map((key) => {
            const tier = TIERS.find((t) => t.key === key)!;
            const comm = commission(rates[key]);
            return (
              <div
                key={key}
                className={`bg-surface border ${tier.color} rounded-xl p-5 text-center`}
              >
                <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2 font-sans" style={{ color: tier.rateColor }}>
                  {tier.name}
                </p>
                <p className="text-2xl font-mono font-bold text-off-white">{formatUSD(comm)}</p>
                <p className="text-xs text-off-white/40 font-sans mt-1">per trade</p>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-mono font-semibold text-off-white/70">
                    {formatUSD(comm * tradesPerMonth)}
                  </p>
                  <p className="text-xs text-off-white/30 font-sans">per month</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Annual savings projection */}
        <div className="bg-surface-2 border border-gold/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gold" />
            <p className="text-sm font-medium text-off-white font-sans">
              Annual Savings Projection ({tradesPerMonth} trades/month)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface rounded-lg p-4 text-center">
              <p className="text-xs text-off-white/40 font-sans mb-1">Standard → Member</p>
              <p
                className="text-xl font-mono font-bold"
                style={{
                  color: annualSavings(rates.standard, rates.member) > 0 ? '#3d9e6e' : '#f0ede8',
                }}
              >
                {formatUSD(annualSavings(rates.standard, rates.member))}
              </p>
              <p className="text-xs text-off-white/30 font-sans mt-1">saved per year</p>
            </div>
            <div className="bg-surface rounded-lg p-4 text-center">
              <p className="text-xs text-off-white/40 font-sans mb-1">Standard → Private</p>
              <p
                className="text-xl font-mono font-bold"
                style={{
                  color: annualSavings(rates.standard, rates.private) > 0 ? '#3d9e6e' : '#f0ede8',
                }}
              >
                {formatUSD(annualSavings(rates.standard, rates.private))}
              </p>
              <p className="text-xs text-off-white/30 font-sans mt-1">saved per year</p>
            </div>
          </div>
          <p className="text-xs text-off-white/25 mt-3 font-sans">
            * Projections use midpoint commission rates. Actual savings may vary.
            Member plan savings are net of the $29.99/mo subscription fee.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function FeeSchedule() {
  return (
    <div className="min-h-screen bg-obsidian text-off-white">
      {/* Header */}
      <div
        className="border-b border-border"
        style={{ background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-off-white/40 hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>

          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            OBSIDIAN CAPITAL
          </p>
          <h1
            className="font-serif text-4xl font-medium text-off-white mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            Fee Schedule
          </h1>
          <p className="text-off-white/50 text-lg max-w-2xl font-sans">
            Transparent pricing. No hidden fees.
          </p>
        </div>
      </div>

      {/* Section 1: Commission Tier Cards */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
              COMMISSION TIERS
            </p>
            <h2 className="font-serif text-3xl font-medium text-off-white mb-2">
              Choose Your Tier
            </h2>
            <p className="text-off-white/50 text-sm max-w-xl mx-auto">
              Our commission structure rewards active membership. Upgrade any time to reduce your rate.
            </p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const IconComp = tier.icon as React.ComponentType<{ size: number; className: string }> | null;
              return (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl border ${tier.color} p-6 flex flex-col gap-5 transition-all duration-300 hover:border-gold/30 ${
                    tier.featured
                      ? 'bg-gradient-to-b from-surface-2 to-surface shadow-[0_0_40px_rgba(201,168,76,0.08)]'
                      : 'bg-surface'
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className="px-3 py-1 text-xs font-bold tracking-widest uppercase text-obsidian rounded-full"
                        style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96e)' }}
                      >
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Tier name */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {IconComp && <IconComp size={14} className="text-gold" />}
                      <p
                        className="text-xs font-bold tracking-[0.2em] uppercase font-sans"
                        style={{ color: tier.rateColor }}
                      >
                        {tier.name}
                      </p>
                    </div>

                    {/* Price */}
                    <p className="text-2xl font-sans font-bold text-off-white">{tier.priceLabel}</p>
                    <p className="text-xs text-off-white/40 font-sans mt-0.5">{tier.priceDetail}</p>
                  </div>

                  {/* Commission rate — prominent */}
                  <div className="py-4 border-y border-border text-center">
                    <span
                      className="font-mono font-bold"
                      style={{
                        fontSize: '2.25rem',
                        background: tier.featured
                          ? 'linear-gradient(135deg, #c9a84c, #e8c96e)'
                          : 'none',
                        color: tier.featured ? 'transparent' : tier.rateColor,
                        WebkitBackgroundClip: tier.featured ? 'text' : undefined,
                        WebkitTextFillColor: tier.featured ? 'transparent' : undefined,
                        backgroundClip: tier.featured ? 'text' : undefined,
                      }}
                    >
                      {tier.commissionLabel.split(' ')[0]}
                    </span>
                    <p className="text-xs text-off-white/40 font-sans mt-1">per trade</p>
                    {tier.savingsLabel && (
                      <p className="text-xs text-gain font-sans mt-1">{tier.savingsLabel}</p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    to={tier.ctaPath}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      tier.featured
                        ? 'text-obsidian'
                        : 'text-off-white/80 border border-border hover:border-gold/30 hover:text-off-white'
                    }`}
                    style={
                      tier.featured
                        ? { background: 'linear-gradient(135deg, #c9a84c, #e8c96e)' }
                        : { background: 'transparent' }
                    }
                  >
                    {tier.ctaLabel}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Commission Calculator */}
      <CommissionCalculator />

      {/* Section 3: Other Fees */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase mb-3 font-sans">
              OTHER FEES
            </p>
            <h2 className="font-serif text-3xl font-medium text-off-white mb-2">
              What Else Do You Pay?
            </h2>
            <p className="text-off-white/50 text-sm">Almost nothing.</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
          </div>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left py-4 px-6 text-xs font-medium text-off-white/40 uppercase tracking-wider font-sans">
                    Fee Type
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-medium text-off-white/40 uppercase tracking-wider font-sans">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {OTHER_FEES.map((fee, i) => (
                  <tr
                    key={fee.type}
                    className={`border-b border-border/40 transition-colors hover:bg-surface-2/50 ${
                      i === OTHER_FEES.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="py-4 px-6 text-off-white/80 font-sans">{fee.type}</td>
                    <td className="py-4 px-6 text-right font-mono font-medium text-off-white">
                      {fee.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'No Inactivity Fees', desc: 'Keep your account open as long as you like' },
              { label: 'No Hidden Charges', desc: 'The only fee we charge is our commission' },
              { label: 'Free Paper Trading', desc: 'Practice risk-free with simulated trades' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 bg-surface-2 rounded-xl p-4 border border-border"
              >
                <Check size={14} className="text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-off-white font-sans">{item.label}</p>
                  <p className="text-xs text-off-white/40 font-sans mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Regulatory Disclosures */}
      <section className="py-12 px-6 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs font-bold tracking-[0.3em] text-off-white/30 uppercase font-sans">
            REGULATORY DISCLOSURES
          </p>
          <p className="text-xs text-off-white/30 font-sans leading-relaxed">
            Trading provided by Interactive Brokers LLC, member FINRA/SIPC. Obsidian Capital is not a
            registered broker-dealer. Commissions charged by Obsidian Capital are platform fees
            separate from any exchange or regulatory fees. Commission rates shown are estimates;
            actual rates may vary based on order type, market conditions, and account tier. All
            figures shown are for illustrative purposes. Past performance is not indicative of future
            results. Investing involves risk, including the possible loss of principal.
          </p>
          <p className="text-xs text-off-white/30 font-sans leading-relaxed">
            Securities held in accounts at Obsidian Capital are protected by the Securities Investor
            Protection Corporation (SIPC) up to $500,000 (including $250,000 in cash). SIPC
            protection does not cover market losses.
          </p>
          <p className="text-xs text-off-white/30 font-sans">
            Fees subject to change with 30 days notice.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-off-white/25 font-sans">
            © 2026 Obsidian Capital LLC. Washington, D.C. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Home
            </Link>
            <Link to="/terms" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Terms
            </Link>
            <Link to="/privacy" className="text-xs text-off-white/30 hover:text-gold transition-colors font-sans">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
