import { useQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useCommunity(communityId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.detail(communityId ?? ''),
    queryFn: () => communitiesApi.getCommunity(communityId!),
    enabled: !!communityId,
    staleTime: 0,
  })
}
