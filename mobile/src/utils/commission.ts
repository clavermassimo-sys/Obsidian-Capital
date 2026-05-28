/* ============================================================
   Obsidian Capital Mobile — Commission Calculation Utilities
   ============================================================ */

export type CommissionTier = 'standard' | 'member' | 'private';

export const COMMISSION_CONFIG: Record<
  CommissionTier,
  { min: number; max: number; mid: number; display: string; label: string }
> = {
  standard: { min: 0.10, max: 0.12, mid: 0.11, display: '10–12%', label: 'Standard' },
  member:   { min: 0.07, max: 0.09, mid: 0.08, display: '7–9%',   label: 'Member' },
  private:  { min: 0.05, max: 0.06, mid: 0.055, display: '5–6%',  label: 'Private Client' },
} as const;

export interface CommissionResult {
  rate: number;
  amount: number;
  total: number;
  display: string;
  subtotal: number;
  tier: CommissionTier;
  label: string;
}

export function calculateCommission(
  subtotal: number,
  tier: CommissionTier,
): CommissionResult {
  const config = COMMISSION_CONFIG[tier];
  const rate   = config.mid;
  const amount = parseFloat((subtotal * rate).toFixed(2));
  const total  = parseFloat((subtotal + amount).toFixed(2));
  return {
    rate,
    amount,
    total,
    display: config.display,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tier,
    label: config.label,
  };
}

/** Potential savings if upgrading from standard/member to a lower-rate tier */
export function upgradeSavings(
  subtotal: number,
  currentTier: CommissionTier,
): { toMember: number; toPrivate: number } {
  const current   = calculateCommission(subtotal, currentTier).amount;
  const memberAmt = calculateCommission(subtotal, 'member').amount;
  const privateAmt = calculateCommission(subtotal, 'private').amount;
  return {
    toMember:  parseFloat(Math.max(0, current - memberAmt).toFixed(2)),
    toPrivate: parseFloat(Math.max(0, current - privateAmt).toFixed(2)),
  };
}
