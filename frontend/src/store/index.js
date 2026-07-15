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

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)

// ─── UI Store ─────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  theme: 'dark',
  activeNotifications: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  addNotification: (n) =>
    set((s) => ({ activeNotifications: [{ ...n, id: Date.now() }, ...s.activeNotifications].slice(0, 5) })),
  dismissNotification: (id) =>
    set((s) => ({ activeNotifications: s.activeNotifications.filter((n) => n.id !== id) })),
}))
