import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subDays, format } from 'date-fns'

// ─── Filter Store ────────────────────────────────────────────────────────────
export const useFilterStore = create((set, get) => ({
  selectedModels: [],            // [] = all models
  startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  availableModels: [],

  setModels: (models) => set({ selectedModels: models }),
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  setAvailableModels: (models) => set({ availableModels: models }),
  resetFilters: () => set({
    selectedModels: [],
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  }),

  // Computed: query params object to spread into API calls
  get queryParams() {
    const s = get()
    return {
      ...(s.selectedModels.length ? { model: s.selectedModels } : {}),
      start_date: s.startDate,
      end_date: s.endDate,
    }
  },
}))

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
