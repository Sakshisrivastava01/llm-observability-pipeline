import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    try {
      const res = await authService.login({ email, password })
      login(res.user, res.access_token)
      localStorage.setItem('auth_token', res.access_token)
      useUIStore.getState().addNotification({
        title: 'Login Success',
        message: `Welcome back, ${res.user.name || 'User'}!`,
        type: 'success',
      })
      navigate('/')
    } catch (err) {
      const errMsg = err.message || 'Invalid credentials'
      setError(errMsg)
      useUIStore.getState().addNotification({
        title: 'Login Failure',
        message: errMsg,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-surface-900 bg-glow-brand flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/Project_logo.png"
            className="w-12 h-12 object-contain mx-auto mb-4"
            alt="Project Logo"
          />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Observe</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your dashboard</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="form-input w-full pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end text-xs">
              <a href="/forgot-password" className="text-brand-600 dark:text-brand-400 hover:underline transition-colors">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-dim/30 border border-rose/20 text-xs text-rose">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full justify-center h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size={16} /> : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          Observability Pipeline · Built with FastAPI + Supabase
        </p>
      </div>
    </div>
  )
}
