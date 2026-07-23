import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, X } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'
import { useNavigate } from 'react-router-dom'

export function AuthRequiredModal() {
  const { authModalOpen, setAuthModalOpen } = useUIStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  if (!authModalOpen) return null

  const handleSignIn = () => {
    setAuthModalOpen(false)
    logout() // Clear guest state
    navigate('/login')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAuthModalOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full max-w-md bg-white/70 dark:bg-surface-700/60 border border-slate-200 dark:border-white/[0.08] p-6 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-5"
        >
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>

          <div className="mx-auto w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
            <ShieldAlert size={24} />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Authentication Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You are currently viewing the platform in **Guest Mode**. Please sign in or register a full account to perform write actions, save settings, or export telemetry data.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSignIn}
              className="btn-primary w-full justify-center h-10 font-bold"
            >
              Sign In or Register
            </button>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="btn-outline w-full justify-center h-10 font-semibold"
            >
              Keep Exploring as Guest
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
