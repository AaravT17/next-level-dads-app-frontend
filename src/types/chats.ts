export type ChatType = 'dm' | 'group'

export interface ChatOtherUser {
  id: string
  name: string
  avatar_url: string | null
}

export interface ChatLastMessage {
  id: string
  content: string        // empty string if deleted
  sender_id: string
  sender_name: string
  created_at: string
  is_deleted: boolean
}

export interface Chat {
  id: string
  type: ChatType
  name: string | null    // null for DMs, set for groups
  updated_at: string
  last_message: ChatLastMessage | null
  other_user: ChatOtherUser | null   // only present for DMs
}

export interface ReplyTo {
  id: string
  content: string        // empty string if deleted
  sender_id: string
  sender_name: string
  is_deleted: boolean
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  sender_name: string
  sender_avatar_url: string | null
  content: string        // empty string if deleted
  edited_at: string | null
  is_deleted: boolean
  created_at: string
  reply_to: ReplyTo | null
}

export interface ChatParticipant {
  id: string
  name: string
  avatar_url: string | null
  joined_at: string
  role: 'admin' | 'member'
}

export interface ChatAddableParticipant {
  id: string
  name: string
  avatar_url: string | null
}

export interface ChatsCursor {
  cursor_id: string
  cursor_updated_at: string
}

export interface MessagesCursor {
  cursor_id: string
  cursor_created_at: string
}

export interface ParticipantsCursor {
  cursor_id: string
  cursor_joined_at: string
}
