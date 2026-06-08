import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Block } from '@/types/renderBlocks'

import { BlockRenderer } from './BlockRenderer'

describe('BlockRenderer', () => {
  it('renders nothing for an empty block list', () => {
    const { container } = render(<BlockRenderer blocks={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('dispatches each block to its renderer by type', () => {
    const blocks: Block[] = [
      { type: 'prose', markdown: 'hello world' },
      { type: 'code', language: 'ts', code: 'const x = 1' },
    ]
    const { container } = render(<BlockRenderer blocks={blocks} />)

    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(container.querySelector('[data-block-type="prose"]')).not.toBeNull()
    expect(container.querySelector('[data-block-type="code"]')).not.toBeNull()
  })

  it('renders a ranking table with both rows', () => {
    const blocks: Block[] = [
      {
        type: 'ranking_table',
        title: null,
        columns: [
          { key: 'name', label: 'Name', align: 'left' },
          { key: 'open', label: 'Open', align: 'right' },
        ],
        rows: [
          { cells: ['Alice', 7], href: null, highlight: true },
          { cells: ['Bob', 3], href: null, highlight: false },
        ],
      },
    ]
    render(<BlockRenderer blocks={blocks} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders a health report with a sourced quote linking to its evidence', () => {
    const blocks: Block[] = [
      {
        type: 'health_report',
        title: null,
        overall: 'at_risk',
        sections: [
          {
            kind: 'at_risk',
            heading: 'Risks',
            items: [
              {
                text: 'Login is flaky',
                severity: 'warning',
                quote: 'it keeps logging me out',
                evidence: { kind: 'issue', id: '12', label: '#12', href: '/issues/12' },
              },
            ],
          },
        ],
      },
    ]
    render(<BlockRenderer blocks={blocks} />)

    expect(screen.getByText('Login is flaky')).toBeInTheDocument()
    expect(screen.getByText(/it keeps logging me out/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '#12' })).toBeInTheDocument()
  })
})
