import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  Notification,
  NotificationCount,
  NotificationCursor,
} from '@/types/notifications'

export const notificationsApi = {
  async getNotifications(
    cursor?: NotificationCursor,
  ): Promise<Notification[]> {
    const params = new URLSearchParams()
    if (cursor) {
      params.append('cursor_created_at', cursor.cursor_created_at)
      params.append('cursor_id', cursor.cursor_id)
    }
    const res = await axiosPrivate.get<Notification[]>('/api/notifications', {
      params,
      timeout: TIMEOUT_LENGTH_MS,
    })
    return res.data
  },

  async getUnreadCount(): Promise<NotificationCount> {
    const res = await axiosPrivate.get<NotificationCount>(
      '/api/notifications/count',
      { timeout: TIMEOUT_LENGTH_MS },
    )
    return res.data
  },
}
