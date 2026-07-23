import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, Cpu, ShieldCheck } from 'lucide-react'
import { useUIStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({ label, type, value, onChange, required, rightAction, error }) {
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
          focused ? "border-brand-500 ring-2 ring-brand-500/10 shadow-sm" : "border-slate-200 dark:border-zinc-800",
          error ? "border-rose-500 ring-2 ring-rose-500/10" : ""
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

    const particleCount = 30
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        radius: Math.random() * 1.1 + 0.8,
        opacity: Math.random() * 0.22 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.008
      })
    }

    const blobs = [
      { x: width * 0.25, y: height * 0.35, tx: Math.random() * 100, ty: Math.random() * 100, radius: 300, color: { r: 59, g: 130, b: 246 } },
      { x: width * 0.75, y: height * 0.65, tx: Math.random() * 100, ty: Math.random() * 100, radius: 290, color: { r: 168, g: 85, b: 247 } }
    ]

    const darkBg = { r: 9, g: 9, b: 11 }
    const lightBg = { r: 248, g: 250, b: 252 }

    const darkParticle = { r: 0, g: 229, b: 255 }
    const lightParticle = { r: 37, g: 99, b: 235 }

    const darkLine = { r: 0, g: 229, b: 255, a: 0.06 }
    const lightLine = { r: 37, g: 99, b: 235, a: 0.04 }

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

      blobs.forEach((blob, i) => {
        blob.tx += 0.0005
        blob.ty += 0.0004
        const scaleX = width * 0.12
        const scaleY = height * 0.12
        const baseX = i === 0 ? width * 0.35 : width * 0.65
        const baseY = i === 0 ? height * 0.35 : height * 0.65

        blob.x = baseX + Math.sin(blob.tx) * scaleX
        blob.y = baseY + Math.cos(blob.ty) * scaleY

        const blobColors = activeIsDark
          ? [
              { r: 0, g: 229, b: 255 },
              { r: 168, g: 85, b: 247 }
            ]
          : [
              { r: 56, g: 189, b: 248 },
              { r: 99, g: 102, b: 241 }
            ]

        const targetColor = blobColors[i]
        blob.color.r += (targetColor.r - blob.color.r) * 0.05
        blob.color.g += (targetColor.g - blob.color.g) * 0.05
        blob.color.b += (targetColor.b - blob.color.b) * 0.05

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
        const opacity = activeIsDark ? 0.04 : 0.02
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
          
          if (dist < 130) {
            const lineAlpha = currL.a * (1 - dist / 130)
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

        const pulsedRadius = p.radius + Math.sin(p.phase) * 0.25
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

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Reset Pw, 4: Success
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shakeInputs, setShakeInputs] = useState(false)

  // Otp cursor navigation
  const otpInputsRef = useRef([])
  const [otpTimer, setOtpTimer] = useState(30)

  useEffect(() => {
    if (step !== 2 || otpTimer <= 0) return
    const id = setInterval(() => setOtpTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [step, otpTimer])

  // Stepper Indicator labels
  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'Reset' }
  ]

  // Step 1: Send OTP request
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)
    try {
      await authService.forgotPassword(email)
      setStep(2)
      setOtpTimer(30)
    } catch (err) {
      setError(err.message || 'Unable to request password reset code.')
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
    } finally {
      setLoading(false)
    }
  }

  // OTP navigation
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '')
    if (!clean) {
      const nextOtp = [...otpCode]
      nextOtp[index] = ''
      setOtpCode(nextOtp)
      return
    }

    const nextOtp = [...otpCode]
    nextOtp[index] = clean[clean.length - 1]
    setOtpCode(nextOtp)

    if (index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1].focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtpCode(pasted.split(''))
      otpInputsRef.current[5]?.focus()
    }
  }

  const handleVerifyOtpStep = (e) => {
    e.preventDefault()
    const code = otpCode.join('')
    if (code.length !== 6) return
    // Proceed to reset password screen
    setStep(3)
  }

  // Step 3: Set new password submission
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
      return
    }

    setLoading(true)
    setError(null)
    const code = otpCode.join('')
    try {
      await authService.resetPassword({ email, otp: code, new_password: newPassword })
      setStep(4)
      setTimeout(() => {
        navigate('/login')
      }, 3500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your verification code.')
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
        {/* Stepper Progress bar */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-6 mb-8 select-none">
            {steps.map((st, i) => (
              <div key={st.num} className="flex items-center gap-2">
                <span className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                  step >= st.num
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-slate-500"
                )}>
                  {st.num}
                </span>
                <span className={clsx(
                  "text-[10px] font-bold tracking-wide uppercase",
                  step >= st.num ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                )}>
                  {st.label}
                </span>
                {i < steps.length - 1 && (
                  <span className="w-4 h-px bg-slate-200 dark:bg-zinc-800" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Enter email */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Recovery Email</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Enter your email to receive a password reset OTP code.</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <FloatingInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading || !email}
                className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
                style={{ transition: 'background-position 0.5s ease' }}
              >
                {loading ? <Spinner size={16} /> : 'Send Reset OTP'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: OTP verification */}
        {step === 2 && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Enter Verification Code</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold max-w-xs mx-auto">
                We sent a 6-digit verification code to <span className="text-slate-800 dark:text-slate-300 font-bold">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpStep} className="space-y-6">
              <div className="flex justify-between gap-2.5 py-2" onPaste={handleOtpPaste}>
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono rounded-lg border border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/20 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"
                  />
                ))}
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Didn&apos;t receive the code?</span>
                {otpTimer > 0 ? (
                  <span className="text-slate-400 font-semibold">Resend in {otpTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await authService.forgotPassword(email)
                      setOtpTimer(30)
                    }}
                    className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={otpCode.some((d) => !d)}
                className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
                style={{ transition: 'background-position 0.5s ease' }}
              >
                Verify Code
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Reset password */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Create New Password</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Set your new enterprise pipeline recovery password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <FloatingInput
                label="New Password (Min 8 chars)"
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
                disabled={loading || newPassword.length < 8 || !confirmPassword}
                className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
                style={{ transition: 'background-position 0.5s ease' }}
              >
                {loading ? <Spinner size={16} /> : 'Save and Update'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Success illustration check */}
        {step === 4 && (
          <div className="text-center py-6 space-y-5">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.1, 1], opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald flex items-center justify-center mx-auto"
            >
              <ShieldCheck size={36} />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Password Updated!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Your recovery password has been successfully updated. You are being redirected to Sign In...
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <Spinner size={20} />
            </div>
          </div>
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
