import { useInfiniteQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { CONVERSATIONS_PAGE_LIMIT } from '@/config/constants'
import type {
  AnyConversationsCursor,
  ConversationSort,
  ConversationTimeWindow,
} from '@/types/communities'

export function useCommunityConversations(
  communityId: string | undefined,
  sort: ConversationSort,
  timeWindow: ConversationTimeWindow,
) {
  const effectiveTimeWindow: ConversationTimeWindow = sort === 'recent' ? 'all' : timeWindow

  return useInfiniteQuery({
    queryKey: communityKeys.conversations(communityId ?? '', sort, effectiveTimeWindow),
    queryFn: ({ pageParam }) =>
      communitiesApi.getCommunityConversations(communityId!, sort, effectiveTimeWindow, pageParam),
    initialPageParam: undefined as AnyConversationsCursor | undefined,
    enabled: !!communityId,
    getNextPageParam: (lastPage): AnyConversationsCursor | undefined => {
      if (lastPage.length < CONVERSATIONS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      if (sort === 'popular') return { cursor_id: last.id, cursor_heart_count: last.heart_count }
      if (sort === 'active') return { cursor_id: last.id, cursor_reply_count: last.reply_count }
      return { cursor_id: last.id, cursor_last_activity_at: last.last_activity_at }
    },
  })
}
