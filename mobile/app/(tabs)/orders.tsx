/* ============================================================
   Obsidian Capital Mobile — Orders Screen
   Filterable list of all orders with status badges
   ============================================================ */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { tradesApi } from '@/services/api';
import type { IBKROrder } from '@/services/api';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { SkeletonRow } from '@/components/LoadingSkeleton';

// ── Filter tabs ───────────────────────────────────────────────

type FilterTab = 'all' | 'open' | 'filled' | 'cancelled';

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Open',      value: 'open' },
  { label: 'Filled',    value: 'filled' },
  { label: 'Cancelled', value: 'cancelled' },
];

// ── Status badge ──────────────────────────────────────────────

function statusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'filled')    return Colors.gain;
  if (s === 'cancelled' || s === 'canceled') return Colors.loss;
  if (s === 'new' || s === 'accepted' || s === 'pending_new') return '#f5a623';
  return Colors.textMuted;
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <View style={[statusStyle.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[statusStyle.text, { color }]}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
    </View>
  );
}

const statusStyle = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});

// ── Order Card ────────────────────────────────────────────────

function OrderCard({ order }: { order: IBKROrder }) {
  const isBuy    = order.side === 'buy';
  const sideColor = isBuy ? Colors.gain : Colors.loss;
  const qty       = parseFloat(String(order.qty));
  const filledQty = parseFloat(String(order.filled_qty));
  const price     = order.filled_avg_price
    ? parseFloat(String(order.filled_avg_price))
    : order.limit_price
    ? parseFloat(String(order.limit_price))
    : 0;
  const total       = qty * price;
  const commission  = order.commission ?? 0;

  return (
    <View style={orderStyle.card}>
      {/* Top row: side badge + symbol + status */}
      <View style={orderStyle.topRow}>
        <View style={[orderStyle.sideBadge, { backgroundColor: sideColor + '22', borderColor: sideColor + '55' }]}>
          <Text style={[orderStyle.sideText, { color: sideColor }]}>
            {order.side.toUpperCase()}
          </Text>
        </View>
        <Text style={orderStyle.symbol}>{order.symbol}</Text>
        <StatusBadge status={order.status} />
      </View>

      {/* Middle: qty @ price */}
      <View style={orderStyle.midRow}>
        <Text style={orderStyle.qtyText}>
          {qty.toFixed(0)} {filledQty > 0 && filledQty < qty ? `(${filledQty} filled) ` : ''}shares
          {price > 0 ? ` @ ${formatCurrency(price)}` : ''}
        </Text>
        <Text style={orderStyle.orderTypeText}>{order.type?.replace(/_/g, ' ')}</Text>
      </View>

      {/* Bottom: commission + total + timestamp */}
      <View style={orderStyle.bottomRow}>
        {commission > 0 && (
          <Text style={orderStyle.commission}>
            Commission: <Text style={{ color: Colors.gold }}>{formatCurrency(commission)}</Text>
          </Text>
        )}
        {total > 0 && (
          <Text style={orderStyle.total}>Total: {formatCurrency(total)}</Text>
        )}
      </View>

      <Text style={orderStyle.timestamp}>{formatDateTime(order.submitted_at)}</Text>
    </View>
  );
}

const orderStyle = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  sideText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  symbol: { color: Colors.text, fontSize: 16, fontWeight: '800', flex: 1 },
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  qtyText: { color: Colors.text, fontSize: 13 },
  orderTypeText: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commission: { color: Colors.textMuted, fontSize: 12 },
  total:      { color: Colors.text, fontSize: 13, fontWeight: '600' },
  timestamp:  { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});

// ── Empty State ───────────────────────────────────────────────

function EmptyOrders() {
  return (
    <View style={emptyStyle.container}>
      <Text style={emptyStyle.icon}>📋</Text>
      <Text style={emptyStyle.title}>No Orders Yet</Text>
      <Text style={emptyStyle.desc}>
        Your placed orders will appear here.
        Head to the Trade tab to place your first order.
      </Text>
    </View>
  );
}

const emptyStyle = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 60 },
  icon:  { fontSize: 48, marginBottom: 16 },
  title: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  desc:  { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});

// ── Orders Screen ─────────────────────────────────────────────

export default function OrdersScreen() {
  const [filter, setFilter]       = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => tradesApi.getOrders(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allOrders = data?.orders ?? [];

  const filtered = useMemo(() => {
    if (filter === 'all') return allOrders;
    return allOrders.filter((o) => {
      const s = o.status?.toLowerCase();
      if (filter === 'open')      return ['new', 'accepted', 'pending_new', 'partially_filled', 'held'].includes(s);
      if (filter === 'filled')    return s === 'filled';
      if (filter === 'cancelled') return s === 'cancelled' || s === 'canceled';
      return true;
    });
  }, [allOrders, filter]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IBKROrder>) => <OrderCard order={item} />,
    []
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.filterTab, filter === tab.value && styles.filterTabActive]}
            onPress={() => setFilter(tab.value)}
          >
            <Text style={[styles.filterText, filter === tab.value && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders count */}
      {!isLoading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* List / loading / error */}
      {isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load orders</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyOrders />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.obsidian },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.gold + '22',
    borderColor: Colors.gold,
  },
  filterText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: Colors.gold },

  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: { color: Colors.textMuted, fontSize: 12 },

  list: { paddingHorizontal: 16 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorIcon:  { fontSize: 40, marginBottom: 12 },
  errorTitle: { color: Colors.text, fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: Colors.obsidian, fontWeight: '700', fontSize: 14 },
});
