/* ============================================================
   Obsidian Capital — OrderConfirmModal (Updated)
   Full order summary with Alpaca disclaimer, extended order info,
   and Reg BI / risk disclosures.
   ============================================================ */

import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2, Building2, Zap } from 'lucide-react';
import type { CommissionTier, OrderSide, ExtendedOrderType, TimeInForce } from '@/types';
import { CommissionCalculator } from './CommissionCalculator';
import { getCommissionBreakdown } from '@/utils/commission';

// ── Types ─────────────────────────────────────────────────────

interface OrderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  ticker: string;
  company: string;
  side: OrderSide;
  shares: number;
  price: number;
  tier: CommissionTier;
  orderType?: ExtendedOrderType;
  timeInForce?: TimeInForce;
  limitPrice?: number;
  stopPrice?: number;
  trailPct?: number;
}

// ── Helpers ───────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function orderTypeLabel(ot: ExtendedOrderType): string {
  const map: Record<ExtendedOrderType, string> = {
    market: 'Market Order',
    limit: 'Limit Order',
    stop: 'Stop Order',
    stop_limit: 'Stop-Limit Order',
    trailing_stop: 'Trailing Stop Order',
  };
  return map[ot] ?? 'Market Order';
}

function tifLabel(tif: TimeInForce): string {
  const map: Record<TimeInForce, string> = {
    day: 'Day',
    gtc: 'Good Till Cancelled',
    ioc: 'Immediate or Cancel',
    fok: 'Fill or Kill',
  };
  return map[tif] ?? 'Day';
}

const TIER_UPGRADE_SAVINGS: Record<CommissionTier, string | null> = {
  standard: 'Upgrade to Member and save 2–3% on every trade.',
  member: 'Upgrade to Private Client for the lowest 5–6% rate.',
  private: null,
};

// ── Component ─────────────────────────────────────────────────

export function OrderConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  ticker,
  company,
  side,
  shares,
  price,
  tier,
  orderType = 'market',
  timeInForce = 'day',
  limitPrice,
  stopPrice,
  trailPct,
}: OrderConfirmModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (!isOpen) setIsLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = shares * price;
  const breakdown = getCommissionBreakdown(subtotal, tier);
  const commissionRate = formatPct(breakdown.rate);
  const isBuy = side === 'buy';
  const sideLabel = isBuy ? 'BUY' : 'SELL';
  const sideColor = isBuy ? '#c9a84c' : '#c0453a';
  const sideBg = isBuy ? 'rgba(201,168,76,0.12)' : 'rgba(192,69,58,0.12)';
  const upgradeTip = TIER_UPGRADE_SAVINGS[tier];

  const displayTotal = isBuy ? breakdown.total : subtotal - breakdown.amount;

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !isLoading) onClose();
  }

  // Estimated price for display
  const estPrice = limitPrice ?? stopPrice ?? price;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-surface-lg animate-slide-up"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="order-modal-title" className="text-lg font-serif font-semibold text-off-white">
            Confirm Order
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-md text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Buy/Sell badge + Ticker ──────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <div
                className="inline-flex items-center px-3 py-1 rounded text-sm font-sans font-bold tracking-widest mb-2"
                style={{ color: sideColor, backgroundColor: sideBg }}
              >
                {sideLabel}
              </div>
              <p className="text-xl font-mono font-bold text-off-white">{ticker}</p>
              <p className="text-sm font-sans text-[#a09a8e] mt-0.5">{company}</p>
            </div>
            <div className="text-right">
              <p className="text-2xs font-sans text-[#6b6560] mb-1">Est. Price</p>
              <p className="text-base font-mono font-semibold text-off-white">{fmt(estPrice)}</p>
            </div>
          </div>

          {/* ── Order Details ────────────────────────────────── */}
          <div className="rounded-lg border border-border bg-surface-2 divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-sans text-[#a09a8e]">Order Type</span>
              <span className="text-xs font-sans font-semibold text-off-white">{orderTypeLabel(orderType)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-sans text-[#a09a8e]">Time In Force</span>
              <span className="text-xs font-sans font-semibold text-off-white">{tifLabel(timeInForce)}</span>
            </div>
            {limitPrice != null && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-sans text-[#a09a8e]">Limit Price</span>
                <span className="text-xs font-mono font-semibold text-off-white">{fmt(limitPrice)}</span>
              </div>
            )}
            {stopPrice != null && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-sans text-[#a09a8e]">Stop Price</span>
                <span className="text-xs font-mono font-semibold text-off-white">{fmt(stopPrice)}</span>
              </div>
            )}
            {trailPct != null && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-sans text-[#a09a8e]">Trail %</span>
                <span className="text-xs font-mono font-semibold text-off-white">{trailPct.toFixed(1)}%</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-sans text-[#a09a8e]">Shares</span>
              <span className="text-xs font-mono font-semibold text-off-white">{shares.toLocaleString()}</span>
            </div>
          </div>

          {/* ── Cost Breakdown ───────────────────────────────── */}
          <div className="rounded-lg border border-border bg-surface-2 divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-sans text-[#a09a8e]">Trade Value</span>
              <span className="text-sm font-mono text-off-white">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-sans text-[#a09a8e]">
                Obsidian Commission ({commissionRate})
              </span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#c9a84c' }}>
                {fmt(breakdown.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-sans font-semibold text-off-white">
                {isBuy ? 'Total Cost' : 'Net Proceeds'}
              </span>
              <span className="text-base font-mono font-bold text-off-white">
                {fmt(displayTotal)}
              </span>
            </div>
          </div>

          {/* ── Upgrade savings box ──────────────────────────── */}
          {upgradeTip && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/5">
              <Zap size={13} className="text-gold shrink-0 mt-0.5" />
              <p className="text-xs font-sans text-[#a09a8e]">
                <span className="text-gold font-semibold">Lower your commission: </span>
                {upgradeTip}
              </p>
            </div>
          )}

          {/* ── Disclosures ──────────────────────────────────── */}
          <div className="rounded-lg border border-border bg-surface-2 p-4 space-y-3">
            {/* Risk disclaimer */}
            <div className="flex items-start gap-2.5">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#c0453a]" />
              <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                <span className="text-[#a09a8e] font-semibold">Risk Disclaimer: </span>
                Investing involves risk. You may lose money. Past performance is not indicative of future results.
              </p>
            </div>

            <div className="border-t border-border" />

            {/* Reg BI */}
            <div className="flex items-start gap-2.5">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#c9a84c]" />
              <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                <span className="text-[#a09a8e] font-semibold">SEC Regulation Best Interest: </span>
                A commission of {commissionRate} is disclosed per Reg BI. This is consistent with your investment
                profile and serves your best interest.
              </p>
            </div>

            <div className="border-t border-border" />

            {/* Alpaca / SIPC */}
            <div className="flex items-start gap-2.5">
              <Building2 size={13} className="mt-0.5 shrink-0 text-[#3d9e6e]" />
              <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                Trading executed by <span className="text-[#a09a8e] font-semibold">Alpaca Securities LLC</span>,
                member FINRA/SIPC. Your account is protected up to{' '}
                <span className="text-[#a09a8e] font-semibold">$500,000</span> by SIPC, including up to $250,000
                for cash claims.
              </p>
            </div>

            <div className="border-t border-border" />

            {/* SIPC shield */}
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#3d9e6e]" />
              <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                Obsidian Capital is not a registered broker-dealer. All brokerage services are provided through Alpaca Securities LLC.
              </p>
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-11 rounded-lg border border-border bg-surface-2 text-sm font-sans font-medium text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 h-11 rounded-lg text-sm font-sans font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: isLoading ? '#1a1a1a' : sideColor,
                color: isBuy ? '#0a0a0a' : '#f0ede8',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Executing…</span>
                </>
              ) : (
                <span>Confirm {sideLabel} →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmModal;
