import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Search, AlertTriangle,
  FlaskConical, GitCompare, Settings, ChevronLeft,
  ChevronRight, LogOut
} from 'lucide-react'
import clsx from 'clsx'
import { useUIStore, useAuthStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'

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
        'flex flex-col h-full sidebar-theme border-r shrink-0',
        'transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3.5 h-14 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
        <motion.img
          src="/Project_logo.png"
          className="w-8 h-8 object-contain rounded-md"
          alt="Project Logo"
          whileHover={{ scale: 1.08, rotate: 2, filter: 'drop-shadow(0 0 8px rgba(100,112,243,0.4))' }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{
            animate: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
            whileHover: { type: 'spring', stiffness: 400, damping: 10 }
          }}
        />
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden leading-tight"
          >
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate uppercase tracking-wider">Observe</p>
            <p className="text-[9px] text-slate-500 font-semibold truncate">Cost & Performance</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 relative">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'nav-item relative z-10 transition-colors duration-150',
                isActive ? 'text-brand-600 dark:text-brand-300 font-semibold' : 'text-slate-500 dark:text-slate-400'
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveBackground"
                    className="absolute inset-0 bg-brand-500/10 dark:bg-brand-500/15 border-l-2 border-brand-500 rounded-r-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.div whileHover={{ scale: 1.08 }} className="shrink-0">
                  <Icon size={16} />
                </motion.div>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="truncate ml-1"
                  >
                    {label}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-200 dark:border-white/[0.06] p-2 space-y-1">
        {/* User */}
        {user && !sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 rounded-lg flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.04]"
          >
            <div className="w-6 h-6 rounded-full bg-brand-600/50 flex items-center justify-center text-[10px] font-bold text-brand-700 dark:text-brand-300 shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user?.name}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </motion.div>
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
