import { useQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.messages(conversationId ?? ''),
    queryFn: () => communitiesApi.getConversationMessages(conversationId!),
    enabled: !!conversationId,
  })
}
