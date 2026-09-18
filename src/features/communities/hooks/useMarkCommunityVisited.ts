import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { shouldStampVisit } from '../lib/visitThrottle'

/**
 * Record that the caller opened this community, clearing its new-activity badge.
 *
 * Fire-and-forget by design. It runs as a side effect of rendering a page the
 * user asked for, not as something they requested, so there is no success
 * feedback and no error toast: a failed stamp just means the badge clears on the
 * next visit, which is not worth interrupting anyone over.
 *
 * Non-members are stamped too — harmlessly, since the server has no membership
 * row to write and no badge to clear. Checking `is_member` first would mean
 * waiting on the community query before firing, which is a round trip for a
 * branch the server already handles.
 *
 * On success it invalidates two things. The communities list is keyed
 * `['communities', scope, ...]` by ScopedCollectionPage rather than through
 * communityKeys, so the bare `['communities']` prefix is what reaches it. The
 * stats document behind the nav badge is `['user', 'stats']`.
 */
export function useMarkCommunityVisited(communityId: string | undefined): void {
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: (id: string) => communitiesApi.markVisited(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
    },
    // Deliberately silent. See above.
    onError: () => {},
  })

  useEffect(() => {
    if (!communityId) return
    if (!shouldStampVisit(communityId)) return

    mutate(communityId)
  }, [communityId, mutate])
}
