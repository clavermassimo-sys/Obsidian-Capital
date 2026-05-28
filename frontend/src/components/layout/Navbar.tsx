/* ============================================================
   Obsidian Capital — Navbar (Left Sidebar)
   ============================================================ */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  CandlestickChart,
  ClipboardList,
  SlidersHorizontal,
  Lock,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import TierBadge from '@/components/ui/TierBadge';
import { useAuth } from '@/contexts/AuthContext';

// ── Logo SVG ──────────────────────────────────────────────────

function ObsidianLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Obsidian Capital Logo"
    >
      {/* Outer hexagon */}
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="1.5"
      />
      {/* Inner gem facets */}
      <polygon
        points="20,7 32,14 32,26 20,33 8,26 8,14"
        fill="rgba(201,168,76,0.08)"
        stroke="#c9a84c"
        strokeWidth="0.75"
      />
      {/* Top facet */}
      <polygon
        points="20,7 28,14 20,18 12,14"
        fill="rgba(201,168,76,0.15)"
        stroke="none"
      />
      {/* Bottom facet */}
      <polygon
        points="20,33 28,26 20,22 12,26"
        fill="rgba(201,168,76,0.06)"
        stroke="none"
      />
      {/* Left facet */}
      <polygon
        points="8,14 20,18 20,22 8,26"
        fill="rgba(201,168,76,0.10)"
        stroke="none"
      />
      {/* Right facet */}
      <polygon
        points="32,14 20,18 20,22 32,26"
        fill="rgba(201,168,76,0.12)"
        stroke="none"
      />
      {/* Center divider lines */}
      <line x1="20" y1="7" x2="20" y2="18" stroke="#c9a84c" strokeWidth="0.5" opacity="0.6" />
      <line x1="20" y1="22" x2="20" y2="33" stroke="#c9a84c" strokeWidth="0.5" opacity="0.4" />
      <line x1="8" y1="14" x2="20" y2="18" stroke="#c9a84c" strokeWidth="0.5" opacity="0.5" />
      <line x1="32" y1="14" x2="20" y2="18" stroke="#c9a84c" strokeWidth="0.5" opacity="0.5" />
      <line x1="8" y1="26" x2="20" y2="22" stroke="#c9a84c" strokeWidth="0.5" opacity="0.4" />
      <line x1="32" y1="26" x2="20" y2="22" stroke="#c9a84c" strokeWidth="0.5" opacity="0.4" />
      {/* Center gem point */}
      <circle cx="20" cy="20" r="1.5" fill="#c9a84c" />
    </svg>
  );
}

// ── Nav Items Config ──────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard   },
  { label: 'Markets',    path: '/markets',    icon: BarChart2          },
  { label: 'Charts',     path: '/charts',     icon: CandlestickChart   },
  { label: 'Orders',     path: '/orders',     icon: ClipboardList      },
  { label: 'Screener',   path: '/screener',   icon: SlidersHorizontal  },
  { label: 'Private',    path: '/private',    icon: Lock               },
  { label: 'Settings',   path: '/settings',   icon: Settings           },
];

// ── NavItem Component ─────────────────────────────────────────

function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-sm font-medium
         transition-all duration-200 select-none
         ${isActive
           ? 'bg-gold/10 text-gold border border-gold/20 shadow-[0_0_16px_rgba(201,168,76,0.08)]'
           : 'text-off-white/50 hover:text-off-white hover:bg-surface-3 border border-transparent'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active left indicator */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold rounded-r-full" />
          )}

          <Icon
            size={17}
            className={`flex-shrink-0 transition-colors duration-200
              ${isActive ? 'text-gold' : 'text-off-white/40 group-hover:text-off-white/70'}`
            }
          />

          <span className="flex-1 tracking-wide">{item.label}</span>

          {isActive && (
            <ChevronRight size={13} className="text-gold/50 flex-shrink-0" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'OC';

  return (
    <aside
      className="flex flex-col h-full w-full"
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#111111',
        borderRight: '1px solid #2a2a2a',
      }}
      aria-label="Sidebar navigation"
    >
      {/* ── Logo / Brand ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border flex-shrink-0">
        <ObsidianLogo size={36} />
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className="text-xs font-bold tracking-[0.2em] text-gold uppercase"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            OBSIDIAN
          </span>
          <span
            className="text-xs font-bold tracking-[0.18em] text-off-white/70 uppercase"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            CAPITAL
          </span>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-hidden">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="mx-4 h-px bg-border flex-shrink-0" />

      {/* ── User Profile ──────────────────────────────────── */}
      <div className="px-3 py-4 flex-shrink-0 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-surface-2 border border-border">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-obsidian"
              style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96e 100%)' }}
            >
              {initials}
            </div>

            {/* Name + Tier */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-off-white truncate leading-tight">
                {user.name}
              </p>
              <div className="mt-0.5">
                <TierBadge tier={user.tier} size="sm" showIcon={false} />
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium
                     text-off-white/40 hover:text-loss hover:bg-loss/5 hover:border-loss/10
                     border border-transparent transition-all duration-200 select-none"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
