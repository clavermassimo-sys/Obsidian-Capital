/* ============================================================
   Obsidian Capital Mobile — CommissionCard Component
   Shows trade value, commission, and total breakdown
   ============================================================ */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatTierName, getTierRateDisplay } from '@/utils/format';
import { calculateCommission, upgradeSavings, type CommissionTier } from '@/utils/commission';

// ── Props ─────────────────────────────────────────────────────

interface CommissionCardProps {
  subtotal: number;
  tier: CommissionTier;
  showUpgradeSavings?: boolean;
}

// ── Component ─────────────────────────────────────────────────

export default function CommissionCard({
  subtotal,
  tier,
  showUpgradeSavings = true,
}: CommissionCardProps) {
  const result   = calculateCommission(subtotal, tier);
  const savings  = upgradeSavings(subtotal, tier);
  const rateDisp = getTierRateDisplay(tier);
  const tierName = formatTierName(tier);

  const tierColor: Record<CommissionTier, string> = {
    private:  Colors.gold,
    member:   '#a0c4ff',
    standard: Colors.textMuted,
  };
  const color = tierColor[tier];

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Commission Breakdown</Text>
        <View style={[styles.tierBadge, { borderColor: color }]}>
          <Text style={[styles.tierText, { color }]}>{tierName}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Line items */}
      <View style={styles.lineRow}>
        <Text style={styles.label}>Trade Value</Text>
        <Text style={styles.value}>{formatCurrency(subtotal)}</Text>
      </View>

      <View style={styles.lineRow}>
        <Text style={styles.label}>
          Commission ({rateDisp})
        </Text>
        <Text style={[styles.value, { color: Colors.gold }]}>
          {formatCurrency(result.amount)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.lineRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(result.total)}</Text>
      </View>

      {/* Upgrade savings callout */}
      {showUpgradeSavings && tier === 'standard' && savings.toMember > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            Upgrade to Member and save {formatCurrency(savings.toMember)} on this trade
          </Text>
        </View>
      )}

      {showUpgradeSavings && tier === 'member' && savings.toPrivate > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            Upgrade to Private Client and save {formatCurrency(savings.toPrivate)} on this trade
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  totalLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    color: Colors.offWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  savingsRow: {
    marginTop: 12,
    backgroundColor: Colors.gold + '18',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    padding: 10,
  },
  savingsText: {
    color: Colors.gold,
    fontSize: 12,
    lineHeight: 17,
  },
});
