import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  Receipt,
  Shield,
  LogOut,
  User,
} from 'lucide-react'
import { clearAdminToken } from '../services/api'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/trades', label: 'Trades', icon: TrendingUp, end: false },
  { to: '/admin/revenue', label: 'Revenue', icon: DollarSign, end: false },
  { to: '/admin/commissions', label: 'Commissions', icon: Receipt, end: false },
  { to: '/admin/compliance', label: 'Compliance', icon: Shield, end: false },
]

export default function AdminSidebar() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside
      className="flex flex-col h-full bg-surface border-r border-border"
      style={{ width: '240px', minWidth: '240px' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center py-8 px-6 border-b border-border">
        <div className="mb-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="24,2 43,13 43,35 24,46 5,35 5,13" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
            <polygon points="24,9 38,17 38,31 24,39 10,31 10,17" stroke="#c9a84c" strokeWidth="1" fill="#c9a84c" fillOpacity="0.08" />
            <polygon points="24,16 31,24 24,32 17,24" fill="#c9a84c" fillOpacity="0.7" />
            <circle cx="24" cy="24" r="2.5" fill="#c9a84c" />
          </svg>
        </div>
        <div className="text-center">
          <div className="font-serif text-sm font-semibold tracking-[0.15em] text-off-white uppercase" style={{ letterSpacing: '0.12em' }}>
            Obsidian Capital
          </div>
          <div className="text-xs font-medium tracking-widest mt-0.5" style={{ color: '#c9a84c', letterSpacing: '0.18em' }}>
            ADMIN PORTAL
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-surface-2 text-gold border-l-2 border-gold pl-[14px]'
                  : 'text-off-white/60 hover:text-off-white hover:bg-surface-2 border-l-2 border-transparent',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-gold' : 'text-off-white/50'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-5 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center">
            <User size={14} className="text-gold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-off-white">Admin</div>
            <div className="text-xs text-off-white/40">Authenticated</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-off-white/50 hover:text-loss hover:bg-surface-2 transition-colors duration-150"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
