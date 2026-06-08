import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MarkdownContent } from './MarkdownContent'

describe('MarkdownContent', () => {
  it('renders bold and italic from markdown', () => {
    render(<MarkdownContent content="**hello** and *world*" />)
    const strong = screen.getByText('hello')
    const em = screen.getByText('world')
    expect(strong.tagName).toBe('STRONG')
    expect(em.tagName).toBe('EM')
  })

  it('renders unordered lists', () => {
    render(<MarkdownContent content={'- one\n- two\n- three'} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('one')
  })

  it('renders fenced code blocks', () => {
    render(<MarkdownContent content={'```ts\nconst x = 1\n```'} />)
    const code = screen.getByText('const x = 1')
    expect(code.tagName).toBe('CODE')
  })

  it('renders safe links with target=_blank and rel=noopener', () => {
    render(<MarkdownContent content={'[docs](https://example.com)'} />)
    const link = screen.getByRole('link', { name: 'docs' })
    expect(link).toHaveAttribute('target', '_blank')
    expect((link.getAttribute('rel') ?? '')).toMatch(/noopener/)
  })

  it('strips script tags while keeping surrounding text (XSS guard)', () => {
    const { container } = render(
      <MarkdownContent
        content={'Hello <script>window.__pwned = true</script> world'}
      />,
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('Hello')
    expect(container.textContent).toContain('world')
  })

  it('returns null for empty content', () => {
    const { container } = render(<MarkdownContent content="" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('MarkdownContent typography', () => {
  it('renders paragraphs with vertical rhythm', () => {
    const { container } = render(
      <MarkdownContent content={'first paragraph\n\nsecond paragraph'} />,
    )
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(2)
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('my-2')
      expect(p).toHaveClass('leading-relaxed')
    })
  })

  it('renders unordered lists with disc markers and indent', () => {
    const { container } = render(<MarkdownContent content={'- one\n- two'} />)
    const ul = container.querySelector('ul')
    expect(ul).not.toBeNull()
    expect(ul).toHaveClass('list-disc')
    expect(ul).toHaveClass('pl-6')
  })

  it('renders ordered lists with decimal markers and indent', () => {
    const { container } = render(<MarkdownContent content={'1. one\n2. two'} />)
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
    expect(ol).toHaveClass('list-decimal')
    expect(ol).toHaveClass('pl-6')
  })

  it('renders list items with relaxed line-height', () => {
    const { container } = render(<MarkdownContent content={'- one\n- two'} />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(2)
    items.forEach((li) => {
      expect(li).toHaveClass('leading-relaxed')
    })
  })

  it('renders h2 with appropriate size and weight', () => {
    const { container } = render(<MarkdownContent content={'## Section heading'} />)
    const h2 = container.querySelector('h2')
    expect(h2).not.toBeNull()
    expect(h2).toHaveClass('font-semibold')
  })

  it('renders blockquote with a left border and muted text', () => {
    const { container } = render(<MarkdownContent content={'> quoted text'} />)
    const bq = container.querySelector('blockquote')
    expect(bq).not.toBeNull()
    expect(bq).toHaveClass('border-l-2')
    expect(bq).toHaveClass('border-border')
    expect(bq).toHaveClass('pl-3')
    expect(bq).toHaveClass('text-muted-foreground')
  })

  it('renders inline code with a surface background', () => {
    const { container } = render(
      <MarkdownContent content={'use the `getUser` helper'} />,
    )
    const code = container.querySelector('code')
    expect(code).not.toBeNull()
    expect(code).toHaveClass('bg-muted')
    expect(code).toHaveClass('rounded')
    expect(code).toHaveClass('px-1')
    expect(code).toHaveClass('font-mono')
    expect(code).toHaveClass('text-xs')
  })

  it('renders links with brand color and underline', () => {
    const { container } = render(
      <MarkdownContent content={'[docs](https://example.com)'} />,
    )
    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link).toHaveClass('text-brand-primary')
    expect(link).toHaveClass('underline')
  })
})
