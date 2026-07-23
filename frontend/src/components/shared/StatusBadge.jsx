import clsx from 'clsx'

export function StatusBadge({ status, className }) {
  const normStatus = String(status || '').toUpperCase()

  const statusConfigs = {
    HIGH: {
      text: 'HIGH',
      classes: 'bg-rose-500/10 text-rose border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
      dotClass: 'bg-rose pulse-rose'
    },
    FAILED: {
      text: 'FAILED',
      classes: 'bg-rose-500/10 text-rose border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
      dotClass: 'bg-rose'
    },
    WARN: {
      text: 'WARN',
      classes: 'bg-amber-500/10 text-amber border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      dotClass: 'bg-amber pulse-amber'
    },
    MEDIUM: {
      text: 'WARN',
      classes: 'bg-amber-500/10 text-amber border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      dotClass: 'bg-amber pulse-amber'
    },
    LOW: {
      text: 'LOW',
      classes: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50',
      dotClass: 'bg-slate-500'
    },
    QUEUED: {
      text: 'QUEUED',
      classes: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50',
      dotClass: 'bg-slate-400 animate-pulse'
    },
    SUCCESS: {
      text: 'SUCCESS',
      classes: 'bg-emerald-500/10 text-emerald border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      dotClass: 'bg-emerald'
    },
    OK: {
      text: 'OK',
      classes: 'bg-emerald-500/10 text-emerald border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      dotClass: 'bg-emerald'
    },
    RUNNING: {
      text: 'RUNNING',
      classes: 'bg-brand-500/10 text-brand-600 border-brand-500/20 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30',
      dotClass: 'bg-brand pulse-blue'
    }
  }

  const config = statusConfigs[normStatus] || {
    text: status || '—',
    classes: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50',
    dotClass: 'bg-slate-400'
  }

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border tracking-wide uppercase',
      config.classes,
      className
    )}>
      {config.dotClass && (
        <span className={clsx('status-dot mr-1.5 shrink-0', config.dotClass)} />
      )}
      {config.text}
    </span>
  )
}
