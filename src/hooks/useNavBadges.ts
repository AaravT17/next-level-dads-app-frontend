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

/**
 * The stats document behind every counter in the shell.
 *
 * One query key, so every caller shares a single request. The AppBar mounts it
 * on every screen, which is why a page can read a count without issuing one of
 * its own — though it must still respect `isPending`, since "not loaded yet"
 * and "zero" mean different things to anything that branches on the answer.
 */
export function useUserStats() {
  return useQuery({
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
}

/** Incoming connection requests. Previously had no entry point at all. */
export function usePendingRequestCount(): number {
  return useUserStats().data?.requests ?? 0
}
