import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { CONTENT_WIDTH, type ContentWidth } from './contentWidth'

export type PageContainerProps = {
  children: ReactNode
  className?: string
  /** Pass false when the page owns its own scrolling region, as Chat does. */
  scroll?: boolean
  /** Disable route-driven scroll restoration for nested panes that should keep
   * their own position while the route changes (for example the desktop chat list). */
  restoreScroll?: boolean
  /** Match the AppBar's width so the header and content share a left edge. */
  width?: ContentWidth
}

/**
 * The app's only <main>. Owns page padding, the scroll region, and the
 * responsive content measure.
 */
export function PageContainer({
  children,
  className,
  scroll = true,
  restoreScroll = true,
  width = 'default',
}: PageContainerProps) {
  const ref = useRef<HTMLElement>(null)
  if (restoreScroll) {
    useScrollRestoration(ref)
  }

  return (
    <main
      id="main"
      ref={ref}
      className={cn('flex-1 min-h-0', scroll && 'overflow-y-auto overscroll-contain')}
    >
      <div className={cn(CONTENT_WIDTH[width], 'px-4 sm:px-6 py-6', className)}>{children}</div>
    </main>
  )
}
