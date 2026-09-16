export type ChatType = 'dm' | 'group'

export interface ChatOtherUser {
  id: string
  name: string
  avatar_url: string | null
}

export interface ChatLastMessage {
  id: string
  content: string // empty string if deleted
  sender_id: string
  sender_name: string
  created_at: string
  is_deleted: boolean
}

export interface Chat {
  id: string
  type: ChatType
  name: string | null // null for DMs, set for groups
  updated_at: string
  last_read_at: string | null
  last_message: ChatLastMessage | null
  other_user: ChatOtherUser | null // only present for DMs
}

export interface ReplyTo {
  id: string
  content: string // empty string if deleted
  sender_id: string
  sender_name: string
  is_deleted: boolean
}

/**
 * The community attached to an invite message.
 *
 * Present only on messages sent from a community's "Invite a friend" flow, and
 * withheld once the message is deleted — the card links onward, so it should
 * not outlive the message carrying it.
 */
export interface SharedCommunity {
  id: string
  name: string
  description: string | null
  image_url: string | null
  member_count: number
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  sender_name: string
  sender_avatar_url: string | null
  content: string // empty string if deleted
  edited_at: string | null
  is_deleted: boolean
  created_at: string
  reply_to: ReplyTo | null
  shared_community: SharedCommunity | null
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

export interface ChatMembership {
  chat_id: string
  last_read_at: string | null
  updated_at: string
}

// ============================================
// Realtime + context
// ============================================

export type MessageHandler = (event: WsEvent) => void

export type WsEvent =
  | { type: 'ws:ready' }
  | {
      type: 'messages:new'
      payload: Message & {
        chat_name: string | null
        chat_type: ChatType
        chat_avatar_url: string | null
      }
    }
  | {
      type: 'messages:edit'
      payload: {
        id: string
        chat_id: string
        content: string
        is_deleted: false
        edited_at: string
      }
    }
  | {
      type: 'messages:delete'
      payload: {
        id: string
        chat_id: string
        content: ''
        is_deleted: true
        edited_at: null
      }
    }
  | {
      type: 'chats:read'
      payload: {
        chat_id: string
        last_read_at: string
      }
    }
  | {
      type: 'chats:added'
      payload: {
        chat_id: string
        chat_name: string | null
        chat_type: ChatType
        chat_avatar_url: string | null
        added_by: string
        added_by_name: string
        notification_id?: string
        notification_created_at?: string
      }
    }
  | {
      type: 'chats:removed'
      payload: {
        chat_id: string
      }
    }
  | {
      type: 'connections:request'
      payload: {
        from_id: string
        from_name: string
        from_avatar_url: string | null
        notification_id?: string
        notification_created_at?: string
      }
    }
  | {
      type: 'connections:accepted'
      payload: {
        by_id: string
        by_name: string
        by_avatar_url: string | null
        notification_id?: string
        notification_created_at?: string
      }
    }
  | {
      type: 'notifications:read'
      payload: {
        last_read_at: string
      }
    }
  | {
      type: 'notifications:cleared'
      payload: {
        last_read_at: string
        last_cleared_at: string
      }
    }

export type NotificationEventHandler = (event: WsEvent) => void

export interface ChatContextType {
  registerMessageHandler: (chatId: string, handler: MessageHandler) => () => void
  registerReconnectHandler: (handler: () => void) => () => void
  registerNotificationHandler: (handler: NotificationEventHandler) => () => void
  sendWsMessage: (data: object) => void
  isChatMember: (chatId: string) => boolean
  isReconnecting: boolean
  isFailed: boolean
  reconnect: () => void
  wsReady: boolean
  unreadCount: number
}
