/* ============================================================
   Obsidian Capital — AppLayout
   Main authenticated app shell with ticker, sidebar, content area
   ============================================================ */

import React from 'react';
import { Outlet } from 'react-router-dom';
import MarketTicker from './MarketTicker';
import Navbar from './Navbar';

// ── Constants ─────────────────────────────────────────────────

const TICKER_HEIGHT = 32; // px — matches h-8
const SIDEBAR_WIDTH = 240; // px
const TRADE_PANEL_WIDTH = 320; // px

// ── Component ─────────────────────────────────────────────────

interface AppLayoutProps {
  /** Optional override: pass a custom trade panel node,
   *  or leave undefined to hide it */
  tradePanel?: React.ReactNode;
}

export default function AppLayout({ tradePanel }: AppLayoutProps) {
  return (
    <div
      className="flex flex-col min-h-screen w-full bg-obsidian"
      style={{ colorScheme: 'dark' }}
    >
      {/* ── Market Ticker ── sticky at very top ────────── */}
      <div
        className="sticky top-0 z-50 w-full flex-shrink-0"
        style={{ height: `${TICKER_HEIGHT}px` }}
      >
        <MarketTicker />
      </div>

      {/* ── Body row: sidebar + content + trade panel ─── */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ height: `calc(100vh - ${TICKER_HEIGHT}px)` }}
      >
        {/* ── Left Sidebar Navbar ─── fixed width ─────── */}
        <div
          className="flex-shrink-0 sticky top-8 h-[calc(100vh-32px)] overflow-y-auto scrollbar-hidden z-40"
          style={{ width: `${SIDEBAR_WIDTH}px` }}
        >
          <Navbar />
        </div>

        {/* ── Main Content Area ────────────────────────── */}
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{
            background: '#0a0a0a',
            paddingRight: tradePanel ? `${TRADE_PANEL_WIDTH}px` : '0',
          }}
        >
          {/* Page scroll container */}
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>

        {/* ── Trade Panel ── fixed on right side ──────── */}
        {tradePanel && (
          <div
            className="fixed right-0 flex-shrink-0 overflow-y-auto scrollbar-hidden z-40 border-l border-border"
            style={{
              top: `${TICKER_HEIGHT}px`,
              width: `${TRADE_PANEL_WIDTH}px`,
              height: `calc(100vh - ${TICKER_HEIGHT}px)`,
              background: '#111111',
            }}
          >
            {tradePanel}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-exports for page layout helpers ─────────────────────── */

/** Wrap page content with consistent padding */
export function PageContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/** Standard page header with title + optional actions */
export function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="font-serif text-2xl font-medium text-off-white leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-off-white/50 mt-1 font-sans">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
