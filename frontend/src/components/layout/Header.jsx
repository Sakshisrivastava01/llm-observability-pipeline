import { useState, useEffect } from 'react'
import { Bell, Sun, Moon, X, User, Settings as SettingsIcon, LogOut, Info, ShieldAlert, Check } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'
import { FilterBar } from '@/components/shared/FilterBar'
import apiClient from '@/api/client'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

export function Header({ title, subtitle, showFilters = true }) {
  const {
    theme,
    setTheme,
    notifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
  } = useUIStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [healthStatus, setHealthStatus] = useState('connecting')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // ─── Live health status polling ───────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/health')
        if (res?.status === 'healthy') {
          if (isMounted) setHealthStatus('live')
        } else {
          if (isMounted) setHealthStatus('connecting')
        }
      } catch (err) {
        if (isMounted) setHealthStatus('offline')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="shrink-0 border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-surface-800/50 backdrop-blur-sm relative z-30 transition-colors duration-200">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Page title */}
        <div>
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300",
            healthStatus === 'live' ? "bg-emerald-dim/30 border-emerald/20 text-emerald"
            : healthStatus === 'connecting' ? "bg-amber-dim/30 border-amber/20 text-amber"
            : "bg-rose-dim/30 border-rose/20 text-rose"
          )}>
            <span className={clsx(
              "status-dot",
              healthStatus === 'live' ? "bg-emerald animate-pulse-slow"
              : healthStatus === 'connecting' ? "bg-amber animate-bounce"
              : "bg-rose"
            )} />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              {healthStatus === 'live' ? 'Live'
               : healthStatus === 'connecting' ? 'Connecting...'
               : 'Offline'}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-ghost p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-ghost p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 relative"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose border border-white dark:border-surface-800" />
              )}
            </button>
          </div>

          {/* User Profile Avatar Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-500 transition-colors flex items-center justify-center text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                aria-label="User profile menu"
              >
                {user.name?.[0]?.toUpperCase() || 'U'}
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl card bg-white dark:bg-surface-700 shadow-lg border border-slate-200 dark:border-white/[0.08] py-1 z-50 animate-slide-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.04]">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        navigate('/settings')
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors duration-150"
                    >
                      <User size={13} />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        navigate('/settings')
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors duration-150"
                    >
                      <SettingsIcon size={13} />
                      <span>Settings</span>
                    </button>
                    <hr className="border-slate-100 dark:border-white/[0.04] my-1" />
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose hover:bg-slate-100 dark:hover:bg-white/5 text-left font-semibold transition-colors duration-150"
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar row */}
      {showFilters && (
        <div className="px-6 pb-3">
          <FilterBar />
        </div>
      )}

      {/* Notification Drawer overlay and drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white dark:bg-surface-800 border-l border-slate-200 dark:border-white/[0.06] shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out translate-x-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-800 dark:text-slate-100" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose text-[9px] font-bold text-white leading-none">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-brand-600 dark:text-brand-300 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                  <Bell size={24} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold animate-pulse">No notifications</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">System events and observability alert logs will display here.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={clsx(
                      'p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 relative overflow-hidden',
                      n.read
                        ? 'bg-slate-50/50 border-slate-200 dark:bg-surface-700/30 dark:border-white/[0.04]'
                        : 'bg-white border-slate-300 shadow-sm dark:bg-surface-700/60 dark:border-brand-500/20'
                    )}
                  >
                    {!n.read && (
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-brand-500 rounded-bl-lg" />
                    )}
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'success' && (
                          <div className="p-1 rounded-full bg-emerald-dim/40 border border-emerald/20 text-emerald">
                            <span className="w-2.5 h-2.5 flex items-center justify-center font-bold text-[9px]">✓</span>
                          </div>
                        )}
                        {n.type === 'error' && (
                          <div className="p-1 rounded-full bg-rose-dim/40 border border-rose/20 text-rose">
                            <span className="w-2.5 h-2.5 flex items-center justify-center font-bold text-[9px]">⚠️</span>
                          </div>
                        )}
                        {n.type === 'info' && (
                          <div className="p-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 flex items-center justify-center font-bold text-[9px]">ℹ️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-surface-900/30 text-center">
                <button
                  onClick={clearAllNotifications}
                  className="text-[10px] text-rose font-bold hover:underline"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  )
}
