export const communityKeys = {
  all: ['communities'] as const,
  detail: (communityId: string) => ['community', communityId] as const,
  conversationsAll: (communityId: string) =>
    ['community-conversations', communityId] as const,
  conversations: (communityId: string, sort: string, timeWindow: string) =>
    ['community-conversations', communityId, sort, timeWindow] as const,
  conversation: (conversationId: string) =>
    ['conversation', conversationId] as const,
  messages: (conversationId: string) =>
    ['conversation-messages', conversationId] as const,
  participants: (conversationId: string) =>
    ['conversation-participants', conversationId] as const,
  replies: (messageId: string) => ['message-replies', messageId] as const,
}
