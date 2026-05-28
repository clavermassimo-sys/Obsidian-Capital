/* ============================================================
   Obsidian Capital Mobile — StockRow Component
   Reusable row for markets / holdings / watchlist
   ============================================================ */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatPercent } from '@/utils/format';

// ── Props ─────────────────────────────────────────────────────

interface StockRowProps {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  shares?: number;
  onPress?: () => void;
}

// ── Component ─────────────────────────────────────────────────

export default function StockRow({
  ticker,
  name,
  price,
  change,
  changePct,
  shares,
  onPress,
}: StockRowProps) {
  const isPositive = changePct >= 0;
  const changeColor = isPositive ? Colors.gain : Colors.loss;
  const signedPct = formatPercent(changePct);
  const signedChange = isPositive
    ? `+${formatCurrency(change)}`
    : `-${formatCurrency(Math.abs(change))}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: ticker + name */}
      <View style={styles.left}>
        <View style={styles.tickerBadge}>
          <Text style={styles.tickerInitial}>{ticker.charAt(0)}</Text>
        </View>
        <View style={styles.nameGroup}>
          <Text style={styles.ticker}>{ticker}</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {shares !== undefined && (
            <Text style={styles.shares}>{shares} shares</Text>
          )}
        </View>
      </View>

      {/* Right: price + change */}
      <View style={styles.right}>
        <Text style={styles.price}>{formatCurrency(price)}</Text>
        <View style={[styles.changeBadge, { backgroundColor: changeColor + '22' }]}>
          <Text style={[styles.changeText, { color: changeColor }]}>
            {signedPct}
          </Text>
        </View>
        <Text style={[styles.changeDollar, { color: changeColor }]}>
          {signedChange}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  tickerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerInitial: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  nameGroup: {
    flex: 1,
  },
  ticker: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  name: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  shares: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  changeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeDollar: {
    fontSize: 11,
    fontWeight: '500',
  },
});
