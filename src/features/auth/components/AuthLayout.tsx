import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-surface-auth">
      {/* Left panel — animation placeholder */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-panel items-center justify-center">
        {/* Ambient blobs */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/3 w-40 h-40 bg-blue-700/10 rounded-full blur-2xl pointer-events-none" />

        {/* Grid overlay */}
        {/* Radar pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1.4, 2.8].map((delay) => (
            <motion.div
              key={delay}
              className="absolute w-96 h-96 rounded-full border border-brand-primary/40"
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 2.6, opacity: [0, 0.5, 0] }}
              transition={{
                duration:   4,
                ease:       'easeOut',
                repeat:     Infinity,
                delay,
                times:      [0, 0.1, 1],
              }}
            />
          ))}
        </div>

        {/* Brand watermark */}
        <p className="relative z-10 text-white/20 text-5xl font-bold uppercase tracking-[0.3em]">Planiqo</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
