export const COMMISSION_CONFIG = {
  standard: { min: 0.10, max: 0.12, mid: 0.11, display: '10–12%' },
  member: { min: 0.07, max: 0.09, mid: 0.08, display: '7–9%' },
  private: { min: 0.05, max: 0.06, mid: 0.055, display: '5–6%' },
} as const;

export type CommissionTier = keyof typeof COMMISSION_CONFIG;

export interface CommissionResult {
  rate: number;
  amount: number;
  total: number;
  display: string;
  subtotal: number;
  tier: CommissionTier;
}

export const calculateCommission = (
  subtotal: number,
  tier: CommissionTier
): CommissionResult => {
  const config = COMMISSION_CONFIG[tier];
  const rate = config.mid;
  const amount = parseFloat((subtotal * rate).toFixed(2));
  const total = parseFloat((subtotal + amount).toFixed(2));

  return {
    rate,
    amount,
    total,
    display: config.display,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tier,
  };
};

export const getCommissionRange = (
  subtotal: number,
  tier: CommissionTier
): { low: number; high: number; display: string } => {
  const config = COMMISSION_CONFIG[tier];
  return {
    low: parseFloat((subtotal * config.min).toFixed(2)),
    high: parseFloat((subtotal * config.max).toFixed(2)),
    display: config.display,
  };
};

export const getTierLabel = (tier: CommissionTier): string => {
  const labels: Record<CommissionTier, string> = {
    standard: 'Standard',
    member: 'Member',
    private: 'Private Client',
  };
  return labels[tier];
};
