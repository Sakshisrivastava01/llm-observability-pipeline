import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Activity, Cpu, Zap, Layers } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { authService } from '@/api/services'
import { Spinner } from '@/components/shared/ui'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/api/client'
import clsx from 'clsx'

// ─── GPU-Accelerated Fullscreen Neural Network Canvas ─────────────────────────
function NeuralNetworkCanvas({ isDark }) {
  const canvasRef = useRef(null)
  const isDarkRef = useRef(isDark)

  // Keep isDark context synced in ref to prevent canvas particle re-init
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

    // Visibility Listener to pause animation on background tabs
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Neural particles variables (190 particles count)
    const particleCount = 190
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseRadius: Math.random() * 1.5 + 0.8,
        radius: 0,
        opacity: Math.random() * 0.5 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02
      })
    }

    // Ambient floating lights (5 large radial lights)
    const ambientLights = [
      { x: width * 0.2, y: height * 0.3, vx: 0.08, vy: 0.06, baseRadius: 260, angle: 0, speed: 0.001 },
      { x: width * 0.7, y: height * 0.2, vx: -0.06, vy: 0.08, baseRadius: 300, angle: Math.PI / 3, speed: 0.0008 },
      { x: width * 0.4, y: height * 0.8, vx: 0.07, vy: -0.05, baseRadius: 240, angle: Math.PI / 1.5, speed: 0.0012 },
      { x: width * 0.8, y: height * 0.7, vx: -0.05, vy: -0.07, baseRadius: 280, angle: Math.PI, speed: 0.0009 },
      { x: width * 0.1, y: height * 0.8, vx: 0.04, vy: 0.05, baseRadius: 220, angle: Math.PI * 1.5, speed: 0.0007 }
    ]

    // AI Scanner Grid scanning variables
    let gridOffset = 0

    // Data Streams array (network packets traveling)
    const dataStreams = []
    const spawnStream = () => {
      const isHorizontal = Math.random() > 0.5
      dataStreams.push({
        horizontal: isHorizontal,
        pos: isHorizontal ? Math.random() * height : Math.random() * width,
        progress: 0,
        speed: 2 + Math.random() * 3,
        length: 100 + Math.random() * 100
      })
    }

    // Compute bursts array (appearing, expanding circles)
    const computeRings = []
    const spawnRing = () => {
      computeRings.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 2,
        maxRadius: 20 + Math.random() * 20,
        opacity: 0.8,
        speed: 0.2 + Math.random() * 0.3
      })
    }

    // Mouse tracking variables
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

    // Palette targets for interpolating smoothly on theme swaps (400ms duration)
    const darkBg = { r: 9, g: 9, b: 11 }
    const lightBg = { r: 248, g: 250, b: 252 }

    const darkParticle = { r: 0, g: 229, b: 255 }
    const lightParticle = { r: 37, g: 99, b: 235 }

    const darkLine = { r: 0, g: 229, b: 255, a: 0.18 }
    const lightLine = { r: 37, g: 99, b: 235, a: 0.12 }

    // Floating Ambient Light Color Sets
    // Dark: Cyan, Blue, Indigo, Purple
    const darkLights = [
      { r: 0, g: 229, b: 255 },
      { r: 59, g: 130, b: 246 },
      { r: 99, g: 102, b: 241 },
      { r: 168, g: 85, b: 247 },
      { r: 0, g: 229, b: 255 }
    ]
    // Light: Sky Blue, Slate, Indigo, White
    const lightLights = [
      { r: 56, g: 189, b: 248 },
      { r: 148, g: 163, b: 184 },
      { r: 99, g: 102, b: 241 },
      { r: 255, g: 255, b: 255 },
      { r: 56, g: 189, b: 248 }
    ]

    // Active color values to interpolate
    const currBg = { ...lightBg }
    const currP = { ...lightParticle }
    const currL = { ...lightLine }
    const currLights = lightLights.map(l => ({ ...l }))

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
      const targetLights = activeIsDark ? darkLights : lightLights

      currBg.r += (targetBg.r - currBg.r) * 0.07
      currBg.g += (targetBg.g - currBg.g) * 0.07
      currBg.b += (targetBg.b - currBg.b) * 0.07

      currP.r += (targetP.r - currP.r) * 0.07
      currP.g += (targetP.g - currP.g) * 0.07
      currP.b += (targetP.b - currP.b) * 0.07

      currL.r += (targetL.r - currL.r) * 0.07
      currL.g += (targetL.g - currL.g) * 0.07
      currL.b += (targetL.b - currL.b) * 0.07
      currL.a += (targetL.a - currL.a) * 0.07

      // Interpolate ambient light colors
      for (let i = 0; i < currLights.length; i++) {
        currLights[i].r += (targetLights[i].r - currLights[i].r) * 0.07
        currLights[i].g += (targetLights[i].g - currLights[i].g) * 0.07
        currLights[i].b += (targetLights[i].b - currLights[i].b) * 0.07
      }

      // Draw background
      ctx.fillStyle = `rgb(${Math.round(currBg.r)}, ${Math.round(currBg.g)}, ${Math.round(currBg.b)})`
      ctx.fillRect(0, 0, width, height)

      // ─── Draw Ambient Floating Lights ──────────────────────────────────────
      ambientLights.forEach((light, i) => {
        light.angle += light.speed
        // Perlin-like slow floating motion
        light.x += light.vx + Math.sin(light.angle) * 0.12
        light.y += light.vy + Math.cos(light.angle) * 0.12

        // Bounce boundaries
        if (light.x < -100 || light.x > width + 100) light.vx *= -1
        if (light.y < -100 || light.y > height + 100) light.vy *= -1

        const activeColor = currLights[i]
        const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.baseRadius)
        // High quality blurred glows
        const opacityMultiplier = activeIsDark ? 0.07 : 0.05
        grad.addColorStop(0, `rgba(${Math.round(activeColor.r)}, ${Math.round(activeColor.g)}, ${Math.round(activeColor.b)}, ${opacityMultiplier})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(light.x, light.y, light.baseRadius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      // ─── Draw AI Scanning Grid (Subtle Grid Overlay) ───────────────────────
      gridOffset = (gridOffset + 0.08) % 60
      ctx.beginPath()
      const gridOpacity = activeIsDark ? 0.015 : 0.01
      ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${gridOpacity})`
      ctx.lineWidth = 0.6

      // Vertical lines
      for (let x = gridOffset; x < width; x += 60) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      // Horizontal lines
      for (let y = gridOffset; y < height; y += 60) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      // ─── Spawn & Draw Network Data Streams ──────────────────────────────────
      if (Math.random() < 0.015 && dataStreams.length < 3) spawnStream()
      dataStreams.forEach((stream, i) => {
        stream.progress += stream.speed
        if (stream.progress > (stream.horizontal ? width : height) + stream.length) {
          dataStreams.splice(i, 1)
          return
        }

        ctx.beginPath()
        const streamOpacity = activeIsDark ? 0.12 : 0.08
        const grad = ctx.createLinearGradient(
          stream.horizontal ? stream.progress - stream.length : stream.pos,
          stream.horizontal ? stream.pos : stream.progress - stream.length,
          stream.horizontal ? stream.progress : stream.pos,
          stream.horizontal ? stream.pos : stream.progress
        )
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(1, `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${streamOpacity})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.2

        if (stream.horizontal) {
          ctx.moveTo(stream.progress - stream.length, stream.pos)
          ctx.lineTo(stream.progress, stream.pos)
        } else {
          ctx.moveTo(stream.pos, stream.progress - stream.length)
          ctx.lineTo(stream.pos, stream.progress)
        }
        ctx.stroke()
      })

      // ─── Spawn & Draw Compute Burst Rings ───────────────────────────────────
      if (Math.random() < 0.008 && computeRings.length < 4) spawnRing()
      computeRings.forEach((ring, i) => {
        ring.radius += ring.speed
        ring.opacity -= 0.007
        if (ring.opacity <= 0) {
          computeRings.splice(i, 1)
          return
        }

        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${Math.round(currP.r)}, ${Math.round(currP.g)}, ${Math.round(currP.b)}, ${ring.opacity * 0.18})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })

      // ─── Draw Particle Connections ─────────────────────────────────────────
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          
          if (dist < 100) {
            let lineAlpha = currL.a * (1 - dist / 100) * p1.opacity

            // Cursor proximity glow lines boost (150px cursor area)
            if (mouse.x !== null && mouse.y !== null) {
              const mouseDist1 = Math.hypot(p1.x - mouse.x, p1.y - mouse.y)
              const mouseDist2 = Math.hypot(p2.x - mouse.x, p2.y - mouse.y)
              if (mouseDist1 < 150 || mouseDist2 < 150) {
                lineAlpha = Math.min(0.4, lineAlpha * 1.6)
              }
            }

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${lineAlpha})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }

      // Temporary lines straight to cursor
      if (mouse.x !== null && mouse.y !== null) {
        particles.forEach((p) => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.strokeStyle = `rgba(${Math.round(currL.r)}, ${Math.round(currL.g)}, ${Math.round(currL.b)}, ${currL.a * (1 - dist / 150) * 1.2})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        })
      }

      // ─── Update & Draw Neural Particles ────────────────────────────────────
      particles.forEach((p) => {
        let activeRadius = p.baseRadius
        let activeAlpha = p.opacity * currP.a

        // Cursor magnetic attraction physics
        if (mouse.x !== null && mouse.y !== null) {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (dist < 150) {
            const force = (150 - dist) / 150
            
            // Magnetic force pull towards mouse coordinates
            p.x += (mouse.x - p.x) * force * 0.022
            p.y += (mouse.y - p.y) * force * 0.022

            activeRadius += force * 1.5
            activeAlpha = Math.min(1.0, activeAlpha + force * 0.35)
          }
        }

        // Drifting motion
        p.x += p.vx
        p.y += p.vy
        p.phase += p.speed

        // Organic slow direction changing nudge
        p.vx += (Math.random() - 0.5) * 0.008
        p.vy += (Math.random() - 0.5) * 0.008

        // Clamp speeds
        const speed = Math.hypot(p.vx, p.vy)
        if (speed > 0.42) {
          p.vx = (p.vx / speed) * 0.42
          p.vy = (p.vy / speed) * 0.42
        }

        // Screen boundary wrapping
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const pulsedRadius = activeRadius + Math.sin(p.phase) * 0.4

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

// ─── Staggered Timeline Variants (1.5-2s total sequence) ─────────────────────
const rootPageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const staggerSlideItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 14 }
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
    <motion.div
      variants={rootPageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen w-full flex bg-transparent overflow-hidden relative select-none"
    >
      {/* Fullscreen Canvas overlay backdrop */}
      <NeuralNetworkCanvas isDark={isDark} />
      
      {/* ─── LEFT PANEL (Enterprise Branding) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 bg-transparent border-r border-slate-200/40 dark:border-zinc-800/30 relative overflow-hidden">
        
        {/* Top Header branding */}
        <motion.div variants={staggerSlideItem} className="flex items-center gap-2.5 relative z-10">
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
        </motion.div>

        {/* Center Descriptions & Cards */}
        <div className="max-w-lg space-y-8 my-auto relative z-10">
          <div className="space-y-4">
            <motion.h2
              variants={staggerSlideItem}
              className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight"
            >
              Observe, analyze and optimize every LLM interaction from a single enterprise dashboard.
            </motion.h2>
            <motion.p
              variants={staggerSlideItem}
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
          Observe Enterprise observability suite · v1.0.0
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL (Login Panel) ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-transparent relative">
        
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
          variants={staggerSlideItem}
          className={clsx(
            "w-full max-w-sm login-card-premium p-8 border border-slate-200/50 dark:border-zinc-800/40 relative z-10",
            "bg-white/72 dark:bg-[rgba(18,18,25,0.82)]"
          )}
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

    </motion.div>
  )
}
