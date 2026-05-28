/* ============================================================
   Obsidian Capital — CommissionCalculator
   Reusable breakdown showing subtotal, commission, and total
   for a given shares × price trade with tier-based rates.
   Includes upgrade savings section for non-Private tiers.
   ============================================================ */

import React from 'react';
import { TrendingDown, ArrowUpRight } from 'lucide-react';
import type { CommissionTier, OrderSide } from '@/types';
import { getCommissionBreakdown, calculateCommission, COMMISSION_RATES } from '@/utils/commission';

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

// Savings thresholds — only show upgrade nudge if savings exceed this
const MIN_SAVINGS_DISPLAY = 0.50; // $0.50

interface UpgradeSaving {
  fromTier: CommissionTier;
  toTier: CommissionTier;
  label: string;
  save: number;
}

/**
 * Calculate per-trade savings if user upgraded to a higher tier.
 */
function getUpgradeSavings(subtotal: number, tier: CommissionTier): UpgradeSaving[] {
  const savings: UpgradeSaving[] = [];
  const current = calculateCommission(subtotal, tier).amount;

  if (tier === 'standard') {
    const memberAmount = calculateCommission(subtotal, 'member').amount;
    const memberSave = current - memberAmount;
    if (memberSave >= MIN_SAVINGS_DISPLAY) {
      savings.push({ fromTier: 'standard', toTier: 'member', label: 'Member', save: memberSave });
    }
    const privateAmount = calculateCommission(subtotal, 'private').amount;
    const privateSave = current - privateAmount;
    if (privateSave >= MIN_SAVINGS_DISPLAY) {
      savings.push({ fromTier: 'standard', toTier: 'private', label: 'Private', save: privateSave });
    }
  } else if (tier === 'member') {
    const privateAmount = calculateCommission(subtotal, 'private').amount;
    const privateSave = current - privateAmount;
    if (privateSave >= MIN_SAVINGS_DISPLAY) {
      savings.push({ fromTier: 'member', toTier: 'private', label: 'Private', save: privateSave });
    }
  }

  return savings;
}

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

      {/* Upgrade savings section — only shown when savings > $0.50 */}
      {isValid && tier !== 'private' && (() => {
        const upgradeSavings = getUpgradeSavings(subtotal, tier);
        if (upgradeSavings.length === 0) return null;
        return (
          <div
            className="mt-3 rounded-md p-3 space-y-2"
            style={{
              background: 'rgba(201,168,76,0.04)',
              border: '1px solid rgba(201,168,76,0.12)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5">
              <TrendingDown size={12} style={{ color: '#c9a84c' }} />
              <span className="text-2xs font-semibold font-sans text-[#c9a84c] uppercase tracking-wider">
                Upgrade Savings
              </span>
            </div>

            {/* Saving rows */}
            {upgradeSavings.map(({ toTier, label, save }) => (
              <div key={toTier} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArrowUpRight size={11} className="text-[#6b6560] flex-shrink-0" />
                  <span className={`text-2xs font-sans text-[#a09a8e]`}>
                    Switch to{' '}
                    <strong className="text-[#c9a84c] font-semibold">{label}</strong>
                    {' '}tier
                  </span>
                </div>
                <span className="text-2xs font-mono font-semibold text-[#c9a84c] flex-shrink-0">
                  Save {formatCurrency(save)}
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export default CommissionCalculator;
