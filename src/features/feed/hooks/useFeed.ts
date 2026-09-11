import { useInfiniteQuery } from '@tanstack/react-query'
import { CONVERSATIONS_PAGE_LIMIT } from '@/config/constants'
import { feedApi, type FeedConversation } from '../api/feedApi'
import { feedKeys } from './feedKeys'

export function useFeed(following: boolean) {
  return useInfiniteQuery({
    queryKey: feedKeys.list(following),
    queryFn: ({ pageParam }) => feedApi.list(following, pageParam),
    initialPageParam: undefined as { cursor_id: string; cursor_created_at: string } | undefined,
    staleTime: 1000 * 60,
    getNextPageParam: (lastPage: FeedConversation[]) => {
      if (lastPage.length < CONVERSATIONS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_created_at: last.created_at }
    },
  })
}
