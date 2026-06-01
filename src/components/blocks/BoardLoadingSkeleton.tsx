import { motion } from 'framer-motion'

export function BoardLoadingSkeleton() {
  return (
    <motion.div
      className="flex gap-4 p-6 overflow-x-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[1, 2, 3, 4].map((colIdx) => (
        <motion.div
          key={colIdx}
          className="flex flex-col gap-3 w-72 shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: colIdx * 0.1 }}
        >
          {/* Column header */}
          <div className="px-3 py-3 border border-border rounded-lg bg-muted/30">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>

          {/* Cards in column */}
          {[1, 2, 3, 4].map((cardIdx) => (
            <motion.div
              key={cardIdx}
              className="p-3 border border-border/50 rounded-md bg-muted/20"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: colIdx * 0.1 + cardIdx * 0.05 }}
            >
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="h-12 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </motion.div>
          ))}
        </motion.div>
      ))}
    </motion.div>
  )
}

export function TabsSkeleton() {
  return (
    <motion.div
      className="flex items-center gap-2 px-6 py-4 border-b border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-8 w-24 bg-muted rounded-lg animate-pulse"
        />
      ))}
    </motion.div>
  )
}
