import { useInfiniteQuery } from '@tanstack/react-query'
import { PROFILES_PAGE_LIMIT } from '@/config/constants'
import type { ConnectionsCursor, ConnectionsFilters } from '@/types/users'
import { fetchIncomingRequests } from '../api/requestsApi'

/** No search term — what the Dads panel and an unfiltered Requests page share. */
export const NO_REQUEST_FILTERS: ConnectionsFilters = { name: '' }

export const requestsQueryKey = (filters: ConnectionsFilters) =>
  ['connections', 'requests', filters] as const

/**
 * The incoming-requests list.
 *
 * Always an infinite query, even where only the first four rows are shown:
 * DadCard rewrites this cache by prefix after accept/ignore and assumes the
 * paged shape, so a plain useQuery under the same key would be corrupted by
 * the first accepted request.
 */
export function useIncomingRequests(filters: ConnectionsFilters) {
  return useInfiniteQuery({
    queryKey: requestsQueryKey(filters),
    queryFn: ({ pageParam }) => fetchIncomingRequests(filters, pageParam),
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
