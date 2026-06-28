import { useQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.conversation(conversationId ?? ''),
    queryFn: () => communitiesApi.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 0,
  })
}
