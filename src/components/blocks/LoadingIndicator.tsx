import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

interface LoadingIndicatorProps {
  isLoading: boolean
  message?: string
}

export function LoadingIndicator({ isLoading, message = 'Loading...' }: LoadingIndicatorProps) {
  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-border shadow-lg"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader size={16} className="text-brand-primary" />
      </motion.div>
      <span className="text-sm text-foreground">{message}</span>
    </motion.div>
  )
}
