import type { ReactNode } from 'react'

/** Repeats one skeleton row. Keeps the count in the caller, not the shape. */
export function ListSkeleton({ count = 4, item }: { count?: number; item: ReactNode }) {
  return (
    <div aria-hidden className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  )
}
