// ── Conversation types ─────────────────────────────────────────────────────

export interface AuthorInfo {
  id: string
  name: string
  avatar_url: string | null
  about: string | null
}

export interface Conversation {
  id: string
  community_id: string
  author: AuthorInfo | null
  title: string
  body: string
  prompt_type: string | null
  reply_count: number
  heart_count: number
  participant_count: number
  is_hearted: boolean
  created_at: string
  updated_at: string
  last_activity_at: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  author: AuthorInfo | null
  body: string
  heart_count: number
  is_hearted: boolean
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  id: string
  name: string
  avatar_url: string | null
  first_joined_at: string
  last_active_at: string
}

export interface ConversationCreate {
  title: string
  body: string
  prompt_type?: string
}

export interface MessageCreate {
  body: string
}

// ── Community types ────────────────────────────────────────────────────────

export type CommunityRole = 'admin' | 'member' | null

export interface Community {
  id: string
  name: string
  description: string | null
  member_count: number
  created_by: string | null
  created_at: string
  is_member: boolean
  role: CommunityRole
}

export interface DiscoverCommunitiesFilters {
  name: string
}

export interface DiscoverCommunitiesCursor {
  cursor_id: string
  cursor_created_at: string
}

export interface CommunityMemberResponse {
  id: string
  name: string
  age: number
  city: string
  province: string
  about: string
  avatar_url: string | null
  interests: string[]
  children: string[]
  created_at: string
  joined_at: string
  role: 'admin' | 'member'
}

export interface CommunityMembersCursor {
  cursor_id: string
  cursor_joined_at: string
}

export type ConversationSort = 'recent' | 'popular' | 'active'
export type ConversationTimeWindow = 'today' | 'week' | 'month' | 'year' | 'all'

export interface ConversationsCursor {
  cursor_id: string
  cursor_last_activity_at: string
}

export interface PopularConversationsCursor {
  cursor_id: string
  cursor_heart_count: number
}

export interface ActiveConversationsCursor {
  cursor_id: string
  cursor_reply_count: number
}

export type AnyConversationsCursor =
  | ConversationsCursor
  | PopularConversationsCursor
  | ActiveConversationsCursor

export interface MessagesCursor {
  cursor_id: string
  cursor_created_at: string
}
