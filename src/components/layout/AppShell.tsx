import type { ReactNode } from 'react'
import { SystemBanners } from './SystemBanners'

/**
 * The app frame, responsive in two modes.
 *
 * One column at every width, with the bottom bar spanning the full screen.
 *
 * A fixed-height shell with an internally scrolling content area, so the nav
 * stays put and no page needs clearance padding. System banners sit above
 * everything — they describe the whole app, not the current page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-background flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to content
      </a>

      <SystemBanners />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
