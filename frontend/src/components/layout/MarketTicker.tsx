/* ============================================================
   Obsidian Capital — MarketTicker Component
   Scrolling market data bar at the top of the app
   ============================================================ */

import React, { useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketIndex } from '@/types/index';

// ── Mock Ticker Data ──────────────────────────────────────────

const TICKER_ITEMS: (MarketIndex & { symbol: string; prefix?: string })[] = [
  { name: 'S&P 500',  symbol: 'SPX',  value: 5321.41, change: 28.74,   changePct: 0.54  },
  { name: 'NASDAQ',   symbol: 'COMP', value: 16780.22,change: 112.48,  changePct: 0.67  },
  { name: 'DOW',      symbol: 'DJI',  value: 39118.86,change: -43.20,  changePct: -0.11 },
  { name: 'RUSSELL',  symbol: 'RUT',  value: 2041.58, change: 14.32,   changePct: 0.71  },
  { name: 'VIX',      symbol: 'VIX',  value: 14.82,   change: -0.54,   changePct: -3.52 },
  { name: 'BTC/USD',  symbol: 'BTC',  value: 68420.50,change: 1240.80, changePct: 1.85  },
  { name: 'ETH/USD',  symbol: 'ETH',  value: 3814.20, change: -62.40,  changePct: -1.61 },
  { name: 'GOLD',     symbol: 'XAU',  value: 2384.60, change: 12.40,   changePct: 0.52, prefix: '$' },
  { name: 'SILVER',   symbol: 'XAG',  value: 28.84,   change: 0.38,    changePct: 1.34, prefix: '$' },
  { name: 'OIL (WTI)',symbol: 'CL',   value: 79.42,   change: -0.88,   changePct: -1.10, prefix: '$' },
  { name: 'EUR/USD',  symbol: 'EUR',  value: 1.0824,  change: 0.0012,  changePct: 0.11  },
  { name: 'GBP/USD',  symbol: 'GBP',  value: 1.2741,  change: -0.0021, changePct: -0.16 },
  { name: '10Y YIELD',symbol: 'TNX',  value: 4.482,   change: 0.024,   changePct: 0.54, prefix: '' },
];

// ── Helpers ───────────────────────────────────────────────────

function formatValue(item: typeof TICKER_ITEMS[number]): string {
  const { symbol, value, prefix } = item;
  if (symbol === 'EUR' || symbol === 'GBP') return value.toFixed(4);
  if (symbol === 'TNX') return `${value.toFixed(3)}%`;
  if (symbol === 'VIX') return value.toFixed(2);
  if (value >= 10000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (value >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toFixed(2);
}

function formatChange(item: typeof TICKER_ITEMS[number]): string {
  const sign = item.change >= 0 ? '+' : '';
  return `${sign}${item.changePct.toFixed(2)}%`;
}

// ── Ticker Item ───────────────────────────────────────────────

function TickerItem({ item }: { item: typeof TICKER_ITEMS[number] }) {
  const isPositive = item.change >= 0;
  const colorClass = isPositive ? 'text-gain' : 'text-loss';

  return (
    <div className="inline-flex items-center gap-2 px-4 py-1 flex-shrink-0 border-r border-border/40 last:border-r-0">
      {/* Name */}
      <span className="text-xs font-medium text-off-white/50 tracking-wider uppercase whitespace-nowrap">
        {item.name}
      </span>

      {/* Price */}
      <span className="text-xs font-mono font-semibold text-off-white tabular-nums whitespace-nowrap">
        {item.prefix !== undefined ? item.prefix : ''}
        {formatValue(item)}
      </span>

      {/* Change */}
      <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium tabular-nums whitespace-nowrap ${colorClass}`}>
        {isPositive
          ? <TrendingUp size={10} className="flex-shrink-0" />
          : <TrendingDown size={10} className="flex-shrink-0" />
        }
        {formatChange(item)}
      </span>
    </div>
  );
}

// ── Separator ─────────────────────────────────────────────────

function TickerSeparator() {
  return (
    <span className="inline-flex items-center px-2 flex-shrink-0 text-gold/30 select-none">
      ◆
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────

export default function MarketTicker() {
  // Duplicate items for seamless infinite scroll
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="h-8 w-full overflow-hidden relative flex-shrink-0"
      style={{
        background: '#000000',
        borderBottom: '1px solid #c9a84c26',
      }}
      aria-label="Live market ticker"
      role="marquee"
    >
      {/* Gold left accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gold/30 z-10" />

      {/* Scrolling track */}
      <div
        className="absolute inset-0 flex items-center"
        style={{ willChange: 'transform' }}
      >
        <div
          className="flex items-center animate-ticker"
          style={{ width: 'max-content' }}
        >
          {items.map((item, idx) => (
            <React.Fragment key={`${item.symbol}-${idx}`}>
              <TickerItem item={item} />
              {idx < items.length - 1 && (idx + 1) % 4 === 0 && (
                <TickerSeparator />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
