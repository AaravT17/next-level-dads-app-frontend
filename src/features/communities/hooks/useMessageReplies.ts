import { useInfiniteQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { REPLIES_PAGE_LIMIT } from '@/config/constants'
import type { RepliesCursor } from '@/types/communities'

export function useMessageReplies(messageId: string | undefined) {
  return useInfiniteQuery({
    queryKey: communityKeys.replies(messageId ?? ''),
    queryFn: ({ pageParam }) =>
      communitiesApi.getMessageReplies(messageId!, pageParam),
    initialPageParam: undefined as RepliesCursor | undefined,
    enabled: !!messageId,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < REPLIES_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_heart_count: last.heart_count }
    },
  })
}
