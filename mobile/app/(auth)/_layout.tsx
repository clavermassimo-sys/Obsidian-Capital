/* ============================================================
   Obsidian Capital Mobile — Auth Group Layout
   ============================================================ */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.obsidian },
        animation: 'fade',
      }}
    />
  );
}
