/* ============================================================
   Obsidian Capital — CommissionCalculator
   Reusable breakdown showing subtotal, commission, and total
   for a given shares × price trade with tier-based rates.
   ============================================================ */

import React from 'react';
import type { CommissionTier, OrderSide } from '@/types';
import { getCommissionBreakdown, COMMISSION_RATES } from '@/utils/commission';

// ── Types ─────────────────────────────────────────────────────

interface CommissionCalculatorProps {
  shares: number;
  price: number;
  tier: CommissionTier;
  side: OrderSide;
  /** Optional additional class names for the wrapper */
  className?: string;
  /** Compact mode: smaller padding, less whitespace */
  compact?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

const TIER_LABELS: Record<CommissionTier, string> = {
  standard: 'Standard Tier',
  member: 'Member Tier',
  private: 'Private Tier',
};

// ── Component ─────────────────────────────────────────────────

export function CommissionCalculator({
  shares,
  price,
  tier,
  side,
  className = '',
  compact = false,
}: CommissionCalculatorProps) {
  const subtotal = shares * price;
  const breakdown = getCommissionBreakdown(subtotal, tier);
  const rateDisplay = COMMISSION_RATES[tier].display;
  const tierLabel = TIER_LABELS[tier];

  // For a sell: commission is deducted from proceeds
  // For a buy: commission is added to the cost
  const totalLabel = side === 'buy' ? 'Total Cost' : 'Net Proceeds';
  const displayTotal =
    side === 'sell'
      ? subtotal - breakdown.amount
      : breakdown.total;

  const isValid = shares > 0 && price > 0;

  const padding = compact ? 'p-3' : 'p-4';
  const textSm = compact ? 'text-xs' : 'text-sm';
  const textBase = compact ? 'text-sm' : 'text-base';

  return (
    <div
      className={`rounded-lg border border-border bg-surface-2 ${padding} ${className}`}
      aria-label="Commission breakdown"
    >
      {/* Tier badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`${textSm} text-[#a09a8e] font-sans`}>
          {tierLabel}
        </span>
        <span
          className={`${textSm} font-semibold font-sans`}
          style={{ color: '#c9a84c' }}
        >
          {rateDisplay} Commission
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-3" />

      {/* Line items */}
      <div className="space-y-2">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className={`${textSm} text-[#a09a8e] font-sans`}>
            Subtotal ({shares.toLocaleString()} × {formatCurrency(price)})
          </span>
          <span
            className={`${textSm} font-mono text-[#f0ede8] ${!isValid ? 'opacity-40' : ''}`}
          >
            {isValid ? formatCurrency(subtotal) : '—'}
          </span>
        </div>

        {/* Commission */}
        <div className="flex items-center justify-between">
          <span className={`${textSm} text-[#a09a8e] font-sans`}>
            Commission ({formatPercent(breakdown.rate)})
          </span>
          <span
            className={`${textBase} font-mono font-semibold ${!isValid ? 'opacity-40' : ''}`}
            style={{ color: isValid ? '#c9a84c' : undefined }}
          >
            {isValid ? formatCurrency(breakdown.amount) : '—'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-1" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span
            className={`${textBase} font-semibold font-sans text-[#f0ede8]`}
          >
            {totalLabel}
          </span>
          <span
            className={`${textBase} font-mono font-bold text-[#f0ede8] ${!isValid ? 'opacity-40' : ''}`}
          >
            {isValid ? formatCurrency(displayTotal) : '—'}
          </span>
        </div>
      </div>

      {/* Commission note */}
      {isValid && (
        <p className="mt-3 text-2xs text-[#6b6560] font-sans leading-relaxed">
          Commission of {formatCurrency(breakdown.amount)} ({formatPercent(breakdown.rate)}) will be{' '}
          {side === 'buy' ? 'added to your cost' : 'deducted from your proceeds'}.
        </p>
      )}
    </div>
  );
}

export default CommissionCalculator;
