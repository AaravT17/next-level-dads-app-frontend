import { useInfiniteQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { CONVERSATION_MESSAGES_PAGE_LIMIT } from '@/config/constants'
import type { MessagesCursor } from '@/types/communities'

export function useConversationMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: communityKeys.messages(conversationId ?? ''),
    queryFn: ({ pageParam }) =>
      communitiesApi.getConversationMessages(conversationId!, pageParam),
    initialPageParam: undefined as MessagesCursor | undefined,
    enabled: !!conversationId,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < CONVERSATION_MESSAGES_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_created_at: last.created_at }
    },
  })
}
