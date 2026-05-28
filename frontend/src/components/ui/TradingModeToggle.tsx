/* ============================================================
   Obsidian Capital — TradingModeToggle
   Paper / Live mode toggle. Shown in Navbar and TradePanel.
   Switching to LIVE shows a confirmation modal.
   Mode persisted to localStorage as 'ibkr_mode'.
   ============================================================ */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Zap, AlertTriangle, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

export type TradingMode = 'paper' | 'live';

const STORAGE_KEY = 'ibkr_mode';

// ── Hook ──────────────────────────────────────────────────────

/**
 * Shared hook to read / write the current trading mode.
 * Syncs with localStorage so Navbar and TradePanel stay in sync.
 */
export function useTradingMode(): {
  mode: TradingMode;
  setMode: (mode: TradingMode) => void;
} {
  const [mode, setModeState] = useState<TradingMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'live' ? 'live' : 'paper';
  });

  const setMode = useCallback((next: TradingMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Dispatch storage event so other instances update
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }));
  }, []);

  // Listen for changes from other component instances
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && (e.newValue === 'live' || e.newValue === 'paper')) {
        setModeState(e.newValue as TradingMode);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { mode, setMode };
}

// ── Warning Modal ─────────────────────────────────────────────

interface LiveWarningModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function LiveWarningModal({ onConfirm, onCancel }: LiveWarningModalProps) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
          aria-hidden="true"
        />

        {/* Dialog */}
        <motion.div
          className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border overflow-hidden"
          style={{ background: '#161616' }}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-modal-title"
        >
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center
                       rounded-md text-off-white/30 hover:text-off-white/70 hover:bg-white/5
                       transition-all duration-150 z-10"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>

          <div className="p-6">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <AlertTriangle size={22} className="text-red-400" />
            </div>

            {/* Title */}
            <h2
              id="live-modal-title"
              className="font-serif text-xl font-medium text-off-white mb-2"
            >
              Switch to Live Trading?
            </h2>

            {/* Body */}
            <p className="text-sm text-off-white/60 leading-relaxed mb-1">
              Live trading uses{' '}
              <strong className="text-off-white/80">real money</strong> from your connected
              Interactive Brokers account. Orders placed in Live mode will be executed on real markets.
            </p>
            <p className="text-sm text-off-white/50 leading-relaxed mb-6">
              Are you sure you want to switch from Paper to Live mode?
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                           text-sm font-semibold text-white
                           bg-red-500/80 hover:bg-red-500 border border-red-500/40
                           transition-all duration-200 active:scale-[0.98]"
              >
                <Zap size={14} />
                Yes, Switch to Live
              </button>
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg
                           text-sm font-medium text-off-white/70
                           border border-border hover:bg-white/5 hover:text-off-white
                           transition-all duration-200 active:scale-[0.98]"
              >
                Stay in Paper
              </button>
            </div>

            {/* Fine print */}
            <p className="mt-4 text-2xs text-off-white/25 text-center leading-relaxed">
              Trading executed by Interactive Brokers LLC, member FINRA/SIPC.
              You can switch back to Paper mode at any time.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── TradingModeToggle Component ───────────────────────────────

interface TradingModeToggleProps {
  /** Compact = icon-only pill; full = label + pill */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function TradingModeToggle({
  variant = 'full',
  className = '',
}: TradingModeToggleProps) {
  const { mode, setMode } = useTradingMode();
  const [showLiveWarning, setShowLiveWarning] = useState(false);

  function handleToggle() {
    if (mode === 'paper') {
      // Switching to live: show confirmation first
      setShowLiveWarning(true);
    } else {
      // Switching back to paper: no confirmation needed
      setMode('paper');
    }
  }

  function handleConfirmLive() {
    setShowLiveWarning(false);
    setMode('live');
  }

  function handleCancelLive() {
    setShowLiveWarning(false);
  }

  const isPaper = mode === 'paper';

  return (
    <>
      {showLiveWarning && (
        <LiveWarningModal onConfirm={handleConfirmLive} onCancel={handleCancelLive} />
      )}

      <div className={`flex items-center gap-2 ${className}`}>
        {variant === 'full' && (
          <span className="text-xs text-off-white/40 font-sans select-none">Mode</span>
        )}

        <button
          onClick={handleToggle}
          className="relative flex items-center rounded-full transition-all duration-300
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          style={{
            padding: '3px',
            background: isPaper
              ? 'rgba(96,165,250,0.12)'
              : 'rgba(34,197,94,0.12)',
            border: isPaper
              ? '1px solid rgba(96,165,250,0.25)'
              : '1px solid rgba(34,197,94,0.25)',
          }}
          aria-label={`Trading mode: ${isPaper ? 'Paper' : 'Live'}. Click to switch.`}
          title={isPaper ? 'Switch to Live Trading' : 'Switch to Paper Trading'}
        >
          {/* Track */}
          <span
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              color: isPaper ? 'rgba(96,165,250,0.9)' : 'rgba(34,197,94,0.9)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em',
            }}
          >
            {isPaper ? (
              <>
                <FlaskConical size={11} />
                {variant === 'full' && <span>PAPER</span>}
              </>
            ) : (
              <>
                <Zap size={11} />
                {variant === 'full' && <span>LIVE</span>}
              </>
            )}
          </span>
        </button>
      </div>
    </>
  );
}
