// Flat-fee commission model per trade execution
export const COMMISSION_CONFIG = {
  standard: { flat: 4.99, display: '$4.99 / trade' },
  member:   { flat: 2.99, display: '$2.99 / trade', monthly: 29.99 },
  private:  { flat: 0.99, display: '$0.99 / trade', monthly: 199.99 },
} as const;

export type CommissionTier = keyof typeof COMMISSION_CONFIG;

export interface CommissionResult {
  rate: number;       // kept for API compatibility — equals flat fee as fraction of subtotal (or 0 when flat)
  amount: number;     // flat fee amount
  total: number;      // subtotal + flat fee (buy) or subtotal - flat fee (sell)
  display: string;
  subtotal: number;
  tier: CommissionTier;
}

export const calculateCommission = (
  subtotal: number,
  tier: CommissionTier
): CommissionResult => {
  const config = COMMISSION_CONFIG[tier];
  const amount = config.flat;
  const total  = parseFloat((subtotal + amount).toFixed(2));

  return {
    rate:     subtotal > 0 ? parseFloat((amount / subtotal).toFixed(6)) : 0,
    amount,
    total,
    display:  config.display,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tier,
  };
};

export const getCommissionRange = (
  subtotal: number,
  tier: CommissionTier
): { low: number; high: number; display: string } => {
  const { flat, display } = COMMISSION_CONFIG[tier];
  return { low: flat, high: flat, display };
};

export const getTierLabel = (tier: CommissionTier): string => {
  const labels: Record<CommissionTier, string> = {
    standard: 'Standard',
    member:   'Member',
    private:  'Obsidian Private',
  };
  return labels[tier];
};
