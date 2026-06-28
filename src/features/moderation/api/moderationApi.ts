import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  BanStatus,
  ModerationNotification,
  ReportCreate,
  UserReportCreate,
} from '@/types/moderation'

const t = { timeout: TIMEOUT_LENGTH_MS }

export const moderationApi = {
  getBanStatus: () =>
    axiosPrivate.get<BanStatus>('/api/moderation/ban', t).then((r) => r.data),

  reportContent: (payload: ReportCreate) =>
    axiosPrivate.post('/api/moderation/reports', payload, t).then((r) => r.data),

  getNotifications: (unreadOnly = false) => {
    const params = new URLSearchParams()
    if (unreadOnly) params.append('unread_only', 'true')
    return axiosPrivate
      .get<ModerationNotification[]>('/api/moderation/notifications', { params, ...t })
      .then((r) => r.data)
  },

  markNotificationRead: (notificationId: string) =>
    axiosPrivate.post(`/api/moderation/notifications/${notificationId}/read`, {}, t),

  markAllNotificationsRead: () =>
    axiosPrivate.post('/api/moderation/notifications/read-all', {}, t),

  reportUser: (payload: UserReportCreate) =>
    axiosPrivate.post('/api/moderation/user-reports', payload, t).then((r) => r.data),
}
