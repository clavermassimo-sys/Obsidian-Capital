/* ============================================================
   Obsidian Capital — IBKRConnectBanner
   Dismissible banner shown on Dashboard when no IBKR account
   is connected. Prompts users to connect live or paper trading.
   ============================================================ */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, FlaskConical, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────

interface IBKRConnectBannerProps {
  /** Compact single-line variant for inline use (e.g. trade panel) */
  compact?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────

export function IBKRConnectBanner({ compact = false, className = '' }: IBKRConnectBannerProps) {
  const { alpacaConnected } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('ibkr_banner_dismissed') === 'true';
  });

  // Don't render if connected or dismissed
  if (alpacaConnected || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('ibkr_banner_dismissed', 'true');
  }

  // ── Compact variant ─────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/5 ${className}`}
      >
        <AlertCircle size={14} className="text-gold shrink-0" />
        <p className="text-xs font-sans text-[#a09a8e] flex-1">
          Your account is being activated. Trading will be available shortly.
        </p>
      </div>
    );
  }

  // ── Full banner variant ──────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative rounded-xl border border-gold/25 overflow-hidden ${className}`}
        style={{
          background:
            'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.03) 100%)',
        }}
        role="banner"
        aria-label="Brokerage account activation notice"
      >
        {/* Subtle gold glow line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
          }}
        />

        <div className="flex items-start gap-4 p-5">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            <Zap size={18} style={{ color: '#c9a84c' }} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-sans text-sm font-semibold text-off-white leading-tight mb-1">
                  Account Activation In Progress
                </h3>
                <p className="text-xs text-off-white/50 leading-relaxed max-w-xl">
                  Your brokerage account is being activated. This typically takes 1–2 business days.
                  You can browse the platform and set up your watchlist while you wait.
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md
                           text-off-white/30 hover:text-off-white/70 hover:bg-white/5
                           transition-all duration-150"
                aria-label="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>

            {/* Status pills */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-off-white/60"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <FlaskConical size={12} className="text-blue-400/70" />
                <span>
                  <strong className="text-off-white/80">Paper Trading</strong> — available while
                  your account is being reviewed
                </span>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-off-white/60"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Zap size={12} className="text-green-400/70" />
                <span>
                  <strong className="text-off-white/80">Live Trading</strong> — enabled
                  automatically once your account is approved
                </span>
              </div>
            </div>

            {/* Regulatory disclaimer */}
            <div className="mt-4 flex items-start gap-2">
              <ShieldCheck size={11} className="text-off-white/25 mt-0.5 flex-shrink-0" />
              <p className="text-2xs text-off-white/30 leading-relaxed">
                Securities trading provided through our regulated brokerage partner, member FINRA/SIPC.
                Your funds are held in your name in a segregated account.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default IBKRConnectBanner;
