import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subDays, format } from 'date-fns'

// ─── Filter Store ────────────────────────────────────────────────────────────
export const useFilterStore = create((set, get) => {
  const setWithGetter = (update) => {
    set((state) => {
      const nextState = typeof update === 'function' ? update(state) : update
      const merged = { ...state, ...nextState }
      Object.defineProperty(merged, 'queryParams', {
        get() {
          return {
            ...(merged.selectedModels.length ? { model: merged.selectedModels } : {}),
            start_date: merged.startDate,
            end_date: merged.endDate,
          }
        },
        enumerable: true,
        configurable: true,
      })
      return merged
    })
  }

  const initialState = {
    selectedModels: [],            // [] = all models
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    availableModels: [],

    setModels: (models) => setWithGetter({ selectedModels: models }),
    setDateRange: (start, end) => setWithGetter({ startDate: start, endDate: end }),
    setAvailableModels: (models) => setWithGetter({ availableModels: models }),
    resetFilters: () => setWithGetter({
      selectedModels: [],
      startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    }),
  }

  Object.defineProperty(initialState, 'queryParams', {
    get() {
      return {
        ...(initialState.selectedModels.length ? { model: initialState.selectedModels } : {}),
        start_date: initialState.startDate,
        end_date: initialState.endDate,
      }
    },
    enumerable: true,
    configurable: true,
  })

  return initialState
})

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,

      login: (user, token) => set({ user, token, isAuthenticated: true, isGuest: false }),
      loginAsGuest: () => set({
        user: { id: 'guest-user', email: 'guest@costlense.ai', name: 'Guest User' },
        token: 'guest-jwt-mock-token',
        isAuthenticated: true,
        isGuest: true,
      }),
      logout: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false, isGuest: false })
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated, isGuest: s.isGuest }),
    }
  )
)

// ─── UI Store ─────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => {
  const initialTheme = localStorage.getItem('theme') || 'dark'
  const initialSidebar = localStorage.getItem('sidebar_collapsed') === 'true'

  return {
    sidebarCollapsed: initialSidebar,
    theme: initialTheme,
    notifications: [],
    authModalOpen: false,

    setAuthModalOpen: (open) => set({ authModalOpen: open }),

    toggleSidebar: () =>
      set((s) => {
        const next = !s.sidebarCollapsed
        localStorage.setItem('sidebar_collapsed', String(next))
        return { sidebarCollapsed: next }
      }),

    setTheme: (newTheme) =>
      set(() => {
        localStorage.setItem('theme', newTheme)
        return { theme: newTheme }
      }),

    addNotification: (n) =>
      set((s) => {
        const newNotif = {
          id: Date.now() + Math.random(),
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          timestamp: new Date().toISOString(),
          read: false,
        }
        return { notifications: [newNotif, ...s.notifications].slice(0, 30) }
      }),

    markAsRead: (id) =>
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

    markAllAsRead: () =>
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      })),

    clearAllNotifications: () => set({ notifications: [] }),
  }
})
