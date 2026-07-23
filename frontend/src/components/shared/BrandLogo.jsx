import { motion } from 'framer-motion'
import clsx from 'clsx'

export function BrandLogo({ size = 'md', showText = true, showTagline = true, className }) {
  const logoSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const titleSizes = {
    sm: 'text-xs tracking-wider',
    md: 'text-sm tracking-widest',
    lg: 'text-lg tracking-widest',
  }

  return (
    <div className={clsx('flex items-center gap-2 select-none', className)}>
      <motion.img
        src="/Project_logo.png"
        className={clsx('object-contain rounded-md', logoSizes[size] || logoSizes.md)}
        alt="CostLense Logo"
        whileHover={{ scale: 1.08, rotate: 2, filter: 'drop-shadow(0 0 8px rgba(100,112,243,0.4))' }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{
          animate: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
          whileHover: { type: 'spring', stiffness: 400, damping: 10 }
        }}
      />
      {showText && (
        <div className="overflow-hidden leading-tight text-left">
          <h1 className={clsx('font-extrabold text-slate-800 dark:text-slate-100 uppercase', titleSizes[size] || titleSizes.md)}>
            CostLense
          </h1>
          {showTagline && (
            <p className="text-[9px] text-slate-500 font-bold truncate tracking-wider">
              AI Cost & Performance Intelligence
            </p>
          )}
        </div>
      )}
    </div>
  )
}
