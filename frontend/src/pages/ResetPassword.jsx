import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import { useUIStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'
import { motion } from 'framer-motion'
import clsx from 'clsx'

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({ label, type, value, onChange, required, rightAction }) {
  const [focused, setFocused] = useState(false)
  const isFloating = focused || value.length > 0

  return (
    <div className="relative mt-4">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          "form-input w-full pt-6 pb-2.5 px-3 block transition-all duration-300 bg-white/40 dark:bg-zinc-950/20 border-slate-200 dark:border-zinc-800",
          focused ? "border-brand-500 ring-2 ring-brand-500/10 shadow-sm" : "border-slate-200 dark:border-zinc-800"
        )}
        placeholder=""
      />
      <label
        className={clsx(
          "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 origin-left text-xs font-semibold select-none",
          isFloating
            ? "text-[10px] text-brand-600 dark:text-brand-400 translate-y-[-18px]"
            : "text-slate-400 dark:text-slate-500"
        )}
      >
        {label}
      </label>
      {rightAction && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex items-center">
          {rightAction}
        </div>
      )}
    </div>
  )
}

// ─── GPU-Accelerated Background Canvas ─────────────────────────────────────────
function NeuralNetworkCanvas({ isDark }) {
  const canvasRef = useRef(null)
  const isDarkRef = useRef(isDark)

  useEffect(() => {
    isDarkRef.current = isDark
  }, [isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let isTabActive = true

    let width = canvas.width = window.innerWidth
    let height = canvas.height = window.innerHeight

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const particleCount = 20
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        radius: Math.random() * 1.1 + 0.8,
        opacity: Math.random() * 0.2 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.006
      })
    }

    const blobs = [
      { x: width * 0.5, y: height * 0.5, tx: Math.random() * 100, ty: Math.random() * 100, radius: 310, color: { r: 59, g: 130, b: 246 } }
    ]

    const darkBg = { r: 9, g: 9, b: 11 }
    const lightBg = { r: 248, g: 250, b: 252 }

    const darkParticle = { r: 0, g: 229, b: 255 }
    const lightParticle = { r: 37, g: 99, b: 235 }

    const darkLine = { r: 0, g: 229, b: 255, a: 0.05 }
    const lightLine = { r: 37, g: 99, b: 235, a: 0.03 }

    const currBg = { ...lightBg }
    const currP = { ...lightParticle }
    const currL = { ...lightLine }

    const draw = () => {
      if (!isTabActive) {
        animationFrameId = requestAnimationFrame(draw)
        return
      }

      const activeIsDark = isDarkRef.current
      const targetBg = activeIsDark ? darkBg : lightBg
      const targetP = activeIsDark ? darkParticle : lightParticle
      const targetL = activeIsDark ? darkLine : lightLine

      currBg.r += (targetBg.r - currBg.r) * 0.05
      currBg.g += (targetBg.g - currBg.g) * 0.05
      currBg.b += (targetBg.b - currBg.b) * 0.05

      currP.r += (targetP.r - currP.r) * 0.05
      currP.g += (targetP.g - currP.g) * 0.05
      currP.b += (targetP.b - currP.b) * 0.05

      currL.r += (targetL.r - currL.r) * 0.05
      currL.g += (targetL.g - currL.g) * 0.05
      currL.b += (targetL.b - currL.b) * 0.05
      currL.a += (targetL.a - currL.a) * 0.05

      ctx.fillStyle = `rgb(${Math.round(currBg.r)}, ${Math.round(currBg.g)}, ${Math.round(currBg.b)})`
      ctx.fillRect(0, 0, width, height)

      blobs.forEach((blob) => {
        blob.tx += 0.0004
        blob.ty += 0.0003
        const scaleX = width * 0.1
        const scaleY = height * 0.1
        blob.x = (width * 0.5) + Math.sin(blob.tx) * scaleX
        blob.y = (height * 0.5) + Math.cos(blob.ty) * scaleY

        const targetColor = activeIsDark ? { r: 0, g: 229, b: 255 } : { r: 99, g: 102, b: 241 }
        blob.color.r += (targetColor.r - blob.color.r) * 0.05
        blob.color.g += (targetColor.g - blob.color.g) * 0.05
        blob.color.b += (targetColor.b - blob.color.b) * 0.05

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
        const opacity = activeIsDark ? 0.03 : 0.015
        grad.addColorStop(0, `rgba(${Math.round(blob.color.r)}, ${Math.round(blob.color.g)}, ${Math.round(blob.color.b)}, ${opacity})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          
          if (dist < 120) {
            const lineAlpha = currL.a * (1 - dist / 120)
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.phase += p.speed

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const pulsedRadius = p.radius + Math.sin(p.phase) * 0.2
        const activeAlpha = p.opacity * currL.a * 3.5

        ctx.beginPath()
        ctx.arc(p.x, p.y, pulsedRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${Math.round(currP.r)}, ${Math.round(currP.g)}, ${Math.round(currP.b)}, ${activeAlpha})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-screen h-screen z-[-1] pointer-events-none" />
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [shakeInputs, setShakeInputs] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !otp || !newPassword) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await authService.resetPassword({ email, otp, new_password: newPassword })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your OTP.')
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-transparent relative">
      <NeuralNetworkCanvas isDark={isDark} />

      <motion.div
        animate={shakeInputs ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md login-card-premium p-10 border border-slate-200/50 dark:border-zinc-800/40 bg-white/72 dark:bg-[rgba(18,18,25,0.82)]"
      >
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Enter your OTP and choose a new password</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald flex items-center justify-center mx-auto">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Password Reset Successful!</h3>
              <p className="text-xs text-slate-500">Redirecting to Sign In...</p>
            </div>
            <div className="pt-2 flex justify-center">
              <Spinner size={16} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <FloatingInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FloatingInput
              label="6-Digit OTP Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />

            <FloatingInput
              label="New Password"
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              rightAction={
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-200 p-1">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <FloatingInput
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-dim/30 border border-rose/20 text-[10px] text-rose font-medium mt-4">
                <AlertCircle size={13} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || otp.length !== 6 || newPassword.length < 8 || !confirmPassword}
              className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
              style={{ transition: 'background-position 0.5s ease' }}
            >
              {loading ? <Spinner size={16} /> : 'Save and Update'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-xs text-slate-500 dark:text-slate-400 font-bold hover:underline">
            ← Cancel and Return
          </a>
        </div>
      </motion.div>
    </div>
  )
}
