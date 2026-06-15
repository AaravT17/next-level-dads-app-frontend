import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  Community,
  Conversation,
  ConversationCreate,
  ConversationMessage,
  ConversationParticipant,
  MessageCreate,
} from '@/types/communities'

const t = { timeout: TIMEOUT_LENGTH_MS }

export const communitiesApi = {
  getCommunities: () =>
    axiosPrivate.get<Community[]>('/api/communities', t).then((r) => r.data),

  getCommunity: (communityId: string) =>
    axiosPrivate
      .get<Community>(`/api/communities/${communityId}`, t)
      .then((r) => r.data),

  getCommunityConversations: (communityId: string) =>
    axiosPrivate
      .get<Conversation[]>(`/api/communities/${communityId}/conversations`, t)
      .then((r) => r.data),

  createConversation: (communityId: string, payload: ConversationCreate) =>
    axiosPrivate
      .post<Conversation>(`/api/communities/${communityId}/conversations`, payload, t)
      .then((r) => r.data),

  getConversation: (conversationId: string) =>
    axiosPrivate
      .get<Conversation>(`/api/conversations/${conversationId}`, t)
      .then((r) => r.data),

  getConversationMessages: (conversationId: string) =>
    axiosPrivate
      .get<ConversationMessage[]>(`/api/conversations/${conversationId}/messages`, t)
      .then((r) => r.data),

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
}
