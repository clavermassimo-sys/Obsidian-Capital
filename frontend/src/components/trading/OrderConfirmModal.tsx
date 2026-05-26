/* ============================================================
   Obsidian Capital — OrderConfirmModal
   Modal dialog shown before executing an order. Displays full
   order summary, commission breakdown, regulatory disclosures,
   and Confirm/Cancel actions.
   ============================================================ */

import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import type { CommissionTier, OrderSide } from '@/types';
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
}

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

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
}: OrderConfirmModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isLoading, onClose]);

  // Reset loading when modal closes
  useEffect(() => {
    if (!isOpen) setIsLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = shares * price;
  const breakdown = getCommissionBreakdown(subtotal, tier);
  const commissionRate = formatPercent(breakdown.rate);

  const isBuy = side === 'buy';
  const sideLabel = isBuy ? 'BUY' : 'SELL';
  const sideColor = isBuy ? '#c9a84c' : '#c0453a';
  const sideBg = isBuy ? 'rgba(201,168,76,0.1)' : 'rgba(192,69,58,0.1)';

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !isLoading) {
      onClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-surface-lg animate-slide-up"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            id="order-modal-title"
            className="text-lg font-serif font-semibold text-off-white"
          >
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

        <div className="px-6 py-5 space-y-5">
          {/* ── Order Summary ────────────────────────────── */}
          <div className="rounded-lg border border-border bg-surface-2 p-4 space-y-3">
            {/* Side badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-semibold uppercase tracking-widest text-[#a09a8e]">
                Order Type
              </span>
              <span
                className="px-3 py-1 rounded text-sm font-sans font-bold tracking-wide"
                style={{ color: sideColor, backgroundColor: sideBg }}
              >
                {sideLabel}
              </span>
            </div>

            {/* Ticker / Company */}
            <div className="flex items-start justify-between">
              <span className="text-xs font-sans text-[#a09a8e]">Security</span>
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-off-white">{ticker}</p>
                <p className="text-xs font-sans text-[#a09a8e]">{company}</p>
              </div>
            </div>

            {/* Shares */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-[#a09a8e]">Shares</span>
              <span className="text-sm font-mono text-off-white">
                {shares.toLocaleString()}
              </span>
            </div>

            {/* Price per share */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-[#a09a8e]">Price per Share</span>
              <span className="text-sm font-mono text-off-white">
                {formatCurrency(price)}
              </span>
            </div>

            {/* Order type */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-[#a09a8e]">Order Execution</span>
              <span className="text-xs font-sans text-[#a09a8e] bg-surface-3 px-2 py-0.5 rounded">
                Market Order
              </span>
            </div>
          </div>

          {/* ── Commission Breakdown ─────────────────────── */}
          <CommissionCalculator
            shares={shares}
            price={price}
            tier={tier}
            side={side}
            compact={false}
          />

          {/* ── Reg BI Disclosure ────────────────────────── */}
          <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#c9a84c]" />
              <div>
                <p className="text-xs font-sans font-semibold text-[#c9a84c] mb-1">
                  SEC Regulation Best Interest Disclosure
                </p>
                <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                  This trade includes a commission of {commissionRate}. Under SEC Regulation Best
                  Interest, we are required to disclose all costs before execution. Our recommendation
                  is based on your investment profile and financial interests.
                </p>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* SIPC Notice */}
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#3d9e6e]" />
              <p className="text-2xs font-sans text-[#6b6560] leading-relaxed">
                Your account is protected up to{' '}
                <span className="text-[#a09a8e] font-semibold">$500,000</span> by the Securities
                Investor Protection Corporation (SIPC), including up to $250,000 for cash claims.
              </p>
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────── */}
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
                backgroundColor: isLoading ? undefined : sideColor,
                color: isBuy ? '#0a0a0a' : '#f0ede8',
                opacity: isLoading ? 0.7 : 1,
                background: isLoading ? '#1a1a1a' : sideColor,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Executing…</span>
                </>
              ) : (
                <span>
                  Confirm {sideLabel}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmModal;
