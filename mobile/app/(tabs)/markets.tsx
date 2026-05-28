/* ============================================================
   Obsidian Capital Mobile — Markets Screen
   Search, indices, top movers, news feed
   ============================================================ */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { marketApi } from '@/services/api';
import type { IndexQuote, MoverEntry, NewsItem, AssetResult } from '@/services/api';
import { formatCurrency, formatPercent, formatRelativeTime } from '@/utils/format';
import { SkeletonRow, Skeleton } from '@/components/LoadingSkeleton';

// ── Search result row ─────────────────────────────────────────

function SearchResult({ asset, onPress }: { asset: AssetResult; onPress: () => void }) {
  return (
    <TouchableOpacity style={srStyle.row} onPress={onPress} activeOpacity={0.7}>
      <View style={srStyle.badge}>
        <Text style={srStyle.initial}>{asset.symbol.charAt(0)}</Text>
      </View>
      <View style={srStyle.text}>
        <Text style={srStyle.symbol}>{asset.symbol}</Text>
        <Text style={srStyle.name} numberOfLines={1}>{asset.name}</Text>
      </View>
      <Text style={srStyle.type}>{asset.type}</Text>
    </TouchableOpacity>
  );
}

const srStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  badge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    marginRight: 12,
  },
  initial: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  text: { flex: 1 },
  symbol: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  name: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  type: { color: Colors.textMuted, fontSize: 11 },
});

// ── Mover row ─────────────────────────────────────────────────

function MoverRow({ m, onPress }: { m: MoverEntry; onPress: () => void }) {
  const isUp  = m.changePct >= 0;
  const color = isUp ? Colors.gain : Colors.loss;
  return (
    <TouchableOpacity style={moverStyle.row} onPress={onPress} activeOpacity={0.7}>
      <View style={moverStyle.left}>
        <View style={moverStyle.badge}>
          <Text style={moverStyle.initial}>{m.symbol.charAt(0)}</Text>
        </View>
        <View>
          <Text style={moverStyle.symbol}>{m.symbol}</Text>
          {m.name && (
            <Text style={moverStyle.name} numberOfLines={1}>{m.name}</Text>
          )}
        </View>
      </View>
      <View style={moverStyle.right}>
        <Text style={moverStyle.price}>{formatCurrency(m.price)}</Text>
        <View style={[moverStyle.badge2, { backgroundColor: color + '22' }]}>
          <Text style={[moverStyle.pct, { color }]}>{formatPercent(m.changePct)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const moverStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  initial: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  symbol: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  name: { color: Colors.textMuted, fontSize: 11, marginTop: 1, maxWidth: 160 },
  right: { alignItems: 'flex-end', gap: 4 },
  price: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  badge2: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  pct: { fontSize: 12, fontWeight: '600' },
});

// ── Index Card ────────────────────────────────────────────────

function IndexCard({ idx }: { idx: IndexQuote }) {
  const isUp  = idx.changePct >= 0;
  const color = isUp ? Colors.gain : Colors.loss;
  return (
    <View style={idxStyle.card}>
      <Text style={idxStyle.name} numberOfLines={1}>{idx.name}</Text>
      <Text style={idxStyle.price}>{formatCurrency(idx.price, { decimals: 0 })}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <Text style={[idxStyle.change, { color }]}>{formatPercent(idx.changePct)}</Text>
        <Text style={[{ color, fontSize: 10 }]}>
          {isUp ? '▲' : '▼'} {formatCurrency(Math.abs(idx.change), { decimals: 2 })}
        </Text>
      </View>
    </View>
  );
}

const idxStyle = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: 14,
    minWidth: 130,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: { color: Colors.textMuted, fontSize: 11, marginBottom: 6 },
  price: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  change: { fontSize: 13, fontWeight: '600' },
});

// ── News Card ─────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <View style={newsStyle.card}>
      {item.symbols.length > 0 && (
        <View style={newsStyle.symbolsRow}>
          {item.symbols.slice(0, 3).map((s) => (
            <View key={s} style={newsStyle.symbolChip}>
              <Text style={newsStyle.symbolText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={newsStyle.headline} numberOfLines={3}>{item.headline}</Text>
      <View style={newsStyle.footer}>
        <Text style={newsStyle.source}></Text>
        <Text style={newsStyle.time}>{formatRelativeTime(item.publishedAt)}</Text>
      </View>
    </View>
  );
}

const newsStyle = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symbolsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  symbolChip: {
    backgroundColor: Colors.gold + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  symbolText: { color: Colors.gold, fontSize: 10, fontWeight: '700' },
  headline: { color: Colors.text, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  source: { color: Colors.textMuted, fontSize: 11 },
  time: { color: Colors.textMuted, fontSize: 11 },
});

// ── Markets Screen ────────────────────────────────────────────

type MoverTab = 'gainers' | 'losers';

export default function MarketsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState('');
  const [moverTab, setMoverTab]         = useState<MoverTab>('gainers');
  const [refreshing, setRefreshing]     = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQ, setDebouncedQ]     = useState('');

  const onSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQ(text), 350);
  }, []);

  const { data: indicesData, isLoading: loadIndices, refetch: refetchIndices } = useQuery({
    queryKey: ['indices'],
    queryFn: () => marketApi.getIndices(),
  });

  const { data: moversData, isLoading: loadMovers, refetch: refetchMovers } = useQuery({
    queryKey: ['movers'],
    queryFn: () => marketApi.getMovers(),
  });

  const { data: newsData, isLoading: loadNews, refetch: refetchNews } = useQuery({
    queryKey: ['news'],
    queryFn: () => marketApi.getNews(20),
  });

  const { data: searchData, isLoading: loadSearch } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => marketApi.search(debouncedQ),
    enabled: debouncedQ.length >= 1,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchIndices(), refetchMovers(), refetchNews()]);
    setRefreshing(false);
  }, [refetchIndices, refetchMovers, refetchNews]);

  const indices = indicesData?.indices ?? [];
  const gainers = moversData?.gainers ?? [];
  const losers  = moversData?.losers ?? [];
  const news    = newsData?.news ?? [];
  const movers  = moverTab === 'gainers' ? gainers : losers;
  const results = searchData?.assets ?? [];

  const showSearch = debouncedQ.length >= 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search stocks, ETFs..."
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          returnKeyType="search"
          selectionColor={Colors.gold}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setDebouncedQ(''); }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search results overlay */}
      {showSearch ? (
        <View style={styles.searchResults}>
          {loadSearch ? (
            <ActivityIndicator color={Colors.gold} style={{ margin: 20 }} />
          ) : results.length === 0 ? (
            <Text style={styles.noResults}>No results for "{debouncedQ}"</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(i) => i.symbol}
              renderItem={({ item }) => (
                <SearchResult
                  asset={item}
                  onPress={() => {
                    setSearchQuery('');
                    setDebouncedQ('');
                    router.push(`/chart/${item.symbol}`);
                  }}
                />
              )}
            />
          )}
        </View>
      ) : (
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
          {/* ── Indices ─────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Indices</Text>
            {loadIndices ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width={130} height={80} borderRadius={12} style={{ marginRight: 12 }} />
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

          {/* ── Top Movers ──────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.moverHeader}>
              <Text style={styles.sectionTitle}>Top Movers</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.togglePill, moverTab === 'gainers' && styles.togglePillActive]}
                  onPress={() => setMoverTab('gainers')}
                >
                  <Text style={[styles.toggleText, moverTab === 'gainers' && styles.toggleTextActive]}>
                    Gainers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.togglePill, moverTab === 'losers' && styles.togglePillActiveLoss]}
                  onPress={() => setMoverTab('losers')}
                >
                  <Text style={[styles.toggleText, moverTab === 'losers' && styles.toggleTextActiveLoss]}>
                    Losers
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.moversCard}>
              {loadMovers ? (
                Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
              ) : movers.length === 0 ? (
                <Text style={styles.noResults}>No data available</Text>
              ) : (
                movers.slice(0, 10).map((m) => (
                  <MoverRow
                    key={m.symbol}
                    m={m}
                    onPress={() => router.push(`/chart/${m.symbol}`)}
                  />
                ))
              )}
            </View>
          </View>

          {/* ── News ────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market News</Text>
            {loadNews ? (
              Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} width="100%" height={100} borderRadius={12} style={{ marginBottom: 10 }} />
              ))
            ) : news.length === 0 ? (
              <Text style={styles.noResults}>No news available</Text>
            ) : (
              news.map((item, i) => <NewsCard key={i} item={item} />)
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.obsidian },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  clearIcon: { color: Colors.textMuted, fontSize: 14 },
  searchResults: {
    flex: 1,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  noResults: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  moverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  togglePillActive: {
    backgroundColor: Colors.gain,
    borderColor: Colors.gain,
  },
  togglePillActiveLoss: {
    backgroundColor: Colors.loss,
    borderColor: Colors.loss,
  },
  toggleText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  toggleTextActiveLoss: { color: '#fff' },
  moversCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
});
