import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-glow-brand flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Cpu size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1">Get an OTP to reset your password</p>
        </div>

        <div className="card p-6">
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-dim/30 border border-emerald/20 text-xs text-emerald-400">
                <CheckCircle size={13} className="shrink-0" />
                If the email is registered, a 6-digit OTP has been sent.
              </div>
              <button
                onClick={() => navigate('/reset-password', { state: { email } })}
                className="btn-primary w-full justify-center h-10"
              >
                Go to Enter OTP
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
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

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-dim/30 border border-rose/20 text-xs text-rose">
                  <AlertCircle size={13} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full justify-center h-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner size={16} /> : 'Send OTP'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <a href="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              ← Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
