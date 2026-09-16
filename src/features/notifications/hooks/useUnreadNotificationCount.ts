import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../api/notificationsApi'
import { notificationKeys } from './notificationKeys'

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: notificationsApi.getUnreadCount,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  })
}
