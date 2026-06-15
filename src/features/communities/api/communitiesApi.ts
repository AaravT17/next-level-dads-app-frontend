import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  AnyConversationsCursor,
  Community,
  Conversation,
  ConversationCreate,
  ConversationMessage,
  ConversationParticipant,
  ConversationSort,
  ConversationTimeWindow,
  MessageCreate,
  MessageReply,
  MessagesCursor,
  RepliesCursor,
  ReplyCreate,
} from '@/types/communities'

const t = { timeout: TIMEOUT_LENGTH_MS }

export const communitiesApi = {
  getCommunities: () =>
    axiosPrivate.get<Community[]>('/api/communities', t).then((r) => r.data),

  getCommunity: (communityId: string) =>
    axiosPrivate
      .get<Community>(`/api/communities/${communityId}`, t)
      .then((r) => r.data),

  getCommunityConversations: (
    communityId: string,
    sort: ConversationSort,
    timeWindow: ConversationTimeWindow,
    cursor?: AnyConversationsCursor,
  ) => {
    const params = new URLSearchParams()
    params.append('sort', sort)
    if (timeWindow !== 'all') params.append('time_window', timeWindow)
    if (cursor) {
      params.append('cursor_id', cursor.cursor_id)
      if ('cursor_last_activity_at' in cursor) {
        params.append('cursor_last_activity_at', cursor.cursor_last_activity_at)
      } else if ('cursor_heart_count' in cursor) {
        params.append('cursor_heart_count', String(cursor.cursor_heart_count))
      } else if ('cursor_reply_count' in cursor) {
        params.append('cursor_reply_count', String(cursor.cursor_reply_count))
      }
    }
    return axiosPrivate
      .get<Conversation[]>(`/api/communities/${communityId}/conversations`, { params, ...t })
      .then((r) => r.data)
  },

  createConversation: (communityId: string, payload: ConversationCreate) =>
    axiosPrivate
      .post<Conversation>(`/api/communities/${communityId}/conversations`, payload, t)
      .then((r) => r.data),

  getConversation: (conversationId: string) =>
    axiosPrivate
      .get<Conversation>(`/api/conversations/${conversationId}`, t)
      .then((r) => r.data),

  getConversationMessages: (conversationId: string, cursor?: MessagesCursor) => {
    const params = new URLSearchParams()
    if (cursor) {
      params.append('cursor_id', cursor.cursor_id)
      params.append('cursor_created_at', cursor.cursor_created_at)
    }
    return axiosPrivate
      .get<ConversationMessage[]>(`/api/conversations/${conversationId}/messages`, { params, ...t })
      .then((r) => r.data)
  },

  createMessage: (conversationId: string, payload: MessageCreate) =>
    axiosPrivate
      .post<ConversationMessage>(
        `/api/conversations/${conversationId}/messages`,
        payload,
        t,
      )
      .then((r) => r.data),

  getConversationParticipants: (conversationId: string) =>
    axiosPrivate
      .get<ConversationParticipant[]>(
        `/api/conversations/${conversationId}/participants`,
        t,
      )
      .then((r) => r.data),

  heartConversation: (conversationId: string) =>
    axiosPrivate.post(`/api/conversations/${conversationId}/heart`, {}, t),

  unheartConversation: (conversationId: string) =>
    axiosPrivate.delete(`/api/conversations/${conversationId}/heart`, t),

  heartMessage: (messageId: string) =>
    axiosPrivate.post(`/api/messages/${messageId}/heart`, {}, t),

  unheartMessage: (messageId: string) =>
    axiosPrivate.delete(`/api/messages/${messageId}/heart`, t),

  getMessageReplies: (messageId: string, cursor?: RepliesCursor) => {
    const params = new URLSearchParams()
    if (cursor) {
      params.append('cursor_id', cursor.cursor_id)
      params.append('cursor_heart_count', String(cursor.cursor_heart_count))
    }
    return axiosPrivate
      .get<MessageReply[]>(`/api/messages/${messageId}/replies`, { params, ...t })
      .then((r) => r.data)
  },

  createReply: (messageId: string, payload: ReplyCreate) =>
    axiosPrivate
      .post<MessageReply>(`/api/messages/${messageId}/replies`, payload, t)
      .then((r) => r.data),

  heartReply: (replyId: string) =>
    axiosPrivate.post(`/api/replies/${replyId}/heart`, {}, t),

  unheartReply: (replyId: string) =>
    axiosPrivate.delete(`/api/replies/${replyId}/heart`, t),
}
