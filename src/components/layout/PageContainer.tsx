import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PageContainerProps = {
  children: ReactNode
  className?: string
  /** Pass false when the page owns its own scrolling region, as Chat does. */
  scroll?: boolean
}

/**
 * The app's only <main>. Owns page padding and the scroll region, so pages no
 * longer hand-roll min-h-screen / max-w-md / pb-20.
 */
export function PageContainer({ children, className, scroll = true }: PageContainerProps) {
  return (
    <main
      id="main"
      className={cn(
        'flex-1 min-h-0',
        scroll && 'overflow-y-auto overscroll-contain',
        'px-6 py-6',
        className,
      )}
    >
      {children}
    </main>
  )
}
