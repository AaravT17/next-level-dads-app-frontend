export type ModerationNotificationType = 'content_removed' | 'temporary_ban'

export type ModerationContentType = 'conversation' | 'message' | 'reply'

export interface ModerationNotification {
  id: string
  type: ModerationNotificationType
  content_type: ModerationContentType | null
  content_id: string | null
  reason: string | null
  message: string
  is_read: boolean
  created_at: string
}

export interface BanStatus {
  banned: boolean
  expires_at: string | null
}

export interface ReportCreate {
  content_type: ModerationContentType
  content_id: string
  reason?: string
}

export interface UserReportCreate {
  reported_id: string
  reason?: string
}
