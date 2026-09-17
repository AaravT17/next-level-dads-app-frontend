import { useInfiniteQuery } from '@tanstack/react-query'
import { PROFILES_PAGE_LIMIT } from '@/config/constants'
import type { ConnectionsCursor, ConnectionsFilters } from '@/types/users'
import { fetchOutgoingRequests } from '../api/requestsApi'

export const sentRequestsQueryKey = (filters: ConnectionsFilters) =>
  ['connections', 'sent', filters] as const

/**
 * Requests you have sent and nobody has answered yet.
 *
 * Infinite for the same reason useIncomingRequests is: DadCard rewrites this
 * cache by key prefix when a request is cancelled and assumes the paged shape,
 * so a plain useQuery here would be corrupted by the first cancellation.
 *
 * Two minutes stale matches the incoming list. These rows only change when the
 * recipient acts, so the window where one is listed after being accepted is
 * small, and the panel labels itself as awaiting a reply rather than claiming
 * the request is still open.
 */
export function useOutgoingRequests(filters: ConnectionsFilters) {
  return useInfiniteQuery({
    queryKey: sentRequestsQueryKey(filters),
    queryFn: ({ pageParam }) => fetchOutgoingRequests(filters, pageParam),
    initialPageParam: undefined as ConnectionsCursor | undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PROFILES_PAGE_LIMIT) return undefined
      const lastItem = lastPage[lastPage.length - 1]
      return {
        cursor_id: lastItem.connection_id,
        cursor_updated_at: lastItem.connection_updated_at,
      }
    },
  })
}
