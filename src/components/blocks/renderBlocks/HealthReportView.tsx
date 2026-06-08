import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { HealthReportBlock } from '@/types/renderBlocks'

interface HealthReportViewProps {
  block: HealthReportBlock
}

type Overall = HealthReportBlock['overall']
type SectionKind = HealthReportBlock['sections'][number]['kind']
type Severity = HealthReportBlock['sections'][number]['items'][number]['severity']

const OVERALL: Record<Overall, { label: string; className: string }> = {
  healthy: {
    label: 'Healthy',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  at_risk: {
    label: 'At risk',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
}

const SECTION_LABEL: Record<SectionKind, string> = {
  going_well: 'What’s going well',
  at_risk: 'What’s at risk',
  recommended: 'Recommended actions',
}

const SEVERITY_DOT: Record<Severity, string> = {
  info: 'bg-muted-foreground/40',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}

// Usage: render a project health panel (health_report block) — the composite
// "going well / at risk / recommended" view. `overall` is server-derived.
//   <HealthReportView block={block} />
export function HealthReportView({ block }: HealthReportViewProps) {
  const overall = OVERALL[block.overall]

  return (
    <div className="my-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold">{block.title ?? 'Project health'}</span>
        <Badge className={cn('border-transparent', overall.className)}>{overall.label}</Badge>
      </div>
      <div className="space-y-3">
        {block.sections.map((section) => (
          <section key={section.kind}>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.heading || SECTION_LABEL[section.kind]}
            </h4>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      SEVERITY_DOT[item.severity],
                    )}
                  />
                  <div className="min-w-0">
                    <p className="leading-relaxed text-foreground">{item.text}</p>
                    {item.quote && (
                      <blockquote className="mt-1 border-l-2 border-border pl-2 text-xs italic text-muted-foreground">
                        “{item.quote}”
                        {item.evidence && (
                          <>
                            {' — '}
                            <a
                              href={item.evidence.href}
                              className="text-brand-primary not-italic hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.evidence.label}
                            </a>
                          </>
                        )}
                      </blockquote>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
