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
        'flex flex-col h-full bg-surface-800 border-r border-subtle',
        'transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-subtle shrink-0">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <Cpu size={14} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-100 truncate">LLM Observe</p>
            <p className="text-[10px] text-slate-500">Observability Pipeline</p>
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
      <div className="border-t border-subtle p-2 space-y-1">
        {/* User */}
        {user && !sidebarCollapsed && (
          <div className="px-3 py-2 rounded-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-600/50 flex items-center justify-center text-[10px] font-bold text-brand-300 shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
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
