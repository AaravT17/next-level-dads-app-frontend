import { useEffect, useRef } from 'react'
import { Spinner } from './Spinner'

/**
 * Infinite-scroll trigger. The same IntersectionObserver effect was written
 * six times across Discover, Groups, Chats, Requests and Connections.
 *
 * The bare sentinel div those used is unreachable without scrolling, so
 * keyboard and screen-reader users could not page through a list. The
 * sr-only button gives them an explicit control.
 */

export type InfiniteSentinelProps = {
  hasNextPage: boolean | undefined
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
  /** Announced on the fallback control: "Load more dads". */
  noun?: string
}

export function InfiniteSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  noun = 'results',
}: InfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = ref.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!hasNextPage) return null

  return (
    <div ref={ref} className="flex justify-center py-6">
      {isFetchingNextPage ? (
        <Spinner className="text-muted-foreground" label={`Loading more ${noun}`} />
      ) : (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          className="sr-only focus:not-sr-only focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
        >
          Load more {noun}
        </button>
      )}
    </div>
  )
}
