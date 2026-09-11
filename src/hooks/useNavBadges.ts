import { useQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { UserStats } from '@/types/users'
import type { Chat } from '@/types/chats'

/**
 * Counts for the primary navigation badges.
 *
 * The unread count is a *read* of the ['chats'] cache that ChatContext already
 * keeps live over the WebSocket — no extra request and no second subscription.
 * It uses the same predicate as the chat list itself.
 */

export function isChatUnread(c: Chat): boolean {
  return c.last_read_at === null || c.updated_at > c.last_read_at
}

export function useUnreadChatCount(): number {
  const queryClient = useQueryClient()
  // Subscribing through useQuery with the same key means WebSocket writes to
  // the cache re-render the badge, without this hook owning the fetch.
  const { data } = useQuery({
    queryKey: ['chats'],
    queryFn: () => queryClient.getQueryData<InfiniteData<Chat[]>>(['chats']) ?? null,
    enabled: false,
    staleTime: Infinity,
    initialData: () => queryClient.getQueryData<InfiniteData<Chat[]>>(['chats']),
  })

  const pages = (data as InfiniteData<Chat[]> | undefined)?.pages
  if (!pages) return 0
  return pages.flat().filter(isChatUnread).length
}

/** Incoming connection requests. Previously had no entry point at all. */
export function usePendingRequestCount(): number {
  const { data } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const res = await axiosPrivate.get<UserStats>('/api/users/me/stats', {
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  })
  return data?.requests ?? 0
}
