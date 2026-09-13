import { useQuery } from '@tanstack/react-query'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { UserStats } from '@/types/users'
import { useChat } from '@/contexts/useChat'

/**
 * Counts for the primary navigation badges.
 *
 * The unread count is derived from the chat membership hashmap maintained
 * by ChatContext over the WebSocket — no extra request and no cache scan.
 */

export function useUnreadChatCount(): number {
  const { unreadCount } = useChat()
  return unreadCount
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
