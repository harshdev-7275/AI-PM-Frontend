import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * AuthLayout — the split-pane shell used by /login and /signup.
 *
 * Two columns on lg+:
 *   • Left  — brand / hero panel with animated radar rings, ambient blobs,
 *            and a faded "Planiqo" watermark. Hidden on smaller viewports.
 *   • Right — the actual form. Theme-aware (light is the active default).
 *
 * The hero is designed to work in BOTH themes:
 *   • Light (default, active now): soft brand-tinted gradient background,
 *     stronger blob opacities, watermark in brand color.
 *   • Dark  (when dark ships):     deep surface colors as before, white
 *     watermark, softer blobs. Use the `dark:` variants on the body.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-brand-primary/5 via-background to-brand-accent/5 dark:bg-surface-auth">
      {/* Left brand panel — hidden on mobile/tablet, visible on lg+ */}
      <div
        aria-label="Brand panel"
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center dark:bg-surface-panel"
      >
        {/* Ambient blobs — light: visible brand tints. dark: bloomier. */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-primary/15 dark:bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-brand-accent/20 dark:bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/3 w-40 h-40 bg-blue-500/10 dark:bg-blue-700/10 rounded-full blur-2xl pointer-events-none" />

        {/* Radar pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1.4, 2.8].map((delay) => (
            <motion.div
              key={delay}
              className="absolute w-96 h-96 rounded-full border-2 border-brand-primary/50 dark:border-brand-primary/40"
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 2.6, opacity: [0, 0.6, 0] }}
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

        {/* Brand watermark — light: subtle brand color. dark: white. */}
        <p className="relative z-10 text-brand-primary/20 dark:text-white/20 text-5xl font-bold uppercase tracking-[0.3em]">
          Planiqo
        </p>
      </div>

      {/* Right panel — explicit bg so the form sits on a known surface. */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 overflow-hidden bg-background">
        {children}
      </div>
    </div>
  )
}
