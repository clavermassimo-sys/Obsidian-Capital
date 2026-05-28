/* ============================================================
   Obsidian Capital Mobile — Loading Skeleton Components
   Animated shimmer using Animated API (no extra deps)
   ============================================================ */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';

// ── Base Skeleton ─────────────────────────────────────────────

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 6, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as `${number}%` | number,
          height,
          borderRadius,
          backgroundColor: Colors.surface3,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Pre-built Row Skeleton ────────────────────────────────────

export function SkeletonRow() {
  return (
    <View style={styles.rowContainer}>
      <View style={styles.rowLeft}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.rowTextGroup}>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width={120} height={11} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={styles.rowRight}>
        <Skeleton width={70} height={14} borderRadius={4} />
        <Skeleton width={50} height={11} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

// ── Pre-built Card Skeleton ───────────────────────────────────

export function SkeletonCard() {
  return (
    <View style={styles.cardContainer}>
      <Skeleton width="100%" height={18} borderRadius={4} />
      <Skeleton width="70%" height={14} borderRadius={4} style={{ marginTop: 10 }} />
      <Skeleton width="85%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width="55%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTextGroup: {
    gap: 0,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 0,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
