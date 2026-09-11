import type { ReactNode } from 'react'

/**
 * The app frame.
 *
 * A fixed-height flex column with the content area scrolling internally,
 * which is the model Chat.tsx already used. Adopting it everywhere buys three
 * things the old per-page `min-h-screen` + `fixed bottom-0` pattern could not:
 *
 * - the bottom nav is a flex sibling, so no page needs pb-20 clearance
 * - system banners sit in normal flow instead of covering the header
 * - the desktop frame is just a max-width and a border, with no fixed-position
 *   element escaping it to span the full window
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh bg-app-ambient flex justify-center overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to content
      </a>
      <div
        className="
          relative flex w-full max-w-md flex-col overflow-hidden bg-background
          md:my-6 md:h-[calc(100dvh-3rem)] md:rounded-lg
          md:border md:border-foreground/10 md:shadow-lg
        "
      >
        {children}
      </div>
    </div>
  )
}
