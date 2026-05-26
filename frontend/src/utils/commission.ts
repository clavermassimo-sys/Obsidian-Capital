/* ============================================================
   Obsidian Capital — Commission Calculation Utilities
   ============================================================ */

import type { CommissionTier, CommissionBreakdown, CommissionRateConfig } from '@/types';

// ── Rate Configuration ────────────────────────────────────────

/**
 * Commission rates per membership tier.
 * Ranges represent the min/max rate applied to the trade subtotal.
 * The midpoint of the range is used for all calculations.
 */
export const COMMISSION_RATES: Record<CommissionTier, CommissionRateConfig> = {
  standard: {
    min: 0.10,
    max: 0.12,
    display: '10–12%',
  },
  member: {
    min: 0.07,
    max: 0.09,
    display: '7–9%',
  },
  private: {
    min: 0.05,
    max: 0.06,
    display: '5–6%',
  },
} as const;

// ── Core Calculation ──────────────────────────────────────────

/**
 * Calculate the commission for a given trade subtotal and membership tier.
 * Uses the midpoint of the tier's rate range.
 *
 * @param subtotal - The gross trade value (shares × price) in USD
 * @param tier     - The client's membership tier
 * @returns        Object containing the effective rate, commission amount, and grand total
 *
 * @example
 * calculateCommission(10_000, 'member')
 * // → { rate: 0.08, amount: 800, total: 10_800 }
 */
export function calculateCommission(
  subtotal: number,
  tier: CommissionTier
): { rate: number; amount: number; total: number } {
  if (subtotal < 0) {
    throw new RangeError(`Subtotal must be non-negative, received ${subtotal}`);
  }

  const config = COMMISSION_RATES[tier];
  // Midpoint of the rate range
  const rate = (config.min + config.max) / 2;
  const amount = subtotal * rate;
  const total = subtotal + amount;

  return {
    rate: parseFloat(rate.toFixed(4)),
    amount: parseFloat(amount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Full commission breakdown including tier metadata and subtotal.
 *
 * @param subtotal - The gross trade value (shares × price) in USD
 * @param tier     - The client's membership tier
 */
export function getCommissionBreakdown(
  subtotal: number,
  tier: CommissionTier
): CommissionBreakdown {
  const { rate, amount, total } = calculateCommission(subtotal, tier);
  return {
    tier,
    rate,
    amount,
    subtotal: parseFloat(subtotal.toFixed(2)),
    total,
  };
}

/**
 * Calculate the effective commission rate (midpoint) for a tier.
 */
export function getEffectiveRate(tier: CommissionTier): number {
  const config = COMMISSION_RATES[tier];
  return (config.min + config.max) / 2;
}

/**
 * Return the human-readable commission range string for a tier.
 * e.g.  "7–9%"
 */
export function getCommissionDisplay(tier: CommissionTier): string {
  return COMMISSION_RATES[tier].display;
}

/**
 * Given a total (including commission) and a tier, back-calculate the subtotal.
 * Useful when displaying the pre-commission value from a known total.
 */
export function subtotalFromTotal(total: number, tier: CommissionTier): number {
  const rate = getEffectiveRate(tier);
  return parseFloat((total / (1 + rate)).toFixed(2));
}

/**
 * Compare commission cost across all tiers for a given subtotal.
 * Returns an array of breakdowns sorted from cheapest to most expensive.
 */
export function compareCommissionTiers(
  subtotal: number
): CommissionBreakdown[] {
  const tiers: CommissionTier[] = ['private', 'member', 'standard'];
  return tiers.map((tier) => getCommissionBreakdown(subtotal, tier));
}

/**
 * Annual savings if a client upgrades from one tier to another.
 *
 * @param annualTradingVolume - Total buy+sell volume per year in USD
 * @param fromTier            - Current tier
 * @param toTier              - Proposed upgraded tier
 */
export function annualSavings(
  annualTradingVolume: number,
  fromTier: CommissionTier,
  toTier: CommissionTier
): number {
  const current  = calculateCommission(annualTradingVolume, fromTier).amount;
  const upgraded = calculateCommission(annualTradingVolume, toTier).amount;
  return parseFloat((current - upgraded).toFixed(2));
}
