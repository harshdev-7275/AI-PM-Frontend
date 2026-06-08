import { describe, expect, it } from 'vitest'

import { parseBlocks } from './renderBlocks'

describe('parseBlocks', () => {
  it('keeps a valid block', () => {
    const blocks = parseBlocks([{ type: 'prose', markdown: 'hi' }])
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.type).toBe('prose')
  })

  it('drops an invalid block but keeps the valid ones', () => {
    const blocks = parseBlocks([
      { type: 'prose', markdown: 'ok' },
      { type: 'code' }, // missing required language + code
    ])
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.type).toBe('prose')
  })

  it('returns empty for an unknown block type', () => {
    expect(parseBlocks([{ type: 'definitely_not_a_block' }])).toHaveLength(0)
  })

  it('accepts the envelope shape', () => {
    const blocks = parseBlocks({ version: 'v1', blocks: [{ type: 'prose', markdown: 'hi' }] })
    expect(blocks).toHaveLength(1)
  })

  it('accepts a single block object', () => {
    expect(parseBlocks({ type: 'prose', markdown: 'hi' })).toHaveLength(1)
  })

  it('returns empty for garbage input', () => {
    expect(parseBlocks('garbage')).toHaveLength(0)
    expect(parseBlocks(null)).toHaveLength(0)
    expect(parseBlocks(42)).toHaveLength(0)
  })

  it('discriminates the union by type', () => {
    const [block] = parseBlocks([{ type: 'code', language: 'py', code: 'x = 1' }])
    expect(block?.type).toBe('code')
  })

  it('applies schema defaults (table align + row highlight)', () => {
    const [block] = parseBlocks([
      {
        type: 'ranking_table',
        columns: [{ key: 'a', label: 'A' }],
        rows: [{ cells: ['x'] }],
      },
    ])
    expect(block?.type).toBe('ranking_table')
    if (block?.type === 'ranking_table') {
      expect(block.columns[0]?.align).toBe('left')
      expect(block.rows[0]?.highlight).toBe(false)
    }
  })

  it('derives nothing client-side: trusts the server overall but validates shape', () => {
    const [block] = parseBlocks([
      {
        type: 'health_report',
        overall: 'critical',
        sections: [
          { kind: 'at_risk', heading: 'Risks', items: [{ text: 'db slow', severity: 'critical' }] },
        ],
      },
    ])
    expect(block?.type).toBe('health_report')
    if (block?.type === 'health_report') {
      expect(block.overall).toBe('critical')
      expect(block.sections).toHaveLength(1)
    }
  })
})
