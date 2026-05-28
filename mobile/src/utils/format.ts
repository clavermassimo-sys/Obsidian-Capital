/* ============================================================
   Obsidian Capital Mobile — Formatting Utilities
   ============================================================ */

export function formatCurrency(
  value: number,
  options?: { decimals?: number; compact?: boolean },
): string {
  const { decimals = 2, compact = false } = options ?? {};
  if (!isFinite(value)) return '—';
  if (compact && Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrencySigned(value: number, decimals = 2): string {
  if (!isFinite(value)) return '—';
  const formatted = formatCurrency(Math.abs(value), { decimals });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted.slice(1)}`;
  return formatted;
}

export function formatPercent(
  value: number,
  options?: { decimals?: number; showSign?: boolean },
): string {
  const { decimals = 2, showSign = true } = options ?? {};
  if (!isFinite(value)) return '—';
  const formatted = Math.abs(value).toFixed(decimals);
  if (!showSign) return `${value >= 0 ? '' : '-'}${formatted}%`;
  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

export function formatNumber(
  value: number,
  options?: { decimals?: number; compact?: boolean },
): string {
  const { decimals = 0, compact = false } = options ?? {};
  if (!isFinite(value)) return '—';
  if (compact && Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const diffMs  = Date.now() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if (seconds < 10)  return 'just now';
  if (seconds < 60)  return `${seconds}s ago`;
  if (minutes < 60)  return `${minutes}m ago`;
  if (hours   < 24)  return `${hours}h ago`;
  if (days    < 7)   return `${days}d ago`;
  return formatDate(d);
}

export function formatTierName(tier: string): string {
  const map: Record<string, string> = {
    standard: 'Standard',
    member:   'Member',
    private:  'Private Client',
  };
  return map[tier] ?? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

export function getTierRate(tier: string): number {
  if (tier === 'private') return 0.055;
  if (tier === 'member')  return 0.08;
  return 0.11;
}

export function getTierRateDisplay(tier: string): string {
  if (tier === 'private') return '5–6%';
  if (tier === 'member')  return '7–9%';
  return '10–12%';
}
