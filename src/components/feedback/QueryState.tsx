import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { CenteredSpinner } from './Spinner'

/**
 * The loading / error / empty / data branch, in one place.
 *
 * This shape was written out longhand in eight files, each with slightly
 * different padding and none with a retry. Accepts the common surface of
 * useQuery and useInfiniteQuery, so both work unchanged.
 */

export type QueryStateShape<T> = {
  isPending: boolean
  isError: boolean
  error: unknown
  data: T | undefined
  refetch?: () => unknown
  isRefetching?: boolean
}

export type QueryStateProps<T> = {
  query: QueryStateShape<T>
  /** Plural noun for the error message: "dads", "communities", "chats". */
  noun: string
  /** Defaults to treating an empty array as empty. */
  isEmpty?: (data: T) => boolean
  /** Shown on first load. Prefer a skeleton over a spinner for lists. */
  skeleton?: ReactNode
  empty?: ReactNode
  /**
   * Errors handled elsewhere. Discover surfaces 429s as a toast and keeps the
   * list on screen rather than replacing it with an error panel.
   */
  ignoreError?: (error: unknown) => boolean
  children: (data: T) => ReactNode
}

function defaultIsEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0
}

export function QueryState<T>({
  query,
  noun,
  isEmpty = defaultIsEmpty as (data: T) => boolean,
  skeleton,
  empty,
  ignoreError,
  children,
}: QueryStateProps<T>) {
  if (query.isPending) {
    return <>{skeleton ?? <CenteredSpinner label={`Loading ${noun}`} />}</>
  }

  if (query.isError && !(ignoreError?.(query.error) ?? false)) {
    return (
      <ErrorState
        noun={noun}
        onRetry={query.refetch ? () => query.refetch?.() : undefined}
        isRetrying={query.isRefetching}
      />
    )
  }

  // An ignored error can leave us with no data at all; treat that as empty
  // rather than crashing the render prop on undefined.
  if (query.data === undefined) {
    return <>{empty ?? <EmptyState title={`No ${noun} yet`} />}</>
  }

  if (isEmpty(query.data)) {
    return <>{empty ?? <EmptyState title={`No ${noun} yet`} />}</>
  }

  return <>{children(query.data)}</>
}
