export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned'
export type ModerationLayer = 'profanity' | 'hate_speech' | 'report'
export type ContentType = 'conversation' | 'message' | 'reply'

export interface AdminContentReport {
  id: string
  content_type: ContentType
  content_id: string
  reporter_id: string
  reporter_name: string | null
  reason: string | null
  status: ReportStatus
  created_at: string
}

export interface AdminUserReport {
  id: string
  reported_id: string
  reported_name: string | null
  reporter_id: string
  reporter_name: string | null
  reason: string | null
  status: ReportStatus
  created_at: string
}

export interface AdminFilteredMessage {
  id: string
  content_type: ContentType
  content_id: string
  author_id: string | null
  author_name: string | null
  community_id: string | null
  original_text: string
  layer: ModerationLayer
  reason: string | null
  score: number | null
  created_at: string
}

export interface AdminBan {
  id: string
  user_id: string
  user_name: string | null
  reason: string
  created_at: string
  expires_at: string
}

export interface AdminBanCreate {
  user_id: string
  reason: string
  duration_hours: number
}

export interface AdminContextAuthorContent {
  id: string
  author_id: string | null
  author_name: string | null
  body: string
  is_deleted: boolean
  created_at: string
}

export interface AdminContextConversation extends AdminContextAuthorContent {
  community_id: string
  title: string
}

export interface AdminContextMessage extends AdminContextAuthorContent {
  conversation_id: string
  is_target: boolean
  is_focus: boolean
}

export interface AdminContextReply extends AdminContextAuthorContent {
  message_id: string
  is_target: boolean
}

export interface AdminContentContext {
  conversation: AdminContextConversation
  messages: AdminContextMessage[]
  replies: AdminContextReply[]
  target: {
    content_type: ContentType
    content_id: string
  }
}

export interface AdminUserActivity {
  activity_type: 'post' | 'message' | 'reply'
  id: string
  text: string
  context_title: string
  community_id: string
  created_at: string
  is_deleted: boolean
}

export interface AdminUserContext {
  user: {
    id: string
    name: string | null
    city: string | null
    province: string | null
    about: string | null
    avatar_url: string | null
  }
  activity: AdminUserActivity[]
}
