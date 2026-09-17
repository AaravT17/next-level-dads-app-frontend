import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../api/notificationsApi'
import { notificationKeys } from './notificationKeys'

export function useUnreadNotificationCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: notificationsApi.getUnreadCount,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
    enabled,
  })
}
