import { useQuery } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useCommunities() {
  return useQuery({
    queryKey: communityKeys.all,
    queryFn: communitiesApi.getCommunities,
  })
}
