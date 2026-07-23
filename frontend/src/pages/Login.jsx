import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Activity, Cpu, Zap, Layers } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner, BrandLogo } from '@/components/shared/ui'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/api/client'
import clsx from 'clsx'

// ─── GPU-Accelerated Calming Fullscreen Background Canvas ─────────────────────
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

    // Minimal subtle particles (35 count)
    const particleCount = 35
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        radius: Math.random() * 1.2 + 0.8,
        opacity: Math.random() * 0.25 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01
      })
    }

    // 3 Slow organic moving blobs
    const blobs = [
      { x: width * 0.3, y: height * 0.4, tx: Math.random() * 100, ty: Math.random() * 100, radius: 280, color: { r: 59, g: 130, b: 246 } },
      { x: width * 0.7, y: height * 0.3, tx: Math.random() * 100, ty: Math.random() * 100, radius: 320, color: { r: 99, g: 102, b: 241 } },
      { x: width * 0.5, y: height * 0.8, tx: Math.random() * 100, ty: Math.random() * 100, radius: 290, color: { r: 168, g: 85, b: 247 } }
    ]

    let mouse = { x: null, y: null }
    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Color targets for interpolating smoothly (400ms) on theme transitions
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

      // Interpolate main colors towards target themes
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

      // Draw background
      ctx.fillStyle = `rgb(${Math.round(currBg.r)}, ${Math.round(currBg.g)}, ${Math.round(currBg.b)})`
      ctx.fillRect(0, 0, width, height)

      // Draw 3 Slow organic gradient blobs
      blobs.forEach((blob, i) => {
        blob.tx += 0.0006
        blob.ty += 0.0005
        
        // Non-repeating smooth organic floating coordinates
        const scaleX = width * 0.15
        const scaleY = height * 0.15
        const baseX = i === 0 ? width * 0.3 : i === 1 ? width * 0.7 : width * 0.5
        const baseY = i === 0 ? height * 0.3 : i === 1 ? height * 0.4 : height * 0.75

        blob.x = baseX + Math.sin(blob.tx) * scaleX
        blob.y = baseY + Math.cos(blob.ty) * scaleY

        // Target blob colors based on theme configs
        const blobColors = activeIsDark
          ? [
              { r: 0, g: 229, b: 255 }, // Cyan
              { r: 59, g: 130, b: 246 }, // Blue
              { r: 168, g: 85, b: 247 }  // Purple
            ]
          : [
              { r: 56, g: 189, b: 248 }, // Sky Blue
              { r: 148, g: 163, b: 184 }, // Slate
              { r: 99, g: 102, b: 241 }   // Indigo
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

      // Draw Particle Connection Lines (Subtle lines under 10% opacity)
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          
          if (dist < 140) {
            let lineAlpha = currL.a * (1 - dist / 140)

            // Cursor hover brightening (subtle glow boost)
            if (mouse.x !== null && mouse.y !== null) {
              const mouseDist1 = Math.hypot(p1.x - mouse.x, p1.y - mouse.y)
              const mouseDist2 = Math.hypot(p2.x - mouse.x, p2.y - mouse.y)
              if (mouseDist1 < 150 || mouseDist2 < 150) {
                lineAlpha = Math.min(0.09, lineAlpha * 1.5)
              }
            }

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${lineAlpha})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Update & Draw subtle particles
      particles.forEach((p) => {
        let activeRadius = p.radius
        let activeAlpha = p.opacity * currL.a * 3.5

        if (mouse.x !== null && mouse.y !== null) {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (dist < 150) {
            const force = (150 - dist) / 150
            // Subtle offset away from cursor
            const angle = Math.atan2(p.y - mouse.y, p.x - mouse.x)
            p.x += Math.cos(angle) * force * 0.4
            p.y += Math.sin(angle) * force * 0.4
            activeAlpha = Math.min(0.09, activeAlpha + force * 0.1)
          }
        }

        p.x += p.vx
        p.y += p.vy
        p.phase += p.speed

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const pulsedRadius = activeRadius + Math.sin(p.phase) * 0.3

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
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-screen h-screen z-[-1] pointer-events-none" />
  )
}

// ─── Floating Label Input Component ──────────────────────────────────────────
function FloatingInput({ label, type, value, onChange, required, autoComplete, rightAction }) {
  const [focused, setFocused] = useState(false)
  const isFloating = focused || value.length > 0

  return (
    <div className="relative mt-4">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
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

const FEATURE_CARDS = [
  { icon: Activity, title: 'Real-Time Observability', description: 'Deep tracing of spans, prompts, and execution graphs.' },
  { icon: Cpu,      title: 'Prompt Analytics',       description: 'Performance stats and cloud-provider benchmarks.' },
  { icon: Layers,   title: 'Token Cost Tracking',    description: 'Track costs and tokens across model versions.' },
  { icon: Zap,      title: 'Hallucination Detection',description: 'Automated judges monitoring response quality.' },
  { icon: Activity, title: 'Model Comparison',       description: 'Compare cost-efficiency and latencies.' },
  { icon: Layers,   title: 'Production Monitoring',  description: 'Inference traffic logs and anomaly alerts.' },
  { icon: Cpu,      title: 'Alerts',                 description: 'Detect statistical drift and regressions.' },
  { icon: Zap,      title: 'Evaluation Engine',      description: 'SQuAD and custom benchmarking pipelines.' }
]

// ─── Staggered Timeline Variants (1.5-2s total sequence) ─────────────────────
const rootPageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
}

const staggerSlideItem = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 14 }
  }
}

export default function Login() {
  const navigate = useNavigate()
  const { login, loginAsGuest } = useAuthStore()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Validation Shake State on form inputs only
  const [shakeInputs, setShakeInputs] = useState(false)

  // Logo spring entrance done checker
  const [logoEntranceDone, setLogoEntranceDone] = useState(false)

  // Backend Wake status checking pinger
  const [backendStatus, setBackendStatus] = useState('checking') // 'checking' | 'waking' | 'online'
  const [secondsToNextPoll, setSecondsToNextPoll] = useState(5)
  
  // Pending submit queue store to auto-login once server becomes healthy
  const pendingLoginRef = useRef(null)

  // Refactored async trigger to ensure instant routing after successful POST
  const triggerAuth = useCallback(async (loginEmail, loginPassword) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.login({ email: loginEmail, password: loginPassword })
      // Sync auth state variables
      login(res.user, res.access_token)
      localStorage.setItem('auth_token', res.access_token)
      
      useUIStore.getState().addNotification({
        title: 'Login Success',
        message: `Welcome back, ${res.user.name || 'User'}!`,
        type: 'success',
      })
      
      // Navigate immediately - dashboard components will load data asynchronously in background
      navigate('/')
    } catch (err) {
      let errMsg = 'Invalid email or password. Try again.'
      if (err.response?.status === 503 || err.message === 'Network Error' || !err.response) {
        setBackendStatus('waking')
        errMsg = 'Starting AI services... This usually takes 20–30 seconds.'
      }
      setError(errMsg)
      setShakeInputs(true)
      setTimeout(() => setShakeInputs(false), 500)
      useUIStore.getState().addNotification({
        title: 'Login Failure',
        message: errMsg,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [login, navigate])

  const triggerAuthRef = useRef(triggerAuth)
  useEffect(() => {
    triggerAuthRef.current = triggerAuth
  }, [triggerAuth])

  // Check health on mount and periodically if waking
  useEffect(() => {
    let countdownInterval
    let isMounted = true

    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/health')
        if (res?.status === 'healthy') {
          if (isMounted) {
            setBackendStatus('online')
            // Auto retry login if credentials were queued
            if (pendingLoginRef.current) {
              const queued = pendingLoginRef.current
              pendingLoginRef.current = null
              triggerAuthRef.current(queued.email, queued.password)
            }
          }
          return true
        }
      } catch (err) {
        // offline
      }
      if (isMounted) setBackendStatus('waking')
      return false
    }

    const startCheckingLoop = async () => {
      const isOnline = await checkHealth()
      if (isOnline) return

      countdownInterval = setInterval(() => {
        setSecondsToNextPoll((prev) => {
          if (prev <= 1) {
            checkHealth()
            return 5
          }
          return prev - 1
        })
      }, 1000)
    }

    startCheckingLoop()

    return () => {
      isMounted = false
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return

    // If server is cold starting, store parameters in pending queue and let pinger auto-submit once healthy
    if (backendStatus === 'waking') {
      pendingLoginRef.current = { email, password }
      useUIStore.getState().addNotification({
        title: 'Login Queued',
        message: 'Server is starting up. Login will run automatically once online.',
        type: 'info',
      })
      return
    }

    triggerAuth(email, password)
  }

  return (
    <motion.div
      variants={rootPageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen w-full flex bg-transparent overflow-hidden relative select-none"
    >
      {/* Fullscreen Canvas overlay backdrop */}
      <NeuralNetworkCanvas isDark={isDark} />
      
      {/* ─── LEFT PANEL (Enterprise Branding) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[50%] flex-col justify-between p-16 bg-transparent border-r border-slate-200/40 dark:border-zinc-800/30 relative overflow-hidden">
        
        {/* Top Header branding */}
        <motion.div variants={staggerSlideItem} className="flex items-center gap-2.5 relative z-10">
          <BrandLogo showText={true} showTagline={false} size="sm" />
        </motion.div>

        {/* Center Descriptions & Cards */}
        <div className="max-w-lg space-y-12 my-auto relative z-10">
          <div className="space-y-5">
            <motion.h2
              variants={staggerSlideItem}
              className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight"
            >
              CostLense every LLM. <br />
              Optimize every token. <br />
              Reduce every dollar.
            </motion.h2>
            <motion.p
              variants={staggerSlideItem}
              className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed opacity-90"
            >
              Monitor latency, hallucinations, token usage, model quality and production AI performance in real time from a unified cost and performance intelligence platform.
            </motion.p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={staggerSlideItem}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  borderColor: isDark ? 'rgba(0, 229, 255, 0.45)' : 'rgba(37, 99, 235, 0.45)',
                  boxShadow: 'var(--shadow-md)',
                  background: isDark ? 'linear-gradient(135deg, rgba(24,24,27,0.7) 0%, rgba(24,24,27,0.55) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.45) 100%)'
                }}
                className="p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800 bg-white/30 dark:bg-zinc-900/20 backdrop-blur-sm flex gap-3 text-left transition-all duration-350 group"
              >
                <div className="p-2 h-fit rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0 transition-transform duration-300 group-hover:rotate-5">
                  <Icon size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{title}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <motion.div variants={staggerSlideItem} className="text-[10px] text-slate-400 font-semibold relative z-10">
          CostLense Enterprise observability suite · v1.0.0
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL (Login Panel) ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-12 bg-transparent relative">
        
        {/* Mobile header Logo */}
        <div className="lg:hidden flex flex-col items-center mb-6">
          <BrandLogo showText={true} showTagline={true} size="md" className="flex-col text-center" />
        </div>

        <motion.div
          variants={staggerSlideItem}
          className={clsx(
            "w-full max-w-md login-card-premium p-10 border border-slate-200/50 dark:border-zinc-800/40 relative z-10",
            "bg-white/72 dark:bg-[rgba(18,18,25,0.82)]"
          )}
        >
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Enter your credentials to sign in</p>
          </div>

          {/* Wake-up progress loader */}
          <AnimatePresence>
            {backendStatus === 'waking' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber rounded-2xl p-4 text-xs flex flex-col gap-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                    <span className="font-bold text-[11px] tracking-wide uppercase">Waking up server...</span>
                  </div>
                  <span className="font-semibold text-[9px] uppercase tracking-wider opacity-90">
                    Checking in {secondsToNextPoll}s
                  </span>
                </div>
                
                {/* Horizontal Progress Bar */}
                <div className="w-full h-1 bg-amber-500/20 rounded-full overflow-hidden relative">
                  <div className="absolute h-full w-[40%] bg-amber rounded-full animate-shimmer" style={{ animationDuration: '1.5s', left: '-40%' }} />
                </div>
                
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[10px]">
                  The cloud instance is waking up. Fill out credentials and click Sign In to queue your login automatically.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <motion.div
              animate={shakeInputs ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="space-y-4"
            >
              <FloatingInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              
              <FloatingInput
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showPw ? 'hide' : 'show'}
                        initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                        transition={{ duration: 0.15 }}
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                }
              />
            </motion.div>

            <div className="flex justify-end text-xs pt-3">
              <a
                href="/forgot-password"
                className="text-brand-600 dark:text-brand-400 font-semibold transition-colors duration-150 hover:text-brand-500 flex items-center gap-0.5 group"
              >
                <span>Forgot password?</span>
                <span className="transition-transform duration-200 transform group-hover:translate-x-0.5">→</span>
              </a>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-dim/30 border border-rose/20 text-[10px] text-rose font-medium leading-relaxed mt-4">
                <AlertCircle size={13} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              whileHover={!(loading || !email || !password) ? { scale: 1.02 } : {}}
              whileTap={!(loading || !email || !password) ? { scale: 0.98 } : {}}
              className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
              style={{ transition: 'background-position 0.5s ease, transform 0.15s ease' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size={16} className="text-white animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : pendingLoginRef.current ? (
                <span>Queued - Waiting for Server...</span>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-xs text-slate-500 font-semibold select-none">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                Create Account
              </a>
            </p>
            <div className="h-px bg-slate-200/50 dark:bg-zinc-800/40 w-full" />
            <button
              type="button"
              onClick={() => {
                loginAsGuest()
                navigate('/')
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-bold transition-colors underline"
            >
              Continue as Guest
            </button>
          </div>
        </motion.div>
      </div>

    </motion.div>
  )
}
