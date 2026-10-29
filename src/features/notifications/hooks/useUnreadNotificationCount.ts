import { useMemberQuery } from '@/hooks/useMemberQuery'
import { notificationsApi } from '../api/notificationsApi'
import { notificationKeys } from './notificationKeys'

export function useUnreadNotificationCount(enabled: boolean) {
  return useMemberQuery(
    {
      queryKey: notificationKeys.count(),
      queryFn: notificationsApi.getUnreadCount,
      staleTime: 1000 * 60 * 3,
      refetchOnWindowFocus: true,
      enabled,
    },
    { count: 0 },
  )
}
