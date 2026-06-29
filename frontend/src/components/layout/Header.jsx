import { Bell, RefreshCw, Sun, Moon } from 'lucide-react'
import { useUIStore } from '@/store'
import { FilterBar } from '@/components/shared/FilterBar'
import clsx from 'clsx'

export function Header({ title, subtitle, showFilters = true }) {
  const { theme, setTheme, activeNotifications, dismissNotification } = useUIStore()

  return (
    <header className="shrink-0 border-b border-subtle bg-surface-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Page title */}
        <div>
          <h1 className="text-sm font-semibold text-slate-100">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-dim/30 border border-emerald/20">
            <span className="status-dot bg-emerald animate-pulse-slow" />
            <span className="text-[10px] font-medium text-emerald">Live</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-ghost p-1.5"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button className="btn-ghost p-1.5">
              <Bell size={15} />
              {activeNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar row */}
      {showFilters && (
        <div className="px-6 pb-3">
          <FilterBar />
        </div>
      )}
    </header>
  )
}
