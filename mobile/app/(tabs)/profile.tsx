/* ============================================================
   Obsidian Capital Mobile — Profile / Settings Screen
   User info, tier badge, account stats, menu rows
   ============================================================ */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { tradesApi } from '@/services/api';
import { formatCurrency, formatTierName, getTierRateDisplay } from '@/utils/format';
import { useAuthStore } from '@/store/auth';

// ── Tier display helpers ──────────────────────────────────────

function tierColor(tier: string): string {
  if (tier === 'private') return Colors.gold;
  if (tier === 'member')  return '#a0c4ff';
  return Colors.textMuted;
}

// ── Avatar circle ─────────────────────────────────────────────

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  return (
    <View style={avatarStyle.circle}>
      <Text style={avatarStyle.initials}>{initials}</Text>
    </View>
  );
}

const avatarStyle = StyleSheet.create({
  circle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surface3,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  initials: { color: Colors.gold, fontSize: 26, fontWeight: '700' },
});

// ── Menu Row ──────────────────────────────────────────────────

interface MenuRowProps {
  icon: string;
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuRow({ icon, label, value, valueColor, onPress, danger }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={menuStyle.row}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={menuStyle.left}>
        <Text style={menuStyle.icon}>{icon}</Text>
        <Text style={[menuStyle.label, danger && { color: Colors.loss }]}>{label}</Text>
      </View>
      <View style={menuStyle.right}>
        {value && (
          <Text style={[menuStyle.value, valueColor ? { color: valueColor } : null]}>
            {value}
          </Text>
        )}
        {onPress && <Text style={menuStyle.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

const menuStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 18, width: 26, textAlign: 'center' },
  label: { color: Colors.text, fontSize: 15 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { color: Colors.textMuted, fontSize: 14 },
  arrow: { color: Colors.textMuted, fontSize: 20 },
});

// ── Menu Section ──────────────────────────────────────────────

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyle.wrapper}>
      <Text style={sectionStyle.title}>{title}</Text>
      <View style={sectionStyle.card}>{children}</View>
    </View>
  );
}

const sectionStyle = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, marginBottom: 24 },
  title: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});

// ── Stat Card ─────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={statStyle.card}>
      <Text style={statStyle.label}>{label}</Text>
      <Text style={statStyle.value}>{value}</Text>
      {sub && <Text style={statStyle.sub}>{sub}</Text>}
    </View>
  );
}

const statStyle = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { color: Colors.textMuted, fontSize: 10, marginBottom: 4, textAlign: 'center' },
  value: { color: Colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sub:   { color: Colors.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
});

// ── Profile Screen ────────────────────────────────────────────

export default function ProfileScreen() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const { data: accountData } = useQuery({
    queryKey: ['account'],
    queryFn: () => tradesApi.getAccount(),
    enabled: !!user,
  });

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
      { userInterfaceStyle: 'dark' }
    );
  }, [logout, router]);

  if (!user) return null;

  const tc     = tierColor(user.tier);
  const equity = accountData?.account
    ? parseFloat(String(accountData.account.equity))
    : user.portfolioValue;
  const bp     = accountData?.account
    ? parseFloat(String(accountData.account.buying_power))
    : user.buyingPower;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── User header ───────────────────────── */}
        <View style={styles.userHeader}>
          <AvatarCircle name={user.name} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={[styles.tierBadge, { borderColor: tc, backgroundColor: tc + '18' }]}>
            <Text style={[styles.tierText, { color: tc }]}>
              {formatTierName(user.tier)}
            </Text>
          </View>
        </View>

        {/* ── Tier highlight card ───────────────── */}
        <View style={styles.tierCard}>
          <View style={styles.tierCardLeft}>
            <Text style={styles.tierCardTitle}>{formatTierName(user.tier)} Membership</Text>
            <Text style={styles.tierCardRate}>
              {getTierRateDisplay(user.tier)} commission rate
            </Text>
          </View>
          {user.tier !== 'private' && (
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Account stats ─────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(equity, { compact: true })}
          />
          <StatCard
            label="Buying Power"
            value={formatCurrency(bp, { compact: true })}
          />
          <StatCard
            label="KYC Status"
            value={user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
          />
        </View>

        {/* ── Menu sections ─────────────────────── */}
        <MenuSection title="Account">
          <MenuRow
            icon="🔗"
            label="IBKR Connection"
            value="Connected"
            valueColor={Colors.gain}
            onPress={() => {}}
          />
          <MenuRow
            icon="💳"
            label="Subscription & Billing"
            value={formatTierName(user.tier)}
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection title="Settings">
          <MenuRow
            icon="🔒"
            label="Security"
            onPress={() => {}}
          />
          <MenuRow
            icon="🔔"
            label="Notifications"
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection title="Legal & Information">
          <MenuRow
            icon="💰"
            label="Fee Schedule"
            onPress={() => {}}
          />
          <MenuRow
            icon="📄"
            label="Terms & Conditions"
            onPress={() => {}}
          />
          <MenuRow
            icon="🛡️"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection title="Session">
          <MenuRow
            icon="🚪"
            label="Sign Out"
            danger
            onPress={handleLogout}
          />
        </MenuSection>

        <Text style={styles.version}>
          Obsidian Capital v1.0.0{'\n'}
          Member since {new Date(user.createdAt).getFullYear()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.obsidian },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  userHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  userName:  { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: Colors.textMuted, fontSize: 13, marginBottom: 12 },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  tierCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierCardLeft:  {},
  tierCardTitle: { color: Colors.gold, fontSize: 15, fontWeight: '700' },
  tierCardRate:  { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  upgradeBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  upgradeBtnText: { color: Colors.obsidian, fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  version: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
    marginTop: 8,
  },
});
