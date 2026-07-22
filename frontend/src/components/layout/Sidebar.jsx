import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Search, AlertTriangle,
  FlaskConical, GitCompare, Settings, ChevronLeft,
  ChevronRight, Cpu, LogOut
} from 'lucide-react'
import clsx from 'clsx'
import { useUIStore, useAuthStore } from '@/store'

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Overview',         end: true },
  { to: '/analytics',  icon: Activity,        label: 'Analytics' },
  { to: '/traces',     icon: Search,          label: 'Trace Explorer' },
  { to: '/alerts',     icon: AlertTriangle,   label: 'Regression Alerts' },
  { to: '/evaluation', icon: FlaskConical,    label: 'Hallucination' },
  { to: '/models',     icon: GitCompare,      label: 'Model Comparison' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-slate-50 border-r border-slate-200 dark:bg-surface-800 dark:border-white/[0.06]',
        'transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
        <img
          src="/Project_logo.png"
          className="w-8 h-8 object-contain rounded-md"
          alt="Project Logo"
        />
        {!sidebarCollapsed && (
          <div className="overflow-hidden leading-tight">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate uppercase tracking-wider">Observe</p>
            <p className="text-[9px] text-slate-500 font-semibold truncate">Cost & Performance</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active')
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={16} className="shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-200 dark:border-white/[0.06] p-2 space-y-1">
        {/* User */}
        {user && !sidebarCollapsed && (
          <div className="px-3 py-2 rounded-lg flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.04]">
            <div className="w-6 h-6 rounded-full bg-brand-600/50 flex items-center justify-center text-[10px] font-bold text-brand-700 dark:text-brand-300 shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user?.name}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="nav-item w-full"
          title={sidebarCollapsed ? 'Sign out' : undefined}
        >
          <LogOut size={14} className="shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="nav-item w-full justify-center"
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span className="text-xs">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
