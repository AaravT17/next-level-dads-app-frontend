import { useQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useCommunityConversations(communityId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.conversations(communityId ?? ''),
    queryFn: () => communitiesApi.getCommunityConversations(communityId!),
    enabled: !!communityId,
  })
}
