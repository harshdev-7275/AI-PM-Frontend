import { z } from 'zod'

// Frontend mirror of the AI service render contract
// (ai-service/models/blocks.py). The wire format is camelCase: the Python
// block models serialize through a camelCase alias generator so this schema
// and that one stay in lockstep.
//
// The server is the source of truth for the SEMANTIC rules (health-report
// `overall` is derived from the worst risk, a quote requires evidence). This
// boundary only validates SHAPE and drops anything malformed, so a single bad
// block can never break the chat — exactly mirroring the Python validator's
// drop-and-keep behaviour.

const statusEnum = z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'])
const priorityEnum = z.enum(['urgent', 'high', 'medium', 'low'])
const severityEnum = z.enum(['info', 'warning', 'critical'])

const assigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullish(),
})

const refSchema = z.object({
  kind: z.enum(['issue', 'sprint', 'project']),
  id: z.string(),
  label: z.string(),
  href: z.string(),
})

// --- inline-tier blocks ------------------------------------------------------

const proseSchema = z.object({
  type: z.literal('prose'),
  markdown: z.string(),
})

const codeSchema = z.object({
  type: z.literal('code'),
  language: z.string(),
  code: z.string(),
  caption: z.string().nullish(),
})

const metaItemSchema = z.object({ label: z.string(), value: z.string() })

const entityCardSchema = z.object({
  type: z.literal('entity_card'),
  entity: z.enum(['issue', 'sprint']),
  id: z.string(),
  title: z.string(),
  href: z.string(),
  status: statusEnum.nullish(),
  priority: priorityEnum.nullish(),
  assignees: z.array(assigneeSchema).default([]),
  meta: z.array(metaItemSchema).default([]),
  summary: z.string().nullish(),
})

const tableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  align: z.enum(['left', 'right']).default('left'),
})

const tableRowSchema = z.object({
  cells: z.array(z.union([z.string(), z.number()])),
  href: z.string().nullish(),
  highlight: z.boolean().default(false),
})

const rankingTableSchema = z.object({
  type: z.literal('ranking_table'),
  title: z.string().nullish(),
  columns: z.array(tableColumnSchema).min(1),
  rows: z.array(tableRowSchema).default([]),
})

const actionProposalSchema = z.object({
  type: z.literal('action_proposal'),
  action: z.enum(['create', 'update', 'transition', 'assign', 'delete']),
  entity: z.enum(['issue', 'sprint', 'comment']),
  summary: z.string(),
  payload: z.record(z.unknown()).default({}),
  confirmRequired: z.literal(true).default(true),
  executorRef: z.string(),
})

// --- composed-tier blocks ----------------------------------------------------

const breakdownSegmentSchema = z.object({
  label: z.string(),
  value: z.number(),
  ratio: z.number().min(0).max(1).nullish(),
  tone: z.enum(['neutral', 'good', 'warn', 'bad']).default('neutral'),
})

const breakdownSchema = z.object({
  type: z.literal('breakdown'),
  title: z.string().nullish(),
  dimension: z.enum(['status', 'priority', 'assignee', 'type']),
  display: z.enum(['bar', 'stat_row']).default('bar'),
  total: z.number().nullish(),
  segments: z.array(breakdownSegmentSchema).default([]),
})

const trendPointSchema = z.object({ date: z.string(), remaining: z.number() })
const pointsProgressSchema = z.object({ done: z.number(), total: z.number() })

const progressSchema = z.object({
  type: z.literal('progress'),
  kind: z.enum(['sprint', 'epic']),
  title: z.string().nullish(),
  completed: z.number(),
  total: z.number(),
  dueDate: z.string().nullish(),
  points: pointsProgressSchema.nullish(),
  trend: z.array(trendPointSchema).default([]),
})

const healthItemSchema = z.object({
  text: z.string(),
  severity: severityEnum.default('info'),
  quote: z.string().nullish(),
  evidence: refSchema.nullish(),
})

const healthSectionSchema = z.object({
  kind: z.enum(['going_well', 'at_risk', 'recommended']),
  heading: z.string(),
  items: z.array(healthItemSchema).min(1),
})

const healthReportSchema = z.object({
  type: z.literal('health_report'),
  title: z.string().nullish(),
  overall: z.enum(['healthy', 'at_risk', 'critical']).default('healthy'),
  sections: z.array(healthSectionSchema).min(1),
})

// --- the union + envelope ----------------------------------------------------

export const blockSchema = z.discriminatedUnion('type', [
  proseSchema,
  codeSchema,
  entityCardSchema,
  rankingTableSchema,
  actionProposalSchema,
  breakdownSchema,
  progressSchema,
  healthReportSchema,
])

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
export type ProseBlock = z.infer<typeof proseSchema>
export type CodeBlock = z.infer<typeof codeSchema>
export type EntityCardBlock = z.infer<typeof entityCardSchema>
export type RankingTableBlock = z.infer<typeof rankingTableSchema>
export type ActionProposalBlock = z.infer<typeof actionProposalSchema>
export type BreakdownBlock = z.infer<typeof breakdownSchema>
export type ProgressBlock = z.infer<typeof progressSchema>
export type HealthReportBlock = z.infer<typeof healthReportSchema>

// The wire envelope. `blocks` stays unknown[] so a single malformed block is
// dropped by parseBlocks instead of failing the whole array.
export const renderResponseSchema = z.object({
  version: z.string().default('v1'),
  blocks: z.array(z.unknown()).default([]),
})

function coerceCandidates(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw !== null && typeof raw === 'object') {
    if ('blocks' in raw && Array.isArray(raw.blocks)) return raw.blocks
    if ('type' in raw && typeof raw.type === 'string') return [raw]
  }
  return []
}

/**
 * Validate raw AI-service output into typed blocks. Never throws.
 *
 * Mirrors the Python boundary validator: drop invalid candidates, keep the
 * valid ones. Accepts an envelope ({ blocks: [...] }), a bare array, or a
 * single block object. The caller decides what to do with an empty result.
 */
export function parseBlocks(raw: unknown): Block[] {
  const out: Block[] = []
  for (const candidate of coerceCandidates(raw)) {
    const result = blockSchema.safeParse(candidate)
    if (result.success) out.push(result.data)
  }
  return out
}
