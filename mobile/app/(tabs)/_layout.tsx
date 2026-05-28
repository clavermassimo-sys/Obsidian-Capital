/* ============================================================
   Obsidian Capital Mobile — Bottom Tab Navigator
   5 tabs: Dashboard | Markets | Trade | Orders | Profile
   ============================================================ */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

// ── Icon components (simple Unicode / text-based icons) ───────
// Using emoji/symbols to avoid needing an icon library at this stage.
// Each tab uses a styled View so the trade button can be elevated.

function TabIcon({
  focused,
  label,
  icon,
}: {
  focused: boolean;
  label: string;
  icon: string;
}) {
  return (
    <View style={tab.wrapper}>
      <Text style={[tab.icon, focused && tab.iconActive]}>{icon}</Text>
    </View>
  );
}

function TradeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={trade.outer}>
      <View style={[trade.circle, focused && trade.circleActive]}>
        <Text style={trade.icon}>⬆</Text>
      </View>
    </View>
  );
}

const tab = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  icon: {
    fontSize: 22,
    color: Colors.textMuted,
  },
  iconActive: {
    color: Colors.gold,
  },
});

const trade = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  circleActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  icon: {
    fontSize: 22,
    color: Colors.text,
  },
});

// ── Layout ────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.obsidian },
        headerTintColor: Colors.gold,
        headerTitleStyle: { color: Colors.text, fontWeight: '600' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Dashboard" icon="▦" />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Markets',
          tabBarLabel: 'Markets',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Markets" icon="📈" />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarLabel: 'Trade',
          tabBarIcon: ({ focused }) => <TradeTabIcon focused={focused} />,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Orders" icon="📋" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profile" icon="👤" />
          ),
        }}
      />
    </Tabs>
  );
}
