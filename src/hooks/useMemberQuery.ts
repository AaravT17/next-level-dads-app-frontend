import {
  useInfiniteQuery,
  useQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useAuth } from '@/contexts/useAuth'
import { isGhostRole } from '@/lib/roles'
import { withGhostPlaceholder } from '@/lib/memberQuery'

/**
 * `useQuery` for data that only exists for a member (my stats, my chats, my
 * connections), which the backend refuses to a ghost.
 *
 * Use it in place of `useQuery` for any such endpoint. A ghost gets `empty`
 * back as a settled result with no request made; everyone else gets exactly
 * what `useQuery` would have given them. See lib/memberQuery.ts for why.
 *
 * `memberOnly` is for a query that is only sometimes member-only, such as the
 * Communities list, whose "joined" scope is mine and whose "all" scope is not.
 *
 * Do not call `queryClient.fetchQuery` on these endpoints: an explicit fetch
 * ignores `enabled`, and would send a ghost's request regardless.
 */
export function useMemberQuery<
  TQueryFnData,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey>,
  empty: TQueryFnData,
  memberOnly = true,
): UseQueryResult<TQueryFnData, TError> {
  const { role } = useAuth()
  return useQuery(withGhostPlaceholder(options, memberOnly && isGhostRole(role), empty))
}

/** `useInfiniteQuery` for member-only data. See `useMemberQuery`. */
export function useMemberInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    InfiniteData<TQueryFnData, TPageParam>,
    TQueryKey,
    TPageParam
  >,
  empty: InfiniteData<TQueryFnData, TPageParam>,
  memberOnly = true,
): UseInfiniteQueryResult<InfiniteData<TQueryFnData, TPageParam>, TError> {
  const { role } = useAuth()
  return useInfiniteQuery(withGhostPlaceholder(options, memberOnly && isGhostRole(role), empty))
}
