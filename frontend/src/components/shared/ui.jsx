import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react'
import clsx from 'clsx'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, ...props }) {
  return (
    <div className={clsx('card', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
export function KpiCard({ title, value, change, changeLabel, icon: Icon, iconColor, loading }) {
  const isPositive = change > 0
  const isNeutral = change === 0 || change === undefined

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className={clsx('p-2 rounded-lg', iconColor || 'bg-brand-500/10')}>
            <Icon size={14} className={clsx(iconColor ? 'text-current' : 'text-brand-400')} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-8 w-28 rounded-md" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-semibold text-slate-100 tracking-tight">{value}</p>
          {change !== undefined && (
            <p className={clsx(
              'text-xs font-medium flex items-center gap-1',
              isNeutral ? 'text-slate-500'
              : isPositive ? 'text-emerald' : 'text-rose'
            )}>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% {changeLabel || 'vs 24h'}</span>
            </p>
          )}
        </>
      )}
    </div>
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
          'status-dot',
          variant === 'ok' ? 'bg-emerald' :
          variant === 'medium' ? 'bg-amber' :
          variant === 'high' || variant === 'critical' ? 'bg-rose' :
          'bg-brand-400'
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
  const message = error?.message || 'Something went wrong. Please try again.'
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 gap-4 text-center', className)}>
      <div className="p-3 rounded-full bg-rose-dim/30 border border-rose/20">
        <AlertTriangle size={20} className="text-rose" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">Failed to load data</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-xs gap-1.5">
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ title = 'No data found', description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 gap-3 text-center', className)}>
      <div className="p-3 rounded-full bg-surface-500 border border-white/10">
        <Inbox size={20} className="text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
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
    <div className={clsx('h-1.5 bg-surface-400 rounded-full overflow-hidden', className)}>
      <div className={clsx('h-full rounded-full transition-all duration-500', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}
