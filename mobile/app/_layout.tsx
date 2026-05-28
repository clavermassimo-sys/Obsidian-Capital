/* ============================================================
   Obsidian Capital Mobile — Root Layout
   SafeAreaProvider + QueryClient + auth-gated navigation
   ============================================================ */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { Colors } from '@/constants/colors';
import { useRouter, useSegments } from 'expo-router';

// ── Query Client ──────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// ── Auth Guard (inner component — has access to router) ───────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadStoredAuth } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();

  // Hydrate auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Not logged in → send to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Already logged in → send to dashboard
      router.replace('/(tabs)/dashboard');
    } else if (user && !inTabsGroup && !inAuthGroup) {
      // Logged in but not in tabs or chart — allow (e.g. chart/[symbol])
    }
  }, [user, isLoading, segments]);

  return <>{children}</>;
}

// ── Root Layout ───────────────────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={Colors.obsidian} />
          <AuthGuard>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.obsidian },
                headerTintColor: Colors.gold,
                headerTitleStyle: {
                  color: Colors.text,
                  fontWeight: '600',
                  fontSize: 17,
                },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: Colors.obsidian },
                animation: 'slide_from_right',
              }}
            >
              {/* Auth group — no header */}
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />

              {/* Tabs group — no header (tabs has its own) */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Chart detail */}
              <Stack.Screen
                name="chart/[symbol]"
                options={{
                  headerShown: true,
                  title: 'Chart',
                  headerBackTitle: 'Back',
                }}
              />
            </Stack>
          </AuthGuard>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.obsidian },
});
