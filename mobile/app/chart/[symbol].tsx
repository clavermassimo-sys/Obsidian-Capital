/* ============================================================
   Obsidian Capital Mobile — Chart Detail Screen
   Symbol header, period selector, chart, company info, trade CTA
   ============================================================ */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { marketApi } from '@/services/api';
import type { Bar, QuoteResponse } from '@/services/api';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;
const CHART_H = 220;

// ── Period config ─────────────────────────────────────────────

type Period = '1D' | '1W' | '1M' | '3M' | '1Y';

interface PeriodConfig { timeframe: string; limit: number }

const PERIOD_CONFIG: Record<Period, PeriodConfig> = {
  '1D': { timeframe: '5Min',  limit: 78  },
  '1W': { timeframe: '1Hour', limit: 35  },
  '1M': { timeframe: '1Day',  limit: 22  },
  '3M': { timeframe: '1Day',  limit: 66  },
  '1Y': { timeframe: '1Day',  limit: 252 },
};

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y'];

// ── Bar Chart (Views, no Skia/Victory required) ───────────────

function BarChart({ bars, isPositive }: { bars: Bar[]; isPositive: boolean }) {
  if (bars.length < 2) {
    return <View style={[chartStyle.empty, { width: CHART_W, height: CHART_H }]} />;
  }

  const closes = bars.map((b) => b.c);
  const min    = Math.min(...closes);
  const max    = Math.max(...closes);
  const range  = max - min || 1;
  const color  = isPositive ? Colors.gain : Colors.loss;

  return (
    <View style={[chartStyle.container, { width: CHART_W, height: CHART_H }]}>
      {/* Y-axis labels */}
      <View style={chartStyle.yAxis}>
        <Text style={chartStyle.yLabel}>{formatCurrency(max, { decimals: 0 })}</Text>
        <Text style={chartStyle.yLabel}>{formatCurrency((min + max) / 2, { decimals: 0 })}</Text>
        <Text style={chartStyle.yLabel}>{formatCurrency(min, { decimals: 0 })}</Text>
      </View>

      {/* Bar columns */}
      <View style={chartStyle.barsArea}>
        {bars.map((b, i) => {
          const pct = (b.c - min) / range;
          const barH = Math.max(2, pct * (CHART_H - 24));
          const isUp = b.c >= b.o;
          const barColor = isUp ? Colors.gain : Colors.loss;
          return (
            <View
              key={i}
              style={[
                chartStyle.bar,
                {
                  height: barH,
                  backgroundColor: barColor + '88',
                  borderTopColor: barColor,
                  borderTopWidth: 1,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const chartStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  empty: {
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yAxis: {
    width: 56,
    height: CHART_H,
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  yLabel: { color: Colors.textMuted, fontSize: 9 },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    height: CHART_H,
  },
  bar: { flex: 1, borderRadius: 1 },
});

// ── Company info row ──────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyle.row}>
      <Text style={infoStyle.label}>{label}</Text>
      <Text style={infoStyle.value}>{value}</Text>
    </View>
  );
}

const infoStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { color: Colors.textMuted, fontSize: 13 },
  value: { color: Colors.text, fontSize: 13, fontWeight: '600' },
});

// ── Trade-this-stock button ───────────────────────────────────

function TradeSheet({
  symbol,
  visible,
  onClose,
}: {
  symbol: string;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tradeSheetStyle.backdrop}>
        <View style={tradeSheetStyle.sheet}>
          <View style={tradeSheetStyle.handle} />
          <Text style={tradeSheetStyle.title}>Trade {symbol}</Text>
          <Text style={tradeSheetStyle.hint}>
            Open the Trade tab to place a full order with commission preview,
            limit/stop prices, and Reg BI disclosure.
          </Text>
          <TouchableOpacity style={tradeSheetStyle.closeBtn} onPress={onClose}>
            <Text style={tradeSheetStyle.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const tradeSheetStyle = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  hint: { color: Colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 },
  closeBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeText: { color: Colors.obsidian, fontSize: 15, fontWeight: '700' },
});

// ── Chart Screen ──────────────────────────────────────────────

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const nav = useNavigation();

  const [period, setPeriod]       = useState<Period>('1M');
  const [tradeOpen, setTradeOpen] = useState(false);

  const sym = (Array.isArray(symbol) ? symbol[0] : symbol ?? '').toUpperCase();

  const { data: quoteData, isLoading: loadingQuote } = useQuery({
    queryKey: ['quote', sym],
    queryFn: () => marketApi.getQuote(sym),
    enabled: sym.length > 0,
    refetchInterval: 15_000,
  });

  const quote = quoteData as QuoteResponse | undefined;

  const { data: barsData, isLoading: loadingBars } = useQuery({
    queryKey: ['bars', sym, period],
    queryFn: () => {
      const cfg = PERIOD_CONFIG[period];
      return marketApi.getBars(sym, cfg.timeframe, cfg.limit);
    },
    enabled: sym.length > 0,
  });

  const bars    = barsData?.bars ?? [];
  const isUp    = (quote?.changePct ?? 0) >= 0;
  const qColor  = isUp ? Colors.gain : Colors.loss;

  React.useEffect(() => {
    if (sym) {
      nav.setOptions({ title: sym });
    }
  }, [sym]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Quote header ─────────────────────── */}
        <View style={styles.quoteHeader}>
          {loadingQuote ? (
            <ActivityIndicator color={Colors.gold} />
          ) : quote ? (
            <>
              <View>
                <Text style={styles.quoteSymbol}>{sym}</Text>
              </View>
              <View style={styles.quotePriceCol}>
                <Text style={styles.quotePrice}>{formatCurrency(quote.price)}</Text>
                <View style={[styles.changePill, { backgroundColor: qColor + '22' }]}>
                  <Text style={[styles.changeText, { color: qColor }]}>
                    {formatPercent(quote.changePct)} today
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>Quote unavailable</Text>
          )}
        </View>

        {/* ── Period selector ──────────────────── */}
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

        {/* ── Chart ────────────────────────────── */}
        <View style={styles.chartCard}>
          {loadingBars ? (
            <ActivityIndicator color={Colors.gold} size="large" style={{ height: CHART_H }} />
          ) : (
            <BarChart bars={bars} isPositive={isUp} />
          )}
        </View>

        {/* ── OHLC summary ─────────────────────── */}
        {quote && (
          <View style={styles.ohlcRow}>
            {[
              ['Open',  formatCurrency(quote.open)],
              ['High',  formatCurrency(quote.high)],
              ['Low',   formatCurrency(quote.low)],
              ['Prev',  formatCurrency(quote.previousClose)],
            ].map(([k, v]) => (
              <View key={k} style={styles.ohlcCell}>
                <Text style={styles.ohlcLabel}>{k}</Text>
                <Text style={styles.ohlcValue}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Company info ─────────────────────── */}
        {quote && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Key Statistics</Text>
            <InfoRow label="52-Week High"  value={formatCurrency(quote.high52)} />
            <InfoRow label="52-Week Low"   value={formatCurrency(quote.low52)} />
            <InfoRow label="Volume"        value={formatNumber(quote.volume, { compact: true })} />
            <InfoRow label="Avg Volume"    value={formatNumber(quote.avgVolume, { compact: true })} />
            {quote.marketCap && (
              <InfoRow
                label="Market Cap"
                value={`$${(quote.marketCap / 1e9).toFixed(2)}B`}
              />
            )}
            {quote.peRatio && (
              <InfoRow label="P/E Ratio" value={quote.peRatio.toFixed(2)} />
            )}
          </View>
        )}

        {/* ── Trade CTA ────────────────────────── */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.tradeBtn}
            onPress={() => setTradeOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.tradeBtnText}>Trade {sym}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TradeSheet symbol={sym} visible={tradeOpen} onClose={() => setTradeOpen(false)} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.obsidian },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quoteSymbol: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  quotePriceCol: { alignItems: 'flex-end' },
  quotePrice: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  changeText: { fontSize: 13, fontWeight: '600' },
  errorText: { color: Colors.textMuted, fontSize: 14 },

  periodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  periodPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  periodPillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  periodText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: Colors.obsidian },

  chartCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },

  ohlcRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  ohlcCell: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ohlcLabel: { color: Colors.textMuted, fontSize: 10, marginBottom: 4 },
  ohlcValue: { color: Colors.text, fontSize: 12, fontWeight: '600' },

  infoCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },

  ctaRow: { paddingHorizontal: 16 },
  tradeBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tradeBtnText: {
    color: Colors.obsidian,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
