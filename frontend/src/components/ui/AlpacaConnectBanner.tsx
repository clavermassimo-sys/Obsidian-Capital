/* ============================================================
   Obsidian Capital — AlpacaConnectBanner
   Dismissible banner shown on Dashboard when no Alpaca account
   is connected. Prompts users to connect live or paper trading.
   ============================================================ */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, FlaskConical, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────

interface AlpacaConnectBannerProps {
  /** Compact single-line variant for inline use (e.g. trade panel) */
  compact?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────

export function AlpacaConnectBanner({ compact = false, className = '' }: AlpacaConnectBannerProps) {
  const { connectAlpaca, alpacaConnected } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('alpaca_banner_dismissed') === 'true';
  });

  // Don't render if connected or dismissed
  if (alpacaConnected || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('alpaca_banner_dismissed', 'true');
  }

  // ── Compact variant ─────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/5 ${className}`}
      >
        <AlertCircle size={14} className="text-gold shrink-0" />
        <p className="text-xs font-sans text-[#a09a8e] flex-1">
          Connect Alpaca to enable live trading.
        </p>
        <button
          onClick={() => connectAlpaca(true)}
          className="flex items-center gap-1 text-xs font-sans font-semibold text-gold hover:text-[#e0c070] transition-colors whitespace-nowrap"
        >
          Connect <ExternalLink size={11} />
        </button>
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
        aria-label="Connect Alpaca account"
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
                  Connect your Alpaca account to enable live trading
                </h3>
                <p className="text-xs text-off-white/50 leading-relaxed max-w-xl">
                  Obsidian Capital uses Alpaca Securities to execute orders. Connect your account
                  to place trades — or start with paper trading to practice risk-free.
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

            {/* Mode comparison pills */}
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
                  <strong className="text-off-white/80">Paper Mode</strong> — simulated orders,
                  no real money at risk
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
                  <strong className="text-off-white/80">Live Mode</strong> — real orders executed
                  on live markets
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => connectAlpaca(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                           text-obsidian transition-all duration-200
                           hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)',
                  boxShadow: '0 0 20px rgba(201,168,76,0.25)',
                }}
              >
                <Zap size={14} />
                Connect Alpaca Account
              </button>

              <button
                onClick={() => connectAlpaca(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           text-gold border border-gold/30 bg-transparent
                           hover:bg-gold/8 active:scale-[0.98] transition-all duration-200"
              >
                <FlaskConical size={14} />
                Use Paper Trading
              </button>
            </div>

            {/* Regulatory disclaimer */}
            <div className="mt-4 flex items-start gap-2">
              <ShieldCheck size={11} className="text-off-white/25 mt-0.5 flex-shrink-0" />
              <p className="text-2xs text-off-white/30 leading-relaxed">
                Trading executed by Alpaca Securities LLC, member FINRA/SIPC. Obsidian Capital
                is not a registered broker-dealer. Securities trading involves risk of loss.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AlpacaConnectBanner;
