import { useQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useConversationParticipants(conversationId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.participants(conversationId ?? ''),
    queryFn: () => communitiesApi.getConversationParticipants(conversationId!),
    enabled: !!conversationId,
  })
}
