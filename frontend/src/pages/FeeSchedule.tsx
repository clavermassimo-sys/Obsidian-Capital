/* ============================================================
   Obsidian Capital — Fee Schedule Page
   Public-facing page detailing commission structure by tier
   ============================================================ */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Standard',
    key: 'standard',
    commission: '10–12%',
    monthlyFee: '$0',
    description: 'Entry-level access to Obsidian Capital markets.',
    features: [
      'Market & limit orders',
      'Basic charting',
      'Real-time quotes',
      'Email support',
    ],
    highlighted: false,
  },
  {
    name: 'Member',
    key: 'member',
    commission: '7–9%',
    monthlyFee: '$149',
    description: 'For active traders seeking reduced commissions.',
    features: [
      'Everything in Standard',
      'Reduced commission rate',
      'Advanced order types',
      'Priority support',
      'Screener access',
    ],
    highlighted: true,
  },
  {
    name: 'Private',
    key: 'private',
    commission: '5–6%',
    monthlyFee: '$500',
    description: 'Institutional-grade access for high-volume clients.',
    features: [
      'Everything in Member',
      'Lowest commission rate',
      'Private deal flow access',
      'Dedicated account manager',
      'Custom reporting',
      'API access',
    ],
    highlighted: false,
  },
] as const;

// ── Component ─────────────────────────────────────────────────

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

          <h1
            className="font-serif text-4xl font-medium text-off-white mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            Fee Schedule
          </h1>
          <p className="text-off-white/50 text-lg max-w-2xl">
            Obsidian Capital charges a commission on executed trades. Rates vary by
            membership tier — upgrade any time to reduce your commission.
          </p>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={`relative rounded-xl border p-6 flex flex-col gap-5 ${
                tier.highlighted
                  ? 'border-gold/40 bg-gold/5 shadow-[0_0_40px_rgba(201,168,76,0.06)]'
                  : 'border-border bg-surface-1'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-obsidian text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-off-white/40 mb-1">
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-medium text-gold">
                    {tier.commission}
                  </span>
                  <span className="text-off-white/40 text-sm">commission</span>
                </div>
                <p className="text-off-white/50 text-sm mt-1">
                  {tier.monthlyFee === '$0' ? 'Free membership' : `${tier.monthlyFee}/month`}
                </p>
              </div>

              <p className="text-sm text-off-white/60 leading-relaxed">{tier.description}</p>

              <ul className="space-y-2 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={14} className="text-gold mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-off-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-12 rounded-lg border border-border bg-surface-1 p-6 space-y-3">
          <h2 className="font-sans text-sm font-semibold text-off-white/70 uppercase tracking-wider">
            Important Notes
          </h2>
          <ul className="space-y-2">
            {[
              'Commission is calculated on the gross trade value (shares × execution price).',
              'The effective rate is the midpoint of the displayed range.',
              'Buy orders: commission is added to the total cost.',
              'Sell orders: commission is deducted from your net proceeds.',
              'Commissions are charged at the time of order execution.',
              'Trading is executed by Alpaca Securities LLC, member FINRA/SIPC.',
            ].map((note) => (
              <li key={note} className="flex items-start gap-2 text-sm text-off-white/50">
                <span className="text-gold mt-1">·</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-off-white/30">
          Fees subject to change with 30 days notice.{' '}
          <Link to="/terms" className="underline hover:text-off-white/50 transition-colors">
            Terms & Conditions
          </Link>{' '}
          apply.
        </p>
      </div>
    </div>
  );
}
