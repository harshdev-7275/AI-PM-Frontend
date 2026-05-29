import { type ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#09090b]">
      {/* Left panel — animation placeholder */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d0d15] items-center justify-center">
        {/* Ambient blobs */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/3 w-40 h-40 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Placeholder */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-16 text-center">
          <div className="w-72 h-72 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <p className="text-white/30 text-sm">Animation coming soon</p>
          </div>
          <p className="text-white/20 text-xs uppercase tracking-widest">Vortex AI</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
