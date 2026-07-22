import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react'
import clsx from 'clsx'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Custom Animated Counter ──────────────────────────────────────────────────
export function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const valString = String(value)
    const numericMatch = valString.match(/[\d.]+/)
    if (!numericMatch) {
      setDisplayValue(value)
      return
    }

    const target = parseFloat(numericMatch[0])
    const prefix = valString.substring(0, numericMatch.index)
    const suffix = valString.substring(numericMatch.index + numericMatch[0].length)
    
    let start = 0
    const duration = 800 // ms
    const startTime = performance.now()

    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing out quad
      const eased = progress * (2 - progress)
      const current = start + eased * (target - start)
      
      // Keep decimal places matching target representation
      const decimalIndex = numericMatch[0].indexOf('.')
      const decimals = decimalIndex === -1 ? 0 : numericMatch[0].length - decimalIndex - 1
      
      setDisplayValue(`${prefix}${current.toFixed(decimals)}${suffix}`)

      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }

    requestAnimationFrame(update)
  }, [value])

  return <span>{displayValue}</span>
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, ...props }) {
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={clsx('card card-hover', className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
export function KpiCard({ title, value, change, changeLabel, icon: Icon, iconColor, loading }) {
  const isPositive = change > 0
  const isNeutral = change === 0 || change === undefined

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <motion.div
            whileHover={{ rotate: 15 }}
            className={clsx('p-2 rounded-lg', iconColor || 'bg-brand-500/10')}
          >
            <Icon size={14} className={clsx(iconColor ? 'text-current' : 'text-brand-400')} />
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-8 w-28 rounded-md" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-100 tracking-tight">
            <AnimatedNumber value={value} />
          </p>
          {change !== undefined && (
            <p className={clsx(
              'text-xs font-semibold flex items-center gap-1',
              isNeutral ? 'text-slate-500'
              : isPositive ? 'text-emerald-600 dark:text-emerald' : 'text-rose'
            )}>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% {changeLabel || 'vs 24h'}</span>
            </p>
          )}
        </>
      )}
    </motion.div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────
const BADGE_VARIANTS = {
  ok:       'badge-ok',
  low:      'badge-low',
  medium:   'badge-medium',
  high:     'badge-high',
  critical: 'badge-critical',
  default:  'badge bg-surface-500 text-slate-300 border border-white/10',
}

export function Badge({ variant = 'default', children, dot = false }) {
  return (
    <span className={BADGE_VARIANTS[variant] || BADGE_VARIANTS.default}>
      {dot && (
        <span className={clsx(
          'status-dot mr-1.5',
          variant === 'ok' ? 'bg-emerald pulse-green' :
          variant === 'medium' ? 'bg-amber pulse-amber' :
          variant === 'high' || variant === 'critical' ? 'bg-rose pulse-rose' :
          'bg-brand-400 animate-pulse'
        )} />
      )}
      {children}
    </span>
  )
}

export function SeverityBadge({ severity }) {
  const v = severity?.toLowerCase()
  return <Badge variant={v === 'ok' ? 'ok' : v || 'default'} dot>{severity}</Badge>
}

// ─── Loading States ───────────────────────────────────────────────────────────
export function Spinner({ size = 20, className }) {
  return (
    <svg
      className={clsx('animate-spin text-brand-400', className)}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={28} />
        <p className="text-sm text-slate-500">Loading data…</p>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-4 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────────────────────────
export function ErrorState({ error, onRetry, className }) {
  const [showDetails, setShowDetails] = useState(false)
  const message = error?.message || 'Something went wrong. Please try again.'
  const details = error?.stack || error?.details || (typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error))

  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 gap-4 text-center max-w-lg mx-auto', className)}>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="p-3 rounded-full bg-rose/10 border border-rose/20 text-rose"
      >
        <AlertTriangle size={24} />
      </motion.div>

      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Failed to load data</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <button onClick={onRetry} className="btn-primary text-xs py-1.5 px-3">
            <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
            Retry Request
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="btn-outline text-xs py-1.5 px-3"
        >
          Reload Page
        </button>
        {error && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDetails && error && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full text-left bg-slate-100 dark:bg-surface-800/80 border border-slate-200 dark:border-white/[0.06] rounded-lg p-3 overflow-x-auto max-h-48 text-[10px] font-mono text-slate-600 dark:text-slate-400 select-all leading-tight"
          >
            {details}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ title = 'No data found', description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 gap-3 text-center', className)}>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="p-3 rounded-full bg-slate-100 dark:bg-surface-500 border border-slate-200 dark:border-white/10"
      >
        <Inbox size={20} className="text-slate-500" />
      </motion.div>
      <div>
        <p className="text-sm font-semibold text-slate-400">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('section-header', className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
export function StatRow({ label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={clsx('text-sm font-medium', valueClass || 'text-slate-200')}>{value}</span>
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ className }) {
  return <hr className={clsx('border-t border-white/[0.06]', className)} />
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, colorClass = 'bg-brand-500', className }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={clsx('h-1.5 bg-slate-200 dark:bg-surface-400 rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={clsx('h-full rounded-full', colorClass)}
      />
    </div>
  )
}
