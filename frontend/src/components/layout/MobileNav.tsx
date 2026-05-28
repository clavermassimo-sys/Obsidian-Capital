/* ============================================================
   Obsidian Capital — MobileNav (Bottom Tab Bar)
   Fixed bottom navigation for mobile screens only.
   Hidden on md+ (desktop/tablet).
   ============================================================ */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  ClipboardList,
  Settings,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

interface MobileNavProps {
  /** Called when the Trade tab is tapped — parent opens the trade drawer */
  onTradePress?: () => void;
}

// ── Tab Config ────────────────────────────────────────────────

const TABS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Markets',   path: '/markets',   icon: TrendingUp       },
  { label: 'Orders',    path: '/orders',    icon: ClipboardList    },
  { label: 'Settings',  path: '/settings',  icon: Settings         },
] as const;

// ── Component ─────────────────────────────────────────────────

export default function MobileNav({ onTradePress }: MobileNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16
                 bg-surface border-t border-border
                 flex items-center justify-around px-2
                 safe-area-inset-bottom"
      aria-label="Mobile bottom navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Dashboard tab */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `tap-target flex flex-col items-center justify-center gap-0.5 flex-1
           text-[10px] font-medium tracking-wide transition-colors duration-150
           ${isActive ? 'text-gold' : 'text-off-white/50'}`
        }
      >
        {({ isActive }) => (
          <>
            <LayoutDashboard size={20} className={isActive ? 'text-gold' : 'text-off-white/50'} />
            <span>Dashboard</span>
          </>
        )}
      </NavLink>

      {/* Markets tab */}
      <NavLink
        to="/markets"
        className={({ isActive }) =>
          `tap-target flex flex-col items-center justify-center gap-0.5 flex-1
           text-[10px] font-medium tracking-wide transition-colors duration-150
           ${isActive ? 'text-gold' : 'text-off-white/50'}`
        }
      >
        {({ isActive }) => (
          <>
            <TrendingUp size={20} className={isActive ? 'text-gold' : 'text-off-white/50'} />
            <span>Markets</span>
          </>
        )}
      </NavLink>

      {/* Trade — center elevated button */}
      <button
        onClick={onTradePress}
        className="tap-target flex flex-col items-center justify-center gap-0.5 flex-1
                   text-[10px] font-medium tracking-wide transition-all duration-150"
        aria-label="Open trade panel"
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center
                     bg-gold shadow-gold-md active:scale-95 transition-transform duration-150"
          style={{ marginBottom: '2px' }}
        >
          <ArrowLeftRight size={18} className="text-obsidian" />
        </span>
        <span className="text-gold -mt-1">Trade</span>
      </button>

      {/* Orders tab */}
      <NavLink
        to="/orders"
        className={({ isActive }) =>
          `tap-target flex flex-col items-center justify-center gap-0.5 flex-1
           text-[10px] font-medium tracking-wide transition-colors duration-150
           ${isActive ? 'text-gold' : 'text-off-white/50'}`
        }
      >
        {({ isActive }) => (
          <>
            <ClipboardList size={20} className={isActive ? 'text-gold' : 'text-off-white/50'} />
            <span>Orders</span>
          </>
        )}
      </NavLink>

      {/* Settings tab */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `tap-target flex flex-col items-center justify-center gap-0.5 flex-1
           text-[10px] font-medium tracking-wide transition-colors duration-150
           ${isActive ? 'text-gold' : 'text-off-white/50'}`
        }
      >
        {({ isActive }) => (
          <>
            <Settings size={20} className={isActive ? 'text-gold' : 'text-off-white/50'} />
            <span>Settings</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
