import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, useFilterStore, useUIStore } from '@/store'
import { modelsService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const Overview       = lazy(() => import('@/pages/Overview'))
const Analytics      = lazy(() => import('@/pages/Analytics'))
const TraceExplorer  = lazy(() => import('@/pages/TraceExplorer'))
const Alerts         = lazy(() => import('@/pages/Alerts'))
const Evaluation     = lazy(() => import('@/pages/Evaluation'))
const ModelComparison = lazy(() => import('@/pages/ModelComparison'))
const Settings       = lazy(() => import('@/pages/Settings'))
const Login          = lazy(() => import('@/pages/Login'))
const Signup         = lazy(() => import('@/pages/Signup'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword  = lazy(() => import('@/pages/ResetPassword'))

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

// ─── Page Loader ─────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-surface-900">
      <Spinner size={24} />
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated } = useAuthStore()
  const { setAvailableModels } = useFilterStore()
  const { theme } = useUIStore()

  // Apply theme class to HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Bootstrap: fetch available model list once
  useEffect(() => {
    if (!isAuthenticated) return
    
    // load initial models from cache if present to speed up filter rendering
    try {
      const cached = localStorage.getItem('costlense_cache_models_list')
      if (cached) {
        setAvailableModels(JSON.parse(cached))
      }
    } catch (e) {
      console.warn(e)
    }

    modelsService.getModels()
      .then((res) => {
        const list = res?.map?.((m) => m.model || m) ?? []
        setAvailableModels(list)
        try {
          localStorage.setItem('costlense_cache_models_list', JSON.stringify(list))
        } catch (e) {
          console.warn(e)
        }
      })
      .catch(() => {
        // fallback to defaults if cache is empty
        setAvailableModels((curr) => curr.length > 0 ? curr : ['mistral', 'gpt-4o-mini', 'llama3'])
      })
  }, [isAuthenticated, setAvailableModels])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/" element={<RequireAuth><Overview /></RequireAuth>} />
        <Route path="/analytics"  element={<RequireAuth><Analytics /></RequireAuth>} />
        <Route path="/traces"     element={<RequireAuth><TraceExplorer /></RequireAuth>} />
        <Route path="/alerts"     element={<RequireAuth><Alerts /></RequireAuth>} />
        <Route path="/evaluation" element={<RequireAuth><Evaluation /></RequireAuth>} />
        <Route path="/models"     element={<RequireAuth><ModelComparison /></RequireAuth>} />
        <Route path="/settings"   element={<RequireAuth><Settings /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
