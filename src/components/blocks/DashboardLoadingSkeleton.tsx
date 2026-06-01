import { motion } from 'framer-motion'

export function DashboardHeaderSkeleton() {
  return (
    <motion.div
      className="px-8 py-6 max-w-6xl w-full mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="h-7 w-32 bg-muted rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-8 mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-7 w-12 bg-muted rounded-lg animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </motion.div>
  )
}

export function DashboardGridSkeleton() {
  const cards = Array.from({ length: 6 })

  return (
    <motion.div
      className="px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {cards.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative flex flex-col rounded-2xl p-5 bg-muted/30 border border-border/50 min-h-[280px]"
        >
          {/* Date + menu */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-6 w-6 bg-muted rounded-md animate-pulse" />
          </div>

          {/* Title + key */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-5 w-12 bg-muted rounded animate-pulse shrink-0" />
          </div>

          {/* Description */}
          <div className="h-3 w-full bg-muted rounded animate-pulse mb-4" />

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex flex-col gap-2">
                <div className="h-5 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-3 w-16 bg-muted rounded animate-pulse mb-2" />
            <div className="h-1.5 w-full bg-muted rounded-full animate-pulse" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <DashboardHeaderSkeleton />
      <div className="pb-8">
        <DashboardGridSkeleton />
      </div>
    </div>
  )
}
