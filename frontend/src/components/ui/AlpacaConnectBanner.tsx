/* ============================================================
   Obsidian Capital — AlpacaConnectBanner
   Inline banner shown when Alpaca is not connected.
   ============================================================ */

import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AlpacaConnectBannerProps {
  compact?: boolean;
  className?: string;
}

export function AlpacaConnectBanner({ compact = false, className = '' }: AlpacaConnectBannerProps) {
  const { connectAlpaca } = useAuth();

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

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/5 ${className}`}
    >
      <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-sans font-semibold text-off-white">
          Alpaca account not connected
        </p>
        <p className="text-xs font-sans text-[#a09a8e] mt-0.5">
          Connect your Alpaca brokerage account to place live trades through Obsidian Capital.
        </p>
      </div>
      <button
        onClick={() => connectAlpaca(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#c9a84c]/40 bg-[#c9a84c]/10 text-xs font-sans font-semibold text-gold hover:bg-[#c9a84c]/20 transition-colors whitespace-nowrap shrink-0"
      >
        Connect Alpaca <ExternalLink size={11} />
      </button>
    </div>
  );
}

export default AlpacaConnectBanner;
