import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  ChatListItem,
  OrganizationChat,
  Message,
  SendMessageRequest,
} from '@/features/organization-chats/types/organizationChats'

const requestConfig = {
  timeout: TIMEOUT_LENGTH_MS,
}

export const organizationChatsApi = {
  getChats: () =>
    axiosPrivate.get<ChatListItem[]>('/api/organization-chats', requestConfig)
                .then((response) => response.data),

  getChat: (chatId: string) =>
  axiosPrivate.get<OrganizationChat>(`/api/organization-chats/${chatId}`, requestConfig)
              .then((response) => response.data),

  getMessages: (chatId: string) =>
    axiosPrivate.get<Message[]>(`/api/organization-chats/${chatId}/messages`, requestConfig)
                .then((response) => response.data),

  sendMessage: (chatId: string, body: SendMessageRequest) =>
    axiosPrivate.post<Message>(`/api/organization-chats/${chatId}/messages`, body, requestConfig)
                .then((response) => response.data),
}