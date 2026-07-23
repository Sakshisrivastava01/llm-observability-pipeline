import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, Activity, Cpu, Zap, Layers, ShieldCheck } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner, BrandLogo } from '@/components/shared/ui'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// ─── Floating Label Input for Signup ─────────────────────────────────────────
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

// ─── GPU-Accelerated Calming Background Canvas ─────────────────────────────────
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

    const particleCount = 35
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 1.2 + 0.8,
        opacity: Math.random() * 0.25 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01
      })
    }

    const blobs = [
      { x: width * 0.3, y: height * 0.4, tx: Math.random() * 100, ty: Math.random() * 100, radius: 280, color: { r: 59, g: 130, b: 246 } },
      { x: width * 0.7, y: height * 0.3, tx: Math.random() * 100, ty: Math.random() * 100, radius: 320, color: { r: 99, g: 102, b: 241 } },
      { x: width * 0.5, y: height * 0.8, tx: Math.random() * 100, ty: Math.random() * 100, radius: 290, color: { r: 168, g: 85, b: 247 } }
    ]

    const darkBg = { r: 9, g: 9, b: 11 }
    const lightBg = { r: 248, g: 250, b: 252 }

    const darkParticle = { r: 0, g: 229, b: 255 }
    const lightParticle = { r: 37, g: 99, b: 235 }

    const darkLine = { r: 0, g: 229, b: 255, a: 0.07 }
    const lightLine = { r: 37, g: 99, b: 235, a: 0.05 }

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

      currBg.r += (targetBg.r - currBg.r) * 0.06
      currBg.g += (targetBg.g - currBg.g) * 0.06
      currBg.b += (targetBg.b - currBg.b) * 0.06

      currP.r += (targetP.r - currP.r) * 0.06
      currP.g += (targetP.g - currP.g) * 0.06
      currP.b += (targetP.b - currP.b) * 0.06

      currL.r += (targetL.r - currL.r) * 0.06
      currL.g += (targetL.g - currL.g) * 0.06
      currL.b += (targetL.b - currL.b) * 0.06
      currL.a += (targetL.a - currL.a) * 0.06

      ctx.fillStyle = `rgb(${Math.round(currBg.r)}, ${Math.round(currBg.g)}, ${Math.round(currBg.b)})`
      ctx.fillRect(0, 0, width, height)

      blobs.forEach((blob, i) => {
        blob.tx += 0.0006
        blob.ty += 0.0005
        const scaleX = width * 0.15
        const scaleY = height * 0.15
        const baseX = i === 0 ? width * 0.3 : i === 1 ? width * 0.7 : width * 0.5
        const baseY = i === 0 ? height * 0.3 : i === 1 ? height * 0.4 : height * 0.75

        blob.x = baseX + Math.sin(blob.tx) * scaleX
        blob.y = baseY + Math.cos(blob.ty) * scaleY

        const blobColors = activeIsDark
          ? [
              { r: 0, g: 229, b: 255 },
              { r: 59, g: 130, b: 246 },
              { r: 168, g: 85, b: 247 }
            ]
          : [
              { r: 56, g: 189, b: 248 },
              { r: 148, g: 163, b: 184 },
              { r: 99, g: 102, b: 241 }
            ]

        const targetColor = blobColors[i]
        blob.color.r += (targetColor.r - blob.color.r) * 0.06
        blob.color.g += (targetColor.g - blob.color.g) * 0.06
        blob.color.b += (targetColor.b - blob.color.b) * 0.06

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
        const opacity = activeIsDark ? 0.05 : 0.03
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
          
          if (dist < 140) {
            const lineAlpha = currL.a * (1 - dist / 140)
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${lineAlpha})`
            ctx.lineWidth = 0.6
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

        const pulsedRadius = p.radius + Math.sin(p.phase) * 0.3
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

const FEATURE_CARDS = [
  { icon: Activity, title: 'Trace Spans & Graphs', description: 'Step-by-step tracing of local and remote LLM workflows.' },
  { icon: Layers, title: 'Cost Allocation', description: 'Aggregate inference costs, tokens, and model configurations.' }
]

export default function Signup() {
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const { login } = useAuthStore()
  const isDark = theme === 'dark'

  const [step, setStep] = useState('signup') // 'signup' | 'otp' | 'success'

  // Signup fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // Stepper & OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(30)
  const otpInputsRef = useRef([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shakeInputs, setShakeInputs] = useState(false)

  // Form errors
  const [emailErr, setEmailErr] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [pwConfirmErr, setPwConfirmErr] = useState('')

  // Calculate password strength score: 0 to 3
  const pwStrength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    return score
  })()

  // Resend code countdown
  useEffect(() => {
    if (step !== 'otp' || otpTimer <= 0) return
    const id = setInterval(() => setOtpTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [step, otpTimer])

  // Email check
  const handleEmailChange = (val) => {
    setEmail(val)
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailErr('Invalid email format')
    } else {
      setEmailErr('')
    }
  }

  // Mobile check
  const handleMobileChange = (val) => {
    const num = val.replace(/\D/g, '')
    setMobile(num)
    if (num && num.length < 10) {
      setPhoneErr('Phone number must have at least 10 digits')
    } else {
      setPhoneErr('')
    }
  }

  // Password confirmation check
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPwConfirmErr('Passwords do not match')
    } else {
      setPwConfirmErr('')
    }
  }, [password, confirmPassword])

  // Signup Submit
  const handleRegister = async (e) => {
    e.preventDefault()
    if (emailErr || phoneErr || pwConfirmErr) {
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
      return
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service to continue.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await authService.register({ email, password, name })
      setStep('otp')
      setOtpTimer(30)
    } catch (err) {
      setError(err.message || 'Registration failed. Try checking your connection.')
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
    } finally {
      setLoading(false)
    }
  }

  // OTP box cursor shifting
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

    // Focus next box
    if (index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus()
    }
  };

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

  // Simulated OTP verification
  const handleVerifyOtp = (e) => {
    e.preventDefault()
    const code = otpCode.join('')
    if (code.length !== 6) return

    setLoading(true)
    setTimeout(async () => {
      setLoading(false)
      try {
        const response = await authService.login({ username: email, password })
        login(response.user, response.token)
        localStorage.setItem('auth_token', response.token)
      } catch (err) {
        console.error("Auto login failed after registration", err)
      }
      setStep('success')
      // Auto redirect to dashboard after 3.5s
      setTimeout(() => {
        navigate('/')
      }, 3500)
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex bg-transparent overflow-hidden relative select-none"
    >
      <NeuralNetworkCanvas isDark={isDark} />

      {/* LEFT COLUMN */}
      <div className="hidden lg:flex lg:w-[50%] flex-col justify-between p-16 bg-transparent border-r border-slate-200/40 dark:border-zinc-800/30 relative">
        <div className="flex items-center gap-2.5 z-10">
          <BrandLogo showText={true} showTagline={false} size="sm" />
        </div>

        <div className="max-w-lg space-y-12 my-auto z-10">
          <div className="space-y-5">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              Create your CostLense account.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Start monitoring prompt latencies, hallucination judges, and database regression logs in minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800 bg-white/30 dark:bg-zinc-900/20 backdrop-blur-sm flex gap-3 text-left">
                <div className="p-2 h-fit rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                  <Icon size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{title}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-semibold z-10">
          CostLense Enterprise · v1.0.0
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex-1 flex flex-col justify-center items-center p-12 bg-transparent relative">
        <motion.div
          animate={shakeInputs ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md login-card-premium p-10 border border-slate-200/50 dark:border-zinc-800/40 relative z-10 bg-white/72 dark:bg-[rgba(18,18,25,0.82)]"
        >
          {/* STEP 1: Signup Form */}
          {step === 'signup' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-sans">Get Started</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Enter details to create an account</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <FloatingInput
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                
                <FloatingInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  error={emailErr}
                  required
                />
                {emailErr && <p className="text-[10px] text-rose font-medium ml-1">{emailErr}</p>}

                <FloatingInput
                  label="Mobile Number"
                  type="tel"
                  value={mobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  error={phoneErr}
                  required
                />
                {phoneErr && <p className="text-[10px] text-rose font-medium ml-1">{phoneErr}</p>}

                <FloatingInput
                  label="Password (Min 8 characters)"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  rightAction={
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-200 p-1">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />

                {/* Password strength bar */}
                {password && (
                  <div className="space-y-1 pt-1 px-1">
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wide">
                      <span className="text-slate-500">Security</span>
                      <span className={clsx(
                        pwStrength === 1 ? 'text-rose' : pwStrength === 2 ? 'text-amber' : 'text-emerald'
                      )}>
                        {pwStrength === 1 ? 'Weak' : pwStrength === 2 ? 'Medium' : 'Strong'}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                      <div className={clsx("h-full rounded-full transition-all duration-300", 
                        pwStrength >= 1 ? (pwStrength === 1 ? "bg-rose w-1/3" : pwStrength === 2 ? "bg-amber w-2/3" : "bg-emerald w-full") : "w-0"
                      )} />
                    </div>
                  </div>
                )}

                <FloatingInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={pwConfirmErr}
                  required
                />
                {pwConfirmErr && <p className="text-[10px] text-rose font-medium ml-1">{pwConfirmErr}</p>}

                {/* Accept Terms checkbox */}
                <div className="flex items-start gap-2 pt-3 select-none">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-slate-200 dark:border-zinc-800 text-brand-600 focus:ring-brand-500/20"
                  />
                  <label htmlFor="terms" className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold cursor-pointer leading-tight">
                    I accept the{' '}
                    <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-dim/30 border border-rose/20 text-[10px] text-rose font-medium leading-normal mt-4">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !name || !email || !mobile || !password || !confirmPassword || !acceptTerms}
                  className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-5 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
                  style={{ transition: 'background-position 0.5s ease, transform 0.15s ease' }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size={16} className="text-white" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{' '}
                  <a href="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                    Sign In
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Verify Your Email</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold max-w-xs mx-auto">
                  We have sent a 6-digit confirmation code to your email address.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                      onClick={() => setOtpTimer(30)}
                      className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.some((d) => !d)}
                  className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
                  style={{ transition: 'background-position 0.5s ease, transform 0.15s ease' }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size={16} className="text-white" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Success Verification Check */}
          {step === 'success' && (
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Account Verified!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your CostLense credentials have been successfully registered. You are being redirected to Sign In...
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <Spinner size={20} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
