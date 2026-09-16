export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'chat_added'

export interface Notification {
  id: string
  type: NotificationType
  payload: Record<string, unknown>
  created_at: string
}

export interface NotificationCount {
  count: number
}

export interface NotificationCursor {
  cursor_created_at: string
  cursor_id: string
}
