/* ============================================================
   Obsidian Capital Mobile — Dashboard Screen
   Portfolio value, chart, holdings, market indices
   ============================================================ */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { portfolioApi, marketApi } from '@/services/api';
import type { HoldingRaw, HistoryPoint, IndexQuote } from '@/services/api';
import { formatCurrency, formatCurrencySigned, formatPercent, formatTierName } from '@/utils/format';
import { useAuthStore } from '@/store/auth';
import { SkeletonRow, Skeleton } from '@/components/LoadingSkeleton';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;
const CHART_H = 180;

type Period = '1D' | '1W' | '1M' | '1Y';

// ── Minimal SVG-free chart using Views ────────────────────────

function MiniLineChart({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) return <View style={chart.empty} />;

  const values = points.map((p) => p.value);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min || 1;

  const first = values[0];
  const last  = values[values.length - 1];
  const isUp  = last >= first;
  const lineColor = isUp ? Colors.gain : Colors.loss;

  return (
    <View style={[chart.container, { width: CHART_W, height: CHART_H }]}>
      {/* Simple bar chart approximation using View columns */}
      <View style={chart.barsRow}>
        {points.map((p, i) => {
          const pct = (p.value - min) / range;
          const barH = Math.max(4, pct * (CHART_H - 20));
          return (
            <View
              key={i}
              style={[
                chart.bar,
                {
                  height: barH,
                  backgroundColor: lineColor + (isUp ? '55' : '55'),
                  borderTopColor: lineColor,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  empty: {
    width: CHART_W,
    height: CHART_H,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    paddingHorizontal: 4,
  },
  bar: {
    flex: 1,
    borderTopWidth: 1,
    borderRadius: 1,
  },
});

// ── Helpers ───────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function periodToApiParam(p: Period): string {
  const map: Record<Period, string> = {
    '1D': '1D',
    '1W': '1W',
    '1M': '1M',
    '1Y': '1Y',
  };
  return map[p];
}

// ── Market Index Card ─────────────────────────────────────────

function IndexCard({ idx }: { idx: IndexQuote }) {
  const isUp = idx.changePct >= 0;
  const color = isUp ? Colors.gain : Colors.loss;
  return (
    <View style={idxStyle.card}>
      <Text style={idxStyle.name} numberOfLines={1}>{idx.name}</Text>
      <Text style={idxStyle.price}>{formatCurrency(idx.price, { decimals: 0 })}</Text>
      <Text style={[idxStyle.change, { color }]}>
        {formatPercent(idx.changePct)}
      </Text>
    </View>
  );
}

const idxStyle = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    padding: 12,
    minWidth: 110,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  price: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  change: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});

// ── Holding Row ───────────────────────────────────────────────

function HoldingRow({ h, onPress }: { h: HoldingRaw; onPress: () => void }) {
  const qty   = parseFloat(String(h.qty));
  const price = parseFloat(String(h.current_price));
  const mv    = parseFloat(String(h.market_value));
  const plPct = parseFloat(String(h.unrealized_plpc)) * 100;
  const plDol = parseFloat(String(h.unrealized_pl));
  const isUp  = plPct >= 0;
  const color = isUp ? Colors.gain : Colors.loss;

  return (
    <TouchableOpacity style={holdStyle.row} onPress={onPress} activeOpacity={0.7}>
      <View style={holdStyle.left}>
        <View style={holdStyle.badge}>
          <Text style={holdStyle.initial}>{h.symbol.charAt(0)}</Text>
        </View>
        <View>
          <Text style={holdStyle.ticker}>{h.symbol}</Text>
          <Text style={holdStyle.shares}>{qty.toFixed(0)} shares</Text>
        </View>
      </View>
      <View style={holdStyle.right}>
        <Text style={holdStyle.value}>{formatCurrency(mv)}</Text>
        <Text style={[holdStyle.pnl, { color }]}>
          {formatPercent(plPct)} ({formatCurrencySigned(plDol)})
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const holdStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface3,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  initial: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  ticker: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  shares: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  right: { alignItems: 'flex-end' },
  value: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  pnl: { fontSize: 12, marginTop: 2 },
});

// ── Dashboard Screen ──────────────────────────────────────────

export default function DashboardScreen() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const [period, setPeriod]     = useState<Period>('1M');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: holdingsData,
    isLoading: loadHoldings,
    refetch: refetchHoldings,
  } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => portfolioApi.getHoldings(),
  });

  const {
    data: historyData,
    isLoading: loadHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['portfolio-history', period],
    queryFn: () => portfolioApi.getHistory(periodToApiParam(period)),
  });

  const {
    data: indicesData,
    isLoading: loadIndices,
    refetch: refetchIndices,
  } = useQuery({
    queryKey: ['indices'],
    queryFn: () => marketApi.getIndices(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchHoldings(), refetchHistory(), refetchIndices()]);
    setRefreshing(false);
  }, [refetchHoldings, refetchHistory, refetchIndices]);

  const history = historyData?.history ?? [];
  const holdings = holdingsData?.holdings ?? [];
  const indices  = indicesData?.indices ?? [];

  // Compute portfolio totals from holdings
  const totalValue = holdings.reduce((s, h) => s + parseFloat(String(h.market_value)), 0);
  const totalCost  = holdings.reduce(
    (s, h) => s + parseFloat(String(h.qty)) * parseFloat(String(h.avg_entry_price)), 0
  );
  const totalPL    = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const isUp       = totalPL >= 0;
  const plColor    = isUp ? Colors.gain : Colors.loss;

  // Market status: simplified — use Eastern time
  const hour = new Date().getUTCHours() - 4; // rough ET
  const marketOpen = hour >= 9 && hour < 16;

  const PERIODS: Period[] = ['1D', '1W', '1M', '1Y'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* ── Header ────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()},{' '}
              <Text style={styles.greetingName}>
                {user?.name?.split(' ')[0] ?? 'Investor'}
              </Text>
            </Text>
            <Text style={styles.tierTag}>
              {user ? formatTierName(user.tier) + ' Member' : ''}
            </Text>
          </View>
          <View style={[styles.marketBadge, { backgroundColor: marketOpen ? Colors.gain + '22' : Colors.loss + '22' }]}>
            <View style={[styles.marketDot, { backgroundColor: marketOpen ? Colors.gain : Colors.loss }]} />
            <Text style={[styles.marketText, { color: marketOpen ? Colors.gain : Colors.loss }]}>
              {marketOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        {/* ── Portfolio Value ───────────────────────── */}
        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Portfolio Value</Text>
          {loadHoldings ? (
            <Skeleton width={200} height={36} borderRadius={8} />
          ) : (
            <>
              <Text style={styles.valueAmount}>{formatCurrency(totalValue)}</Text>
              <View style={styles.pnlRow}>
                <View style={[styles.pnlBadge, { backgroundColor: plColor + '22' }]}>
                  <Text style={[styles.pnlText, { color: plColor }]}>
                    {formatCurrencySigned(totalPL)} ({formatPercent(totalPLPct)})
                  </Text>
                </View>
                <Text style={styles.pnlPeriodLabel}>Total Return</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Chart ────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodPill, period === p && styles.periodPillActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {loadHistory ? (
            <Skeleton width={CHART_W} height={CHART_H} borderRadius={8} />
          ) : (
            <MiniLineChart points={history} />
          )}
          {history.length > 1 && (
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>
                {history[0]?.date ?? ''}
              </Text>
              <Text style={styles.chartLabel}>
                {history[history.length - 1]?.date ?? ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── Market Indices ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Indices</Text>
          {loadIndices ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={110} height={72} borderRadius={10} style={{ marginRight: 10 }} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {indices.map((idx) => (
                <IndexCard key={idx.symbol} idx={idx} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Holdings ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Holdings</Text>
            <Text style={styles.sectionCount}>{holdings.length} positions</Text>
          </View>
          {loadHoldings ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : holdings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No Holdings Yet</Text>
              <Text style={styles.emptyDesc}>
                Start trading to build your portfolio.
              </Text>
            </View>
          ) : (
            <View style={styles.holdingsContainer}>
              {holdings.map((h) => (
                <HoldingRow
                  key={h.symbol}
                  h={h}
                  onPress={() => router.push(`/chart/${h.symbol}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.obsidian },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  greetingName: { color: Colors.gold },
  tierTag: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  marketDot: { width: 6, height: 6, borderRadius: 3 },
  marketText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  valueCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 6 },
  valueAmount: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pnlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  pnlBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pnlText: { fontSize: 13, fontWeight: '600' },
  pnlPeriodLabel: { color: Colors.textMuted, fontSize: 11 },

  chartCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  periodPillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  periodText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: Colors.obsidian },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartLabel: { color: Colors.textMuted, fontSize: 10 },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionCount: { color: Colors.textMuted, fontSize: 12 },

  holdingsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyDesc: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
});
