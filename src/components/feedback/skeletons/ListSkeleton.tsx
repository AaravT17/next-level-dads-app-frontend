import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Repeats one skeleton row. `className` should mirror the real list's layout
 * (grid vs stack) so content swapping in does not shift the page.
 */
export function ListSkeleton({
  count = 4,
  item,
  className,
}: {
  count?: number
  item: ReactNode
  className?: string
}) {
  return (
    <div aria-hidden className={cn('space-y-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  )
}
