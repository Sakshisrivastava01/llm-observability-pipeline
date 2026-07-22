import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Activity, Cpu, Zap, Layers } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/api/client'
import clsx from 'clsx'

// ─── GPU-Accelerated Neural Network Animation ────────────────────────────────
function NeuralNetworkCanvas({ isDark }) {
  const canvasRef = useRef(null)
  const isDarkRef = useRef(isDark)

  // Sync isDark into ref to prevent canvas resets when theme changes
  useEffect(() => {
    isDarkRef.current = isDark
  }, [isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = canvas.width = canvas.offsetWidth
    let height = canvas.height = canvas.offsetHeight

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    const particleCount = 45
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.02
      })
    }

    let mouse = { x: null, y: null }
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }

    canvas.parentElement.addEventListener('mousemove', handleMouseMove)
    canvas.parentElement.addEventListener('mouseleave', handleMouseLeave)

    // Palette targets for interpolating smoothly on theme swaps (400ms duration)
    const darkParticle = { r: 0, g: 229, b: 255, a: 0.65 }
    const darkLine = { r: 0, g: 229, b: 255, a: 0.18 }
    const lightParticle = { r: 37, g: 99, b: 235, a: 0.45 }
    const lightLine = { r: 37, g: 99, b: 235, a: 0.12 }

    const currP = { ...lightParticle }
    const currL = { ...lightLine }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const activeIsDark = isDarkRef.current

      // Interpolate colors towards targets
      const targetP = activeIsDark ? darkParticle : lightParticle
      const targetL = activeIsDark ? darkLine : lightLine

      currP.r += (targetP.r - currP.r) * 0.08
      currP.g += (targetP.g - currP.g) * 0.08
      currP.b += (targetP.b - currP.b) * 0.08
      currP.a += (targetP.a - currP.a) * 0.08

      currL.r += (targetL.r - currL.r) * 0.08
      currL.g += (targetL.g - currL.g) * 0.08
      currL.b += (targetL.b - currL.b) * 0.08
      currL.a += (targetL.a - currL.a) * 0.08

      // Draw connection lines
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          
          if (dist < 100) {
            let lineAlpha = currL.a * (1 - dist / 100)

            // Cursor connection lines tracking glow boost
            if (mouse.x !== null && mouse.y !== null) {
              const mouseDist1 = Math.hypot(p1.x - mouse.x, p1.y - mouse.y)
              const mouseDist2 = Math.hypot(p2.x - mouse.x, p2.y - mouse.y)
              if (mouseDist1 < 100 || mouseDist2 < 100) {
                lineAlpha = Math.min(0.42, lineAlpha * 1.8)
              }
            }

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${lineAlpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // Mouse connection particles
      if (mouse.x !== null && mouse.y !== null) {
        particles.forEach((p) => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${currL.a * (1 - dist / 100) * 1.5})`
            ctx.lineWidth = 1.0
            ctx.stroke()
          }
        })
      }

      // Update & Draw particles
      particles.forEach((p) => {
        let activeRadius = p.radius
        let activeAlpha = currP.a

        // Cursor push & glow scale interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (dist < 100) {
            const force = (100 - dist) / 100
            const angle = Math.atan2(p.y - mouse.y, p.x - mouse.x)
            p.x += Math.cos(angle) * force * 1.4
            p.y += Math.sin(angle) * force * 1.4
            activeRadius += force * 2.0
            activeAlpha = Math.min(1.0, currP.a + force * 0.4)
          }
        }

        p.x += p.vx
        p.y += p.vy
        p.phase += p.speed

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        const pulsedRadius = activeRadius + Math.sin(p.phase) * 0.5

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
      if (canvas && canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove)
        canvas.parentElement.removeEventListener('mouseleave', handleMouseLeave)
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-45 z-0" />
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
  {
    icon: Activity,
    title: 'Real-time LLM Observability',
    description: 'Deep tracing of spans, prompts, and inference execution graphs.'
  },
  {
    icon: Cpu,
    title: 'OpenAI + Ollama Monitoring',
    description: 'Dual local and cloud-provider analytics from zero-boilerplate wrappers.'
  },
  {
    icon: Zap,
    title: 'Hallucination Detection',
    description: 'Evals and judges tracking outputs alignments, bias, and context recall.'
  },
  {
    icon: Layers,
    title: 'Cost & Token Analytics',
    description: 'Cost attribution tracking with custom charts and regression alerts.'
  }
]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
}

const slideInItem = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
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
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    let countdownInterval
    let isMounted = true

    const checkHealthStatus = async () => {
      try {
        const res = await apiClient.get('/health')
        if (res?.status === 'healthy') {
          if (isMounted) setBackendStatus('online')
          return true
        }
      } catch (err) {
        // offline
      }
      if (isMounted) setBackendStatus('waking')
      return false
    }

    const startCheckingLoop = async () => {
      const isOnline = await checkHealthStatus()
      if (isOnline) return

      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            checkHealthStatus()
            return 5
          }
          return prev - 1
        })
      }, 1000)
    }

    startCheckingLoop()

    return () => {
      isMounted = false
      clearInterval(countdownInterval)
    }
  }, [])

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
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-surface-900 overflow-hidden relative">
      
      {/* Blurred background circle elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[120px] transition-colors duration-1000" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] rounded-full bg-indigo-300/10 dark:bg-purple-600/5 blur-[135px] transition-colors duration-1000" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-slate-200/10 dark:bg-cyan-500/10 blur-[100px] transition-colors duration-1000" />
      </div>

      {/* ─── LEFT PANEL (Enterprise Branding) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 bg-slate-100/30 dark:bg-zinc-950/20 border-r border-slate-200/50 dark:border-zinc-800/40 relative overflow-hidden select-none z-10">
        <NeuralNetworkCanvas isDark={isDark} />

        {/* Top Header branding */}
        <div className="flex items-center gap-2.5 relative z-10">
          <motion.img
            src="/Project_logo.png"
            className="w-7 h-7 object-contain rounded-md"
            alt="Project Logo"
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={logoEntranceDone ? {
              scale: [1, 1.03, 1],
              rotate: 0,
              opacity: 1
            } : {
              scale: 1,
              rotate: 0,
              opacity: 1
            }}
            whileHover={{ scale: 1.08, filter: 'drop-shadow(0 0 12px rgba(0, 229, 255, 0.55))' }}
            onAnimationComplete={() => setLogoEntranceDone(true)}
            transition={logoEntranceDone ? {
              scale: { repeat: Infinity, duration: 6, ease: 'easeInOut' }
            } : {
              type: 'spring',
              stiffness: 120,
              damping: 14,
              mass: 0.9
            }}
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none">Observe</span>
        </div>

        {/* Center Descriptions & Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-lg space-y-8 my-auto relative z-10"
        >
          <div className="space-y-4">
            <motion.h2
              variants={slideInItem}
              className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight"
            >
              Observe, analyze and optimize every LLM interaction from a single enterprise dashboard.
            </motion.h2>
            <motion.p
              variants={slideInItem}
              className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
            >
              Monitor latency, token usage, hallucinations, cost efficiency, OpenAI, Ollama and production AI performance in real time.
            </motion.p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={slideInItem}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  borderColor: isDark ? 'rgba(0, 229, 255, 0.45)' : 'rgba(37, 99, 235, 0.45)',
                  boxShadow: 'var(--shadow-md)',
                  background: isDark ? 'linear-gradient(135deg, rgba(24,24,27,0.85) 0%, rgba(24,24,27,0.7) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.55) 100%)'
                }}
                className="p-4 rounded-xl border border-slate-200/55 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-sm flex gap-3 text-left transition-all duration-350 group"
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
        </motion.div>

        {/* Footer info */}
        <div className="text-[10px] text-slate-400 font-semibold relative z-10">
          Observe Enterprise observability suite · v1.0.0
        </div>
      </div>

      {/* ─── RIGHT PANEL (Login Panel) ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
        
        {/* Mobile header Logo */}
        <div className="lg:hidden flex flex-col items-center mb-6">
          <img
            src="/Project_logo.png"
            className="w-10 h-10 object-contain rounded-md mb-2"
            alt="Project Logo"
          />
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Observe</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            mass: 0.8
          }}
          className="w-full max-w-sm login-card-premium p-8 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/40 relative"
        >
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Enter your credentials to login</p>
          </div>

          {/* Wake-up Banner */}
          <AnimatePresence>
            {backendStatus === 'waking' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber rounded-2xl p-4 text-xs flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full animate-pulse" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber pulse-amber" />
                    <span className="font-bold text-[11px] tracking-wide uppercase">Starting Backend...</span>
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-amber/10 border border-amber/20 text-[9px] uppercase tracking-wider">
                    Retrying in {countdown}s
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[10px]">
                  The cloud instance is waking up. Estimated time is 20–60 seconds. auto-retrying credentials...
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full justify-center h-11 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 text-white rounded-lg shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-600 bg-[length:200%_auto] hover:bg-[right_center]"
              style={{ transition: 'background-position 0.5s ease, transform 0.15s ease' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size={16} className="text-white animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

    </div>
  )
}
