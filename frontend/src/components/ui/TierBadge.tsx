/* ============================================================
   Obsidian Capital — TierBadge Component
   ============================================================ */

import React from 'react';
import { Shield, Star, Gem } from 'lucide-react';
import type { CommissionTier } from '@/types/index';

// ── Types ─────────────────────────────────────────────────────

interface TierBadgeProps {
  tier: CommissionTier;
  size?: 'sm' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// ── Tier Configs ──────────────────────────────────────────────

const TIER_CONFIG = {
  standard: {
    label: 'STANDARD',
    icon: Shield,
    containerClass: 'bg-surface-3 border border-border text-off-white/60',
    iconClass: 'text-off-white/40',
    dotClass: 'bg-off-white/30',
  },
  member: {
    label: 'MEMBER',
    icon: Star,
    containerClass:
      'bg-[#1e1b4b] border border-indigo-500/30 text-indigo-300',
    iconClass: 'text-indigo-400',
    dotClass: 'bg-indigo-400',
  },
  private: {
    label: 'OBSIDIAN PRIVATE',
    icon: Gem,
    containerClass:
      'bg-gold/10 border border-gold/40 text-gold-light shadow-[0_0_12px_rgba(201,168,76,0.15)]',
    iconClass: 'text-gold',
    dotClass: 'bg-gold',
  },
} as const;

// ── Component ─────────────────────────────────────────────────

export default function TierBadge({
  tier,
  size = 'sm',
  showIcon = true,
  className = '',
}: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (size === 'lg') {
    return (
      <div
        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold tracking-widest uppercase ${config.containerClass} ${className}`}
      >
        {showIcon && (
          <Icon
            size={16}
            className={`flex-shrink-0 ${config.iconClass}`}
          />
        )}
        <span>{config.label}</span>
        {tier === 'private' && (
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dotClass}`}
          />
        )}
      </div>
    );
  }

  // Small (default)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold tracking-widest uppercase ${config.containerClass} ${className}`}
    >
      {showIcon && (
        <Icon size={9} className={`flex-shrink-0 ${config.iconClass}`} />
      )}
      <span>{config.label}</span>
    </div>
  );
}
