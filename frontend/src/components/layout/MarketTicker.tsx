/* ============================================================
   Obsidian Capital — MarketTicker Component
   Scrolling market data bar with updated realistic prices.
   ============================================================ */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketIndex } from '@/types/index';

// ── Updated Ticker Data ───────────────────────────────────────

const TICKER_ITEMS: (MarketIndex & { symbol: string; prefix?: string; suffix?: string })[] = [
  { name: 'S&P 500',   symbol: 'SPX',  value: 5847.28,  change: 47.62,   changePct:  0.82 },
  { name: 'NASDAQ',    symbol: 'COMP', value: 18934.00, change: 231.80,  changePct:  1.24 },
  { name: 'DOW',       symbol: 'DJI',  value: 42134.00, change: -131.20, changePct: -0.31 },
  { name: 'RUSSELL',   symbol: 'RUT',  value: 2082.14,  change:  16.44,  changePct:  0.80 },
  { name: 'VIX',       symbol: 'VIX',  value:  16.24,   change:  -0.82,  changePct: -4.81 },
  { name: 'BTC/USD',   symbol: 'BTC',  value: 97234.00, change: 2284.80, changePct:  2.41 },
  { name: 'ETH/USD',   symbol: 'ETH',  value:  3847.00, change:   70.56, changePct:  1.87 },
  { name: 'Gold',      symbol: 'XAU',  value:  2634.00, change:   11.85, changePct:  0.45, prefix: '$', suffix: '/oz' },
  { name: 'Silver',    symbol: 'XAG',  value:    31.42, change:    0.44, changePct:  1.42, prefix: '$', suffix: '/oz' },
  { name: 'Oil (WTI)', symbol: 'CL',   value:    71.24, change:   -0.64, changePct: -0.89, prefix: '$' },
  { name: 'EUR/USD',   symbol: 'EUR',  value:  1.0867,  change:   0.0018,changePct:  0.17 },
  { name: 'GBP/USD',   symbol: 'GBP',  value:  1.2762,  change:  -0.0024,changePct: -0.19 },
  { name: '10Y Yield', symbol: 'TNX',  value:   4.321,  change:   0.018, changePct:  0.42 },
];

// ── Helpers ───────────────────────────────────────────────────

function formatValue(item: typeof TICKER_ITEMS[number]): string {
  const { symbol, value } = item;
  if (symbol === 'EUR' || symbol === 'GBP') return value.toFixed(4);
  if (symbol === 'TNX') return `${value.toFixed(3)}%`;
  if (symbol === 'VIX') return value.toFixed(2);
  if (value >= 10000)   return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1000)    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toFixed(2);
}

function formatChange(item: typeof TICKER_ITEMS[number]): string {
  const sign = item.changePct >= 0 ? '+' : '';
  return `${sign}${item.changePct.toFixed(2)}%`;
}

// ── Ticker Item ───────────────────────────────────────────────

function TickerItem({ item }: { item: typeof TICKER_ITEMS[number] }) {
  const isPositive = item.changePct >= 0;
  const colorClass = isPositive ? 'text-gain' : 'text-loss';

  return (
    <div className="inline-flex items-center gap-2 px-4 py-1 flex-shrink-0">
      {/* Name */}
      <span className="text-xs font-medium text-off-white/50 tracking-wider uppercase whitespace-nowrap">
        {item.name}
      </span>

      {/* Price */}
      <span className="text-xs font-mono font-semibold text-off-white tabular-nums whitespace-nowrap">
        {item.prefix ?? ''}{formatValue(item)}{item.suffix ?? ''}
      </span>

      {/* Change */}
      <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium tabular-nums whitespace-nowrap ${colorClass}`}>
        {isPositive ? <TrendingUp size={10} className="flex-shrink-0" /> : <TrendingDown size={10} className="flex-shrink-0" />}
        {formatChange(item)}
      </span>
    </div>
  );
}

// ── Separator ─────────────────────────────────────────────────

function TickerSeparator() {
  return (
    <span className="inline-flex items-center px-1.5 flex-shrink-0 select-none" style={{ color: 'rgba(201,168,76,0.4)' }}>
      •
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
      style={{ background: '#000000', borderBottom: '1px solid rgba(201,168,76,0.15)' }}
      aria-label="Live market ticker"
      role="marquee"
    >
      {/* Gold left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gold/30 z-10" />

      {/* Scrolling track */}
      <div className="absolute inset-0 flex items-center" style={{ willChange: 'transform' }}>
        <div className="flex items-center animate-ticker" style={{ width: 'max-content' }}>
          {items.map((item, idx) => (
            <React.Fragment key={`${item.symbol}-${idx}`}>
              <TickerItem item={item} />
              {/* Separator every 2 items */}
              {idx < items.length - 1 && (
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
