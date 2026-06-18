export function ProjectCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-xl w-full max-w-[320px] p-4 bg-muted/30 border border-border/50 animate-pulse">
      {/* Date + menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-6 w-6 rounded-md bg-muted" />
      </div>

      {/* Title + key */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="h-5 flex-1 rounded bg-muted" />
        <div className="h-5 w-12 rounded bg-muted shrink-0" />
      </div>

      {/* Description */}
      <div className="h-3 w-full rounded bg-muted mb-5" />

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-3 w-16 rounded bg-muted mb-2" />
        <div className="h-1.5 rounded-full bg-muted" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="h-8 rounded bg-muted" />
        <div className="h-8 rounded bg-muted" />
        <div className="h-8 rounded bg-muted" />
      </div>
    </div>
  )
}
