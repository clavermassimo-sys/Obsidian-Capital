/* ============================================================
   Obsidian Capital — Formatting Utilities
   ============================================================ */

// ── Currency ──────────────────────────────────────────────────

/**
 * Format a number as USD currency.
 * e.g. 1234.56 → "$1,234.56"
 */
export function formatCurrency(
  value: number,
  options?: { decimals?: number; compact?: boolean }
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

/**
 * Format a currency value with an explicit sign (useful for P&L display).
 * e.g.  350.00 → "+$350.00"
 *       -120.50 → "-$120.50"
 */
export function formatCurrencySigned(value: number, decimals = 2): string {
  if (!isFinite(value)) return '—';
  const formatted = formatCurrency(Math.abs(value), { decimals });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted.slice(1)}`; // already has the $ sign
  return formatted;
}

// ── Percentage ────────────────────────────────────────────────

/**
 * Format a percentage value with sign and two decimal places.
 * Input is the raw percentage (not a fraction).
 * e.g. 2.34 → "+2.34%"   |   -1.5 → "-1.50%"
 */
export function formatPercent(
  value: number,
  options?: { decimals?: number; showSign?: boolean }
): string {
  const { decimals = 2, showSign = true } = options ?? {};

  if (!isFinite(value)) return '—';

  const formatted = Math.abs(value).toFixed(decimals);
  if (!showSign) return `${value >= 0 ? '' : '-'}${formatted}%`;
  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

/**
 * Format a decimal fraction as a percentage.
 * e.g. 0.0834 → "+8.34%"
 */
export function formatFractionAsPercent(fraction: number, decimals = 2): string {
  return formatPercent(fraction * 100, { decimals });
}

// ── Numbers ───────────────────────────────────────────────────

/**
 * Format a large number with thousands separators.
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(
  value: number,
  options?: { decimals?: number; compact?: boolean }
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

/**
 * Format a share count — whole numbers only if integer, up to 4 decimal places otherwise.
 * e.g. 100 → "100"   |   12.5 → "12.5000"
 */
export function formatShares(shares: number): string {
  if (!isFinite(shares)) return '—';
  if (Number.isInteger(shares)) {
    return new Intl.NumberFormat('en-US').format(shares);
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(shares);
}

/**
 * Format a market-cap value compactly.
 * e.g. 2_800_000_000_000 → "$2.80T"
 */
export function formatMarketCap(value: number): string {
  if (!isFinite(value)) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(2)}M`;
  return formatCurrency(value, { decimals: 0 });
}

// ── Dates ─────────────────────────────────────────────────────

/**
 * Format a date as a readable string.
 * e.g. "2024-10-15" → "Oct 15, 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date + time.
 * e.g. "Oct 15, 2024, 9:30 AM"
 */
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

/**
 * Format a date as a short string without year (for charts, lists).
 * e.g. "Oct 15"
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Return a relative time description.
 * e.g. "2 hours ago", "just now", "3 days ago"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const nowMs   = Date.now();
  const diffMs  = nowMs - d.getTime();
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

/**
 * Format a Unix timestamp (seconds) for a chart x-axis label.
 */
export function formatChartTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

// ── Misc ──────────────────────────────────────────────────────

/**
 * Truncate a string to a max length with an ellipsis.
 */
export function truncate(str: string, max = 20): string {
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format a tier name for display.
 * e.g. "private" → "Private Client"
 */
export function formatTierName(tier: string): string {
  const map: Record<string, string> = {
    standard: 'Standard',
    member:   'Member',
    private:  'Private Client',
  };
  return map[tier] ?? capitalize(tier);
}
