import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Cpu, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !otp || !newPassword) return
    setLoading(true)
    setError(null)
    try {
      await authService.resetPassword({ email, otp, new_password: newPassword })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your OTP.')
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
          <h1 className="text-xl font-semibold text-slate-100">Set New Password</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your OTP and choose a new password</p>
        </div>

        <div className="card p-6">
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-dim/30 border border-emerald/20 text-xs text-emerald-400">
                <CheckCircle size={13} className="shrink-0" />
                Password reset successful! You can now sign in.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center h-10"
              >
                Go to Sign In
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

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="form-input w-full font-mono text-center tracking-widest text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className="form-input w-full"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-dim/30 border border-rose/20 text-xs text-rose text-left">
                  <AlertCircle size={13} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || otp.length !== 6 || newPassword.length < 8}
                className="btn-primary w-full justify-center h-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner size={16} /> : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <a href="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              ← Cancel and Return
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
