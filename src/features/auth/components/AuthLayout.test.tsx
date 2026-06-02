import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthLayout from './AuthLayout'

describe('AuthLayout', () => {
  it('renders the children in the right panel', () => {
    render(
      <AuthLayout>
        <button>Sign in</button>
      </AuthLayout>
    )
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the "Planiqo" brand watermark', () => {
    render(
      <AuthLayout>
        <div />
      </AuthLayout>
    )
    // The watermark appears as a <p> with text "Planiqo"
    const watermark = screen.getByText('Planiqo')
    expect(watermark).toBeInTheDocument()
    // Brand watermark must be visible in the current (light) theme.
    // The unconditional classes (not `dark:`) must not be white text since
    // that is invisible on a light background.
    const lightClasses = watermark.className.replace(/\bdark:[^\s]+/g, '')
    expect(lightClasses).not.toMatch(/\btext-white\b/)
    // And it must have some visible color in light mode.
    expect(lightClasses).toMatch(/\btext-(brand-primary|brand-accent|foreground|muted-foreground)\b/)
  })

  it('renders the decorative radar pulse rings (three rings)', () => {
    const { container } = render(
      <AuthLayout>
        <div />
      </AuthLayout>
    )
    // The three rings all share the brand border class. Count occurrences.
    const rings = container.querySelectorAll('.border-brand-primary\\/40, .border-brand-primary\\/50, .border-brand-primary\\/60')
    expect(rings.length).toBeGreaterThanOrEqual(3)
  })

  it('renders the ambient brand blobs (three decorative blobs)', () => {
    const { container } = render(
      <AuthLayout>
        <div />
      </AuthLayout>
    )
    // Blobs are the absolutely-positioned decorative elements with blur.
    const blobs = container.querySelectorAll('[class*="blur-"]')
    expect(blobs.length).toBeGreaterThanOrEqual(3)
  })

  it('hides the left brand panel on small viewports (hidden by default)', () => {
    const { container } = render(
      <AuthLayout>
        <div />
      </AuthLayout>
    )
    // The left panel should have the `hidden` class so it's invisible
    // on mobile/tablet (lg+ only).
    const leftPanel = container.querySelector('[aria-label="Brand panel"]')
    expect(leftPanel).not.toBeNull()
    expect(leftPanel!.className).toMatch(/\bhidden\b/)
    expect(leftPanel!.className).toMatch(/\blg:flex\b/)
  })

  it('uses a light surface for the left panel in light mode (no dark surface color)', () => {
    const { container } = render(
      <AuthLayout>
        <div />
      </AuthLayout>
    )
    const leftPanel = container.querySelector('[aria-label="Brand panel"]')
    expect(leftPanel).not.toBeNull()
    // Light mode is the default. The left panel must NOT carry an
    // unconditional `bg-surface-*` class (those resolve to near-black
    // oklch values). `dark:bg-surface-panel` is fine because it only
    // applies when the .dark class is on <html>.
    const classes = leftPanel!.className
    // Strip every `dark:bg-...` class then assert no `bg-surface-*` remains.
    const withoutDark = classes.replace(/\bdark:[^\s]+/g, '')
    expect(withoutDark).not.toMatch(/\bbg-surface-(auth|panel)\b/)
  })
})
