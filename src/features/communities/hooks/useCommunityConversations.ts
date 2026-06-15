import { useInfiniteQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { CONVERSATIONS_PAGE_LIMIT } from '@/config/constants'
import type { ConversationsCursor } from '@/types/communities'

export function useCommunityConversations(communityId: string | undefined) {
  return useInfiniteQuery({
    queryKey: communityKeys.conversations(communityId ?? ''),
    queryFn: ({ pageParam }) =>
      communitiesApi.getCommunityConversations(communityId!, pageParam),
    initialPageParam: undefined as ConversationsCursor | undefined,
    enabled: !!communityId,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < CONVERSATIONS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_last_activity_at: last.last_activity_at }
    },
  })
}
