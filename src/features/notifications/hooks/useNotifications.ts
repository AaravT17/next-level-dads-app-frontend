import { useInfiniteQuery } from '@tanstack/react-query'
import { NOTIFICATIONS_PAGE_LIMIT } from '@/config/constants'
import type { NotificationCursor } from '@/types/notifications'
import { notificationsApi } from '../api/notificationsApi'
import { notificationKeys } from './notificationKeys'

export function useNotifications(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) => notificationsApi.getNotifications(pageParam),
    initialPageParam: undefined as NotificationCursor | undefined,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 5,
    enabled,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < NOTIFICATIONS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return {
        cursor_created_at: last.created_at,
        cursor_id: last.id,
      }
    },
  })
}
