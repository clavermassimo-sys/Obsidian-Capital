/* ============================================================
   Obsidian Capital Mobile — Trade Screen
   Full-screen trade panel with commission preview + confirmation
   ============================================================ */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { marketApi, tradesApi } from '@/services/api';
import type { PreviewParams, QuoteResponse, PreviewResponse } from '@/services/api';
import { formatCurrency, formatPercent, formatTierName } from '@/utils/format';
import CommissionCard from '@/components/CommissionCard';
import { useAuthStore } from '@/store/auth';
import * as Haptics from 'expo-haptics';

// ── Types ─────────────────────────────────────────────────────

type Side     = 'buy' | 'sell';
type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

const ORDER_TYPES: { label: string; value: OrderType }[] = [
  { label: 'Market',     value: 'market' },
  { label: 'Limit',      value: 'limit' },
  { label: 'Stop',       value: 'stop' },
  { label: 'Stop-Limit', value: 'stop_limit' },
];

// ── Success animation overlay ─────────────────────────────────

function SuccessOverlay({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          scale.setValue(0);
          onDone();
        });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[successStyle.overlay, { opacity }]}>
      <Animated.View style={[successStyle.circle, { transform: [{ scale }] }]}>
        <Text style={successStyle.check}>✓</Text>
        <Text style={successStyle.label}>Order Submitted</Text>
      </Animated.View>
    </Animated.View>
  );
}

const successStyle = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.gain,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 52, fontWeight: '300' },
  label: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 4 },
});

// ── Preview Bottom Sheet ──────────────────────────────────────

function PreviewSheet({
  visible,
  preview,
  onConfirm,
  onCancel,
  submitting,
}: {
  visible: boolean;
  preview: PreviewResponse | null;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  if (!visible || !preview) return null;
  const isUp = preview.side === 'buy';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={sheetStyle.backdrop}>
        <View style={sheetStyle.sheet}>
          <View style={sheetStyle.handle} />
          <Text style={sheetStyle.title}>Order Preview</Text>

          {/* Summary rows */}
          <View style={sheetStyle.summaryGrid}>
            {[
              ['Symbol',    preview.symbol],
              ['Action',    preview.side.toUpperCase()],
              ['Shares',    String(preview.qty)],
              ['Est. Price', formatCurrency(preview.estimatedPrice)],
              ['Subtotal',  formatCurrency(preview.subtotal)],
              ['Commission', formatCurrency(preview.commissionAmount)],
            ].map(([k, v]) => (
              <View key={k} style={sheetStyle.summaryRow}>
                <Text style={sheetStyle.summaryKey}>{k}</Text>
                <Text style={sheetStyle.summaryVal}>{v}</Text>
              </View>
            ))}
            <View style={[sheetStyle.summaryRow, sheetStyle.totalRow]}>
              <Text style={sheetStyle.totalKey}>Total</Text>
              <Text style={sheetStyle.totalVal}>{formatCurrency(preview.total)}</Text>
            </View>
          </View>

          {/* Reg BI disclosure */}
          <View style={sheetStyle.disclosure}>
            <Text style={sheetStyle.disclosureText}>
              Reg BI Disclosure: Obsidian Capital acts in your best interest and discloses
              all material conflicts of interest. Commissions displayed are the full cost of
              this transaction. Review our full fee schedule before placing orders.
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[sheetStyle.confirmBtn, submitting && { opacity: 0.6 }]}
            onPress={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.obsidian} size="small" />
            ) : (
              <Text style={sheetStyle.confirmText}>Confirm & Submit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={sheetStyle.cancelBtn} onPress={onCancel} disabled={submitting}>
            <Text style={sheetStyle.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyle = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
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
  title: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  summaryGrid: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryKey: { color: Colors.textMuted, fontSize: 13 },
  summaryVal: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  totalRow: { borderBottomWidth: 0 },
  totalKey: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  totalVal: { color: Colors.gold, fontSize: 16, fontWeight: '800' },
  disclosure: {
    backgroundColor: Colors.surface3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  disclosureText: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
  confirmBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmText: { color: Colors.obsidian, fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: Colors.textMuted, fontSize: 15 },
});

// ── Trade Screen ──────────────────────────────────────────────

export default function TradeScreen() {
  const user = useAuthStore((s) => s.user);

  const [symbol,     setSymbol]     = useState('');
  const [searchQ,    setSearchQ]    = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [side,       setSide]       = useState<Side>('buy');
  const [orderType,  setOrderType]  = useState<OrderType>('market');
  const [shares,     setShares]     = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice,  setStopPrice]  = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [preview,    setPreview]    = useState<PreviewResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: quoteData, isLoading: loadingQuote } = useQuery({
    queryKey: ['quote', activeSymbol],
    queryFn: () => marketApi.getQuote(activeSymbol),
    enabled: activeSymbol.length > 0,
    refetchInterval: 10_000,
  });

  const quote: QuoteResponse | undefined = quoteData as QuoteResponse | undefined;
  const tier = (user?.tier ?? 'standard') as 'standard' | 'member' | 'private';

  const subtotal = shares * (quote?.price ?? 0);

  // Search handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQ(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.length < 1) { setSearchResults([]); return; }
    setLoadingSearch(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await marketApi.search(text);
        setSearchResults(res.assets.slice(0, 8));
      } catch { setSearchResults([]); }
      finally { setLoadingSearch(false); }
    }, 300);
  }, []);

  const selectSymbol = useCallback((sym: string) => {
    setActiveSymbol(sym.toUpperCase());
    setSymbol(sym.toUpperCase());
    setSearchQ('');
    setSearchResults([]);
    setTradeError('');
  }, []);

  const handlePreview = useCallback(async () => {
    setTradeError('');
    if (!activeSymbol) { setTradeError('Please select a stock first.'); return; }
    if (shares < 1)    { setTradeError('Enter at least 1 share.'); return; }

    const params: PreviewParams = {
      symbol: activeSymbol,
      side,
      qty: shares,
      type: orderType,
      limit_price: orderType === 'limit' || orderType === 'stop_limit' ? parseFloat(limitPrice) : undefined,
      stop_price:  orderType === 'stop'  || orderType === 'stop_limit' ? parseFloat(stopPrice) : undefined,
      time_in_force: 'day',
    };

    try {
      const result = await tradesApi.previewOrder(params);
      setPreview(result);
      setPreviewing(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Preview failed. Check your inputs.';
      setTradeError(msg);
    }
  }, [activeSymbol, side, orderType, shares, limitPrice, stopPrice]);

  const handleConfirm = useCallback(async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      await tradesApi.placeOrder({
        symbol: activeSymbol,
        side,
        qty: shares,
        type: orderType,
        limit_price: orderType === 'limit' || orderType === 'stop_limit' ? parseFloat(limitPrice) : undefined,
        stop_price:  orderType === 'stop'  || orderType === 'stop_limit' ? parseFloat(stopPrice) : undefined,
        time_in_force: 'day',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPreviewing(false);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Order failed.';
      setPreviewing(false);
      setTradeError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [preview, activeSymbol, side, orderType, shares, limitPrice, stopPrice]);

  const isUp = (quote?.changePct ?? 0) >= 0;
  const quoteColor = isUp ? Colors.gain : Colors.loss;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header row ─────────────────────────── */}
          <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>Place Order</Text>
            <View style={styles.modeBadge}>
              <View style={[styles.modeDot, { backgroundColor: Colors.gold }]} />
              <Text style={styles.modeText}>LIVE</Text>
            </View>
          </View>

          {/* ── Ticker search ────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>Stock Symbol</Text>
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.symbolInput}
                value={searchQ || symbol}
                onChangeText={handleSearchChange}
                onFocus={() => setSearchQ(symbol)}
                placeholder="Search ticker (e.g. AAPL)"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                returnKeyType="search"
                selectionColor={Colors.gold}
              />
              {loadingSearch && (
                <ActivityIndicator size="small" color={Colors.gold} style={{ marginRight: 10 }} />
              )}
            </View>

            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.searchDropdown}>
                {searchResults.map((r) => (
                  <TouchableOpacity
                    key={r.symbol}
                    style={styles.searchDropItem}
                    onPress={() => selectSymbol(r.symbol)}
                  >
                    <Text style={styles.dropSymbol}>{r.symbol}</Text>
                    <Text style={styles.dropName} numberOfLines={1}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Quote display ────────────────────── */}
          {activeSymbol.length > 0 && (
            <View style={styles.quoteCard}>
              {loadingQuote ? (
                <ActivityIndicator color={Colors.gold} />
              ) : quote ? (
                <View style={styles.quoteInner}>
                  <View>
                    <Text style={styles.quoteSymbol}>{activeSymbol}</Text>
                  </View>
                  <View style={styles.quotePriceGroup}>
                    <Text style={styles.quotePrice}>{formatCurrency(quote.price)}</Text>
                    <Text style={[styles.quoteChange, { color: quoteColor }]}>
                      {formatPercent(quote.changePct)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.quoteError}>Quote unavailable</Text>
              )}
            </View>
          )}

          {/* ── Buy / Sell toggle ────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>Action</Text>
            <View style={styles.sideToggle}>
              <TouchableOpacity
                style={[styles.sideBtn, side === 'buy' && styles.sideBtnBuy]}
                onPress={() => setSide('buy')}
              >
                <Text style={[styles.sideBtnText, side === 'buy' && styles.sideBtnTextActive]}>
                  BUY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sideBtn, side === 'sell' && styles.sideBtnSell]}
                onPress={() => setSide('sell')}
              >
                <Text style={[styles.sideBtnText, side === 'sell' && styles.sideBtnTextActiveSell]}>
                  SELL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Order type ───────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>Order Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ORDER_TYPES.map((ot) => (
                <TouchableOpacity
                  key={ot.value}
                  style={[styles.typePill, orderType === ot.value && styles.typePillActive]}
                  onPress={() => setOrderType(ot.value)}
                >
                  <Text style={[styles.typePillText, orderType === ot.value && styles.typePillTextActive]}>
                    {ot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Shares ───────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>Shares</Text>
            <View style={styles.sharesRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setShares((s) => Math.max(1, s - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.sharesInput}
                value={String(shares)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!isNaN(n) && n > 0) setShares(n);
                }}
                keyboardType="numeric"
                selectionColor={Colors.gold}
              />
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setShares((s) => s + 1)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Limit / Stop price inputs ─────────── */}
          {(orderType === 'limit' || orderType === 'stop_limit') && (
            <View style={styles.section}>
              <Text style={styles.label}>Limit Price</Text>
              <TextInput
                style={styles.priceInput}
                value={limitPrice}
                onChangeText={setLimitPrice}
                placeholder={`e.g. ${formatCurrency(quote?.price ?? 100)}`}
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                selectionColor={Colors.gold}
              />
            </View>
          )}

          {(orderType === 'stop' || orderType === 'stop_limit') && (
            <View style={styles.section}>
              <Text style={styles.label}>Stop Price</Text>
              <TextInput
                style={styles.priceInput}
                value={stopPrice}
                onChangeText={setStopPrice}
                placeholder={`e.g. ${formatCurrency(quote?.price ?? 100)}`}
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                selectionColor={Colors.gold}
              />
            </View>
          )}

          {/* ── Commission breakdown ──────────────── */}
          {subtotal > 0 && (
            <View style={styles.section}>
              <CommissionCard subtotal={subtotal} tier={tier} showUpgradeSavings />
            </View>
          )}

          {/* ── Error message ─────────────────────── */}
          {tradeError !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{tradeError}</Text>
            </View>
          )}

          {/* ── Preview button ────────────────────── */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.previewBtn, !activeSymbol && styles.btnDisabled]}
              onPress={handlePreview}
              disabled={!activeSymbol}
              activeOpacity={0.85}
            >
              <Text style={styles.previewBtnText}>Preview Order</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Preview sheet */}
      <PreviewSheet
        visible={previewing}
        preview={preview}
        onConfirm={handleConfirm}
        onCancel={() => setPreviewing(false)}
        submitting={submitting}
      />

      {/* Success overlay */}
      <SuccessOverlay
        visible={success}
        onDone={() => {
          setSuccess(false);
          setShares(1);
          setActiveSymbol('');
          setSymbol('');
          setTradeError('');
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.obsidian },
  flex:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingBottom: 48 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.gold + '18',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { color: Colors.gold, fontSize: 11, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 16 },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  searchWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 13,
    letterSpacing: 1,
  },
  searchDropdown: {
    marginTop: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  searchDropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropSymbol: { color: Colors.text, fontSize: 14, fontWeight: '700', width: 60 },
  dropName:   { color: Colors.textMuted, fontSize: 12, flex: 1 },

  quoteCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  quoteInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteSymbol: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  quotePriceGroup: { alignItems: 'flex-end' },
  quotePrice: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  quoteChange: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  quoteError: { color: Colors.textMuted, fontSize: 13 },

  sideToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sideBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  sideBtnBuy:  { backgroundColor: Colors.gain },
  sideBtnSell: { backgroundColor: Colors.loss },
  sideBtnText: { color: Colors.textMuted, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  sideBtnTextActive:     { color: '#fff' },
  sideBtnTextActiveSell: { color: '#fff' },

  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  typePillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  typePillText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  typePillTextActive: { color: Colors.obsidian },

  sharesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: Colors.gold, fontSize: 22, fontWeight: '300' },
  sharesInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 10,
  },

  priceInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.loss + '22',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.loss + '55',
  },
  errorText: { color: Colors.loss, fontSize: 13 },

  previewBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  previewBtnText: { color: Colors.obsidian, fontSize: 16, fontWeight: '700' },
});
