/* ============================================================
   Obsidian Capital — AppLayout
   Main authenticated app shell with ticker, sidebar, content area.
   Mobile: hides sidebar, shows bottom tab nav instead.
   Desktop (md+): shows sidebar as normal.
   ============================================================ */

import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import MarketTicker from './MarketTicker';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import { TradePanel } from '@/components/trading/TradePanel';
import { AnimatePresence, motion } from 'framer-motion';

// ── Constants ─────────────────────────────────────────────────

const TICKER_HEIGHT    = 32; // px — matches h-8
const SIDEBAR_WIDTH    = 240; // px
const TRADE_PANEL_WIDTH = 320; // px

// ── Types ──────────────────────────────────────────────────────

interface ServiceCheck {
  ok: boolean;
  latency?: number;
  detail?: string;
}

interface HealthData {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: Record<string, ServiceCheck>;
}

// ── Health Banner ──────────────────────────────────────────────

function HealthBanner() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health');
        const data: HealthData = await res.json();
        if (data.status === 'degraded') {
          setHealth(data);
        } else {
          setHealth(null);
        }
      } catch {
        // Network error — don't show banner
      }
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  const degraded = Object.entries(health.services).filter(([, s]) => !s.ok);

  return (
    <div className="health-banner px-4 py-2 flex items-center gap-3 text-xs" role="alert">
      <span className="status-dot status-dot-red flex-shrink-0" />
      <span style={{ color: 'rgba(255,59,48,0.90)' }} className="font-medium">
        Service degradation detected:
      </span>
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>
        {degraded.map(([name, s]) => (
          <span key={name} className="mr-3">
            <span style={{ color: '#ff3b30' }}>{name}</span>
            {s.detail ? ` — ${s.detail}` : ''}
          </span>
        ))}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

interface AppLayoutProps {
  /** Optional override: pass a custom trade panel node,
   *  or leave undefined to hide it */
  tradePanel?: React.ReactNode;
}

export default function AppLayout({ tradePanel }: AppLayoutProps) {
  // Mobile trade drawer state
  const [mobileTradePanelOpen, setMobileTradePanelOpen] = useState(false);

  const openMobileTradePanel  = useCallback(() => setMobileTradePanelOpen(true),  []);
  const closeMobileTradePanel = useCallback(() => setMobileTradePanelOpen(false), []);

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{ background: '#000000', colorScheme: 'dark' }}
    >
      {/* ── Health Banner ── appears when services are degraded ─ */}
      <HealthBanner />

      {/* ── Market Ticker ── sticky at very top ────────── */}
      <div
        className="sticky top-0 z-50 w-full flex-shrink-0 hidden md:block"
        style={{ height: `${TICKER_HEIGHT}px` }}
      >
        <MarketTicker />
      </div>

      {/* ── Body row: sidebar + content + trade panel ─── */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ height: `calc(100vh - ${TICKER_HEIGHT}px)` }}
      >
        {/* ── Left Sidebar Navbar ─── hidden on mobile ─── */}
        <div
          className="hidden md:flex flex-shrink-0 sticky top-8 h-[calc(100vh-32px)] overflow-y-auto scrollbar-hidden z-40"
          style={{
            width: `${SIDEBAR_WIDTH}px`,
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Navbar />
        </div>

        {/* ── Main Content Area ────────────────────────── */}
        <main
          className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0"
          style={{
            background: '#000000',
            paddingRight: tradePanel ? `${TRADE_PANEL_WIDTH}px` : '0',
          }}
        >
          {/* Page scroll container */}
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>

        {/* ── Trade Panel ── fixed on right side (desktop only) */}
        {tradePanel && (
          <div
            className="hidden md:flex fixed right-0 flex-shrink-0 overflow-y-auto scrollbar-hidden z-40"
            style={{
              top: `${TICKER_HEIGHT}px`,
              width: `${TRADE_PANEL_WIDTH}px`,
              height: `calc(100vh - ${TICKER_HEIGHT}px)`,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {tradePanel}
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Tab Nav ── only on mobile ─────── */}
      <MobileNav onTradePress={openMobileTradePanel} />

      {/* ── Mobile Trade Drawer ──────────────────────────── */}
      <AnimatePresence>
        {mobileTradePanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-trade-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeMobileTradePanel}
            />

            {/* Slide-up drawer */}
            <motion.div
              key="mobile-trade-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden bottom-sheet z-50 overflow-hidden"
              style={{ height: '90vh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Scrollable panel content */}
              <div className="flex-1 overflow-y-auto h-full">
                <TradePanel onClose={closeMobileTradePanel} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-exports for page layout helpers ─────────────────────── */

/** Wrap page content with consistent padding */
export function PageContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 md:p-6 space-y-4 md:space-y-6 ${className}`}>
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
        <h1 className="font-serif text-xl md:text-2xl font-medium text-off-white leading-tight">{title}</h1>
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
